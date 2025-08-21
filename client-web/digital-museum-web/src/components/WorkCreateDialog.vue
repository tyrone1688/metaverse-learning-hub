<!-- src/components/WorkCreateDialog.vue -->
<template>
  <el-dialog
    v-model="dialogVisible"
    title="创建作品"
    width="800px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="100px"
      class="work-form"
    >
      <!-- 基本信息 -->
      <el-divider content-position="left">基本信息</el-divider>
      
      <el-form-item label="作品标题" prop="title">
        <el-input v-model="form.title" placeholder="请输入作品标题" />
      </el-form-item>
      
      <el-form-item label="作品描述" prop="description">
        <el-input
          v-model="form.description"
          type="textarea"
          :rows="3"
          placeholder="请输入作品描述"
        />
      </el-form-item>
      
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="作者姓名" prop="author">
            <el-input v-model="form.author" placeholder="请输入作者姓名" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="所属学校" prop="school">
            <el-input v-model="form.school" placeholder="请输入学校名称" />
          </el-form-item>
        </el-col>
      </el-row>
      
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="创作年份" prop="year">
            <el-date-picker
              v-model="form.year"
              type="year"
              placeholder="选择年份"
              format="YYYY"
              value-format="YYYY"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="发布状态" prop="status">
            <el-select v-model="form.status" placeholder="选择状态" style="width: 100%">
              <el-option label="已发布" value="published" />
              <el-option label="草稿" value="draft" />
              <el-option label="已归档" value="archived" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      
      <el-form-item label="标签">
        <el-tag
          v-for="tag in form.tags"
          :key="tag"
          closable
          :disable-transitions="false"
          @close="handleTagClose(tag)"
          style="margin-right: 10px"
        >
          {{ tag }}
        </el-tag>
        <el-input
          v-if="inputVisible"
          ref="inputRef"
          v-model="inputValue"
          size="small"
          style="width: 100px"
          @keyup.enter="handleInputConfirm"
          @blur="handleInputConfirm"
        />
        <el-button v-else size="small" @click="showInput">
          + 新标签
        </el-button>
      </el-form-item>
      
      <!-- 媒体文件 -->
      <el-divider content-position="left">媒体文件</el-divider>
      
      <el-form-item label="作品图片">
        <el-upload
          v-model:file-list="imageList"
          :action="uploadUrl"
          :headers="uploadHeaders"
          list-type="picture-card"
          multiple
          :limit="9"
          accept="image/*"
          :on-success="handleImageSuccess"
          :on-error="handleUploadError"
        >
          <el-icon><Plus /></el-icon>
          <template #file="{ file }">
            <div>
              <img class="el-upload-list__item-thumbnail" :src="file.url" alt="" />
              <span class="el-upload-list__item-actions">
                <span
                  class="el-upload-list__item-preview"
                  @click="handlePreview(file)"
                >
                  <el-icon><ZoomIn /></el-icon>
                </span>
                <span
                  class="el-upload-list__item-delete"
                  @click="handleRemove(file, imageList)"
                >
                  <el-icon><Delete /></el-icon>
                </span>
              </span>
            </div>
          </template>
        </el-upload>
      </el-form-item>
      
      <el-form-item label="3D模型">
        <el-upload
          v-model:file-list="modelList"
          :action="uploadUrl"
          :headers="uploadHeaders"
          :limit="1"
          accept=".gltf,.glb,.obj,.fbx,.stl,.ply"
          :on-success="handleModelSuccess"
          :on-error="handleUploadError"
        >
          <el-button type="primary">选择3D模型文件</el-button>
          <template #tip>
            <div class="el-upload__tip">
              支持 GLTF, GLB, OBJ, FBX, STL, PLY 格式
            </div>
          </template>
        </el-upload>
      </el-form-item>
      
      <el-form-item label="讲解音频">
        <el-upload
          v-model:file-list="audioList"
          :action="uploadUrl"
          :headers="uploadHeaders"
          :limit="1"
          accept="audio/*"
          :on-success="handleAudioSuccess"
          :on-error="handleUploadError"
        >
          <el-button type="primary">选择音频文件</el-button>
          <template #tip>
            <div class="el-upload__tip">
              支持 MP3, WAV, OGG 等音频格式
            </div>
          </template>
        </el-upload>
      </el-form-item>
      
      <el-form-item label="获奖证书">
        <el-upload
          v-model:file-list="certificateList"
          :action="uploadUrl"
          :headers="uploadHeaders"
          :limit="1"
          accept="image/*,.pdf"
          :on-success="handleCertificateSuccess"
          :on-error="handleUploadError"
        >
          <el-button type="primary">选择证书文件</el-button>
          <template #tip>
            <div class="el-upload__tip">
              支持图片或PDF格式
            </div>
          </template>
        </el-upload>
      </el-form-item>
    </el-form>
    
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">
          确定
        </el-button>
      </span>
    </template>
    
    <!-- 图片预览对话框 -->
    <el-dialog v-model="previewVisible" width="800px">
      <img :src="previewUrl" alt="Preview" style="width: 100%" />
    </el-dialog>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules, UploadFile } from 'element-plus'
import { Plus, ZoomIn, Delete } from '@element-plus/icons-vue'
import { museumApi } from '../services/museum'

// Props
const props = defineProps<{
  visible: boolean
}>()

// Emits
const emit = defineEmits<{
  'update:visible': [value: boolean]
  success: []
}>()

// 对话框可见性
const dialogVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val)
})

// 表单数据
const formRef = ref<FormInstance>()
const form = ref({
  title: '',
  description: '',
  author: '',
  school: '',
  year: new Date().getFullYear().toString(),
  status: 'published',
  tags: [] as string[],
  images: [] as string[],
  modelUrl: '',
  audioUrl: '',
  certificateUrl: ''
})

// 表单验证规则
const rules: FormRules = {
  title: [
    { required: true, message: '请输入作品标题', trigger: 'blur' }
  ],
  description: [
    { required: true, message: '请输入作品描述', trigger: 'blur' }
  ],
  author: [
    { required: true, message: '请输入作者姓名', trigger: 'blur' }
  ],
  school: [
    { required: true, message: '请输入学校名称', trigger: 'blur' }
  ],
  year: [
    { required: true, message: '请选择创作年份', trigger: 'change' }
  ],
  status: [
    { required: true, message: '请选择发布状态', trigger: 'change' }
  ]
}

// 标签输入
const inputVisible = ref(false)
const inputValue = ref('')
const inputRef = ref()

// 文件列表
const imageList = ref<UploadFile[]>([])
const modelList = ref<UploadFile[]>([])
const audioList = ref<UploadFile[]>([])
const certificateList = ref<UploadFile[]>([])

// 上传配置
const uploadUrl = computed(() => {
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
  return `${baseUrl}/api/museum/upload`
})

const uploadHeaders = computed(() => {
  return {
    // 如果需要认证，在这里添加 token
    // 'Authorization': `Bearer ${token}`
  }
})

// 图片预览
const previewVisible = ref(false)
const previewUrl = ref('')

// 提交状态
const submitting = ref(false)

// 方法
const handleClose = () => {
  dialogVisible.value = false
  resetForm()
}

const resetForm = () => {
  formRef.value?.resetFields()
  form.value = {
    title: '',
    description: '',
    author: '',
    school: '',
    year: new Date().getFullYear().toString(),
    status: 'published',
    tags: [],
    images: [],
    modelUrl: '',
    audioUrl: '',
    certificateUrl: ''
  }
  imageList.value = []
  modelList.value = []
  audioList.value = []
  certificateList.value = []
}

const handleTagClose = (tag: string) => {
  form.value.tags.splice(form.value.tags.indexOf(tag), 1)
}

const showInput = () => {
  inputVisible.value = true
  nextTick(() => {
    inputRef.value?.focus()
  })
}

const handleInputConfirm = () => {
  if (inputValue.value) {
    form.value.tags.push(inputValue.value)
  }
  inputVisible.value = false
  inputValue.value = ''
}

const handleImageSuccess = (response: any, file: UploadFile) => {
  if (response.success && response.data) {
    form.value.images.push(response.data.path)
  }
}

const handleModelSuccess = (response: any, file: UploadFile) => {
  if (response.success && response.data) {
    form.value.modelUrl = response.data.path
  }
}

const handleAudioSuccess = (response: any, file: UploadFile) => {
  if (response.success && response.data) {
    form.value.audioUrl = response.data.path
  }
}

const handleCertificateSuccess = (response: any, file: UploadFile) => {
  if (response.success && response.data) {
    form.value.certificateUrl = response.data.path
  }
}

const handleUploadError = (error: any) => {
  console.error('上传失败:', error)
  ElMessage.error('文件上传失败')
}

const handlePreview = (file: UploadFile) => {
  previewUrl.value = file.url || ''
  previewVisible.value = true
}

const handleRemove = (file: UploadFile, fileList: UploadFile[]) => {
  const index = fileList.indexOf(file)
  if (index > -1) {
    fileList.splice(index, 1)
    // 同时从form.images中移除
    if (file.response?.data?.path) {
      const imgIndex = form.value.images.indexOf(file.response.data.path)
      if (imgIndex > -1) {
        form.value.images.splice(imgIndex, 1)
      }
    }
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        // 转换年份为数字
        const submitData = {
          ...form.value,
          year: parseInt(form.value.year)
        }
        
        await museumApi.createWork(submitData)
        ElMessage.success('作品创建成功')
        emit('success')
        handleClose()
      } catch (error) {
        console.error('创建作品失败:', error)
        ElMessage.error('创建作品失败')
      } finally {
        submitting.value = false
      }
    }
  })
}
</script>

<style scoped>
.work-form {
  max-height: 60vh;
  overflow-y: auto;
  padding-right: 20px;
}

.el-divider {
  margin: 20px 0;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

:deep(.el-upload-list--picture-card) {
  display: flex;
  flex-wrap: wrap;
}

:deep(.el-upload--picture-card) {
  width: 100px;
  height: 100px;
}

:deep(.el-upload-list__item) {
  width: 100px;
  height: 100px;
}

.el-upload-list__item-thumbnail {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.el-upload-list__item-actions {
  position: absolute;
  width: 100%;
  height: 100%;
  left: 0;
  top: 0;
  cursor: default;
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgba(0, 0, 0, 0.5);
  opacity: 0;
  transition: opacity 0.3s;
}

.el-upload-list__item:hover .el-upload-list__item-actions {
  opacity: 1;
}

.el-upload-list__item-preview,
.el-upload-list__item-delete {
  display: inline-flex;
  cursor: pointer;
  margin: 0 8px;
  color: white;
  font-size: 20px;
}
</style>