<!-- src/views/ModelTestView.vue -->
<template>
  <div class="model-test-page">
    <el-card class="control-card">
      <template #header>
        <div class="card-header">
          <span>3D模型加载器测试</span>
          <el-button type="primary" @click="uploadDialogVisible = true">
            <el-icon><Upload /></el-icon>
            上传模型
          </el-button>
        </div>
      </template>
      
      <!-- 预设模型列表 -->
      <div class="preset-models">
        <h4>测试模型</h4>
        <el-space wrap>
          <el-button
            v-for="model in presetModels"
            :key="model.name"
            @click="loadPresetModel(model)"
            :type="currentModel?.url === model.url ? 'primary' : 'default'"
          >
            {{ model.name }}
          </el-button>
        </el-space>
      </div>
      
      <!-- 已上传模型列表 -->
      <div class="uploaded-models" v-if="uploadedModels.length > 0">
        <h4>已上传模型</h4>
        <el-space wrap>
          <el-tag
            v-for="(model, index) in uploadedModels"
            :key="index"
            closable
            @close="removeUploadedModel(index)"
            @click="loadUploadedModel(model)"
            :type="currentModel?.url === model.url ? 'primary' : 'info'"
            style="cursor: pointer"
          >
            {{ model.name }}
          </el-tag>
        </el-space>
      </div>
      
      <!-- 模型URL输入 -->
      <div class="url-input">
        <h4>自定义URL</h4>
        <el-input
          v-model="customUrl"
          placeholder="输入模型URL（支持GLTF/GLB/OBJ/FBX/PLY/STL）"
          @keyup.enter="loadCustomUrl"
        >
          <template #append>
            <el-button @click="loadCustomUrl">加载</el-button>
          </template>
        </el-input>
      </div>
      
      <!-- 返回按钮 -->
      <div class="back-button">
        <el-button @click="goBack" :icon="ArrowLeft">
          返回博物馆
        </el-button>
      </div>
    </el-card>
    
    <!-- 3D查看器 -->
    <div class="viewer-container">
      <ModelViewer
        v-if="currentModel"
        :model-url="currentModel.url"
        :model-type="currentModel.type"
        :show-info="true"
      />
      <div v-else class="placeholder">
        <el-empty description="请选择或上传一个3D模型">
          <el-button type="primary" @click="uploadDialogVisible = true">
            上传模型
          </el-button>
        </el-empty>
      </div>
    </div>
    
    <!-- 上传对话框 -->
    <el-dialog
      v-model="uploadDialogVisible"
      title="上传3D模型"
      width="500px"
    >
      <el-upload
        ref="uploadRef"
        drag
        :auto-upload="false"
        :on-change="handleFileChange"
        :limit="1"
        accept=".gltf,.glb,.obj,.mtl,.fbx,.ply,.stl"
      >
        <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
        <div class="el-upload__text">
          拖拽文件到这里或 <em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            支持格式：GLTF, GLB, OBJ (可包含MTL), FBX, PLY, STL
          </div>
        </template>
      </el-upload>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="uploadDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmUpload">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Upload, UploadFilled, ArrowLeft } from '@element-plus/icons-vue';
import ModelViewer from '../components/ModelViewer.vue';

interface ModelInfo {
  name: string;
  url: string;
  type: string;
  isLocal?: boolean;  // 是否为本地文件
}

// 路由
const router = useRouter();

// 当前模型
const currentModel = ref<ModelInfo | null>(null);

// 预设模型列表（使用公开的3D模型资源）
const presetModels = ref<ModelInfo[]>([
  {
    name: 'Astronaut (GLTF)',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/CesiumMan/glTF/CesiumMan.gltf',
    type: 'gltf'
  },
  {
    name: 'Duck (GLB)',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Duck/glTF-Binary/Duck.glb',
    type: 'glb'
  },
  {
    name: 'Brain Stem (GLB)',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/BrainStem/glTF-Binary/BrainStem.glb',
    type: 'glb'
  },
  {
    name: 'Animated Box (GLB)',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/AnimatedCube/glTF-Binary/AnimatedCube.glb',
    type: 'glb'
  },
  {
    name: 'Avocado (GLB)',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Avocado/glTF-Binary/Avocado.glb',
    type: 'glb'
  },
  {
    name: 'Box (GLB)',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Box/glTF-Binary/Box.glb',
    type: 'glb'
  }
]);

// 已上传的模型
const uploadedModels = ref<ModelInfo[]>([]);

// 自定义URL
const customUrl = ref('');

// 上传相关
const uploadDialogVisible = ref(false);
const uploadRef = ref();
const selectedFile = ref<File | null>(null);

// 返回博物馆
const goBack = () => {
  router.push('/museum');
};

// 加载预设模型
function loadPresetModel(model: ModelInfo) {
  currentModel.value = model;
  ElMessage.success(`正在加载模型: ${model.name}`);
}

// 加载已上传的模型
function loadUploadedModel(model: ModelInfo) {
  currentModel.value = model;
  ElMessage.success(`正在加载模型: ${model.name}`);
}

// 加载自定义URL
function loadCustomUrl() {
  if (!customUrl.value) {
    ElMessage.warning('请输入模型URL');
    return;
  }
  
  // 获取文件扩展名
  const extension = customUrl.value.split('.').pop()?.toLowerCase() || '';
  const supportedFormats = ['gltf', 'glb', 'obj', 'fbx', 'ply', 'stl'];
  
  if (!supportedFormats.includes(extension)) {
    ElMessage.error('不支持的文件格式');
    return;
  }
  
  currentModel.value = {
    name: '自定义模型',
    url: customUrl.value,
    type: extension
  };
  
  ElMessage.success('正在加载自定义模型');
}

// 处理文件选择
function handleFileChange(file: any) {
  selectedFile.value = file.raw;
}

// 确认上传
function confirmUpload() {
  if (!selectedFile.value) {
    ElMessage.warning('请选择一个文件');
    return;
  }
  
  // 获取文件扩展名（从文件名而不是URL获取）
  const fileName = selectedFile.value.name;
  const extension = fileName.split('.').pop()?.toLowerCase() || '';
  
  // 创建本地URL
  const url = URL.createObjectURL(selectedFile.value);
  
  const model: ModelInfo = {
    name: fileName,
    url: url,
    type: extension,
    isLocal: true  // 标记为本地文件
  };
  
  uploadedModels.value.push(model);
  currentModel.value = model;
  
  uploadDialogVisible.value = false;
  selectedFile.value = null;
  
  ElMessage.success('模型上传成功');
}

// 移除已上传的模型
function removeUploadedModel(index: number) {
  const model = uploadedModels.value[index];
  
  // 释放URL对象
  if (model.url.startsWith('blob:')) {
    URL.revokeObjectURL(model.url);
  }
  
  uploadedModels.value.splice(index, 1);
  
  // 如果删除的是当前模型，清空当前模型
  if (currentModel.value?.url === model.url) {
    currentModel.value = null;
  }
}

// 组件挂载时
onMounted(() => {
  // 可以在这里加载默认模型
  // loadPresetModel(presetModels.value[0]);
});
</script>

<style scoped>
.model-test-page {
  display: flex;
  height: 100vh;
  background: #f5f5f5;
}

.control-card {
  width: 400px;
  height: 100%;
  overflow-y: auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.control-card h4 {
  margin: 20px 0 10px 0;
  color: #333;
  font-size: 14px;
}

.control-card h4:first-child {
  margin-top: 0;
}

.preset-models,
.uploaded-models,
.url-input,
.back-button {
  margin-bottom: 20px;
}

.viewer-container {
  flex: 1;
  position: relative;
  background: #fff;
}

.placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 深度选择器样式 */
:deep(.el-upload-dragger) {
  padding: 40px;
}
</style>