<template>
  <div class="museum-container">
    <!-- 页面头部 -->
    <div class="museum-header">
      <h1 class="title">数字馆</h1>
      <p class="subtitle">展示学校优秀获奖作品</p>
    </div>

    <!-- 搜索和筛选区域 -->
    <div class="search-filter-section">
      <el-row :gutter="20" class="filter-row">
        <el-col :span="8">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索作品、作者或学校..."
            size="large"
            clearable
            @keyup.enter="handleSearch"
          >
            <template #append>
              <el-button @click="handleSearch" :icon="Search" />
            </template>
          </el-input>
        </el-col>
        <el-col :span="4">
          <el-select v-model="filters.category" placeholder="选择分类" clearable @change="handleFilter">
            <el-option
              v-for="category in categories"
              :key="category"
              :label="category"
              :value="category"
            />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-select v-model="filters.year" placeholder="选择年份" clearable @change="handleFilter">
            <el-option
              v-for="year in yearOptions"
              :key="year"
              :label="year"
              :value="year"
            />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-select v-model="filters.status" placeholder="状态" clearable @change="handleFilter">
            <el-option label="已发布" value="published" />
            <el-option label="草稿" value="draft" />
            <el-option label="已归档" value="archived" />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-button type="primary" @click="showCreateDialog = true" :icon="Plus">
            添加作品
          </el-button>
        </el-col>
      </el-row>
    </div>

    <!-- 作品展示区域 -->
    <div class="works-section" v-loading="loading">
      <div v-if="works.length === 0 && !loading" class="empty-state">
        <el-empty description="暂无作品数据">
          <el-button type="primary" @click="showCreateDialog = true">
            创建第一个作品
          </el-button>
        </el-empty>
      </div>

      <div v-else class="works-grid">
        <div
          v-for="work in works"
          :key="work._id"
          class="work-card"
          @click="viewWorkDetail(work)"
        >
          <div class="work-image">
            <img
              :src="getImageUrl(work.images[0])"
              :alt="work.title"
              @error="handleImageError"
            />
            <div class="work-overlay">
              <el-button type="primary" size="small">查看详情</el-button>
              <div class="file-indicators">
                <el-icon v-if="work.audioUrl" class="file-icon audio-icon" title="包含音频">
                  <Microphone />
                </el-icon>
                <el-icon v-if="work.certificateUrl" class="file-icon cert-icon" title="包含证书">
                  <Document />
                </el-icon>
                <el-icon v-if="work.modelUrl" class="file-icon model-icon" title="包含3D模型">
                  <Box />
                </el-icon>
              </div>
            </div>
          </div>
          <div class="work-info">
            <h3 class="work-title">{{ work.title }}</h3>
            <p class="work-meta">{{ work.author }} · {{ work.school }}</p>
            <p class="work-year">{{ work.year }}年</p>
            <div class="work-tags">
              <el-tag
                v-for="tag in work.tags.slice(0, 3)"
                :key="tag"
                size="small"
                type="info"
              >
                {{ tag }}
              </el-tag>
            </div>
            <div class="work-stats">
              <span class="view-count">
                <el-icon><View /></el-icon>
                {{ work.viewCount }}
              </span>
              <div class="action-buttons">
                <el-button size="small" type="warning" @click.stop="editWork(work)">
                  <el-icon><Edit /></el-icon>
                </el-button>
                <el-button size="small" type="danger" @click.stop="deleteWork(work)">
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
              <el-tag :type="getStatusType(work.status)" size="small">
                {{ getStatusText(work.status) }}
              </el-tag>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 分页器 -->
    <div class="pagination-section" v-if="works.length > 0">
      <el-pagination
        v-model:current-page="pagination.current"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[12, 24, 48]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 创建作品对话框 -->
    <WorkCreateDialog
      v-model:visible="showCreateDialog"
      @success="handleCreateSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, View, Plus, Microphone, Document, Box, Edit, Delete } from '@element-plus/icons-vue'
import { museumApi, type AwardWork, type GetWorksParams } from '@/services/museum'
import WorkCreateDialog from '@/components/WorkCreateDialog.vue'
import { useRouter } from 'vue-router'

// 在 setup 函数中
const router = useRouter()

// 响应式数据
const loading = ref(false)
const searchKeyword = ref('')
const showCreateDialog = ref(false)

const works = ref<AwardWork[]>([])
const categories = ref<string[]>([])

const filters = reactive({
  category: '',
  year: null as number | null,
  status: ''
})

const pagination = reactive({
  current: 1,
  pageSize: 12,
  total: 0
})

// 计算属性
const yearOptions = computed(() => {
  const currentYear = new Date().getFullYear()
  const years = []
  for (let i = currentYear; i >= currentYear - 10; i--) {
    years.push(i)
  }
  return years
})

// 方法
const getImageUrl = (imagePath: string) => {
  if (!imagePath) return 'https://via.placeholder.com/300x200?text=暂无图片'
  return imagePath.startsWith('http') 
    ? imagePath 
    : `${import.meta.env.VITE_UPLOAD_URL}/${imagePath}`
}

const handleImageError = (event: Event) => {
  const target = event.target as HTMLImageElement
  target.src = 'https://via.placeholder.com/300x200?text=暂无图片'
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

const loadWorks = async () => {
  loading.value = true
  try {
    const params: GetWorksParams = {
      page: pagination.current,
      limit: pagination.pageSize,
      ...filters,
      keyword: searchKeyword.value || undefined
    }

    const response = await museumApi.getWorks(params)
    works.value = response.data
    pagination.total = response.pagination.total
  } catch (error) {
    ElMessage.error('加载作品失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

const loadCategories = async () => {
  try {
    const response = await museumApi.getCategories()
    categories.value = response.data
  } catch (error) {
    console.error('加载分类失败:', error)
  }
}

const handleSearch = () => {
  pagination.current = 1
  loadWorks()
}

const handleFilter = () => {
  pagination.current = 1
  loadWorks()
}

const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  loadWorks()
}

const handleCurrentChange = (page: number) => {
  pagination.current = page
  loadWorks()
}

const viewWorkDetail = (work: AwardWork) => {
  router.push(`/museum/work/${work._id}`)
}

const handleCreateSuccess = () => {
  showCreateDialog.value = false
  loadWorks()
  ElMessage.success('作品创建成功')
}

const editWork = (work: AwardWork) => {
  ElMessage.info(`编辑作品：${work.title}（编辑功能开发中）`)
}

const deleteWork = async (work: AwardWork) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除作品"${work.title}"吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    
    await museumApi.deleteWork(work._id)
    ElMessage.success('删除成功')
    loadWorks()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

// 生命周期
onMounted(() => {
  loadWorks()
  loadCategories()
})
</script>

<style scoped>
.museum-container {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.museum-header {
  text-align: center;
  margin-bottom: 40px;
}

.title {
  font-size: 2.5rem;
  color: #2c3e50;
  margin-bottom: 10px;
}

.subtitle {
  font-size: 1.1rem;
  color: #666;
  margin: 0;
}

.search-filter-section {
  margin-bottom: 30px;
}

.filter-row {
  align-items: center;
}

.works-section {
  min-height: 400px;
}

.empty-state {
  text-align: center;
  padding: 60px 0;
}

.works-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.work-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: pointer;
}

.work-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.work-image {
  position: relative;
  height: 180px;
  overflow: hidden;
}

.work-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.work-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.work-card:hover .work-overlay {
  opacity: 1;
}

.file-indicators {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.file-icon {
  width: 20px;
  height: 20px;
  padding: 4px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
}

.audio-icon {
  color: #e6a23c;
}

.cert-icon {
  color: #67c23a;
}

.model-icon {
  color: #409eff;
}

.work-info {
  padding: 16px;
}

.work-title {
  margin: 0 0 8px 0;
  font-size: 1.1rem;
  color: #2c3e50;
  line-height: 1.4;
}

.work-meta {
  color: #666;
  font-size: 0.9rem;
  margin: 4px 0;
}

.work-year {
  color: #888;
  font-size: 0.85rem;
  margin: 4px 0 8px 0;
}

.work-tags {
  margin: 8px 0;
  min-height: 24px;
}

.work-tags .el-tag {
  margin-right: 4px;
  margin-bottom: 4px;
}

.work-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
}

.view-count {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #999;
  font-size: 0.85rem;
}

.action-buttons {
  display: flex;
  gap: 4px;
}

.pagination-section {
  display: flex;
  justify-content: center;
  margin-top: 40px;
}
</style>