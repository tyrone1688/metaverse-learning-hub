<template>
  <div class="work-detail-view">
    <!-- 页面头部 -->
    <div class="page-header">
      <button @click="goBack" class="back-btn">
        ← 返回列表
      </button>
      <h1 class="page-title">作品详情</h1>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <div class="loading-text">正在加载作品信息...</div>
    </div>

    <!-- 错误状态 -->
    <div v-if="error" class="error-container">
      <div class="error-icon">⚠️</div>
      <div class="error-message">{{ error }}</div>
      <button @click="loadWorkDetail" class="retry-btn">重新加载</button>
    </div>

    <!-- 作品内容 -->
    <div v-if="!loading && !error && workDetail" class="work-content">
      
      <!-- 作品信息卡片 -->
      <div class="work-info-card">
        <div class="work-header">
          <h2 class="work-title">{{ workDetail.title }}</h2>
          <div class="work-meta">
            <span class="work-type">{{ getWorkTypeLabel(workDetail.category) }}</span>
            <span class="work-date">{{ formatDate(workDetail.createdAt) }}</span>
          </div>
        </div>
        
        <div v-if="workDetail.description" class="work-description">
          <p>{{ workDetail.description }}</p>
        </div>

        <div class="work-tags" v-if="workDetail.tags && workDetail.tags.length">
          <span v-for="tag in workDetail.tags" :key="tag" class="tag">
            {{ tag }}
          </span>
        </div>
      </div>

      <!-- 3D模型展示区域 -->
      <div v-if="is3DModel" class="model-section">
        <div class="section-header">
          <h3>3D 模型预览</h3>
          <div class="model-info">
            <span class="file-name">{{ modelFile?.originalName || modelFile?.filename }}</span>
            <span class="file-size">{{ formatFileSize(modelFile?.size) }}</span>
          </div>
        </div>
        
        <div class="model-container">
          <ModelViewer
            :model-url="modelUrl"
            :width="800"
            :height="600"
            :show-controls="true"
            background-color="#f8f9fa"
          />
        </div>
        
        <!-- 模型文件信息 -->
        <div class="model-file-info">
          <div class="info-grid">
            <div class="info-item">
              <span class="label">文件格式:</span>
              <span class="value">{{ getFileExtension(modelFile?.originalName || modelFile?.filename).toUpperCase() }}</span>
            </div>
            <div class="info-item">
              <span class="label">文件大小:</span>
              <span class="value">{{ formatFileSize(modelFile?.size) }}</span>
            </div>
            <div class="info-item">
              <span class="label">上传时间:</span>
              <span class="value">{{ formatDate(modelFile?.uploadedAt || workDetail.createdAt) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 其他文件展示 -->
      <div v-if="otherFiles.length > 0" class="other-files-section">
        <div class="section-header">
          <h3>相关文件</h3>
        </div>
        
        <div class="files-grid">
          <div 
            v-for="file in otherFiles" 
            :key="file.id || file.filename" 
            class="file-card"
            @click="handleFileClick(file)"
          >
            <div class="file-icon">
              {{ getFileIcon(file.mimetype || file.type) }}
            </div>
            <div class="file-info">
              <div class="file-name">{{ file.originalName || file.filename }}</div>
              <div class="file-meta">
                <span class="file-type">{{ file.mimetype || file.type }}</span>
                <span class="file-size">{{ formatFileSize(file.size) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 作品操作 -->
      <div class="work-actions">
        <button @click="downloadModel" class="action-btn primary" v-if="modelFile">
          📥 下载模型
        </button>
        <button @click="shareWork" class="action-btn secondary">
          🔗 分享作品
        </button>
        <button @click="editWork" class="action-btn secondary" v-if="canEdit">
          ✏️ 编辑作品
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ModelViewer from '@/components/ModelViewer.vue'
import { museumApi } from '@/services/museum' // 使用现有的API服务

// 路由相关
const route = useRoute()
const router = useRouter()

// 响应式数据
const loading = ref(false)
const error = ref<string>('')
const workDetail = ref<any>(null) // 作品详情数据

// 作品文件接口定义（根据你的后端数据结构调整）
interface WorkFile {
  id?: string
  originalName?: string
  filename: string
  mimetype?: string
  size?: number
  type?: 'image' | 'audio' | 'certificate' | 'model'
  path?: string
  uploadedAt?: string
}

// 计算属性
const workId = computed(() => route.params.id as string)

// 判断是否为3D模型
const is3DModel = computed(() => {
  if (!workDetail.value) return false
  
  // 检查是否有modelUrl字段并且不为空
  if (workDetail.value.modelUrl) {
    return true
  }
  
  // 检查分类是否为3D模型相关
  const category = workDetail.value.category?.toLowerCase() || ''
  if (category.includes('3d') || category.includes('model')) {
    return true
  }
  
  return false
})

// 获取3D模型文件
const modelFile = computed(() => {
  if (!workDetail.value) return null
  
  // 检查是否有modelUrl字段
  if (workDetail.value.modelUrl) {
    // 从URL中提取文件名来构建文件信息
    const url = workDetail.value.modelUrl
    const filename = url.split('/').pop() || ''
    
    return {
      filename: filename,
      originalName: filename,
      url: url,
      size: 0 // 无法从URL获取大小，设为0
    }
  }
  
  return null
})

// 构建模型URL
const modelUrl = computed(() => {
  if (!modelFile.value) return ''
  
  // 直接使用后端返回的URL
  if (workDetail.value?.modelUrl) {
    // 如果是完整URL，直接使用
    if (workDetail.value.modelUrl.startsWith('http')) {
      return workDetail.value.modelUrl
    }
    // 如果是相对路径，拼接完整URL
    return `http://localhost:3000${workDetail.value.modelUrl}`
  }
  
  return ''
})

// 获取其他文件
const otherFiles = computed(() => {
  if (!workDetail.value) return []
  
  const files: any[] = []
  
  // 处理图片文件
  if (workDetail.value.images && workDetail.value.images.length > 0) {
    workDetail.value.images.forEach((imageUrl: string, index: number) => {
      const filename = imageUrl.split('/').pop() || `image_${index}`
      files.push({
        filename: filename,
        originalName: filename,
        url: imageUrl.startsWith('http') ? imageUrl : `http://localhost:3000${imageUrl}`,
        type: 'image',
        mimetype: 'image/jpeg'
      })
    })
  }
  
  // 处理音频文件
  if (workDetail.value.audioUrl) {
    const filename = workDetail.value.audioUrl.split('/').pop() || 'audio'
    files.push({
      filename: filename,
      originalName: filename,
      url: workDetail.value.audioUrl.startsWith('http') ? workDetail.value.audioUrl : `http://localhost:3000${workDetail.value.audioUrl}`,
      type: 'audio',
      mimetype: 'audio/mpeg'
    })
  }
  
  // 处理证书文件
  if (workDetail.value.certificateUrl) {
    const filename = workDetail.value.certificateUrl.split('/').pop() || 'certificate'
    files.push({
      filename: filename,
      originalName: filename,
      url: workDetail.value.certificateUrl.startsWith('http') ? workDetail.value.certificateUrl : `http://localhost:3000${workDetail.value.certificateUrl}`,
      type: 'certificate',
      mimetype: 'application/pdf'
    })
  }
  
  return files
})

// 检查是否可以编辑
const canEdit = computed(() => {
  // 这里可以添加权限检查逻辑
  return true
})

/**
 * 加载作品详情
 */
const loadWorkDetail = async () => {
  if (!workId.value) {
    error.value = '无效的作品ID'
    return
  }

  loading.value = true
  error.value = ''

  try {
    console.log('加载作品详情，ID:', workId.value)
    
    // 使用正确的museum API方法
    const response = await museumApi.getWork(workId.value)
    workDetail.value = response.data || response // 适配可能的数据结构
    
    console.log('作品详情加载完成:', workDetail.value)
    
    // 如果是3D模型，验证模型文件
    if (is3DModel.value && !modelFile.value) {
      console.warn('作品可能包含3D模型，但未找到有效的模型文件')
    }
    
    if (modelFile.value) {
      console.log('找到3D模型文件:', modelFile.value)
      console.log('模型URL:', modelUrl.value)
    }

  } catch (err) {
    console.error('加载作品详情失败:', err)
    error.value = err instanceof Error ? err.message : '加载失败，请检查网络连接'
  } finally {
    loading.value = false
  }
}

/**
 * 返回列表页
 */
const goBack = () => {
  router.push('/museum')
}

/**
 * 下载模型文件
 */
const downloadModel = () => {
  if (!modelFile.value) return
  
  const link = document.createElement('a')
  link.href = modelUrl.value
  link.download = modelFile.value.originalName || modelFile.value.filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * 分享作品
 */
const shareWork = async () => {
  const shareUrl = window.location.href
  const title = workDetail.value?.title || '3D作品分享'
  const text = workDetail.value?.description || '查看这个精彩的3D作品'
  
  if (navigator.share) {
    try {
      await navigator.share({ title, text, url: shareUrl })
    } catch (err) {
      console.log('分享取消或失败')
    }
  } else {
    // 降级方案：复制到剪贴板
    try {
      await navigator.clipboard.writeText(shareUrl)
      // 这里可以用Element Plus的消息提示
      console.log('链接已复制到剪贴板')
    } catch (err) {
      // 最终降级方案
      prompt('请复制以下链接:', shareUrl)
    }
  }
}

/**
 * 编辑作品
 */
const editWork = () => {
  router.push(`/museum/${workId.value}/edit`)
}

/**
 * 处理文件点击
 */
const handleFileClick = (file: WorkFile) => {
  const url = `http://localhost:3000/uploads/${file.filename}`
  const mimetype = file.mimetype || ''
  
  if (mimetype.startsWith('image/')) {
    // 打开图片预览
    window.open(url, '_blank')
  } else if (mimetype.startsWith('audio/')) {
    // 播放音频
    const audio = new Audio(url)
    audio.play().catch(console.error)
  } else {
    // 其他文件直接下载
    const link = document.createElement('a')
    link.href = url
    link.download = file.originalName || file.filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

/**
 * 获取文件扩展名
 */
const getFileExtension = (filename: string): string => {
  if (!filename) return ''
  return filename.split('.').pop() || ''
}

/**
 * 获取作品类型标签
 */
const getWorkTypeLabel = (category: string): string => {
  const typeLabels: Record<string, string> = {
    '3d_model': '3D模型',
    '3d': '3D作品',
    'model': '模型作品',
    'digital_art': '数字艺术',
    'design': '设计作品', 
    'animation': '动画作品',
    'game': '游戏作品',
    'architecture': '建筑设计',
    'sculpture': '雕塑作品',
    'other': '其他作品'
  }
  return typeLabels[category?.toLowerCase()] || category || '未分类'
}

/**
 * 获取文件图标
 */
const getFileIcon = (mimetype: string): string => {
  if (!mimetype) return '📁'
  
  if (mimetype.startsWith('image/')) return '🖼️'
  if (mimetype.startsWith('audio/')) return '🎵'
  if (mimetype.startsWith('video/')) return '🎥'
  if (mimetype.includes('pdf')) return '📄'
  if (mimetype.includes('certificate')) return '📜'
  
  return '📁'
}

/**
 * 格式化文件大小
 */
const formatFileSize = (bytes: number | undefined): string => {
  if (!bytes || bytes === 0) return '未知'
  
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`
}

/**
 * 格式化日期
 */
const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return '未知时间'
  
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch (err) {
    return '日期格式错误'
  }
}

// 生命周期
onMounted(() => {
  console.log('WorkDetailView 挂载，准备加载作品详情')
  loadWorkDetail()
})
</script>

<style scoped>
.work-detail-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  background: #f8f9fa;
  min-height: 100vh;
}

/* 页面头部 */
.page-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e9ecef;
}

.back-btn {
  background: #6c757d;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.3s;
}

.back-btn:hover {
  background: #5a6268;
}

.page-title {
  margin: 0;
  font-size: 2rem;
  color: #212529;
}

/* 加载和错误状态 */
.loading-container,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f4f6;
  border-top: 4px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

.loading-text {
  color: #6b7280;
  font-size: 1.1rem;
}

.error-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.error-message {
  color: #dc3545;
  font-size: 1.1rem;
  margin-bottom: 1.5rem;
  max-width: 500px;
  word-wrap: break-word;
}

.retry-btn {
  background: #dc3545;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
}

.retry-btn:hover {
  background: #c82333;
}

/* 作品内容 */
.work-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* 作品信息卡片 */
.work-info-card {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.work-header {
  margin-bottom: 1.5rem;
}

.work-title {
  margin: 0 0 1rem 0;
  font-size: 1.8rem;
  color: #212529;
  font-weight: 600;
}

.work-meta {
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
}

.work-type {
  background: #e3f2fd;
  color: #1565c0;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
}

.work-date {
  color: #6c757d;
  font-size: 0.875rem;
}

.work-description {
  margin-bottom: 1.5rem;
  line-height: 1.6;
  color: #495057;
}

.work-tags {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.tag {
  background: #f8f9fa;
  color: #495057;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  border: 1px solid #e9ecef;
}

/* 3D模型区域 */
.model-section {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.section-header h3 {
  margin: 0;
  font-size: 1.3rem;
  color: #212529;
}

.model-info {
  display: flex;
  gap: 1rem;
  font-size: 0.875rem;
  color: #6c757d;
  flex-wrap: wrap;
}

.model-container {
  margin-bottom: 1.5rem;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.model-file-info {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-item .label {
  color: #6c757d;
  font-size: 0.875rem;
}

.info-item .value {
  font-weight: 500;
  color: #212529;
}

/* 其他文件区域 */
.other-files-section {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.files-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
}

.file-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.file-card:hover {
  border-color: #007bff;
  box-shadow: 0 2px 8px rgba(0, 123, 255, 0.15);
}

.file-icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.file-info {
  flex: 1;
  min-width: 0;
}

.file-name {
  font-weight: 500;
  color: #212529;
  margin-bottom: 0.25rem;
  word-break: break-all;
}

.file-meta {
  display: flex;
  gap: 0.75rem;
  font-size: 0.75rem;
  color: #6c757d;
  flex-wrap: wrap;
}

/* 作品操作 */
.work-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  padding: 2rem 0;
  flex-wrap: wrap;
}

.action-btn {
  padding: 0.75rem 2rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  transition: all 0.3s;
  text-decoration: none;
}

.action-btn.primary {
  background: #007bff;
  color: white;
}

.action-btn.primary:hover {
  background: #0056b3;
  transform: translateY(-2px);
}

.action-btn.secondary {
  background: #6c757d;
  color: white;
}

.action-btn.secondary:hover {
  background: #5a6268;
  transform: translateY(-2px);
}

/* 动画 */
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .work-detail-view {
    padding: 1rem;
  }
  
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .page-title {
    font-size: 1.5rem;
  }
  
  .work-actions {
    flex-direction: column;
  }
  
  .action-btn {
    width: 100%;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
  }
  
  .files-grid {
    grid-template-columns: 1fr;
  }
}
</style>