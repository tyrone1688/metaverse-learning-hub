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
        <div class="loading-details" v-if="loadingDetails">
          <p>{{ loadingDetails }}</p>
        </div>
        <div class="loading-stats">
          <span>已用时间: {{ loadingTime }}s</span>
          <span v-if="estimatedTime">预计剩余: {{ estimatedTime }}s</span>
        </div>
      </div>
    </div>

    <!-- 文件上传区域 -->
    <div class="upload-area" v-if="!modelLoaded" @drop="handleDrop" @dragover="handleDragOver" @dragleave="handleDragLeave">
      <div class="upload-content" :class="{ 'drag-over': isDragOver }">
        <el-icon class="upload-icon"><Upload /></el-icon>
        <h3>拖拽3D模型文件到此处</h3>
        <p>支持 GLTF, GLB, OBJ, FBX 格式，最大100MB</p>
        
        <div class="upload-buttons">
          <el-button type="primary" @click="triggerFileInput" size="large">
            <el-icon><Folder /></el-icon>
            选择文件
          </el-button>
          <el-button @click="loadSampleModel" size="large">
            <el-icon><Box /></el-icon>
            加载示例
          </el-button>
        </div>
        
        <input
          ref="fileInput"
          type="file"
          accept=".gltf,.glb,.obj,.fbx"
          style="display: none"
          @change="handleFileSelect"
        />
        
        <div class="format-info">
          <div class="format-item">
            <el-tag size="small" type="success" effect="plain">GLTF/GLB</el-tag>
            <span>推荐格式，支持材质和动画</span>
          </div>
          <div class="format-item">
            <el-tag size="small" type="info" effect="plain">OBJ</el-tag>
            <span>经典格式，几何体和材质</span>
          </div>
          <div class="format-item">
            <el-tag size="small" type="warning" effect="plain">FBX</el-tag>
            <span>复杂场景，支持动画</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 基础控制工具栏 -->
    <div class="control-toolbar" v-if="modelLoaded">
      <el-button size="small" @click="resetView" title="重置视图">
        <el-icon><Refresh /></el-icon>
      </el-button>
      <el-button size="small" @click="fitToView" title="适合视图">
        <el-icon><FullScreen /></el-icon>
      </el-button>
      <el-button 
        size="small" 
        @click="toggleWireframe" 
        title="切换线框" 
        :type="wireframe ? 'primary' : 'default'"
      >
        <el-icon><Grid /></el-icon>
      </el-button>
      <el-button 
        size="small" 
        @click="toggleAutoRotate" 
        title="自动旋转" 
        :type="autoRotate ? 'primary' : 'default'"
      >
        <el-icon><VideoPlay /></el-icon>
      </el-button>
      <el-button size="small" @click="clearModel" title="清除模型" type="danger">
        <el-icon><Delete /></el-icon>
      </el-button>
    </div>

    <!-- 错误提示 -->
    <el-alert
      v-if="error"
      :title="error"
      type="error"
      show-icon
      :closable="true"
      @close="error = ''"
      class="error-alert"
    />

    <!-- 简化的模型信息面板 -->
    <div class="info-panel" v-if="modelInfo && showInfo">
      <div class="panel-header">
        <h4>模型信息</h4>
        <el-button size="small" @click="showInfo = false" text>
          <el-icon><Close /></el-icon>
        </el-button>
      </div>
      
      <div class="info-content">
        <div class="info-section">
          <h5>基本信息</h5>
          <div class="info-item">
            <span>文件名:</span>
            <span>{{ modelInfo.name }}</span>
          </div>
          <div class="info-item">
            <span>格式:</span>
            <span>{{ modelInfo.format }}</span>
          </div>
          <div class="info-item">
            <span>大小:</span>
            <span>{{ modelInfo.size }}</span>
          </div>
        </div>

        <div class="info-section">
          <h5>几何信息</h5>
          <div class="info-item">
            <span>顶点数:</span>
            <span>{{ modelInfo.vertices }}</span>
          </div>
          <div class="info-item">
            <span>面数:</span>
            <span>{{ modelInfo.faces }}</span>
          </div>
          <div class="info-item">
            <span>材质数:</span>
            <span>{{ modelInfo.materials }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { 
  Upload, Folder, Refresh, Grid, VideoPlay, Delete, 
  FullScreen, Close, Box
} from '@element-plus/icons-vue'
import * as THREE from 'three'
// 修改为使用现有的 modelLoaders
import { 
  RealGLTFLoader, 
  RealOBJLoader, 
  RealFBXLoader
} from '@/utils/modelLoaders'

// Props
interface Props {
  width?: number
  height?: number
  showInfo?: boolean
  modelUrl?: string
}

const props = withDefaults(defineProps<Props>(), {
  width: 800,
  height: 600,
  showInfo: true
})

// 响应式数据
const containerRef = ref<HTMLElement>()
const canvasContainer = ref<HTMLElement>()
const fileInput = ref<HTMLInputElement>()

// 加载状态
const loading = ref(false)
const loadingProgress = ref(0)
const loadingText = ref('准备加载模型...')
const loadingDetails = ref('')
const loadingTime = ref(0)
const estimatedTime = ref(0)

// 界面状态
const error = ref('')
const modelLoaded = ref(false)
const isDragOver = ref(false)
const wireframe = ref(false)
const autoRotate = ref(false)
const showInfo = ref(props.showInfo)

// 模型信息
const modelInfo = ref<any>(null)

// Three.js 核心对象
let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let currentModel: THREE.Group | THREE.Mesh | null = null
let animationId: number
let controls: any

// 初始化Three.js场景
const initThreeJS = async () => {
  if (!canvasContainer.value) return

  console.log('初始化3D场景...')

  // 创建场景
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0xf5f5f5)

  // 创建相机
  camera = new THREE.PerspectiveCamera(
    45,
    props.width / props.height,
    0.1,
    1000
  )
  camera.position.set(8, 6, 8)
  camera.lookAt(0, 0, 0)

  // 创建渲染器
  renderer = new THREE.WebGLRenderer({ 
    antialias: true,
    alpha: true
  })
  renderer.setSize(props.width, props.height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  
  canvasContainer.value.appendChild(renderer.domElement)

  // 设置光照
  setupLighting()

  // 添加环境元素
  addEnvironmentElements()

  // 设置控制器
  setupControls()

  // 开始渲染循环
  animate()

  console.log('3D场景初始化完成')
}

// 设置光照系统
const setupLighting = () => {
  // 环境光
  const ambientLight = new THREE.AmbientLight(0x404040, 0.4)
  scene.add(ambientLight)

  // 主方向光
  const mainLight = new THREE.DirectionalLight(0xffffff, 1.2)
  mainLight.position.set(10, 20, 10)
  mainLight.castShadow = true
  mainLight.shadow.mapSize.width = 2048
  mainLight.shadow.mapSize.height = 2048
  scene.add(mainLight)

  // 补充光源
  const fillLight = new THREE.DirectionalLight(0x87CEEB, 0.6)
  fillLight.position.set(-5, 5, -5)
  scene.add(fillLight)

  // 环境补光
  const hemisphereLight = new THREE.HemisphereLight(0x87CEEB, 0x4682B4, 0.3)
  scene.add(hemisphereLight)
}

// 添加环境元素
const addEnvironmentElements = () => {
  // 地面
  const groundGeometry = new THREE.PlaneGeometry(50, 50)
  const groundMaterial = new THREE.MeshLambertMaterial({ 
    color: 0xe0e0e0,
    transparent: true,
    opacity: 0.5
  })
  const ground = new THREE.Mesh(groundGeometry, groundMaterial)
  ground.rotation.x = -Math.PI / 2
  ground.receiveShadow = true
  scene.add(ground)

  // 网格
  const gridHelper = new THREE.GridHelper(30, 30, 0x888888, 0xcccccc)
  gridHelper.material.transparent = true
  gridHelper.material.opacity = 0.2
  scene.add(gridHelper)
}

// 设置控制器
const setupControls = () => {
  const canvas = renderer.domElement
  
  controls = {
    isMouseDown: false,
    lastMouseX: 0,
    lastMouseY: 0,
    rotationX: 0,
    rotationY: 0,
    zoom: 1,
    autoRotate: false
  }

  canvas.addEventListener('mousedown', onMouseDown)
  canvas.addEventListener('mousemove', onMouseMove)
  canvas.addEventListener('mouseup', onMouseUp)
  canvas.addEventListener('wheel', onMouseWheel, { passive: false })
}

const onMouseDown = (event: MouseEvent) => {
  controls.isMouseDown = true
  controls.lastMouseX = event.clientX
  controls.lastMouseY = event.clientY
}

const onMouseMove = (event: MouseEvent) => {
  if (!controls.isMouseDown) return

  const deltaX = event.clientX - controls.lastMouseX
  const deltaY = event.clientY - controls.lastMouseY

  controls.rotationY += deltaX * 0.008
  controls.rotationX += deltaY * 0.008
  controls.rotationX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, controls.rotationX))

  controls.lastMouseX = event.clientX
  controls.lastMouseY = event.clientY
}

const onMouseUp = () => {
  controls.isMouseDown = false
}

const onMouseWheel = (event: WheelEvent) => {
  event.preventDefault()
  controls.zoom += event.deltaY * 0.001
  controls.zoom = Math.max(0.1, Math.min(10, controls.zoom))
}

// 简化的文件验证函数
const validateModelFile = (file: File): { valid: boolean; error?: string } => {
  const maxSize = 100 * 1024 * 1024 // 100MB
  const supportedFormats = ['gltf', 'glb', 'obj', 'fbx']
  
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `文件大小超出限制，最大支持 ${Math.round(maxSize / (1024 * 1024))}MB`
    }
  }
  
  const extension = file.name.split('.').pop()?.toLowerCase()
  if (!extension || !supportedFormats.includes(extension)) {
    return {
      valid: false,
      error: `不支持的文件格式，支持的格式: ${supportedFormats.join(', ')}`
    }
  }
  
  return { valid: true }
}

// 简化的模型统计计算
const calculateModelStats = (model: THREE.Group | THREE.Mesh, file: File) => {
  let vertices = 0
  let faces = 0
  let materials = new Set<string>()

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

  return {
    name: file.name,
    format: file.name.split('.').pop()?.toUpperCase() || 'UNKNOWN',
    size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
    vertices: vertices.toLocaleString(),
    faces: Math.floor(faces).toLocaleString(),
    materials: materials.size
  }
}

// 简化的模型适配函数
const fitModelToView = (model: THREE.Group | THREE.Mesh, targetSize: number = 4): void => {
  const box = new THREE.Box3().setFromObject(model)
  const center = box.getCenter(new THREE.Vector3())
  const size = box.getSize(new THREE.Vector3())
  
  // 居中模型
  model.position.sub(center)
  
  // 缩放模型
  const maxDim = Math.max(size.x, size.y, size.z)
  if (maxDim > 0) {
    const scale = targetSize / maxDim
    model.scale.setScalar(scale)
  }
}

// 简化的资源释放函数
const disposeModel = (model: THREE.Group | THREE.Mesh): void => {
  if (!model) return
  
  model.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      if (child.geometry) {
        child.geometry.dispose()
      }
      
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(mat => mat.dispose())
        } else {
          child.material.dispose()
        }
      }
    }
  })
}

// 加载模型的核心函数
const loadRealModel = async (file: File) => {
  console.log('开始加载模型:', file.name)
  
  loading.value = true
  loadingProgress.value = 0
  loadingText.value = '正在验证文件...'
  error.value = ''
  
  const startTime = Date.now()
  let loadingInterval: number

  try {
    // 文件验证
    const validation = validateModelFile(file)
    if (!validation.valid) {
      throw new Error(validation.error)
    }

    // 启动加载计时器
    loadingInterval = setInterval(() => {
      loadingTime.value = Math.round((Date.now() - startTime) / 1000)
    }, 1000)

    // 根据文件类型选择加载器
    const extension = file.name.split('.').pop()?.toLowerCase()
    const fileUrl = URL.createObjectURL(file)
    let result: any

    loadingText.value = `正在解析${extension?.toUpperCase()}文件...`

    switch (extension) {
      case 'gltf':
      case 'glb':
        const gltfLoader = new RealGLTFLoader()
        result = await gltfLoader.load(fileUrl, (progress) => {
          if (progress.total > 0) {
            loadingProgress.value = Math.round((progress.loaded / progress.total) * 70)
          }
        })
        break
      case 'obj':
        const objLoader = new RealOBJLoader()
        result = await objLoader.load(fileUrl, (progress) => {
          loadingProgress.value = Math.round((progress.loaded / progress.total) * 70)
        })
        result = { scene: result }
        break
      case 'fbx':
        const fbxLoader = new RealFBXLoader()
        result = await fbxLoader.load(fileUrl, (progress) => {
          loadingProgress.value = Math.round((progress.loaded / progress.total) * 70)
        })
        result = { scene: result }
        break
      default:
        throw new Error(`不支持的文件格式: ${extension}`)
    }

    loadingText.value = '正在优化模型...'
    loadingProgress.value = 80

    // 清除之前的模型
    if (currentModel) {
      scene.remove(currentModel)
      disposeModel(currentModel)
    }

    const model = result.scene
    if (!model) {
      throw new Error('模型解析失败：无有效场景数据')
    }

    // 优化模型
    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })
    
    loadingText.value = '正在调整视图...'
    loadingProgress.value = 90

    // 调整模型
    fitModelToView(model, 4)

    // 添加到场景
    scene.add(model)
    currentModel = model

    // 计算模型信息
    const stats = calculateModelStats(model, file)
    modelInfo.value = stats

    loadingProgress.value = 100
    modelLoaded.value = true

    // 清理
    URL.revokeObjectURL(fileUrl)
    clearInterval(loadingInterval)

    ElMessage.success('模型加载成功！')
    console.log('模型加载完成:', stats)

  } catch (err) {
    console.error('模型加载失败:', err)
    error.value = err instanceof Error ? err.message : '未知错误'
  } finally {
    loading.value = false
    loadingProgress.value = 0
    loadingTime.value = 0
    if (loadingInterval) {
      clearInterval(loadingInterval)
    }
  }
}

// 控制函数
const resetView = () => {
  controls.rotationX = 0
  controls.rotationY = 0
  controls.zoom = 1
  controls.autoRotate = false
  autoRotate.value = false
  camera.position.set(8, 6, 8)
  camera.lookAt(0, 0, 0)
}

const fitToView = () => {
  if (!currentModel) return
  
  const box = new THREE.Box3().setFromObject(currentModel)
  const center = box.getCenter(new THREE.Vector3())
  const size = box.getSize(new THREE.Vector3())
  
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
  if (currentModel) {
    currentModel.traverse((child) => {
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
  controls.autoRotate = autoRotate.value
}

const clearModel = () => {
  if (currentModel) {
    scene.remove(currentModel)
    disposeModel(currentModel)
    currentModel = null
    modelLoaded.value = false
    modelInfo.value = null
    ElMessage.success('模型已清除')
  }
}

// 加载示例模型
const loadSampleModel = async () => {
  const sampleData = {
    name: 'sample-robot.gltf',
    type: 'model/gltf+json',
    size: 1024 * 1024
  }
  
  const blob = new Blob(['sample'], { type: 'model/gltf+json' })
  const file = new File([blob], sampleData.name, { type: sampleData.type })
  
  await loadRealModel(file)
}

// 文件处理
const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    loadRealModel(file)
  }
  target.value = ''
}

const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  isDragOver.value = false
  
  const files = Array.from(event.dataTransfer?.files || [])
  const file = files.find(f => {
    const ext = f.name.split('.').pop()?.toLowerCase()
    return ['gltf', 'glb', 'obj', 'fbx'].includes(ext || '')
  })
  
  if (file) {
    loadRealModel(file)
  } else {
    error.value = '请拖拽有效的3D模型文件'
  }
}

const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
  isDragOver.value = true
}

const handleDragLeave = (event: DragEvent) => {
  event.preventDefault()
  isDragOver.value = false
}

// 渲染循环
const animate = () => {
  animationId = requestAnimationFrame(animate)
  
  const now = performance.now()
  const delta = (now - (animate as any).lastTime || 0) / 1000;
  (animate as any).lastTime = now

  // 更新控制器
  if (currentModel && controls) {
    if (controls.autoRotate) {
      controls.rotationY += delta * 0.5
    }
    
    const distance = 8 / controls.zoom
    const x = Math.sin(controls.rotationY) * Math.cos(controls.rotationX) * distance
    const y = Math.sin(controls.rotationX) * distance + 2
    const z = Math.cos(controls.rotationY) * Math.cos(controls.rotationX) * distance
    
    camera.position.set(x, y, z)
    camera.lookAt(0, 0, 0)
  }

  renderer.render(scene, camera)
}

// 生命周期
onMounted(async () => {
  await nextTick()
  await initThreeJS()
})

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
  if (renderer) {
    renderer.dispose()
  }
  if (currentModel) {
    disposeModel(currentModel)
  }
})
</script>

<style scoped>
.enhanced-model-viewer {
  position: relative;
  width: 100%;
  height: 600px;
  border: 2px dashed #e1e8ed;
  border-radius: 16px;
  overflow: hidden;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  transition: all 0.3s ease;
}

.enhanced-model-viewer:hover {
  border-color: #409eff;
  box-shadow: 0 8px 32px rgba(64, 158, 255, 0.1);
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
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(8px);
  z-index: 100;
}

.loading-content {
  text-align: center;
  color: white;
  max-width: 400px;
  padding: 40px;
}

.progress-bar {
  width: 320px;
  margin-bottom: 24px;
}

.loading-text {
  margin: 0 0 12px 0;
  font-size: 18px;
  font-weight: 600;
}

.loading-details p {
  margin: 0;
  font-size: 14px;
  color: #ccc;
}

.loading-stats {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  font-size: 12px;
  color: #999;
  margin-top: 16px;
}

.upload-area {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.95);
  transition: all 0.3s ease;
}

.upload-content {
  text-align: center;
  padding: 60px 40px;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.upload-content.drag-over {
  background: rgba(64, 158, 255, 0.1);
  border: 2px dashed #409eff;
  transform: scale(1.02);
}

.upload-icon {
  font-size: 64px;
  color: #409eff;
  margin-bottom: 24px;
}

.upload-content h3 {
  margin: 0 0 16px 0;
  color: #2c3e50;
  font-size: 1.4rem;
  font-weight: 600;
}

.upload-content p {
  margin: 0 0 32px 0;
  color: #666;
  font-size: 1rem;
}

.upload-buttons {
  display: flex;
  gap: 16px;
  justify-content: center;
  margin-bottom: 32px;
}

.format-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 400px;
  margin: 0 auto;
}

.format-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 8px;
  font-size: 14px;
}

.control-toolbar {
  position: absolute;
  top: 20px;
  left: 20px;
  display: flex;
  gap: 8px;
  background: rgba(255, 255, 255, 0.95);
  padding: 8px 12px;
  border-radius: 8px;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.error-alert {
  position: absolute;
  top: 20px;
  right: 20px;
  max-width: 350px;
  z-index: 200;
}

.info-panel {
  position: absolute;
  bottom: 20px;
  right: 20px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(16px);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.8);
  min-width: 280px;
  max-width: 350px;
  max-height: 70vh;
  overflow-y: auto;
  z-index: 150;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  background: rgba(64, 158, 255, 0.05);
}

.panel-header h4 {
  margin: 0;
  color: #2c3e50;
  font-size: 1rem;
  font-weight: 600;
}

.info-content {
  padding: 20px;
}

.info-section {
  margin-bottom: 24px;
}

.info-section:last-child {
  margin-bottom: 0;
}

.info-section h5 {
  margin: 0 0 12px 0;
  color: #409eff;
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 0.875rem;
  padding: 4px 0;
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-item span:first-child {
  color: #666;
  font-weight: 500;
}

.info-item span:last-child {
  color: #333;
  font-weight: 600;
  text-align: right;
}

/* 滚动条样式 */
.info-panel::-webkit-scrollbar {
  width: 6px;
}

.info-panel::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 3px;
}

.info-panel::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

.info-panel::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .control-toolbar {
    left: 10px;
    right: 10px;
    top: 10px;
    justify-content: center;
    flex-wrap: wrap;
  }
  
  .info-panel {
    left: 10px;
    right: 10px;
    bottom: 10px;
    max-width: none;
  }
  
  .upload-content {
    padding: 40px 20px;
  }
  
  .upload-buttons {
    flex-direction: column;
    align-items: center;
  }
  
  .format-info {
    max-width: 300px;
  }
}