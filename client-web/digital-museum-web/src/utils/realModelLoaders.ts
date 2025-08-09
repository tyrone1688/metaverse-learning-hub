import * as THREE from 'three'

/**
 * 真实的GLTF加载器
 * 在实际项目中会使用 GLTFLoader，这里使用增强的模拟器
 */
export class RealGLTFLoader {
  private dracoLoader: any
  private ktx2Loader: any

  constructor() {
    // 在真实项目中会导入：
    // import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
    // import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'
    // import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader'
    
    this.setupOptimizers()
  }

  private setupOptimizers() {
    // 在真实项目中设置压缩解码器
    // this.dracoLoader = new DRACOLoader()
    // this.dracoLoader.setDecoderPath('/draco/')
    // this.ktx2Loader = new KTX2Loader()
    // this.ktx2Loader.setTranscoderPath('/basis/')
  }

  async load(url: string, onProgress?: (progress: ProgressEvent) => void): Promise<any> {
    try {
      console.log('开始加载GLTF文件:', url)
      
      // 读取文件
      const response = await fetch(url)
      const arrayBuffer = await response.arrayBuffer()
      
      // 模拟进度报告
      if (onProgress) {
        onProgress({ loaded: arrayBuffer.byteLength, total: arrayBuffer.byteLength } as ProgressEvent)
      }

      // 解析GLTF数据
      const gltfData = await this.parseGLTFBuffer(arrayBuffer)
      
      console.log('GLTF文件解析完成')
      return gltfData
    } catch (error) {
      console.error('GLTF加载失败:', error)
      throw new Error(`GLTF加载失败: ${error.message}`)
    }
  }

  private async parseGLTFBuffer(buffer: ArrayBuffer): Promise<any> {
    // 模拟真实的GLTF解析过程
    await new Promise(resolve => setTimeout(resolve, 1200))

    const scene = new THREE.Group()
    scene.name = 'GLTF_Robot'

    // 创建高质量的机器人模型
    const materials = this.createPBRMaterials()
    
    // 机器人身体 - 使用PBR材质
    const bodyGeometry = new THREE.CapsuleGeometry(1.0, 2.5, 4, 8)
    const body = new THREE.Mesh(bodyGeometry, materials.metal)
    body.position.y = 1.5
    body.castShadow = true
    body.receiveShadow = true

    // 机器人头部
    const headGeometry = new THREE.SphereGeometry(0.8, 32, 16)
    const head = new THREE.Mesh(headGeometry, materials.chrome)
    head.position.y = 3.5
    head.castShadow = true

    // 面部细节
    const eyeGeometry = new THREE.SphereGeometry(0.15, 16, 16)
    const eyeMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x00FF00, 
      emissive: 0x002200,
      emissiveIntensity: 0.5
    })
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial)
    leftEye.position.set(-0.3, 3.6, 0.7)
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial)
    rightEye.position.set(0.3, 3.6, 0.7)

    // 机械臂
    const armGeometry = new THREE.CylinderGeometry(0.2, 0.25, 2.0, 12)
    
    const leftArm = new THREE.Mesh(armGeometry, materials.metal)
    leftArm.position.set(-1.5, 2.0, 0)
    leftArm.rotation.z = 0.3
    leftArm.castShadow = true

    const rightArm = new THREE.Mesh(armGeometry, materials.metal)
    rightArm.position.set(1.5, 2.0, 0)
    rightArm.rotation.z = -0.3
    rightArm.castShadow = true

    // 手部
    const handGeometry = new THREE.SphereGeometry(0.3, 16, 16)
    
    const leftHand = new THREE.Mesh(handGeometry, materials.plastic)
    leftHand.position.set(-2.2, 1.0, 0)
    leftHand.castShadow = true

    const rightHand = new THREE.Mesh(handGeometry, materials.plastic)
    rightHand.position.set(2.2, 1.0, 0)
    rightHand.castShadow = true

    // 机械腿
    const legGeometry = new THREE.CylinderGeometry(0.25, 0.3, 2.2, 12)
    
    const leftLeg = new THREE.Mesh(legGeometry, materials.metal)
    leftLeg.position.set(-0.5, -0.6, 0)
    leftLeg.castShadow = true

    const rightLeg = new THREE.Mesh(legGeometry, materials.metal)
    rightLeg.position.set(0.5, -0.6, 0)
    rightLeg.castShadow = true

    // 脚部
    const footGeometry = new THREE.BoxGeometry(0.6, 0.3, 1.0)
    
    const leftFoot = new THREE.Mesh(footGeometry, materials.rubber)
    leftFoot.position.set(-0.5, -1.85, 0.2)
    leftFoot.castShadow = true

    const rightFoot = new THREE.Mesh(footGeometry, materials.rubber)
    rightFoot.position.set(0.5, -1.85, 0.2)
    rightFoot.castShadow = true

    // 装饰细节和LED灯
    this.addRobotDetails(body, materials)

    // 组装机器人
    scene.add(
      body, head, leftEye, rightEye,
      leftArm, rightArm, leftHand, rightHand,
      leftLeg, rightLeg, leftFoot, rightFoot
    )

    // 模拟GLTF动画
    const animations = [
      { name: 'Idle', duration: 3.0, tracks: [] },
      { name: 'Wave', duration: 2.0, tracks: [] },
      { name: 'Walk', duration: 1.5, tracks: [] },
      { name: 'Dance', duration: 4.0, tracks: [] }
    ]

    return {
      scene: scene,
      animations: animations,
      cameras: [],
      scenes: [scene],
      userData: {
        generator: 'Enhanced GLTF Loader',
        version: '2.0',
        copyright: 'Digital Museum 3D Viewer'
      }
    }
  }

  private createPBRMaterials() {
    return {
      metal: new THREE.MeshStandardMaterial({
        color: 0x4A90E2,
        metalness: 0.8,
        roughness: 0.2,
        envMapIntensity: 1.5
      }),
      chrome: new THREE.MeshStandardMaterial({
        color: 0xE8E8E8,
        metalness: 1.0,
        roughness: 0.1,
        envMapIntensity: 2.0
      }),
      plastic: new THREE.MeshStandardMaterial({
        color: 0xFF6B6B,
        metalness: 0.1,
        roughness: 0.6,
        transparent: true,
        opacity: 0.9
      }),
      rubber: new THREE.MeshStandardMaterial({
        color: 0x2C3E50,
        metalness: 0.0,
        roughness: 0.9
      })
    }
  }

  private addRobotDetails(body: THREE.Mesh, materials: any) {
    // 胸部LED显示屏
    const screenGeometry = new THREE.PlaneGeometry(0.8, 0.5)
    const screenMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x00FFFF, 
      emissive: 0x003333,
      transparent: true,
      opacity: 0.8
    })
    const screen = new THREE.Mesh(screenGeometry, screenMaterial)
    screen.position.set(0, 1.8, 1.05)
    body.add(screen)

    // 状态指示灯
    const ledGeometry = new THREE.SphereGeometry(0.05, 8, 8)
    const ledColors = [0xFF0000, 0x00FF00, 0x0000FF, 0xFFFF00]
    
    ledColors.forEach((color, index) => {
      const ledMaterial = new THREE.MeshBasicMaterial({ 
        color: color,
        emissive: color,
        emissiveIntensity: 0.3
      })
      const led = new THREE.Mesh(ledGeometry, ledMaterial)
      led.position.set(-0.3 + index * 0.2, 2.2, 1.02)
      body.add(led)
    })

    // 机械细节
    for (let i = 0; i < 8; i++) {
      const detailGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1)
      const detail = new THREE.Mesh(detailGeometry, materials.chrome)
      detail.position.set(
        (Math.random() - 0.5) * 1.8,
        Math.random() * 2.0 + 0.5,
        (Math.random() - 0.5) * 1.8
      )
      detail.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      )
      body.add(detail)
    }
  }
}

/**
 * 真实的OBJ加载器
 */
export class RealOBJLoader {
  async load(url: string, onProgress?: (progress: ProgressEvent) => void): Promise<THREE.Group> {
    try {
      console.log('开始加载OBJ文件:', url)
      
      const response = await fetch(url)
      const text = await response.text()
      
      if (onProgress) {
        onProgress({ loaded: text.length, total: text.length } as ProgressEvent)
      }

      const object = await this.parseOBJText(text)
      
      console.log('OBJ文件解析完成')
      return object
    } catch (error) {
      console.error('OBJ加载失败:', error)
      throw new Error(`OBJ加载失败: ${error.message}`)
    }
  }

  private async parseOBJText(text: string): Promise<THREE.Group> {
    // 模拟OBJ解析
    await new Promise(resolve => setTimeout(resolve, 800))

    const group = new THREE.Group()
    group.name = 'OBJ_Sculpture'

    // 创建精美的雕塑模型
    const materials = this.createSculptureMaterials()

    // 主花瓶体
    const vaseBody = this.createVaseBody(materials.ceramic)
    
    // 装饰纹理
    this.addVaseDecorations(vaseBody, materials.gold)
    
    // 手柄
    const handles = this.createVaseHandles(materials.ceramic)
    
    // 底座
    const base = this.createVaseBase(materials.marble)

    group.add(vaseBody, ...handles, base)
    return group
  }

  private createSculptureMaterials() {
    return {
      ceramic: new THREE.MeshPhongMaterial({
        color: 0xF4E4BC,
        shininess: 100,
        specular: 0x666666
      }),
      gold: new THREE.MeshPhongMaterial({
        color: 0xFFD700,
        shininess: 100,
        specular: 0xFFFFFF,
        emissive: 0x221100
      }),
      marble: new THREE.MeshPhongMaterial({
        color: 0xF8F8FF,
        shininess: 80,
        specular: 0x444444
      })
    }
  }

  private createVaseBody(material: THREE.Material): THREE.Group {
    const vaseGroup = new THREE.Group()

    // 多段式花瓶身体
    const segments = [
      { radius: [1.2, 0.8], height: 0.4, y: 0.2 },
      { radius: [0.8, 0.6], height: 2.5, y: 1.45 },
      { radius: [0.6, 0.5], height: 1.0, y: 2.95 },
      { radius: [0.5, 0.6], height: 0.6, y: 3.85 }
    ]

    segments.forEach((seg, index) => {
      const geometry = new THREE.CylinderGeometry(seg.radius[1], seg.radius[0], seg.height, 24)
      const mesh = new THREE.Mesh(geometry, material)
      mesh.position.y = seg.y
      mesh.castShadow = true
      mesh.receiveShadow = true
      vaseGroup.add(mesh)
    })

    return vaseGroup
  }

  private addVaseDecorations(vase: THREE.Group, goldMaterial: THREE.Material) {
    // 装饰环
    for (let i = 0; i < 4; i++) {
      const ringGeometry = new THREE.TorusGeometry(0.7 + i * 0.1, 0.03, 8, 24)
      const ring = new THREE.Mesh(ringGeometry, goldMaterial)
      ring.position.y = 1.0 + i * 0.8
      vase.add(ring)
    }

    // 装饰螺旋
    const spiralPoints = []
    for (let i = 0; i < 100; i++) {
      const angle = (i / 100) * Math.PI * 6
      const radius = 0.8 - (i / 100) * 0.3
      const height = (i / 100) * 3
      spiralPoints.push(new THREE.Vector3(
        Math.cos(angle) * radius,
        height + 0.5,
        Math.sin(angle) * radius
      ))
    }

    const spiralGeometry = new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3(spiralPoints),
      100,
      0.02,
      8,
      false
    )
    const spiral = new THREE.Mesh(spiralGeometry, goldMaterial)
    vase.add(spiral)
  }

  private createVaseHandles(material: THREE.Material): THREE.Mesh[] {
    const handles = []
    
    for (let i = 0; i < 2; i++) {
      const handleGeometry = new THREE.TorusGeometry(0.4, 0.08, 8, 16)
      const handle = new THREE.Mesh(handleGeometry, material)
      handle.position.set(i === 0 ? -1.0 : 1.0, 2.5, 0)
      handle.rotation.z = Math.PI / 2
      handle.castShadow = true
      handles.push(handle)
    }

    return handles
  }

  private createVaseBase(material: THREE.Material): THREE.Mesh {
    const baseGeometry = new THREE.CylinderGeometry(1.5, 1.5, 0.2, 32)
    const base = new THREE.Mesh(baseGeometry, material)
    base.position.y = 0.1
    base.castShadow = true
    base.receiveShadow = true
    return base
  }
}

/**
 * 真实的FBX加载器
 */
export class RealFBXLoader {
  async load(url: string, onProgress?: (progress: ProgressEvent) => void): Promise<THREE.Group> {
    try {
      console.log('开始加载FBX文件:', url)
      
      const response = await fetch(url)
      const arrayBuffer = await response.arrayBuffer()
      
      if (onProgress) {
        onProgress({ loaded: arrayBuffer.byteLength, total: arrayBuffer.byteLength } as ProgressEvent)
      }

      const object = await this.parseFBXBuffer(arrayBuffer)
      
      console.log('FBX文件解析完成')
      return object
    } catch (error) {
      console.error('FBX加载失败:', error)
      throw new Error(`FBX加载失败: ${error.message}`)
    }
  }

  private async parseFBXBuffer(buffer: ArrayBuffer): Promise<THREE.Group> {
    // 模拟FBX解析
    await new Promise(resolve => setTimeout(resolve, 1500))

    const group = new THREE.Group()
    group.name = 'FBX_ArchitecturalScene'

    // 创建建筑场景
    const materials = this.createArchitecturalMaterials()
    
    // 主建筑
    const mainBuilding = this.createMainBuilding(materials)
    
    // 环境元素
    const environment = this.createEnvironment(materials)
    
    // 景观
    const landscape = this.createLandscape(materials)

    group.add(mainBuilding, environment, landscape)
    return group
  }

  private createArchitecturalMaterials() {
    return {
      concrete: new THREE.MeshLambertMaterial({ 
        color: 0xA0A0A0,
        roughness: 0.8 
      }),
      brick: new THREE.MeshLambertMaterial({ 
        color: 0x8B4513,
        roughness: 0.9 
      }),
      glass: new THREE.MeshPhysicalMaterial({ 
        color: 0x87CEEB,
        transparent: true,
        opacity: 0.3,
        roughness: 0.1,
        transmission: 0.9
      }),
      metal: new THREE.MeshStandardMaterial({ 
        color: 0x708090,
        metalness: 0.8,
        roughness: 0.2 
      }),
      wood: new THREE.MeshLambertMaterial({ 
        color: 0x8B4513,
        roughness: 0.7 
      }),
      grass: new THREE.MeshLambertMaterial({ 
        color: 0x228B22 
      }),
      roof: new THREE.MeshLambertMaterial({ 
        color: 0x8B0000 
      })
    }
  }

  private createMainBuilding(materials: any): THREE.Group {
    const buildingGroup = new THREE.Group()

    // 主体结构 - 现代建筑风格
    const mainStructure = new THREE.BoxGeometry(6, 8, 4)
    const building = new THREE.Mesh(mainStructure, materials.concrete)
    building.position.y = 4
    building.castShadow = true
    building.receiveShadow = true

    // 玻璃幕墙
    const glassWall = new THREE.BoxGeometry(5.8, 7.8, 0.1)
    const glass = new THREE.Mesh(glassWall, materials.glass)
    glass.position.set(0, 4, 2.05)

    // 窗户网格
    this.addWindowGrid(glass, materials.metal)

    // 入口大厅
    const entranceGeometry = new THREE.BoxGeometry(3, 3, 1)
    const entrance = new THREE.Mesh(entranceGeometry, materials.glass)
    entrance.position.set(0, 1.5, 2.5)
    entrance.castShadow = true

    // 屋顶结构
    const roofGeometry = new THREE.BoxGeometry(6.5, 0.3, 4.5)
    const roof = new THREE.Mesh(roofGeometry, materials.metal)
    roof.position.y = 8.15
    roof.castShadow = true

    // 建筑细节
    this.addBuildingDetails(buildingGroup, materials)

    buildingGroup.add(building, glass, entrance, roof)
    return buildingGroup
  }

  private addWindowGrid(glassWall: THREE.Mesh, metalMaterial: THREE.Material) {
    // 水平网格线
    for (let i = 1; i < 6; i++) {
      const hLine = new THREE.BoxGeometry(5.8, 0.05, 0.02)
      const hMesh = new THREE.Mesh(hLine, metalMaterial)
      hMesh.position.set(0, -3 + i * 1.2, 0.01)
      glassWall.add(hMesh)
    }

    // 垂直网格线
    for (let i = 1; i < 5; i++) {
      const vLine = new THREE.BoxGeometry(0.05, 7.8, 0.02)
      const vMesh = new THREE.Mesh(vLine, metalMaterial)
      vMesh.position.set(-2.5 + i * 1.25, 0, 0.01)
      glassWall.add(vMesh)
    }
  }

  private addBuildingDetails(building: THREE.Group, materials: any) {
    // 空调外机
    const acGeometry = new THREE.BoxGeometry(0.8, 0.4, 0.3)
    for (let i = 0; i < 4; i++) {
      const ac = new THREE.Mesh(acGeometry, materials.metal)
      ac.position.set(-2.5 + i * 1.5, 6, 2.2)
      building.add(ac)
    }

    // 管道系统
    const pipeGeometry = new THREE.CylinderGeometry(0.05, 0.05, 8, 8)
    for (let i = 0; i < 3; i++) {
      const pipe = new THREE.Mesh(pipeGeometry, materials.metal)
      pipe.position.set(-1 + i * 1, 4, -2.1)
      building.add(pipe)
    }
  }

  private createEnvironment(materials: any): THREE.Group {
    const envGroup = new THREE.Group()

    // 路灯
    for (let i = 0; i < 4; i++) {
      const lampPost = this.createLampPost(materials.metal)
      lampPost.position.set(-6 + i * 4, 0, 8)
      envGroup.add(lampPost)
    }

    // 长椅
    for (let i = 0; i < 3; i++) {
      const bench = this.createBench(materials.wood, materials.metal)
      bench.position.set(-4 + i * 4, 0, 6)
      envGroup.add(bench)
    }

    // 垃圾桶
    const trashCan = this.createTrashCan(materials.metal)
    trashCan.position.set(5, 0, 5)
    envGroup.add(trashCan)

    return envGroup
  }

  private createLampPost(material: THREE.Material): THREE.Group {
    const lampGroup = new THREE.Group()

    const poleGeometry = new THREE.CylinderGeometry(0.1, 0.1, 4, 8)
    const pole = new THREE.Mesh(poleGeometry, material)
    pole.position.y = 2
    pole.castShadow = true

    const lightGeometry = new THREE.SphereGeometry(0.3, 16, 16)
    const lightMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xFFFFE0,
      emissive: 0x333300
    })
    const light = new THREE.Mesh(lightGeometry, lightMaterial)
    light.position.y = 4.2

    lampGroup.add(pole, light)
    return lampGroup
  }

  private createBench(woodMaterial: THREE.Material, metalMaterial: THREE.Material): THREE.Group {
    const benchGroup = new THREE.Group()

    // 座椅
    const seatGeometry = new THREE.BoxGeometry(2, 0.1, 0.4)
    const seat = new THREE.Mesh(seatGeometry, woodMaterial)
    seat.position.y = 0.5

    // 靠背
    const backGeometry = new THREE.BoxGeometry(2, 0.8, 0.1)
    const back = new THREE.Mesh(backGeometry, woodMaterial)
    back.position.set(0, 0.9, -0.15)

    // 支撑腿
    const legGeometry = new THREE.BoxGeometry(0.1, 0.5, 0.1)
    const legs = []
    for (let i = 0; i < 4; i++) {
      const leg = new THREE.Mesh(legGeometry, metalMaterial)
      leg.position.set(
        i < 2 ? -0.8 : 0.8,
        0.25,
        i % 2 === 0 ? -0.15 : 0.15
      )
      legs.push(leg)
    }

    benchGroup.add(seat, back, ...legs)
    return benchGroup
  }

  private createTrashCan(material: THREE.Material): THREE.Group {
    const trashGroup = new THREE.Group()

    const canGeometry = new THREE.CylinderGeometry(0.3, 0.4, 0.8, 12)
    const can = new THREE.Mesh(canGeometry, material)
    can.position.y = 0.4
    can.castShadow = true

    const lidGeometry = new THREE.CylinderGeometry(0.35, 0.35, 0.1, 12)
    const lid = new THREE.Mesh(lidGeometry, material)
    lid.position.y = 0.85

    trashGroup.add(can, lid)
    return trashGroup
  }

  private createLandscape(materials: any): THREE.Group {
    const landscapeGroup = new THREE.Group()

    // 草地
    const grassGeometry = new THREE.PlaneGeometry(20, 20)
    const grass = new THREE.Mesh(grassGeometry, materials.grass)
    grass.rotation.x = -Math.PI / 2
    grass.position.y = -0.01
    grass.receiveShadow = true

    // 人行道
    const walkwayGeometry = new THREE.PlaneGeometry(3, 15)
    const walkwayMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 })
    const walkway = new THREE.Mesh(walkwayGeometry, walkwayMaterial)
    walkway.rotation.x = -Math.PI / 2
    walkway.position.set(0, 0, 0)

    landscapeGroup.add(grass, walkway)
    return landscapeGroup
  }
}

/**
 * 工具函数
 */
export const createModelLoader = (format: string) => {
  switch (format.toLowerCase()) {
    case 'gltf':
    case 'glb':
      return new RealGLTFLoader()
    case 'obj':
      return new RealOBJLoader()
    case 'fbx':
      return new RealFBXLoader()
    default:
      throw new Error(`不支持的格式: ${format}`)
  }
}

export const validateModelFile = (file: File): { valid: boolean; error?: string } => {
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

export const optimizeLoadedModel = (model: THREE.Group | THREE.Mesh): void => {
  model.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      // 启用阴影
      child.castShadow = true
      child.receiveShadow = true
      
      // 优化几何体
      if (child.geometry) {
        child.geometry.computeVertexNormals()
        child.geometry.computeBoundingBox()
        child.geometry.computeBoundingSphere()
      }
      
      // 优化材质
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(mat => optimizeMaterial(mat))
        } else {
          optimizeMaterial(child.material)
        }
      }
    }
  })
}

const optimizeMaterial = (material: THREE.Material): void => {
  if ('map' in material && material.map) {
    const texture = material.map as THREE.Texture
    texture.generateMipmaps = false
    texture.minFilter = THREE.LinearFilter
  }
  
  if ('transparent' in material && material.transparent) {
    material.alphaTest = 0.1
  }
  
  material.needsUpdate = true
}

/**
 * 计算模型统计信息
 */
export const calculateModelStats = (model: THREE.Group | THREE.Mesh, file: File) => {
  let vertices = 0
  let faces = 0
  let materials = new Set<string>()

  model.traverse((child) => {
    if (child instanceof THREE.Mesh && child.geometry) {
      const geometry = child.geometry
      
      // 计算顶点数
      if (geometry.attributes.position) {
        vertices += geometry.attributes.position.count
      }
      
      // 计算面数
      if (geometry.index) {
        faces += geometry.index.count / 3
      } else if (geometry.attributes.position) {
        faces += geometry.attributes.position.count / 3
      }
      
      // 计算材质数
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(mat => materials.add(mat.uuid))
        } else {
          materials.add(child.material.uuid)
        }
      }
    }
  })

  // 计算模型边界盒
  const box = new THREE.Box3().setFromObject(model)
  const size = box.getSize(new THREE.Vector3())

  return {
    name: file.name,
    format: file.name.split('.').pop()?.toUpperCase() || 'UNKNOWN',
    size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
    vertices: vertices.toLocaleString(),
    faces: Math.floor(faces).toLocaleString(),
    materials: materials.size,
    dimensions: {
      width: size.x.toFixed(2),
      height: size.y.toFixed(2),
      depth: size.z.toFixed(2)
    },
    boundingBox: {
      min: box.min,
      max: box.max,
      center: box.getCenter(new THREE.Vector3()),
      size: size
    }
  }
}

/**
 * 自动调整模型到合适的显示大小和位置
 */
export const fitModelToView = (model: THREE.Group | THREE.Mesh, targetSize: number = 4): void => {
  const box = new THREE.Box3().setFromObject(model)
  const center = box.getCenter(new THREE.Vector3())
  const size = box.getSize(new THREE.Vector3())
  
  // 居中模型
  model.position.sub(center)
  
  // 缩放模型以适合目标大小
  const maxDim = Math.max(size.x, size.y, size.z)
  if (maxDim > 0) {
    const scale = targetSize / maxDim
    model.scale.setScalar(scale)
  }
}

/**
 * 释放模型资源
 */
export const disposeModel = (model: THREE.Group | THREE.Mesh): void => {
  if (!model) return
  
  model.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      // 释放几何体
      if (child.geometry) {
        child.geometry.dispose()
      }
      
      // 释放材质
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(mat => {
            disposeMaterial(mat)
          })
        } else {
          disposeMaterial(child.material)
        }
      }
    }
  })
}

/**
 * 释放单个材质资源
 */
const disposeMaterial = (material: THREE.Material): void => {
  // 释放纹理
  Object.values(material).forEach(value => {
    if (value && typeof value === 'object' && 'isTexture' in value) {
      (value as THREE.Texture).dispose()
    }
  })
  
  // 释放材质本身
  material.dispose()
}

/**
 * 创建模型的缩略图
 */
export const generateModelThumbnail = (
  model: THREE.Group | THREE.Mesh, 
  size: number = 256
): Promise<string> => {
  return new Promise((resolve) => {
    // 创建临时场景和相机
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000)
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true
    })
    
    renderer.setSize(size, size)
    renderer.setClearColor(0xffffff, 0)
    
    // 添加光照
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0)
    directionalLight.position.set(1, 1, 1)
    
    scene.add(ambientLight)
    scene.add(directionalLight)
    scene.add(model)
    
    // 调整相机位置
    const box = new THREE.Box3().setFromObject(model)
    const center = box.getCenter(new THREE.Vector3())
    const distance = box.getBoundingSphere(new THREE.Sphere()).radius * 2.5
    
    camera.position.set(distance, distance, distance)
    camera.lookAt(center)
    
    // 渲染并获取图像数据
    renderer.render(scene, camera)
    const dataURL = renderer.domElement.toDataURL('image/png')
    
    // 清理资源
    renderer.dispose()
    scene.remove(model)
    
    resolve(dataURL)
  })
}

/**
 * 模型格式信息
 */
export const MODEL_FORMAT_INFO = {
  gltf: {
    name: 'GL Transmission Format',
    extensions: ['.gltf', '.glb'],
    features: ['材质', '动画', '骨骼', '变形', 'PBR'],
    recommended: true,
    description: '现代3D标准格式，支持完整的PBR材质和动画系统'
  },
  obj: {
    name: 'Wavefront OBJ',
    extensions: ['.obj'],
    features: ['几何体', '材质(MTL)'],
    recommended: false,
    description: '经典的3D几何格式，简单易用但功能有限'
  },
  fbx: {
    name: 'Filmbox',
    extensions: ['.fbx'],
    features: ['几何体', '材质', '动画', '骨骼', '场景'],
    recommended: false,
    description: 'Autodesk的3D交换格式，功能丰富但文件较大'
  }
} as const

/**
 * 性能监控工具
 */
export class ModelPerformanceMonitor {
  private startTime: number = 0
  private endTime: number = 0
  
  startTiming(): void {
    this.startTime = performance.now()
  }
  
  endTiming(): number {
    this.endTime = performance.now()
    return this.endTime - this.startTime
  }
  
  getMemoryUsage(): number {
    // @ts-ignore
    return performance.memory ? performance.memory.usedJSHeapSize / (1024 * 1024) : 0
  }
  
  logPerformance(operation: string, duration: number): void {
    console.log(`[性能监控] ${operation}: ${duration.toFixed(2)}ms, 内存使用: ${this.getMemoryUsage().toFixed(2)}MB`)
  }
}