<!-- src/views/HomeView.vue -->
<template>
  <div class="home-container">
    <!-- 主要内容区域 -->
    <div class="main-content">
      <!-- 首页内容 -->
      <div class="home-section">
        <div class="hero-section">
          <h1 class="hero-title">欢迎来到元宇宙教学平台</h1>
          <p class="hero-subtitle">探索3D数字世界，体验沉浸式学习</p>
          <div class="hero-actions">
            <el-button type="primary" size="large" @click="goToMuseum">
              <el-icon><Box /></el-icon>
              进入数字馆
            </el-button>
            <el-button size="large" @click="goToModelTest">
              <el-icon><View /></el-icon>
              3D模型测试
            </el-button>
          </div>
        </div>

        <!-- 特性介绍 -->
        <div class="features-section">
          <h2 class="section-title">平台特性</h2>
          <el-row :gutter="30">
            <el-col :xs="24" :sm="12" :md="8">
              <div class="feature-card">
                <el-icon size="48" color="#409EFF"><Box /></el-icon>
                <h3>3D模型展示</h3>
                <p>支持多种3D格式，包括GLTF、OBJ、FBX等，提供专业的模型查看体验</p>
              </div>
            </el-col>
            <el-col :xs="24" :sm="12" :md="8">
              <div class="feature-card">
                <el-icon size="48" color="#67C23A"><School /></el-icon>
                <h3>数字化教学</h3>
                <p>将传统教学资源数字化，提供音频讲解、证书管理等功能</p>
              </div>
            </el-col>
            <el-col :xs="24" :sm="12" :md="8">
              <div class="feature-card">
                <el-icon size="48" color="#E6A23C"><Trophy /></el-icon>
                <h3>作品管理</h3>
                <p>完整的作品创建、编辑、展示系统，支持多媒体内容管理</p>
              </div>
            </el-col>
          </el-row>
        </div>

        <!-- 统计信息 -->
        <div class="stats-section">
          <el-row :gutter="30">
            <el-col :xs="12" :sm="6">
              <div class="stat-item">
                <div class="stat-value">{{ stats.works }}+</div>
                <div class="stat-label">作品数量</div>
              </div>
            </el-col>
            <el-col :xs="12" :sm="6">
              <div class="stat-item">
                <div class="stat-value">{{ stats.models }}+</div>
                <div class="stat-label">3D模型</div>
              </div>
            </el-col>
            <el-col :xs="12" :sm="6">
              <div class="stat-item">
                <div class="stat-value">{{ stats.schools }}+</div>
                <div class="stat-label">合作学校</div>
              </div>
            </el-col>
            <el-col :xs="12" :sm="6">
              <div class="stat-item">
                <div class="stat-value">{{ stats.views }}+</div>
                <div class="stat-label">浏览次数</div>
              </div>
            </el-col>
          </el-row>
        </div>

        <!-- 快速开始 -->
        <div class="quick-start-section">
          <h2 class="section-title">快速开始</h2>
          <el-row :gutter="30">
            <el-col :xs="24" :sm="12">
              <div class="action-card">
                <h3>浏览作品</h3>
                <p>探索数字馆中的优秀作品，体验3D模型的魅力</p>
                <el-button type="primary" @click="goToMuseum">
                  进入数字馆
                </el-button>
              </div>
            </el-col>
            <el-col :xs="24" :sm="12">
              <div class="action-card">
                <h3>测试功能</h3>
                <p>上传并测试您自己的3D模型文件</p>
                <el-button @click="goToModelTest">
                  模型测试
                </el-button>
              </div>
            </el-col>
          </el-row>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { School, Box, Trophy, View } from '@element-plus/icons-vue'
import { museumApi } from '../services/museum'

const router = useRouter()

// 统计数据
const stats = ref({
  works: 0,
  models: 0,
  schools: 0,
  views: 0
})

// 跳转到数字馆
const goToMuseum = () => {
  router.push('/museum')
}

// 跳转到模型测试
const goToModelTest = () => {
  router.push('/model-test')
}

// 加载统计数据
const loadStats = async () => {
  try {
    const response = await museumApi.getWorks({ limit: 1000 })
    const works = response.data.items || response.data
    stats.value.works = works.length
    
    // 统计有3D模型的作品
    stats.value.models = works.filter((w: any) => w.modelUrl).length
    
    // 统计学校数量（去重）
    const schools = new Set(works.map((w: any) => w.school))
    stats.value.schools = schools.size
    
    // 统计总浏览量
    stats.value.views = works.reduce((sum: number, w: any) => sum + (w.viewCount || 0), 0)
  } catch (error) {
    console.error('加载统计数据失败:', error)
  }
}

onMounted(() => {
  loadStats()
})
</script>

<style scoped>
.home-container {
  min-height: calc(100vh - 60px); /* 减去顶部导航栏高度 */
  background: #f5f7fa;
}

/* 主内容 */
.main-content {
  width: 100%;
}

/* 首页 */
.home-section {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
}

.hero-section {
  text-align: center;
  padding: 80px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  color: white;
  margin-bottom: 60px;
}

.hero-title {
  font-size: 3rem;
  margin: 0 0 20px 0;
  font-weight: 700;
}

.hero-subtitle {
  font-size: 1.5rem;
  margin: 0 0 40px 0;
  opacity: 0.95;
}

.hero-actions {
  display: flex;
  gap: 20px;
  justify-content: center;
  flex-wrap: wrap;
}

/* 特性部分 */
.features-section {
  margin-bottom: 60px;
}

.section-title {
  text-align: center;
  font-size: 2rem;
  margin: 0 0 40px 0;
  color: #2c3e50;
}

.feature-card {
  background: white;
  padding: 30px;
  border-radius: 12px;
  text-align: center;
  height: 100%;
  transition: transform 0.3s;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.feature-card h3 {
  margin: 20px 0 15px 0;
  color: #2c3e50;
}

.feature-card p {
  color: #606266;
  line-height: 1.6;
  margin: 0;
}

/* 统计部分 */
.stats-section {
  background: white;
  padding: 40px;
  border-radius: 12px;
  margin-bottom: 60px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.stat-item {
  text-align: center;
  padding: 20px;
}

.stat-value {
  font-size: 2.5rem;
  font-weight: 700;
  color: #409EFF;
  margin-bottom: 10px;
}

.stat-label {
  color: #909399;
  font-size: 1rem;
}

/* 快速开始部分 */
.quick-start-section {
  margin-bottom: 40px;
}

.action-card {
  background: white;
  padding: 30px;
  border-radius: 12px;
  height: 100%;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.action-card h3 {
  color: #2c3e50;
  margin: 0 0 15px 0;
}

.action-card p {
  color: #606266;
  line-height: 1.6;
  margin: 0 0 20px 0;
}

/* 响应式 */
@media (max-width: 768px) {
  .hero-title {
    font-size: 2rem;
  }
  
  .hero-subtitle {
    font-size: 1.2rem;
  }
  
  .hero-actions {
    flex-direction: column;
    align-items: center;
  }
  
  .stat-value {
    font-size: 2rem;
  }
  
  .hero-section {
    padding: 60px 20px;
  }
}
</style>