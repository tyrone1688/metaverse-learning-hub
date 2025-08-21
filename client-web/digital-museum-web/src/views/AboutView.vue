<!-- src/views/AboutView.vue -->
<template>
  <div class="about-container">
    <div class="about-content">
      <h1 class="about-title">关于元宇宙教学平台</h1>
      
      <div class="about-section">
        <h2>项目介绍</h2>
        <p>
          元宇宙教学平台是一个创新的数字化教育解决方案，旨在通过3D技术和虚拟现实
          为教育领域带来革命性的变化。我们致力于打造一个集虚拟展示、互动教学、
          协作学习于一体的综合性教育平台。
        </p>
        <p>
          通过整合先进的Web 3D技术，我们让教育内容更加生动、直观，
          让学习过程更加有趣、高效。
        </p>
      </div>

      <div class="about-section">
        <h2>核心功能</h2>
        <el-row :gutter="20">
          <el-col :xs="24" :sm="12">
            <div class="feature-item">
              <el-icon size="24" color="#409EFF"><Box /></el-icon>
              <h4>3D模型展示</h4>
              <p>支持GLTF、GLB、OBJ、FBX等多种3D格式，提供专业的模型查看和交互体验</p>
            </div>
          </el-col>
          <el-col :xs="24" :sm="12">
            <div class="feature-item">
              <el-icon size="24" color="#67C23A"><School /></el-icon>
              <h4>数字化教学资源</h4>
              <p>整合音频讲解、证书文档、图片资料等多媒体教学资源</p>
            </div>
          </el-col>
          <el-col :xs="24" :sm="12">
            <div class="feature-item">
              <el-icon size="24" color="#E6A23C"><Trophy /></el-icon>
              <h4>作品管理系统</h4>
              <p>完整的作品创建、编辑、展示、搜索功能，便于内容组织和管理</p>
            </div>
          </el-col>
          <el-col :xs="24" :sm="12">
            <div class="feature-item">
              <el-icon size="24" color="#F56C6C"><View /></el-icon>
              <h4>沉浸式体验</h4>
              <p>提供全屏查看、自动旋转、截图等功能，增强用户体验</p>
            </div>
          </el-col>
        </el-row>
      </div>

      <div class="about-section">
        <h2>技术架构</h2>
        <div class="tech-stack">
          <div class="tech-category">
            <h3>前端技术</h3>
            <div class="tech-tags">
              <el-tag>Vue 3</el-tag>
              <el-tag>TypeScript</el-tag>
              <el-tag>Three.js</el-tag>
              <el-tag>Element Plus</el-tag>
              <el-tag>Vite</el-tag>
            </div>
          </div>
          <div class="tech-category">
            <h3>后端技术</h3>
            <div class="tech-tags">
              <el-tag type="success">NestJS</el-tag>
              <el-tag type="success">MongoDB</el-tag>
              <el-tag type="success">TypeScript</el-tag>
              <el-tag type="success">Swagger</el-tag>
              <el-tag type="success">Redis</el-tag>
            </div>
          </div>
          <div class="tech-category">
            <h3>3D技术</h3>
            <div class="tech-tags">
              <el-tag type="warning">WebGL</el-tag>
              <el-tag type="warning">GLTF/GLB</el-tag>
              <el-tag type="warning">OBJ/MTL</el-tag>
              <el-tag type="warning">FBX</el-tag>
              <el-tag type="warning">STL/PLY</el-tag>
            </div>
          </div>
        </div>
      </div>

      <div class="about-section">
        <h2>发展规划</h2>
        <el-timeline>
          <el-timeline-item timestamp="当前版本 v2.0" placement="top" type="success">
            <h4>基础功能完善</h4>
            <p>3D模型展示、作品管理、文件上传、搜索筛选等核心功能</p>
          </el-timeline-item>
          <el-timeline-item timestamp="计划中" placement="top" type="primary">
            <h4>虚拟教室</h4>
            <p>多人协同查看、实时标注、教师演示模式</p>
          </el-timeline-item>
          <el-timeline-item timestamp="未来版本" placement="top" type="info">
            <h4>元宇宙特性</h4>
            <p>虚拟空间构建、Avatar系统、游戏化学习</p>
          </el-timeline-item>
          <el-timeline-item timestamp="长期目标" placement="top" type="warning">
            <h4>AI辅助教学</h4>
            <p>智能助教、个性化学习路径、自动评分系统</p>
          </el-timeline-item>
        </el-timeline>
      </div>

      <div class="about-section">
        <h2>联系我们</h2>
        <p>
          如果您对我们的平台感兴趣，或有任何建议和合作意向，欢迎与我们联系。
          我们期待与更多教育机构和开发者合作，共同推动教育数字化转型。
        </p>
        <div class="contact-actions">
          <el-button type="primary" size="large" @click="handleContact">
            <el-icon><Message /></el-icon>
            发送邮件
          </el-button>
          <el-button size="large" @click="handleGithub">
            <el-icon><Link /></el-icon>
            GitHub
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { Box, School, Trophy, View, Message, Link } from '@element-plus/icons-vue'

const handleContact = () => {
  ElMessage.info('联系邮箱：contact@metaverse-edu.com')
}

const handleGithub = () => {
  window.open('https://github.com/tyrone1688/metaverse-learning-hub', '_blank')
}
</script>

<style scoped>
.about-container {
  min-height: calc(100vh - 60px);
  background: #f5f7fa;
  padding: 40px 20px;
}

.about-content {
  max-width: 1000px;
  margin: 0 auto;
  background: white;
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.about-title {
  color: #2c3e50;
  margin: 0 0 40px 0;
  text-align: center;
  font-size: 2.5rem;
}

.about-section {
  margin-bottom: 50px;
}

.about-section:last-child {
  margin-bottom: 0;
}

.about-section h2 {
  color: #2c3e50;
  margin: 0 0 20px 0;
  padding-bottom: 10px;
  border-bottom: 2px solid #e4e7ed;
}

.about-section p {
  color: #606266;
  line-height: 1.8;
  margin: 15px 0;
}

.feature-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 20px;
  margin-bottom: 20px;
  background: #f9fafc;
  border-radius: 8px;
  height: 100%;
}

.feature-item h4 {
  color: #2c3e50;
  margin: 10px 0;
}

.feature-item p {
  color: #909399;
  font-size: 14px;
  margin: 0;
}

.tech-stack {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.tech-category h3 {
  color: #606266;
  margin: 0 0 10px 0;
  font-size: 16px;
}

.tech-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.contact-actions {
  display: flex;
  gap: 20px;
  justify-content: center;
  margin-top: 30px;
}

@media (max-width: 768px) {
  .about-content {
    padding: 20px;
  }
  
  .about-title {
    font-size: 2rem;
  }
  
  .contact-actions {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>