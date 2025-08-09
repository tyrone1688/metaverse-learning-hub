<template>
  <div class="enhanced-model-viewer" ref="containerRef">
    <div class="model-canvas" ref="canvasContainer"></div>
    
    <!-- 加载进度条 -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-content">
        <el-progress
          :percentage="loadingProgress"
          :stroke-width="8"
          color="#409eff"
          class="progress-bar"
        />
        <p class="loading-text">{{ loadingText }}</p>
        <div class="loading-details" v-if="loadingDetails">
          <p>{{ loadingDetails }}</p>
        </div>
        <div class="loading-stats">
          <span>已用时间: {{ loadingTime }}s</span>
          <span v-if="estimatedTime">预计剩余: {{ estimatedTime }}s</span>
        </div>
      </div>
    </div>

    <!-- 文件上传区域 -->
    <div class="upload-area" v-if="!modelLoaded" @drop="handleDrop" @dragover="handleDragOver" @dragleave="handleDragLeave">
      <div class="upload-content" :class="{ 'drag-over': isDragOver }">
        <el-icon class="upload-icon"><Upload /></el-icon>
        <h3>拖拽3D模型文件到此处</h3>
        <p>支持 GLTF, GLB, OBJ, FBX 格式，最大100MB</p>
        
        <div class="upload-buttons">
          <el-button type="primary" @click="triggerFileInput" size="large">
            <el-icon><Folder /></el-icon>
            选择文件
          </el-button>
          <el-button @click="loadSampleModel" size="large">
            <el-icon><Box /></el-icon>
            加载示例
          </el-button>
        </div>
        
        <input
          ref="fileInput"
          type="file"
          accept=".gltf,.glb,.obj,.fbx"
          style="display: none"
          @change="handleFileSelect"
        />
        
        <div class="format-info">
          <div class="format-item">
            <el-tag size="small" type="success" effect="plain">GLTF/GLB</el-tag>
            <span>推荐格式，支持材质和动画</span>
          </div>
          <div class="format-item">
            <el-tag size="small" type="info" effect="plain">OBJ</el-tag>
            <span>经典格式，几何体和材质</span>
          </div>
          <div class="format-item">
            <el-tag size="small" type="warning" effect="plain">FBX</el-tag>
            <span>复杂场景，支持动画</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 高级控制工具栏 -->
    <div class="control-toolbar" v-if="modelLoaded">
      <div class="toolbar-section">
        <el-button size="small" @click="resetView" title="重置视图">
          <el-icon><Refresh /></el-icon>
        </el-button>
        <el-button size="small" @click="fitToView" title="适合视图">
          <el-icon><FullScreen /></el-icon>
        </el-button>
        <el-button 
          size="small" 
          @click="toggleWireframe" 
          title="切换线框" 
          :type="wireframe ? 'primary' : 'default'"
        >
          <el-icon><Grid /></el-icon>
        </el-button>
      </div>
      
      <div class="toolbar-section">
        <el-button 
          size="small" 
          @click="toggleAutoRotate" 
          title="自动旋转" 
          :type="autoRotate ? 'primary' : 'default'"
        >
          <el-icon><VideoPlay /></el-icon>
        </el-button>
        <el-button 
          size="small" 
          @click="toggleAnimations" 
          title="播放动画" 
          :type="animationsPlaying ? 'primary' : 'default'"
          v-if="hasAnimations"
        >
          <el-icon><CaretRight /></el-icon>
        </el-button>
        <el-button size="small" @click="generateThumbnail" title="生成缩略图">
          <el-icon><Camera /></el-icon>
        </el-button>
      </div>

      <div class="toolbar-section">
        <el-button size="small" @click="clearModel" title="清除模型" type="danger">
          <el-icon><Delete /></el-icon>
        </el-button>
        <el-button size="small" @click="showInfo = !showInfo" title="模型信息">
          <el-icon><InfoFilled /></el-icon>
        </el-button>
      </div>
    </div>

    <!-- 错误提示 -->
    <el-alert
      v-if="error"
      :title="error"
      type="error"
      show-icon
      :closable="true"
      @close="error = ''"
      class="error-alert"
    />

    <!-- 高级模型信息面板 -->
    <div class="info-panel" v-if="modelInfo && showInfo">
      <div class="panel-header">
        <h4>模型信息</h4>
        <el-button size="small" @click="showInfo = false" text>
          <el-icon><Close /></el-icon>
        </el-button>
      </div>
      
      <div class="info-content">
        <div class="info-section">
          <h5>基本信息</h5>
          <div class="info-item">
            <span>文件名:</span>
            <span>{{ modelInfo.name }}</span>
          </div>
          <div class="info-item">
            <span>格式:</span>
            <span>{{ modelInfo.format }}</span>
          </div>
          <div class="info-item">
            <span>大小:</span>
            <span>{{ modelInfo.size }}</span>
          </div>
        </div>

        <div class="info-section">
          <h5>几何信息</h5>
          <div class="info-item">
            <span>顶点数:</span>
            <span>{{ modelInfo.vertices }}</span>
          </div>
          <div class="info-item">
            <span>面数:</span>
            <span>{{ modelInfo.faces }}</span>
          </div>
          <div class="info-item">
            <span>材质数:</span>
            <span>{{ modelInfo.materials }}</span>
          </div>
        </div>

        <div class="info-section" v-if="modelInfo.animations > 0">
          <h5>动画信息</h5>
          <div class="info-item">
            <span>动画数量:</span>
            <span>{{ modelInfo.animations }}</span>
          </div>
        </div>

        <div class="info-section">
          <h5>尺寸信息</h5>
          <div class="info-item">
            <span>宽度:</span>
            <span>{{ modelInfo.dimensions.width }}m</span>
          </div>
          <div class="info-item">
            <span>高度:</span>
            <span>{{ modelInfo.dimensions.height }}m</span>
          </div>
          <div class="info-item">
            <span>深度:</span>
            <span>{{ modelInfo.dimensions.depth }}m</span>
          </div>
        </div>

        <div class="info-section" v-if="performanceStats">
          <h5>性能统计</h5>
          <div class="info-item">
            <span>加载时间:</span>
            <span>{{ performanceStats.loadTime }}ms</span>
          </div>
          <div class="info-item">
            <span>内存使用:</span>
            <span>{{ performanceStats.memoryUsage }}MB</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 缩略图预览 -->
    <el-dialog v-model="thumbnailVisible" title="模型缩略图" width="400px">
      <div class="thumbnail-container">
        <img :src="thumbnailUrl" alt="Model Thumbnail" style="width: 100%" />
        <div class="thumbnail-actions">
          <el-button @click="downloadThumbnail">下载缩略图</el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { 
  Upload, Folder, Refresh, Grid, VideoPlay, Delete, 
  FullScreen, Close, Box, Camera, InfoFilled, CaretRight