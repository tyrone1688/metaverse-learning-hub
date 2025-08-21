const loadWorks = async () => {
  loading.value = true
  try {
    const params: any = {
      page: currentPage.value,
      limit: pageSize.value,
      sortBy: sortBy.value
    }
    
    if (searchQuery.value) {
      params.search = searchQuery.value
    }
    if (filterYear.value) {
      params.year = filterYear.value
    }
    if (filterStatus.value) {
      params.status = filterStatus.value
    }
    
    const response = await museumApi.getWorks(params)
    works.value = response.data.items || response.data
    totalWorks.value = response.data.total || works.value.length
    
    // 调试：打印第一个作品的数据结构
    if (works.value.length > 0) {
      console.log('作品数据示例:', works.value[0])
      console.log('作品ID字段:', works.value[0]._id || works.value[0].id)
    }
  } catch (error) {
    console.error('加载作品失败:', error)<!-- src/views/MuseumView.vue -->
<template>
  <div class="museum-container">
    <!-- 页面头部 -->
    <div class="museum-header">
      <h1 class="museum-title">数字博物馆 - 作品展示</h1>
      <div class="header-actions">
        <el-button type="primary" @click="openCreateDialog" :icon="Plus">
          创建作品
        </el-button>
        <el-button @click="refreshList" :icon="Refresh">
          刷新
        </el-button>
        <el-button @click="goToModelTest" :icon="Box">
          3D测试
        </el-button>
      </div>
    </div>

    <!-- 搜索和筛选栏 -->
    <div class="filter-bar">
      <el-row :gutter="20">
        <el-col :span="8">
          <el-input 
            v-model="searchQuery" 
            placeholder="搜索作品标题、作者或学校..."
            :prefix-icon="Search"
            clearable
            @clear="handleSearch"
            @keyup.enter="handleSearch"
          />
        </el-col>
        <el-col :span="4">
          <el-select v-model="filterYear" placeholder="选择年份" clearable @change="handleSearch">
            <el-option 
              v-for="year in yearOptions" 
              :key="year" 
              :label="`${year}年`" 
              :value="year" 
            />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-select v-model="filterStatus" placeholder="状态筛选" clearable @change="handleSearch">
            <el-option label="已发布" value="published" />
            <el-option label="草稿" value="draft" />
            <el-option label="已归档" value="archived" />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-select v-model="sortBy" placeholder="排序方式" @change="handleSearch">
            <el-option label="最新创建" value="createdAt" />
            <el-option label="最多浏览" value="viewCount" />
            <el-option label="按年份" value="year" />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-button type="primary" @click="handleSearch" :icon="Search">
            搜索
          </el-button>
        </el-col>
      </el-row>
    </div>

    <!-- 作品列表 -->
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="6" animated />
    </div>
    
    <div v-else-if="works.length > 0" class="works-grid">
      <el-row :gutter="20">
        <el-col 
          v-for="work in works" 
          :key="work._id || work.id" 
          :xs="24" 
          :sm="12" 
          :md="8" 
          :lg="6"
        >
          <el-card class="work-card" @click="viewWorkDetail(work._id || work.id)">
            <!-- 作品图片 -->
            <div class="work-image">
              <el-image 
                v-if="work.images && work.images.length > 0"
                :src="getImageUrl(work.images[0])"
                fit="cover"
                class="card-image"
              >
                <template #error>
                  <div class="image-error">
                    <el-icon><Picture /></el-icon>
                  </div>
                </template>
              </el-image>
              <div v-else class="no-image">
                <el-icon size="48"><Picture /></el-icon>
                <span>暂无图片</span>
              </div>
              
              <!-- 状态标签 -->
              <el-tag 
                class="status-tag" 
                :type="getStatusType(work.status)"
                size="small"
              >
                {{ getStatusText(work.status) }}
              </el-tag>
            </div>

            <!-- 作品信息 -->
            <div class="work-info">
              <h3 class="work-title">{{ work.title }}</h3>
              <p class="work-description">{{ work.description }}</p>
              
              <div class="work-meta">
                <div class="meta-item">
                  <el-icon><User /></el-icon>
                  <span>{{ work.author }}</span>
                </div>
                <div class="meta-item">
                  <el-icon><School /></el-icon>
                  <span>{{ work.school }}</span>
                </div>
                <div class="meta-item">
                  <el-icon><Calendar /></el-icon>
                  <span>{{ work.year }}年</span>
                </div>
                <div class="meta-item">
                  <el-icon><View /></el-icon>
                  <span>{{ work.viewCount || 0 }}</span>
                </div>
              </div>

              <!-- 媒体标识 -->
              <div class="media-icons">
                <el-tooltip v-if="work.modelUrl" content="3D模型" placement="top">
                  <el-icon color="#409EFF"><Box /></el-icon>
                </el-tooltip>
                <el-tooltip v-if="work.audioUrl" content="音频" placement="top">
                  <el-icon color="#67C23A"><Microphone /></el-icon>
                </el-tooltip>
                <el-tooltip v-if="work.certificateUrl" content="证书" placement="top">
                  <el-icon color="#E6A23C"><Document /></el-icon>
                </el-tooltip>
              </div>
            </div>

            <!-- 操作按钮 -->
            <div class="work-actions">
              <el-button 
                type="primary" 
                size="small" 
                @click.stop="viewWorkDetail(work._id || work.id)"
              >
                查看详情
              </el-button>
              <el-button 
                type="danger" 
                size="small" 
                @click.stop="deleteWork(work._id || work.id, work.title)"
              >
                删除
              </el-button>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <el-empty description="暂无作品数据">
        <el-button type="primary" @click="openCreateDialog">创建第一个作品</el-button>
      </el-empty>
    </div>

    <!-- 分页 -->
    <div v-if="totalWorks > pageSize" class="pagination-container">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="totalWorks"
        :page-sizes="[12, 24, 48, 96]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
      />
    </div>

    <!-- 创建作品对话框 -->
    <WorkCreateDialog 
      v-model:visible="createDialogVisible"
      @success="handleCreateSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Plus, 
  Refresh, 
  Search, 
  Picture, 
  User, 
  School, 
  Calendar, 
  View,
  Box,
  Microphone,
  Document
} from '@element-plus/icons-vue'
import { museumApi, type AwardWork } from '../services/museum'
import WorkCreateDialog from '../components/WorkCreateDialog.vue'

// 路由
const router = useRouter()

// 数据
const works = ref<AwardWork[]>([])
const loading = ref(false)
const searchQuery = ref('')
const filterYear = ref<number | ''>('')
const filterStatus = ref('')
const sortBy = ref('createdAt')
const currentPage = ref(1)
const pageSize = ref(12)
const totalWorks = ref(0)
const createDialogVisible = ref(false)

// 计算属性
const yearOptions = computed(() => {
  const currentYear = new Date().getFullYear()
  const years: number[] = []
  for (let i = currentYear; i >= currentYear - 10; i--) {
    years.push(i)
  }
  return years
})

// 方法
const loadWorks = async () => {
  loading.value = true
  try {
    const params: any = {
      page: currentPage.value,
      limit: pageSize.value,
      sortBy: sortBy.value
    }
    
    if (searchQuery.value) {
      params.search = searchQuery.value
    }
    if (filterYear.value) {
      params.year = filterYear.value
    }
    if (filterStatus.value) {
      params.status = filterStatus.value
    }
    
    const response = await museumApi.getWorks(params)
    works.value = response.data.items || response.data
    totalWorks.value = response.data.total || works.value.length
  } catch (error) {
    console.error('加载作品失败:', error)
    ElMessage.error('加载作品失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  currentPage.value = 1
  loadWorks()
}

const handlePageChange = (page: number) => {
  currentPage.value = page
  loadWorks()
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
  loadWorks()
}

const refreshList = () => {
  loadWorks()
  ElMessage.success('已刷新')
}

const viewWorkDetail = (id: string) => {
  console.log('点击查看详情，作品ID:', id)
  if (!id) {
    console.error('作品ID为空，无法跳转')
    ElMessage.error('作品ID无效')
    return
  }
  console.log('准备跳转到:', `/work/${id}`)
  router.push(`/work/${id}`).then(() => {
    console.log('路由跳转成功')
  }).catch((error) => {
    console.error('路由跳转失败:', error)
  })
}

const goToModelTest = () => {
  router.push('/model-test')
}

const openCreateDialog = () => {
  createDialogVisible.value = true
}

const handleCreateSuccess = () => {
  loadWorks()
  ElMessage.success('作品创建成功')
}

const deleteWork = async (id: string, title: string) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除作品"${title}"吗？此操作不可恢复。`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await museumApi.deleteWork(id)
    ElMessage.success('删除成功')
    loadWorks()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

const getImageUrl = (imagePath: string) => {
  if (!imagePath) return ''
  
  if (imagePath.startsWith('http')) {
    return imagePath
  }
  
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
  return `${baseUrl}/${imagePath.startsWith('uploads/') ? '' : 'uploads/'}${imagePath}`
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
    default: return status
  }
}

// 生命周期
onMounted(() => {
  loadWorks()
})
</script>

<style scoped>
.museum-container {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100vh;
}

.museum-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.museum-title {
  margin: 0;
  font-size: 28px;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.filter-bar {
  margin-bottom: 30px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.loading-container {
  padding: 40px;
  background: white;
  border-radius: 8px;
}

.works-grid {
  margin-bottom: 30px;
}

.work-card {
  cursor: pointer;
  transition: all 0.3s;
  margin-bottom: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.work-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.work-image {
  position: relative;
  width: 100%;
  height: 200px;
  overflow: hidden;
  margin: -20px -20px 15px -20px;
}

.card-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-error,
.no-image {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  color: #c0c4cc;
}

.status-tag {
  position: absolute;
  top: 10px;
  right: 10px;
}

.work-info {
  flex: 1;
  padding: 0 20px;
}

.work-title {
  margin: 0 0 10px 0;
  font-size: 18px;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.work-description {
  margin: 0 0 15px 0;
  color: #606266;
  font-size: 14px;
  line-height: 1.5;
  height: 42px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.work-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  margin-bottom: 15px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
  color: #909399;
}

.meta-item .el-icon {
  font-size: 14px;
}

.media-icons {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.media-icons .el-icon {
  font-size: 20px;
}

.work-actions {
  display: flex;
  gap: 10px;
  padding: 15px 20px;
  border-top: 1px solid #ebeef5;
  margin: 0 -20px -20px -20px;
}

.work-actions .el-button {
  flex: 1;
}

.empty-state {
  padding: 80px 20px;
  background: white;
  border-radius: 8px;
  text-align: center;
}

.pagination-container {
  display: flex;
  justify-content: center;
  padding: 20px;
  background: white;
  border-radius: 8px;
}

@media (max-width: 768px) {
  .museum-header {
    flex-direction: column;
    gap: 15px;
  }
  
  .header-actions {
    width: 100%;
    justify-content: center;
  }
  
  .filter-bar .el-col {
    margin-bottom: 10px;
  }
}
</style>