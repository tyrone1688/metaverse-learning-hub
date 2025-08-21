<!-- src/components/ModelViewer.vue -->
<template>
  <div class="model-viewer-container">
    <!-- 3D渲染容器 -->
    <div ref="rendererContainer" class="renderer-container"></div>
    
    <!-- 加载进度条 -->
    <el-progress
      v-if="loading"
      class="loading-progress"
      :percentage="loadProgress"
      :stroke-width="3"
      :show-text="true"
    />
    
    <!-- 控制面板 -->
    <div class="control-panel" v-if="!loading && modelLoaded">
      <!-- 视图控制 -->
      <div class="control-group">
        <el-tooltip content="重置视图" placement="top">
          <el-button circle @click="resetCamera">
            <el-icon><Refresh /></el-icon>
          </el-button>
        </el-tooltip>
        
        <el-tooltip content="自动旋转" placement="top">
          <el-button
            circle
            :type="autoRotate ? 'primary' : 'default'"
            @click="toggleAutoRotate"
          >
            <el-icon><RefreshRight /></el-icon>
          </el-button>
        </el-tooltip>
        
        <el-tooltip content="全屏" placement="top">
          <el-button circle @click="toggleFullscreen">
            <el-icon><FullScreen /></el-icon>
          </el-button>
        </el-tooltip>
        
        <el-tooltip content="截图" placement="top">
          <el-button circle @click="takeScreenshot">
            <el-icon><Camera /></el-icon>
          </el-button>
        </el-tooltip>
      </div>
      
      <!-- 渲染选项 -->
      <div class="control-group">
        <el-tooltip content="线框模式" placement="top">
          <el-button
            circle
            :type="wireframe ? 'primary' : 'default'"
            @click="toggleWireframe"
          >
            <el-icon><Grid /></el-icon>
          </el-button>
        </el-tooltip>
        
        <el-tooltip content="显示坐标轴" placement="top">
          <el-button
            circle
            :type="showAxes ? 'primary' : 'default'"
            @click="toggleAxes"
          >
            <el-icon><Aim /></el-icon>
          </el-button>
        </el-tooltip>
        
        <el-tooltip content="显示网格" placement="top">
          <el-button
            circle
            :type="showGrid ? 'primary' : 'default'"
            @click="toggleGrid"
          >
            <el-icon><CopyDocument /></el-icon>
          </el-button>
        </el-tooltip>
      </div>
      
      <!-- 动画控制（如果有动画） -->
      <div class="animation-controls" v-if="animations.length > 0">
        <el-select
          v-model="currentAnimation"
          placeholder="选择动画"
          size="small"
          @change="playAnimation"
        >
          <el-option
            v-for="(anim, index) in animations"
            :key="index"
            :label="anim.name || `动画 ${index + 1}`"
            :value="index"
          />
        </el-select>
        
        <el-button-group size="small">
          <el-button @click="toggleAnimationPlay">
            <el-icon>
              <VideoPlay v-if="!animationPlaying" />
              <VideoPause v-else />
            </el-icon>
          </el-button>
          <el-button @click="stopAnimation" size="small">
            停止
          </el-button>
        </el-button-group>
        
        <el-slider
          v-model="animationSpeed"
          :min="0.1"
          :max="2"
          :step="0.1"
          :show-tooltip="true"
          @change="updateAnimationSpeed"
          style="width: 100px; margin-left: 10px"
        />
      </div>
    </div>
    
    <!-- 模型信息面板 -->
    <div class="info-panel" v-if="modelInfo && showInfo">
      <h4>模型信息</h4>
      <div class="info-item">
        <span>顶点数：</span>
        <span>{{ modelInfo.vertices.toLocaleString() }}</span>
      </div>
      <div class="info-item">
        <span>面数：</span>
        <span>{{ modelInfo.faces.toLocaleString() }}</span>
      </div>
      <div class="info-item">
        <span>尺寸：</span>
        <span>
          {{ modelInfo.size.x.toFixed(2) }} × 
          {{ modelInfo.size.y.toFixed(2) }} × 
          {{ modelInfo.size.z.toFixed(2) }}
        </span>
      </div>
      <div class="info-item" v-if="animations.length > 0">
        <span>动画数：</span>
        <span>{{ animations.length }}</span>
      </div>
    </div>
    
    <!-- 错误提示 -->
    <el-alert
      v-if="error"
      type="error"
      :title="error"
      :closable="true"
      @close="error = ''"
      class="error-alert"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { modelLoader, type ModelLoadResult } from '../utils/modelLoaders';
import {
  Refresh,
  RefreshRight,
  FullScreen,
  Camera,
  Grid,
  Aim,
  CopyDocument,
  VideoPlay,
  VideoPause
} from '@element-plus/icons-vue';

// Props
const props = defineProps<{
  modelUrl: string;
  modelType?: string;  // 文件类型（用于blob URL）
  showInfo?: boolean;
}>();

// Refs
const rendererContainer = ref<HTMLElement>();
const loading = ref(false);
const loadProgress = ref(0);
const modelLoaded = ref(false);
const error = ref('');
const autoRotate = ref(false);
const wireframe = ref(false);
const showAxes = ref(true);
const showGrid = ref(true);

// Three.js 对象
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let controls: OrbitControls;
let model: THREE.Object3D | null = null;
let axesHelper: THREE.AxesHelper | null = null;
let gridHelper: THREE.GridHelper | null = null;
let animationMixer: THREE.AnimationMixer | null = null;
let animationClock: THREE.Clock;

// 动画相关
const animations = ref<THREE.AnimationClip[]>([]);
const currentAnimation = ref(-1);
const animationPlaying = ref(false);
const animationSpeed = ref(1);
let currentAction: THREE.AnimationAction | null = null;

// 模型信息
const modelInfo = ref<{
  vertices: number;
  faces: number;
  size: THREE.Vector3;
} | null>(null);

// 初始化Three.js场景
function initScene() {
  if (!rendererContainer.value) return;
  
  const container = rendererContainer.value;
  const width = container.clientWidth;
  const height = container.clientHeight;
  
  // 创建场景
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf0f0f0);
  
  // 创建相机
  camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
  camera.position.set(5, 5, 5);
  
  // 创建渲染器
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    preserveDrawingBuffer: true // 用于截图
  });
  renderer.setSize(width, height);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);
  
  // 创建控制器
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.screenSpacePanning = false;
  controls.minDistance = 0.1;
  controls.maxDistance = 100;
  controls.maxPolarAngle = Math.PI;
  
  // 添加灯光
  setupLights();
  
  // 添加辅助对象
  setupHelpers();
  
  // 创建动画时钟
  animationClock = new THREE.Clock();
  
  // 开始渲染循环
  animate();
}

// 设置灯光
function setupLights() {
  // 环境光
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);
  
  // 主方向光
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(5, 10, 5);
  directionalLight.castShadow = true;
  directionalLight.shadow.camera.near = 0.1;
  directionalLight.shadow.camera.far = 50;
  directionalLight.shadow.camera.left = -10;
  directionalLight.shadow.camera.right = 10;
  directionalLight.shadow.camera.top = 10;
  directionalLight.shadow.camera.bottom = -10;
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  scene.add(directionalLight);
  
  // 补充光
  const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
  fillLight.position.set(-5, 5, -5);
  scene.add(fillLight);
}

// 设置辅助对象
function setupHelpers() {
  // 坐标轴
  axesHelper = new THREE.AxesHelper(5);
  if (showAxes.value) {
    scene.add(axesHelper);
  }
  
  // 网格
  gridHelper = new THREE.GridHelper(10, 10, 0x444444, 0x888888);
  if (showGrid.value) {
    scene.add(gridHelper);
  }
}

// 加载模型
async function loadModel() {
  if (!props.modelUrl) {
    error.value = '未提供模型URL';
    return;
  }
  
  loading.value = true;
  loadProgress.value = 0;
  error.value = '';
  
  try {
    // 移除旧模型
    if (model) {
      scene.remove(model);
      model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(mat => mat.dispose());
            } else {
              child.material.dispose();
            }
          }
        }
      });
      model = null;
    }
    
    // 加载新模型
    const result: ModelLoadResult = await modelLoader.load(
      props.modelUrl,
      (progress) => {
        loadProgress.value = Math.round(progress);
      },
      undefined,  // error callback
      props.modelType  // 传递文件类型
    );
    
    model = result.object;
    scene.add(model);
    
    // 保存动画
    if (result.animations) {
      animations.value = result.animations;
      animationMixer = new THREE.AnimationMixer(model);
    }
    
    // 调整相机位置以适应模型大小
    const size = result.size;
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = camera.fov * (Math.PI / 180);
    
    // 计算合适的相机距离
    let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
    cameraZ *= 2.5; // 增加一些距离，确保能看到整个模型
    
    // 根据模型大小调整相机位置
    camera.position.set(cameraZ, cameraZ * 0.5, cameraZ);
    camera.lookAt(0, 0, 0);
    
    // 调整相机的近裁剪面和远裁剪面
    camera.near = maxDim / 100;
    camera.far = maxDim * 100;
    camera.updateProjectionMatrix();
    
    // 更新控制器
    controls.target.set(0, 0, 0);
    controls.minDistance = maxDim * 0.5;
    controls.maxDistance = maxDim * 10;
    controls.update();
    
    // 调整网格和坐标轴大小
    if (gridHelper) {
      scene.remove(gridHelper);
      gridHelper = new THREE.GridHelper(maxDim * 2, 10, 0x444444, 0x888888);
      if (showGrid.value) {
        scene.add(gridHelper);
      }
    }
    
    if (axesHelper) {
      scene.remove(axesHelper);
      axesHelper = new THREE.AxesHelper(maxDim);
      if (showAxes.value) {
        scene.add(axesHelper);
      }
    }
    
    // 计算模型信息
    let vertices = 0;
    let faces = 0;
    
    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const geometry = child.geometry;
        if (geometry) {
          vertices += geometry.attributes.position?.count || 0;
          if (geometry.index) {
            faces += geometry.index.count / 3;
          } else {
            faces += (geometry.attributes.position?.count || 0) / 3;
          }
        }
      }
    });
    
    modelInfo.value = {
      vertices,
      faces,
      size: result.size
    };
    
    modelLoaded.value = true;
    loading.value = false;
    
    console.log('Model loaded successfully:', modelInfo.value);
    
  } catch (err) {
    console.error('Failed to load model:', err);
    error.value = `加载模型失败: ${err}`;
    loading.value = false;
  }
}

// 渲染循环
function animate() {
  requestAnimationFrame(animate);
  
  // 更新控制器
  controls.update();
  
  // 自动旋转
  if (autoRotate.value && model) {
    model.rotation.y += 0.01;
  }
  
  // 更新动画
  if (animationMixer && animationPlaying.value) {
    const delta = animationClock.getDelta();
    animationMixer.update(delta);
  }
  
  // 渲染场景
  renderer.render(scene, camera);
}

// 控制功能
function resetCamera() {
  camera.position.set(5, 5, 5);
  camera.lookAt(0, 0, 0);
  controls.target.set(0, 0, 0);
  controls.update();
}

function toggleAutoRotate() {
  autoRotate.value = !autoRotate.value;
}

function toggleWireframe() {
  wireframe.value = !wireframe.value;
  if (model) {
    model.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(mat => {
            if ('wireframe' in mat) {
              (mat as any).wireframe = wireframe.value;
            }
          });
        } else if ('wireframe' in child.material) {
          (child.material as any).wireframe = wireframe.value;
        }
      }
    });
  }
}

function toggleAxes() {
  showAxes.value = !showAxes.value;
  if (axesHelper) {
    if (showAxes.value) {
      scene.add(axesHelper);
    } else {
      scene.remove(axesHelper);
    }
  }
}

function toggleGrid() {
  showGrid.value = !showGrid.value;
  if (gridHelper) {
    if (showGrid.value) {
      scene.add(gridHelper);
    } else {
      scene.remove(gridHelper);
    }
  }
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    rendererContainer.value?.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
}

function takeScreenshot() {
  const dataURL = renderer.domElement.toDataURL('image/png');
  const link = document.createElement('a');
  link.download = 'model-screenshot.png';
  link.href = dataURL;
  link.click();
}

// 动画控制
function playAnimation(index: number) {
  if (!animationMixer || index < 0 || index >= animations.value.length) return;
  
  // 停止当前动画
  if (currentAction) {
    currentAction.stop();
  }
  
  // 播放新动画
  currentAction = animationMixer.clipAction(animations.value[index]);
  currentAction.play();
  animationPlaying.value = true;
}

function toggleAnimationPlay() {
  if (!currentAction) {
    if (currentAnimation.value >= 0) {
      playAnimation(currentAnimation.value);
    } else if (animations.value.length > 0) {
      currentAnimation.value = 0;
      playAnimation(0);
    }
  } else {
    animationPlaying.value = !animationPlaying.value;
    if (animationPlaying.value) {
      currentAction.play();
    } else {
      currentAction.stop();
    }
  }
}

function stopAnimation() {
  if (currentAction) {
    currentAction.stop();
    currentAction = null;
  }
  animationPlaying.value = false;
  currentAnimation.value = -1;
}

function updateAnimationSpeed() {
  if (animationMixer) {
    animationMixer.timeScale = animationSpeed.value;
  }
}

// 处理窗口大小变化
function handleResize() {
  if (!rendererContainer.value) return;
  
  const width = rendererContainer.value.clientWidth;
  const height = rendererContainer.value.clientHeight;
  
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  
  renderer.setSize(width, height);
}

// 监听模型URL变化
watch(() => props.modelUrl, (newUrl) => {
  if (newUrl) {
    loadModel();
  }
});

// 生命周期
onMounted(() => {
  initScene();
  loadModel();
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  
  // 清理Three.js资源
  if (renderer) {
    renderer.dispose();
  }
  if (controls) {
    controls.dispose();
  }
  
  // 清理模型
  if (model) {
    scene.remove(model);
    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(mat => mat.dispose());
          } else {
            child.material.dispose();
          }
        }
      }
    });
  }
});
</script>

<style scoped>
.model-viewer-container {
  width: 100%;
  height: 100%;
  position: relative;
  background: #f0f0f0;
}

.renderer-container {
  width: 100%;
  height: 100%;
}

.loading-progress {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 200px;
}

.control-panel {
  position: absolute;
  top: 20px;
  right: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.control-group {
  display: flex;
  gap: 8px;
  background: rgba(255, 255, 255, 0.9);
  padding: 8px;
  border-radius: 8px;
  backdrop-filter: blur(10px);
}

.animation-controls {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(255, 255, 255, 0.9);
  padding: 10px;
  border-radius: 8px;
  backdrop-filter: blur(10px);
}

.info-panel {
  position: absolute;
  top: 20px;
  left: 20px;
  background: rgba(255, 255, 255, 0.9);
  padding: 15px;
  border-radius: 8px;
  backdrop-filter: blur(10px);
  min-width: 200px;
}

.info-panel h4 {
  margin: 0 0 10px 0;
  font-size: 14px;
  font-weight: 600;
}

.info-item {
  display: flex;
  justify-content: space-between;
  margin: 5px 0;
  font-size: 12px;
}

.info-item span:first-child {
  color: #666;
}

.info-item span:last-child {
  font-weight: 500;
}

.error-alert {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  max-width: 400px;
}
</style>