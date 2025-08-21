// src/utils/modelLoaders.ts
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader.js';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';

// 模型加载结果接口
export interface ModelLoadResult {
  object: THREE.Object3D;
  animations?: THREE.AnimationClip[];
  boundingBox: THREE.Box3;
  center: THREE.Vector3;
  size: THREE.Vector3;
  originalSize: THREE.Vector3;
}

// 加载进度回调
export type ProgressCallback = (progress: number) => void;
export type ErrorCallback = (error: Error) => void;

/**
 * 3D模型加载器类
 * 支持多种3D格式：GLTF/GLB, OBJ/MTL, FBX, PLY, STL
 */
export class ModelLoader {
  private gltfLoader: GLTFLoader;
  private objLoader: OBJLoader;
  private mtlLoader: MTLLoader;
  private fbxLoader: FBXLoader;
  private plyLoader: PLYLoader;
  private stlLoader: STLLoader;
  private textureLoader: THREE.TextureLoader;

  constructor() {
    this.gltfLoader = new GLTFLoader();
    this.objLoader = new OBJLoader();
    this.mtlLoader = new MTLLoader();
    this.fbxLoader = new FBXLoader();
    this.plyLoader = new PLYLoader();
    this.stlLoader = new STLLoader();
    this.textureLoader = new THREE.TextureLoader();
  }

  /**
   * 根据文件扩展名自动选择加载器
   */
  async load(
    url: string,
    onProgress?: ProgressCallback,
    onError?: ErrorCallback,
    fileType?: string  // 添加可选的文件类型参数
  ): Promise<ModelLoadResult> {
    // 如果提供了文件类型，使用它；否则从URL获取
    const extension = fileType || this.getFileExtension(url);
    
    try {
      switch (extension.toLowerCase()) {
        case 'gltf':
        case 'glb':
          return await this.loadGLTF(url, onProgress);
        
        case 'obj':
          return await this.loadOBJ(url, onProgress);
        
        case 'fbx':
          return await this.loadFBX(url, onProgress);
        
        case 'ply':
          return await this.loadPLY(url, onProgress);
        
        case 'stl':
          return await this.loadSTL(url, onProgress);
        
        default:
          throw new Error(`Unsupported file format: ${extension}`);
      }
    } catch (error) {
      const err = error as Error;
      console.error(`Error loading model: ${err.message}`);
      onError?.(err);
      throw err;
    }
  }

  /**
   * 加载GLTF/GLB模型
   */
  private loadGLTF(url: string, onProgress?: ProgressCallback): Promise<ModelLoadResult> {
    return new Promise((resolve, reject) => {
      this.gltfLoader.load(
        url,
        (gltf) => {
          console.log('GLTF model loaded successfully');
          
          // 处理模型
          const model = gltf.scene;
          
          // 处理材质和纹理
          model.traverse((node) => {
            if (node instanceof THREE.Mesh) {
              // 确保材质双面可见
              if (node.material) {
                if (Array.isArray(node.material)) {
                  node.material.forEach(mat => {
                    mat.side = THREE.DoubleSide;
                    mat.needsUpdate = true;
                  });
                } else {
                  node.material.side = THREE.DoubleSide;
                  node.material.needsUpdate = true;
                }
              }
              
              // 启用阴影
              node.castShadow = true;
              node.receiveShadow = true;
            }
          });
          
          const result = this.processModel(model);
          
          // 添加动画（如果有）
          if (gltf.animations && gltf.animations.length > 0) {
            result.animations = gltf.animations;
            console.log(`Found ${gltf.animations.length} animations`);
          }
          
          resolve(result);
        },
        (xhr) => {
          if (xhr.lengthComputable) {
            const progress = (xhr.loaded / xhr.total) * 100;
            console.log(`Loading progress: ${progress.toFixed(2)}%`);
            onProgress?.(progress);
          }
        },
        (error) => {
          console.error('Error loading GLTF:', error);
          reject(new Error(`Failed to load GLTF: ${error}`));
        }
      );
    });
  }

  /**
   * 加载OBJ模型（支持MTL材质）
   */
  private async loadOBJ(url: string, onProgress?: ProgressCallback): Promise<ModelLoadResult> {
    // 检查是否有对应的MTL文件
    const mtlUrl = url.replace('.obj', '.mtl');
    let materials: MTLLoader.MaterialCreator | null = null;
    
    try {
      // 尝试加载MTL材质文件
      materials = await this.loadMTL(mtlUrl);
      if (materials) {
        materials.preload();
        this.objLoader.setMaterials(materials);
      }
    } catch (error) {
      console.log('No MTL file found, using default material');
    }
    
    return new Promise((resolve, reject) => {
      this.objLoader.load(
        url,
        (object) => {
          console.log('OBJ model loaded successfully');
          
          // 如果没有材质，添加默认材质
          if (!materials) {
            object.traverse((node) => {
              if (node instanceof THREE.Mesh) {
                node.material = new THREE.MeshPhongMaterial({
                  color: 0x888888,
                  specular: 0x222222,
                  shininess: 100,
                  side: THREE.DoubleSide
                });
                node.castShadow = true;
                node.receiveShadow = true;
              }
            });
          } else {
            // 确保材质正确设置
            object.traverse((node) => {
              if (node instanceof THREE.Mesh) {
                if (node.material) {
                  if (Array.isArray(node.material)) {
                    node.material.forEach((mat: any) => {
                      mat.side = THREE.DoubleSide;
                    });
                  } else {
                    (node.material as any).side = THREE.DoubleSide;
                  }
                }
                node.castShadow = true;
                node.receiveShadow = true;
              }
            });
          }
          
          resolve(this.processModel(object));
        },
        (xhr) => {
          if (xhr.lengthComputable) {
            const progress = (xhr.loaded / xhr.total) * 100;
            console.log(`Loading progress: ${progress.toFixed(2)}%`);
            onProgress?.(progress);
          }
        },
        (error) => {
          console.error('Error loading OBJ:', error);
          reject(new Error(`Failed to load OBJ: ${error}`));
        }
      );
    });
  }

  /**
   * 加载MTL材质文件
   */
  private loadMTL(url: string): Promise<MTLLoader.MaterialCreator> {
    return new Promise((resolve, reject) => {
      this.mtlLoader.load(
        url,
        (materials) => {
          console.log('MTL materials loaded');
          resolve(materials);
        },
        undefined,
        (error) => {
          reject(error);
        }
      );
    });
  }

  /**
   * 加载FBX模型
   */
  private loadFBX(url: string, onProgress?: ProgressCallback): Promise<ModelLoadResult> {
    return new Promise((resolve, reject) => {
      this.fbxLoader.load(
        url,
        (object) => {
          console.log('FBX model loaded successfully');
          
          // 处理材质和网格
          object.traverse((node) => {
            if (node instanceof THREE.Mesh) {
              // 计算法线（如果需要）
              if (node.geometry && !node.geometry.attributes.normal) {
                node.geometry.computeVertexNormals();
              }
              
              // 设置材质
              if (node.material) {
                if (Array.isArray(node.material)) {
                  node.material.forEach(mat => {
                    mat.side = THREE.DoubleSide;
                    mat.needsUpdate = true;
                  });
                } else {
                  node.material.side = THREE.DoubleSide;
                  node.material.needsUpdate = true;
                }
              }
              
              node.castShadow = true;
              node.receiveShadow = true;
            }
          });
          
          const result = this.processModel(object);
          
          // FBX可能包含动画
          if (object.animations && object.animations.length > 0) {
            result.animations = object.animations;
            console.log(`Found ${object.animations.length} animations`);
          }
          
          resolve(result);
        },
        (xhr) => {
          if (xhr.lengthComputable) {
            const progress = (xhr.loaded / xhr.total) * 100;
            console.log(`Loading progress: ${progress.toFixed(2)}%`);
            onProgress?.(progress);
          }
        },
        (error) => {
          console.error('Error loading FBX:', error);
          reject(new Error(`Failed to load FBX: ${error}`));
        }
      );
    });
  }

  /**
   * 加载PLY模型（点云格式）
   */
  private loadPLY(url: string, onProgress?: ProgressCallback): Promise<ModelLoadResult> {
    return new Promise((resolve, reject) => {
      this.plyLoader.load(
        url,
        (geometry) => {
          console.log('PLY model loaded successfully');
          
          // 计算法线
          geometry.computeVertexNormals();
          
          // 创建材质
          let material: THREE.Material;
          
          if (geometry.attributes.color) {
            // 如果有顶点颜色，使用顶点颜色
            material = new THREE.MeshPhongMaterial({
              vertexColors: true,
              side: THREE.DoubleSide
            });
          } else {
            // 否则使用默认颜色
            material = new THREE.MeshPhongMaterial({
              color: 0x888888,
              specular: 0x111111,
              shininess: 100,
              side: THREE.DoubleSide
            });
          }
          
          const mesh = new THREE.Mesh(geometry, material);
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          
          const group = new THREE.Group();
          group.add(mesh);
          
          resolve(this.processModel(group));
        },
        (xhr) => {
          if (xhr.lengthComputable) {
            const progress = (xhr.loaded / xhr.total) * 100;
            console.log(`Loading progress: ${progress.toFixed(2)}%`);
            onProgress?.(progress);
          }
        },
        (error) => {
          console.error('Error loading PLY:', error);
          reject(new Error(`Failed to load PLY: ${error}`));
        }
      );
    });
  }

  /**
   * 加载STL模型
   */
  private loadSTL(url: string, onProgress?: ProgressCallback): Promise<ModelLoadResult> {
    return new Promise((resolve, reject) => {
      this.stlLoader.load(
        url,
        (geometry) => {
          console.log('STL model loaded successfully');
          
          // 计算法线
          geometry.computeVertexNormals();
          
          // 创建材质
          const material = new THREE.MeshPhongMaterial({
            color: 0x888888,
            specular: 0x111111,
            shininess: 100,
            side: THREE.DoubleSide
          });
          
          const mesh = new THREE.Mesh(geometry, material);
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          
          const group = new THREE.Group();
          group.add(mesh);
          
          resolve(this.processModel(group));
        },
        (xhr) => {
          if (xhr.lengthComputable) {
            const progress = (xhr.loaded / xhr.total) * 100;
            console.log(`Loading progress: ${progress.toFixed(2)}%`);
            onProgress?.(progress);
          }
        },
        (error) => {
          console.error('Error loading STL:', error);
          reject(new Error(`Failed to load STL: ${error}`));
        }
      );
    });
  }

  /**
   * 处理加载的模型，计算边界和居中
   */
  private processModel(object: THREE.Object3D): ModelLoadResult {
    // 计算边界框
    const box = new THREE.Box3().setFromObject(object);
    const originalSize = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    
    // 将模型移动到原点
    object.position.sub(center);
    
    // 重新计算边界框（居中后）
    const centeredBox = new THREE.Box3().setFromObject(object);
    const size = centeredBox.getSize(new THREE.Vector3());
    
    return {
      object,
      boundingBox: centeredBox,
      center: new THREE.Vector3(0, 0, 0),
      size,
      originalSize
    };
  }

  /**
   * 获取文件扩展名
   */
  private getFileExtension(url: string): string {
    // 处理 blob URL
    if (url.startsWith('blob:')) {
      console.warn('Cannot determine file extension from blob URL, please provide fileType parameter');
      return '';
    }
    
    const parts = url.split('.');
    return parts[parts.length - 1].split('?')[0]; // 移除查询参数
  }

  /**
   * 加载纹理
   */
  loadTexture(url: string): Promise<THREE.Texture> {
    return new Promise((resolve, reject) => {
      this.textureLoader.load(
        url,
        (texture) => {
          texture.needsUpdate = true;
          resolve(texture);
        },
        undefined,
        (error) => {
          reject(new Error(`Failed to load texture: ${error}`));
        }
      );
    });
  }
}

// 导出单例
export const modelLoader = new ModelLoader();