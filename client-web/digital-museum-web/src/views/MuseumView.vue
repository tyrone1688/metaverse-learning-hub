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
    <el-dialog
      v-model="showCreateDialog"
      title="创建新作品"
      width="600px"
      :before-close="handleCloseCreateDialog"
    >
      <div class="create-form">
        <p class="form-hint">请填写基本信息来创建作品（暂时简化版本）</p>
        <el-form :model="newWork" label-width="80px">
          <el-form-item label="标题">
            <el-input v-model="newWork.title" placeholder="请输入作品标题" />
          </el-form-item>
          <el-form-item label="描述">
            <el-input
              v-model="newWork.description"
              type="textarea"
              :rows="3"
              placeholder="请输入作品描述"
            />
          </el-form-item>
          <el-form-item label="分类">
            <el-input v-model="newWork.category" placeholder="如：人工智能、机器人等" />
          </el-form-item>
          <el-form-item label="作者">
            <el-input v-model="newWork.author" placeholder="请输入作者姓名" />
          </el-form-item>
          <el-form-item label="学校">
            <el-input v-model="newWork.school" placeholder="请输入学校名称" />
          </el-form-item>
          <el-form-item label="年份">
            <el-date-picker
              v-model="newWork.year"
              type="year"
              placeholder="选择年份"
              value-format="YYYY"
              style="width: 100%"
            />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showCreateDialog = false">取消</el-button>
          <el-button type="primary" @click="handleCreateWork" :loading="creating">
            创建作品
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, View, Plus } from '@element-plus/icons-vue'
import { museumApi, type AwardWork, type GetWorksParams } from '@/services/museum'

// 响应式数据
const loading = ref(false)
const creating = ref(false)
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

const newWork = reactive({
  title: '',
  description: '',
  category: '',
  author: '',
  school: '',
  year: new Date().getFullYear()
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
  if (!imagePath) return '/placeholder-image.jpg'
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
  ElMessage.info(`查看作品：${work.title}（详情页面待开发）`)
}

const handleCreateWork = async () => {
  if (!newWork.title || !newWork.description || !newWork.author) {
    ElMessage.warning('请填写必要信息')
    return
  }

  creating.value = true
  try {
    const workData = {
      title: newWork.title,
      description: newWork.description,
      category: newWork.category,
      author: newWork.author,
      school: newWork.school,
      year: Number(newWork.year),
      status: 'published'
    }

    console.log('准备发送数据:', workData)
    await museumApi.createWork(workData)
    
    ElMessage.success('作品创建成功')
    showCreateDialog.value = false
    resetNewWork()
    loadWorks()
  } catch (error) {
    ElMessage.error('创建作品失败')
    console.error(error)
  } finally {
    creating.value = false
  }
}

const resetNewWork = () => {
  Object.assign(newWork, {
    title: '',
    description: '',
    category: '',
    author: '',
    school: '',
    year: new Date().getFullYear()
  })
}

const handleCloseCreateDialog = () => {
  showCreateDialog.value = false
  resetNewWork()
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
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.work-card:hover .work-overlay {
  opacity: 1;
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

.pagination-section {
  display: flex;
  justify-content: center;
  margin-top: 40px;
}

.create-form {
  margin: 20px 0;
}

.form-hint {
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 20px;
  text-align: center;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>