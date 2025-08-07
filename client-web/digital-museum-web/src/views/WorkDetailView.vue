<template>
  <div class="work-detail-container">
    <div v-if="loading" class="loading-wrapper">
      <el-skeleton :rows="10" animated />
    </div>

    <div v-else-if="work" class="work-detail">
      <!-- 页面头部 -->
      <div class="detail-header">
        <el-button @click="goBack" :icon="ArrowLeft" type="primary" plain>
          返回列表
        </el-button>
        <div class="header-actions">
          <el-button @click="editWork" :icon="Edit" type="warning">
            编辑作品
          </el-button>
          <el-button @click="deleteWork" :icon="Delete" type="danger">
            删除作品
          </el-button>
        </div>
      </div>

      <!-- 作品基本信息 -->
      <div class="work-header">
        <div class="work-title-section">
          <h1 class="work-title">{{ work.title }}</h1>
          <div class="work-meta">
            <el-tag :type="getStatusType(work.status)" size="large">
              {{ getStatusText(work.status) }}
            </el-tag>
            <span class="meta-item">
              <el-icon><User /></el-icon>
              {{ work.author }}
            </span>
            <span class="meta-item">
              <el-icon><School /></el-icon>
              {{ work.school }}
            </span>
            <span class="meta-item">
              <el-icon><Calendar /></el-icon>
              {{ work.year }}年
            </span>
            <span class="meta-item">
              <el-icon><View /></el-icon>
              {{ work.viewCount }} 次浏览
            </span>
          </div>
        </div>
      </div>

      <!-- 主要内容区域 -->
      <div class="work-content">
        <el-row :gutter="20">
          <!-- 左侧：媒体内容 -->
          <el-col :span="16">
            <div class="media-section">
              <!-- 3D模型查看器 -->
              <div v-if="work.modelUrl" class="media-item model-section">
                <h3 class="section-title">
                  <el-icon><Box /></el-icon>
                  3D模型展示
                </h3>
                <ModelViewer 
                  :model-url="getFileUrl(work.modelUrl)"
                  :width="750"
                  :height="500"
                />
              </div>

              <!-- 图片展示 -->
              <div v-if="work.images.length > 0" class="media-item">
                <h3 class="section-title">
                  <el-icon><Picture /></el-icon>
                  作品图片 ({{ work.images.length }})
                </h3>
                <div class="image-gallery">
                  <el-image
                    v-for="(image, index) in work.images"
                    :key="index"
                    :src="getFileUrl(image)"
                    :alt="`${work.title} - 图片 ${index + 1}`"
                    fit="cover"
                    class="gallery-image"
                    :preview-src-list="work.images.map(img => getFileUrl(img))"
                    :initial-index="index"
                  />
                </div>
              </div>

              <!-- 音频播放器 -->
              <div v-if="work.audioUrl" class="media-item">
                <h3 class="section-title">
                  <el-icon><Microphone /></el-icon>
                  讲解音频
                </h3>
                <div class="audio-player">
                  <audio 
                    :src="getFileUrl(work.audioUrl)" 
                    controls 
                    class="custom-audio"
                  >
                    您的浏览器不支持音频播放。
                  </audio>
                </div>
              </div>
            </div>
          </el-col>

          <!-- 右侧：详细信息 -->
          <el-col :span="8">
            <div class="info-sidebar">
              <!-- 作品描述 -->
              <div class="info-card">
                <h3 class="card-title">作品描述</h3>
                <p class="description">{{ work.description }}</p>
              </div>

              <!-- 作品标签 -->
              <div class="info-card" v-if="work.tags.length > 0">
                <h3 class="card-title">标签</h3>
                <div class="tags-container">
                  <el-tag
                    v-for="tag in work.tags"
                    :key="tag"
                    type="info"
                    class="tag-item"
                  >
                    {{ tag }}
                  </el-tag>
                </div>
              </div>

              <!-- 获奖证书 -->
              <div class="info-card" v-if="work.certificateUrl">
                <h3 class="card-title">
                  <el-icon><Document /></el-icon>
                  获奖证书
                </h3>
                <div class="certificate-preview">
                  <el-image
                    v-if="isCertificateImage(work.certificateUrl)"
                    :src="getFileUrl(work.certificateUrl)"
                    alt="获奖证书"
                    fit="cover"
                    class="certificate-image"
                    :preview-src-list="[getFileUrl(work.certificateUrl)]"
                  />
                  <div v-else class="certificate-file">
                    <el-icon class="file-icon"><Document /></el-icon>
                    <div class="file-info">
                      <p>证书文件</p>
                      <el-button 
                        size="small" 
                        type="primary" 
                        @click="downloadFile(work.certificateUrl, '获奖证书')"
                      >
                        <el-icon><Download /></el-icon>
                        下载查看
                      </el-button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 技术信息 -->
              <div class="info-card">
                <h3 class="card-title">技术信息</h3>
                <div class="tech-info">
                  <div class="info-item">
                    <span class="label">创建时间：</span>
                    <span class="value">{{ formatDate(work.createdAt) }}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">更新时间：</span>
                    <span class="value">{{ formatDate(work.updatedAt) }}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">文件数量：</span>
                    <span class="value">{{ getFileCount() }} 个</span>
                  </div>
                </div>
              </div>
            </div>
          </el-col>
        </el-row>
      </div>
    </div>

    <!-- 404 状态 -->
    <div v-else-if="!loading" class="not-found">
      <el-result
        icon="warning"
        title="作品不存在"
        sub-title="抱歉，您要查看的作品不存在或已被删除"
      >
        <template #extra>
          <el-button type="primary" @click="goBack">返回列表</el-button>
        </template>
      </el-result>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  ArrowLeft, 
  Edit, 
  Delete, 
  User, 
  School, 
  Calendar, 
  View,
  Box,
  Picture,
  Microphone,
  Document,
  Download
} from '@element-plus/icons-vue'
import { museumApi, type AwardWork } from '@/services/museum'
import ModelViewer from '@/components/ModelViewer.vue'

// 路由
const route = useRoute()
const router = useRouter()

// 响应式数据
const loading = ref(false)
const work = ref<AwardWork | null>(null)

// 方法
const loadWork = async (id: string) => {
  loading.value = true
  try {
    const response = await museumApi.getWork(id)
    work.value = response.data
  } catch (error) {
    console.error('加载作品失败:', error)
    ElMessage.error('加载作品失败')
    work.value = null
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  router.push('/museum')
}

const editWork = () => {
  ElMessage.info('编辑功能开发中...')
}

const deleteWork = async () => {
  if (!work.value) return

  try {
    await ElMessageBox.confirm(
      `确定要删除作品"${work.value.title}"吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    
    await museumApi.deleteWork(work.value._id)
    ElMessage.success('删除成功')
    goBack()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const getStatusType = (status: string) => {
  switch (status) {
    case 'published': return 'success'
    case 'draft': return 'warning'
    case 'archived': return 'info'
    default: return 'info'
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'published': return '已发布'
    case 'draft': return '草稿'
    case 'archived': return '已归档'
    default: return '未知'
  }
}

const getFileUrl = (filePath: string) => {
  if (!filePath) return ''
  
  const baseUrl = 'http://localhost:3000' // 直接使用后端地址
  let fullUrl = ''
  
  if (filePath.startsWith('http')) {
    fullUrl = filePath
  } else {
    // 如果路径已经包含 uploads，直接拼接
    if (filePath.startsWith('uploads/')) {
      fullUrl = `${baseUrl}/${filePath}`
    } else {
      // 如果路径不包含 uploads，添加 uploads 前缀
      fullUrl = `${baseUrl}/uploads/${filePath}`
    }
  }
  
  console.log(`文件路径转换: ${filePath} -> ${fullUrl}`)
  return fullUrl
}
const isCertificateImage = (filePath: string) => {
  return /\.(jpg|jpeg|png|gif)$/i.test(filePath)
}

const downloadFile = (filePath: string, fileName: string) => {
  const url = getFileUrl(filePath)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN')
}

const getFileCount = () => {
  if (!work.value) return 0
  
  let count = 0
  if (work.value.images.length > 0) count += work.value.images.length
  if (work.value.audioUrl) count += 1
  if (work.value.certificateUrl) count += 1
  if (work.value.modelUrl) count += 1
  
  return count
}

// 生命周期
onMounted(() => {
  const id = route.params.id as string
  if (id) {
    loadWork(id)
  }
})
</script>

<style scoped>
.work-detail-container {
  min-height: 100vh;
  background: #f5f7fa;
}

.loading-wrapper {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.work-detail {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.work-header {
  background: white;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  margin-bottom: 30px;
}

.work-title {
  font-size: 2.2rem;
  color: #2c3e50;
  margin: 0 0 20px 0;
  line-height: 1.3;
}

.work-meta {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #666;
  font-size: 14px;
}

.work-content {
  gap: 20px;
}

.media-section {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.media-item {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1.3rem;
  color: #2c3e50;
  margin: 0 0 20px 0;
  font-weight: 600;
}

.model-section {
  padding: 20px;
}

.image-gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.gallery-image {
  width: 100%;
  height: 200px;
  border-radius: 8px;
  cursor: pointer;
}

.audio-player {
  width: 100%;
}

.custom-audio {
  width: 100%;
  height: 50px;
}

.info-sidebar {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.info-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1.1rem;
  color: #2c3e50;
  margin: 0 0 16px 0;
  font-weight: 600;
}

.description {
  line-height: 1.6;
  color: #555;
  margin: 0;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-item {
  margin: 0;
}

.certificate-preview {
  width: 100%;
}

.certificate-image {
  width: 100%;
  max-height: 300px;
  border-radius: 8px;
}

.certificate-file {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border: 2px dashed #ddd;
  border-radius: 8px;
}

.file-icon {
  font-size: 2rem;
  color: #409eff;
}

.file-info p {
  margin: 0 0 8px 0;
  font-weight: 500;
}

.tech-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.label {
  font-weight: 500;
  color: #666;
}

.value {
  color: #333;
}

.not-found {
  max-width: 1200px;
  margin: 0 auto;
  padding: 60px 20px;
}

@media (max-width: 768px) {
  .work-content .el-col {
    width: 100% !important;
  }
  
  .detail-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .work-meta {
    gap: 12px;
  }
  
  .meta-item {
    font-size: 13px;
  }
}
</style>