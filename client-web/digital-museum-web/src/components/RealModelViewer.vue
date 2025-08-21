<template>
  <div class="viewer-wrap">
    <div class="toolbar">
      <button @click="resetView">重置视角</button>
      <label><input type="checkbox" v-model="showGrid">网格</label>
      <label><input type="checkbox" v-model="showAxes">坐标轴</label>
      <span v-if="loading">加载中 {{ Math.round(progress*100) }}%</span>
      <span v-if="error" class="err">加载失败：{{ error }}</span>
    </div>
    <div class="canvas-box"><canvas ref="canvasEl"></canvas></div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch } from 'vue';
import { createViewer, loadGLTF } from '@/utils/realModelLoaders';

const props = defineProps<{
  fileUrl: string;
  defaultGrid?: boolean;
  defaultAxes?: boolean;
}>();

const emit = defineEmits<{ 
  (e: 'loaded', payload: any): void 
}>();

const canvasEl = ref<HTMLCanvasElement|null>(null);
const loading = ref(false);
const progress = ref(0);
const error = ref<string|undefined>();
const showGrid = ref(!!props.defaultGrid);
const showAxes = ref(!!props.defaultAxes);

let viewer: ReturnType<typeof createViewer> | null = null;
let ctx: any = null;

async function boot() {
  if (!canvasEl.value) return;
  try {
    viewer = createViewer(canvasEl.value, { 
      showGrid: showGrid.value, 
      showAxes: showAxes.value 
    });
    ctx = viewer.ctx;
    
    // 如果有文件URL，立即加载
    if (props.fileUrl) {
      await doLoad(props.fileUrl);
    }
  } catch (err) {
    console.error('3D查看器初始化失败:', err);
    error.value = '3D查看器初始化失败';
  }
}

async function doLoad(url: string) {
  if (!url || !ctx) return;
  
  loading.value = true; 
  progress.value = 0; 
  error.value = undefined;
  
  try {
    console.log('开始加载3D模型:', url);
    const info = await loadGLTF(ctx, url, (p) => progress.value = p);
    emit('loaded', info);
    console.log('3D模型加载成功');
  } catch (e: any) {
    console.error('3D模型加载失败:', e);
    error.value = e?.message || String(e);
  } finally {
    loading.value = false;
  }
}

function resetView() {
  if (props.fileUrl) {
    doLoad(props.fileUrl);
  }
}

// 监听文件URL变化
watch(() => props.fileUrl, (newUrl) => { 
  if (newUrl && ctx) {
    doLoad(newUrl); 
  }
});

// 监听网格和坐标轴显示设置变化
watch([showGrid, showAxes], ([newGrid, newAxes]) => {
  if (ctx?.grid) {
    ctx.grid.visible = newGrid;
  }
  if (ctx?.axes) {
    ctx.axes.visible = newAxes;
  }
});

onMounted(() => boot());
onBeforeUnmount(() => viewer?.dispose());
</script>

<style scoped>
.viewer-wrap { 
  display: flex; 
  flex-direction: column; 
  height: 100%; 
  background: #f8f9fa;
  border-radius: 8px;
  overflow: hidden;
}

.toolbar { 
  display: flex; 
  gap: 12px; 
  align-items: center; 
  padding: 12px 16px; 
  background: white;
  border-bottom: 1px solid #e5e7eb;
  font-size: 14px;
}

.toolbar button {
  padding: 6px 12px;
  background: #409eff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.toolbar button:hover {
  background: #337ecc;
}

.toolbar label {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
}

.toolbar input[type="checkbox"] {
  margin: 0;
}

.canvas-box { 
  flex: 1; 
  position: relative;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

canvas { 
  width: 100%; 
  height: 100%; 
  display: block; 
}

.err { 
  color: #f56565; 
  font-weight: 500;
}

span {
  color: #4a5568;
  font-size: 13px;
}
</style>