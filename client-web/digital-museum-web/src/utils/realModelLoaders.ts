// D:\Projects\metaverse-learning-hub\client-web\digital-museum-web\src\utils\realModelLoaders.ts
import {
  Scene, PerspectiveCamera, WebGLRenderer,
  ACESFilmicToneMapping, sRGBEncoding, PMREMGenerator,
  Box3, Vector3, GridHelper, AxesHelper, Color
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader }  from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

type ViewerCtx = {
  renderer: WebGLRenderer;
  scene: Scene;
  camera: PerspectiveCamera;
  controls: OrbitControls;
  pmrem: PMREMGenerator;
  grid?: GridHelper;
  axes?: AxesHelper;
  mixer?: any;
  currentRoot?: any;
  raf?: number;
};

export function createViewer(canvas: HTMLCanvasElement, opts?: {
  showGrid?: boolean;
  showAxes?: boolean;
  bg?: string | number;
}) {
  const ctx: ViewerCtx = {} as any;

  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.outputEncoding = sRGBEncoding;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);

  const scene = new Scene();
  if (opts?.bg) scene.background = new Color(opts.bg as any);

  const camera = new PerspectiveCamera(60, canvas.clientWidth / canvas.clientHeight, 0.01, 1000);
  camera.position.set(2.5, 1.5, 2.5);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  const pmrem = new PMREMGenerator(renderer);

  if (opts?.showGrid) {
    const grid = new GridHelper(10, 10);
    scene.add(grid);
    ctx.grid = grid;
  }
  if (opts?.showAxes) {
    const axes = new AxesHelper(1.5);
    scene.add(axes);
    ctx.axes = axes;
  }

  function onResize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  const resizeObs = new ResizeObserver(onResize);
  resizeObs.observe(canvas);

  function tick() {
    controls.update();
    renderer.render(scene, camera);
    ctx.raf = requestAnimationFrame(tick);
  }
  tick();

  ctx.renderer = renderer; ctx.scene = scene; ctx.camera = camera; ctx.controls = controls; ctx.pmrem = pmrem;

  return {
    ctx,
    dispose() {
      cancelAnimationFrame(ctx.raf!);
      resizeObs.disconnect();
      renderer.dispose();
      pmrem.dispose();
    }
  };
}

export async function loadGLTF(ctx: ViewerCtx, url: string, onProgress?: (p: number)=>void) {
  // 卸载旧模型
  if (ctx.currentRoot) {
    ctx.scene.remove(ctx.currentRoot);
    ctx.currentRoot.traverse?.((o: any)=> {
      if (o.geometry) o.geometry.dispose?.();
      if (o.material) {
        if (Array.isArray(o.material)) o.material.forEach((m:any)=>m.dispose?.());
        else o.material.dispose?.();
      }
    });
    ctx.currentRoot = undefined;
    ctx.mixer = undefined;
  }

  // === 关键：这里设置 Draco 解码器路径 ===
  const gltfLoader = new GLTFLoader();
  const draco = new DRACOLoader();
  // 如果部署根路径是 / ，用 '/draco/'；若是子路径，改成 import.meta.env.BASE_URL + 'draco/'
  draco.setDecoderPath('/draco/');
  gltfLoader.setDRACOLoader(draco);

  const gltf = await new Promise<any>((resolve, reject)=>{
    gltfLoader.load(url, resolve, (e)=>{
      if (e.total) onProgress?.(e.loaded / e.total);
    }, reject);
  });

  const root = gltf.scene || gltf.scenes[0];
  root.traverse((o:any)=>{
    if (o.isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
  ctx.scene.add(root);
  ctx.currentRoot = root;

  // 自适应相机
  const box = new Box3().setFromObject(root);
  const size = new Vector3(); const center = new Vector3();
  box.getSize(size); box.getCenter(center);
  const maxDim = Math.max(size.x, size.y, size.z);
  const fitDist = maxDim / (2 * Math.tan((Math.PI * ctx.camera.fov) / 360));
  const dir = new Vector3(1, 1, 1).normalize();
  const newPos = center.clone().addScaledVector(dir, fitDist * 1.5);
  ctx.camera.position.copy(newPos);
  ctx.controls.target.copy(center);
  ctx.controls.update();

  // 动画（有就播放第一个）
  if (gltf.animations?.length) {
    const { AnimationMixer, LoopRepeat } = await import('three');
    ctx.mixer = new AnimationMixer(root);
    const action = ctx.mixer.clipAction(gltf.animations[0]);
    action.setLoop(LoopRepeat, Infinity).play();

    const oldUpdate = ctx.controls.update.bind(ctx.controls);
    let prev = performance.now();
    ctx.controls.update = function() {
      const now = performance.now();
      const delta = (now - prev) / 1000;
      prev = now;
      ctx.mixer?.update(delta);
      oldUpdate();
    };
  }

  return {
    bbox: { min: box.min.clone(), max: box.max.clone(), size },
    nodeCount: root.children.length,
    hasAnimation: !!gltf.animations?.length
  };
}
