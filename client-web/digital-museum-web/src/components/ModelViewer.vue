<template>
  <div class="enhanced-model-viewer" ref="containerRef">
    <div class="model-canvas" ref="canvasContainer"></div>
    
    <!-- 加载进度条 -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-content">
        <el-progress
          :percentage="loadingProgress"
          :stroke-width="8"
          color="#409eff"
          class="progress-bar"
        />
        <p class="loading-text">{{ loadingText }}</p>
      </div>
    </div>

    <!-- 控制面板 -->
    <div class="control-panel" :class="{ collapsed: panelCollapsed }">
      <div class="panel-header" @click="togglePanel">
        <span class="panel-title">3D控制面板</span>
        <el-icon class="collapse-icon" :class="{ rotated: panelCollapsed }">
          <ArrowDown />
        </el-icon>
      </div>

      <div class="panel-content" v-show="!panelCollapsed">
        <!-- 视图控制 -->
        <div class="control-group">
          <h4 class="group-title">
            <el-icon><View /></el-icon>
            视图控制
          </h4>
          <div class="control-grid">
            <el-button size="small" @click="resetView" class="control-btn">
              <el-icon><Refresh /></el-icon>
              重置视图
            </el-button>
            <el-button size="small" @click="fitToScreen" class="control-btn">
              <el-icon><FullScreen /></el-icon>
              适应屏幕
            </el-button>
            <el-button size="small" @click="toggleWireframe" class="control-btn">
              <el-icon><Grid /></el-icon>
              {{ wireframe ? '实体' : '线框' }}
            </el-button>
            <el-button size="small" @click="toggleAutoRotate" class="control-btn">
              <el-icon><Refresh /></el-icon>
              {{ autoRotate ? '停止' : '旋转' }}
            </el-button>
          </div>
        </div>

        <!-- 渲染设置 -->
        <div class="control-group">
          <h4 class="group-title">
            <el-icon><Setting /></el-icon>
            渲染设置
          </h4>
          <div class="setting-item">
            <label>背景颜色</label>
            <el-color-picker 
              v-model="backgroundColor" 
              @change="updateBackground"
              size="small"
            />
          </div>
        </div>

        <!-- 模型信息 -->
        <div class="control-group">
          <h4 class="group-title">
            <el-icon><InfoFilled /></el-icon>
            模型信息
          </h4>
          <div class="model-stats" v-if="modelInfo">
            <div class="stat-item">
              <span class="stat-label">顶点数：</span>
              <span class="stat-value">{{ modelInfo.vertices.toLocaleString() }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">面数：</span>
              <span class="stat-value">{{ modelInfo.faces.toLocaleString() }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">材质数：</span>
              <span class="stat-value">{{ modelInfo.materials }}</span>
            </div>
          </div>
        </div>

        <!-- 导出功能 -->
        <div class="control-group">
          <h4 class="group-title">
            <el-icon><Download /></el-icon>
            导出功能
          </h4>
          <div class="export-buttons">
            <el-button size="small" @click="captureScreenshot" class="control-btn">
              <el-icon><Camera /></el-icon>
              截图
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 错误状态 -->
    <div v-if="error" class="error-overlay">
      <el-alert
        title="模型加载失败"
        :description="error"
        type="error"
        show-icon
        :closable="false"
      />
      <el-button @click="retryLoad" type="primary" class="retry-btn">
        重新加载
      </el-button>
    </div>

    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="toolbar-group">
        <el-tooltip content="帮助">
          <el-button size="small" @click="showHelp" circle>
            <el-icon><QuestionFilled /></el-icon>
          </el-button>
        </el-tooltip>
      </div>
    </div>

    <!-- 帮助对话框 -->
    <el-dialog v-model="helpVisible" title="3D模型查看器使用帮助" width="600px">
      <div class="help-content">
        <h4>鼠标控制：</h4>
        <ul>
          <li><strong>左键拖拽</strong>：旋转模型</li>
          <li><strong>右键拖拽</strong>：平移视图</li>
          <li><strong>滚轮</strong>：缩放视图</li>
        </ul>
        <h4>支持的格式：</h4>
        <ul>
          <li><strong>GLTF/GLB</strong>：推荐格式，支持材质和动画</li>
          <li><strong>OBJ</strong>：通用3D格式</li>
          <li><strong>FBX</strong>：支持复杂场景和动画</li>
        </ul>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { 
  ArrowDown, View, Refresh, FullScreen, Grid, Setting,
  InfoFilled, Download, Camera, QuestionFilled 
} from '@element-plus/icons-vue'
import * as THREE from 'three'
import { SimpleGLTFLoader, SimpleOBJLoader, SimpleFBXLoader } from '@/utils/modelLoaders'

// Props
interface Props {
  modelUrl: string
  width?: number
  height?: number
}

const props = withDefaults(defineProps<Props>(), {
  width: 800,
  height: 600
})

// 响应式数据
const containerRef = ref<HTMLElement>()
const canvasContainer = ref<HTMLElement>()
const loading = ref(false)
const loadingProgress = ref(0)
const loadingText = ref('准备加载模型...')
const error = ref('')
const panelCollapsed = ref(false)
const helpVisible = ref(false)

// 渲染控制
const wireframe = ref(false)
const autoRotate = ref(false)
const backgroundColor = ref('#f0f0f0')

// 模型信息
const modelInfo = ref<{
  vertices: number
  faces: number
  materials: number
} | null>(null)

// Three.js 核心对象
let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let model: THREE.Group | THREE.Mesh | null = null
let animationId: number

// 初始化Three.js场景
const initThreeJS = () => {
  if (!canvasContainer.value) return

  // 创建场景
  scene = new THREE.Scene()
  scene.background = new THREE.Color(backgroundColor.value)

  // 创建相机
  camera = new THREE.PerspectiveCamera(
    75,
    props.width / props.height,
    0.1,
    1000
  )
  camera.position.set(5, 5, 5)

  // 创建渲染器
  renderer = new THREE.WebGLRenderer({ 
    antialias: true,
    alpha: true,
    preserveDrawingBuffer: true
  })
  renderer.setSize(props.width, props.height)
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  canvasContainer.value.appendChild(renderer.domElement)

  // 设置灯光
  setupLighting()

  // 添加鼠标控制
  setupMouseControls()

  // 开始渲染循环
  animate()
}

// 设置灯光
const setupLighting = () => {
  // 环境光
  const ambientLight = new THREE.AmbientLight(0x404040, 0.6)
  scene.add(ambientLight)

  // 主方向光
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0)
  directionalLight.position.set(10, 10, 5)
  directionalLight.castShadow = true
  scene.add(directionalLight)

  // 补充光源
  const pointLight = new THREE.PointLight(0xffffff, 0.3)
  pointLight.position.set(-10, -10, -5)
  scene.add(pointLight)
}

// 鼠标控制
const setupMouseControls = () => {
  let isMouseDown = false
  let mouseX = 0
  let mouseY = 0

  const canvas = renderer.domElement

  canvas.addEventListener('mousedown', (event) => {
    isMouseDown = true
    mouseX = event.clientX
    mouseY = event.clientY
  })

  canvas.addEventListener('mousemove', (event) => {
    if (!isMouseDown || !model) return

    const deltaX = event.clientX - mouseX
    const deltaY = event.clientY - mouseY

    model.rotation.y += deltaX * 0.01
    model.rotation.x += deltaY * 0.01

    mouseX = event.clientX
    mouseY = event.clientY
  })

  canvas.addEventListener('mouseup', () => {
    isMouseDown = false
  })

  canvas.addEventListener('wheel', (event) => {
    event.preventDefault()
    const scale = event.deltaY > 0 ? 0.9 : 1.1
    camera.position.multiplyScalar(scale)
    camera.position.clampLength(2, 50)
  })
}

// 加载3D模型
const loadModel = async (url: string) => {
  loading.value = true
  loadingProgress.value = 0
  loadingText.value = '正在下载模型文件...'
  error.value = ''

  try {
    // 清除之前的模型
    if (model) {
      scene.remove(model)
      model = null
    }

    // 根据文件扩展名选择加载器
    const extension = url.split('.').pop()?.toLowerCase()
    let loadedData: any

    const onProgress = (progress: ProgressEvent) => {
      if (progress.lengthComputable) {
        loadingProgress.value = Math.round((progress.loaded / progress.total) * 100)
        loadingText.value = `正在加载... ${loadingProgress.value}%`
      }
    }

    switch (extension) {
      case 'gltf':
      case 'glb':
        loadedData = await loadGLTFModel(url, onProgress)
        break
      case 'obj':
        loadedData = await loadOBJModel(url, onProgress)
        break
      case 'fbx':
        loadedData = await loadFBXModel(url, onProgress)
        break
      default:
        throw new Error(`不支持的模型格式: ${extension}`)
    }

    model = loadedData.scene || loadedData
    scene.add(model)

    // 计算模型信息
    calculateModelInfo(model)

    // 调整视图
    fitToScreen()

    loading.value = false
    ElMessage.success('3D模型加载成功')

  } catch (err) {
    console.error('模型加载失败:', err)
    error.value = err instanceof Error ? err.message : '未知错误'
    loading.value = false
  }
}

// 加载器方法
const loadGLTFModel = (url: string, onProgress?: (progress: ProgressEvent) => void): Promise<any> => {
  const loader = new SimpleGLTFLoader()
  return new Promise((resolve, reject) => {
    loader.load(url, resolve, onProgress, reject)
  })
}

const loadOBJModel = (url: string, onProgress?: (progress: ProgressEvent) => void): Promise<any> => {
  const loader = new SimpleOBJLoader()
  return new Promise((resolve, reject) => {
    loader.load(url, resolve, onProgress, reject)
  })
}

const loadFBXModel = (url: string, onProgress?: (progress: ProgressEvent) => void): Promise<any> => {
  const loader = new SimpleFBXLoader()
  return new Promise((resolve, reject) => {
    loader.load(url, resolve, onProgress, reject)
  })
}

// 计算模型信息
const calculateModelInfo = (model: THREE.Group | THREE.Mesh) => {
  let vertices = 0
  let faces = 0
  let materials = new Set()

  model.traverse((child) => {
    if (child instanceof THREE.Mesh && child.geometry) {
      const geometry = child.geometry
      
      if (geometry.attributes.position) {
        vertices += geometry.attributes.position.count
      }
      
      if (geometry.index) {
        faces += geometry.index.count / 3
      } else if (geometry.attributes.position) {
        faces += geometry.attributes.position.count / 3
      }

      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(mat => materials.add(mat.uuid))
        } else {
          materials.add(child.material.uuid)
        }
      }
    }
  })

  modelInfo.value = {
    vertices,
    faces: Math.floor(faces),
    materials: materials.size
  }
}

// 视图控制方法
const resetView = () => {
  if (model) {
    model.rotation.set(0, 0, 0)
    fitToScreen()
  }
}

const fitToScreen = () => {
  if (!model) return

  const box = new THREE.Box3().setFromObject(model)
  const size = box.getSize(new THREE.Vector3())
  const center = box.getCenter(new THREE.Vector3())

  const maxDim = Math.max(size.x, size.y, size.z)
  const distance = maxDim * 2

  camera.position.copy(center)
  camera.position.x += distance
  camera.position.y += distance * 0.5
  camera.position.z += distance
  camera.lookAt(center)
}

const toggleWireframe = () => {
  wireframe.value = !wireframe.value
  
  if (model) {
    model.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(mat => {
            mat.wireframe = wireframe.value
          })
        } else {
          child.material.wireframe = wireframe.value
        }
      }
    })
  }
}

const toggleAutoRotate = () => {
  autoRotate.value = !autoRotate.value
}

const updateBackground = (color: string) => {
  if (scene) {
    scene.background = new THREE.Color(color)
  }
}

// 功能性方法
const captureScreenshot = () => {
  renderer.render(scene, camera)
  const canvas = renderer.domElement
  const link = document.createElement('a')
  link.download = '3d-model-screenshot.png'
  link.href = canvas.toDataURL()
  link.click()
  ElMessage.success('截图已保存')
}

const togglePanel = () => {
  panelCollapsed.value = !panelCollapsed.value
}

const showHelp = () => {
  helpVisible.value = true
}

const retryLoad = () => {
  if (props.modelUrl) {
    loadModel(props.modelUrl)
  }
}

// 渲染循环
const animate = () => {
  animationId = requestAnimationFrame(animate)

  if (model && autoRotate.value) {
    model.rotation.y += 0.005
  }

  renderer.render(scene, camera)
}

// 生命周期
onMounted(async () => {
  await nextTick()
  initThreeJS()
  if (props.modelUrl) {
    await loadModel(props.modelUrl)
  }
})

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
  if (renderer) {
    renderer.dispose()
  }
})

// 监听props变化
watch(() => props.modelUrl, (newUrl) => {
  if (newUrl) {
    loadModel(newUrl)
  }
})
</script>

<style scoped>
.enhanced-model-viewer {
  position: relative;
  width: 100%;
  height: 600px;
  border: 1px solid #ddd;
  border-radius: 12px;
  overflow: hidden;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.model-canvas {
  width: 100%;
  height: 100%;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(5px);
}

.loading-content {
  text-align: center;
  color: white;
}

.progress-bar {
  width: 300px;
  margin-bottom: 20px;
}

.loading-text {
  margin: 0;
  font-size: 16px;
}

.control-panel {
  position: absolute;
  top: 20px;
  right: 20px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(15px);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  min-width: 280px;
  max-width: 320px;
  max-height: calc(100vh - 100px);
  overflow-y: auto;
  transition: transform 0.3s ease;
}

.control-panel.collapsed {
  transform: translateX(calc(100% - 50px));
}

.panel-header {
  padding: 16px 20px;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(64, 158, 255, 0.1);
}

.panel-title {
  font-weight: 600;
  color: #2c3e50;
}

.collapse-icon {
  transition: transform 0.3s ease;
}

.collapse-icon.rotated {
  transform: rotate(180deg);
}

.panel-content {
  padding: 0;
}

.control-group {
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.control-group:last-child {
  border-bottom: none;
}

.group-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 12px 0;
}

.control-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.control-btn {
  width: 100%;
  justify-content: center;
  font-size: 12px;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.setting-item:last-child {
  margin-bottom: 0;
}

.setting-item label {
  font-size: 13px;
  color: #666;
  flex: 1;
}

.model-stats {
  font-size: 12px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.stat-item:last-child {
  margin-bottom: 0;
}

.stat-label {
  color: #666;
}

.stat-value {
  color: #333;
  font-weight: 500;
}

.export-buttons {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
}

.error-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.95);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  padding: 40px;
  text-align: center;
}

.retry-btn {
  margin-top: 16px;
}

.toolbar {
  position: absolute;
  bottom: 20px;
  left: 20px;
}

.toolbar-group {
  display: flex;
  gap: 8px;
}

.help-content h4 {
  color: #2c3e50;
  margin-top: 20px;
  margin-bottom: 10px;
}

.help-content h4:first-child {
  margin-top: 0;
}

.help-content ul {
  margin: 0;
  padding-left: 20px;
}

.help-content li {
  margin-bottom: 8px;
  line-height: 1.5;
}
</style>