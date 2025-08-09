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

const emit = defineEmits<{ (e: 'loaded', payload: any): void }>();

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
  viewer = createViewer(canvasEl.value, { showGrid: showGrid.value, showAxes: showAxes.value });
  // @ts-ignore
  ctx = viewer.ctx;
  await doLoad(props.fileUrl);
}

async function doLoad(url: string) {
  if (!url) return;
  loading.value = true; progress.value = 0; error.value = undefined;
  try {
    const info = await loadGLTF(ctx, url, (p)=>progress.value = p);
    emit('loaded', info);
  } catch (e:any) {
    error.value = e?.message || String(e);
  } finally {
    loading.value = false;
  }
}

function resetView() {
  doLoad(props.fileUrl);
}

watch(()=>props.fileUrl, (v)=> { if (v) doLoad(v); });

onMounted(()=> boot());
onBeforeUnmount(()=> viewer?.dispose());
</script>

<style scoped>
.viewer-wrap { display: flex; flex-direction: column; height: 100%; }
.toolbar { display: flex; gap: 12px; align-items: center; padding: 8px 0; }
.canvas-box { flex: 1; position: relative; }
canvas { width: 100%; height: 100%; display: block; }
.err { color: #c00; }
</style>
