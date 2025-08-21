<!-- src/components/WorkEditDialog.vue -->
<template>
  <el-dialog
    v-model="dialogVisible"
    title="编辑作品"
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
      
      <!-- 媒体文件管理 -->
      <el-divider content-position="left">媒体文件管理</el-divider>
      
      <el-form-item label="作品图片">
        <div class="file-manager">
          <div class="current-files" v-if="form.images && form.images.length > 0">
            <div class="file-grid">
              <div v-for="(image, index) in form.images" :key="index" class="file-item">
                <el-image
                  :src="getFileUrl(image)"
                  fit="cover"
                  class="file-preview"
                />
                <el-button
                  type="danger"
                  size="small"
                  circle
                  class="remove-btn"
                  @click="removeImage(index)"
                >
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
            </div>
          </div>
          <el-upload
            :action="uploadUrl"
            :headers="uploadHeaders"
            multiple
            accept="image/*"
            :show-file-list="false"
            :on-success="handleImageUpload"
            :on-error="handleUploadError"
          >
            <el-button size="small" type="primary">
              <el-icon><Plus /></el-icon>
              添加图片
            </el-button>
          </el-upload>
        </div>
      </el-form-item>
      
      <el-form-item label="3D模型">
        <div class="file-manager">
          <div v-if="form.modelUrl" class="current-file">
            <el-tag type="success" closable @close="removeModel">
              已上传3D模型
            </el-tag>
          </div>
          <el-upload
            :action="uploadUrl"
            :headers="uploadHeaders"
            accept=".gltf,.glb,.obj,.fbx,.stl,.ply"
            :show-file-list="false"
            :on-success="handleModelUpload"
            :on-error="handleUploadError"
          >
            <el-button size="small" type="primary">
              <el-icon><Upload /></el-icon>
              {{ form.modelUrl ? '替换' : '上传' }}3D模型
            </el-button>
          </el-upload>
        </div>
      </el-form-item>
      
      <el-form-item label="讲解音频">
        <div class="file-manager">
          <div v-if="form.audioUrl" class="current-file">
            <el-tag type="success" closable @close="removeAudio">
              已上传音频文件
            </el-tag>
          </div>
          <el-upload
            :action="uploadUrl"
            :headers="uploadHeaders"
            accept="audio/*"
            :show-file-list="false"
            :on-success="handleAudioUpload"
            :on-error="handleUploadError"
          >
            <el-button size="small" type="primary">
              <el-icon><Upload /></el-icon>
              {{ form.audioUrl ? '替换' : '上传' }}音频
            </el-button>
          </el-upload>
        </div>
      </el-form-item>
      
      <el-form-item label="获奖证书">
        <div class="file-manager">
          <div v-if="form.certificateUrl" class="current-file">
            <el-tag type="success" closable @close="removeCertificate">
              已上传证书文件
            </el-tag>
          </div>
          <el-upload
            :action="uploadUrl"
            :headers="uploadHeaders"
            accept="image/*,.pdf"
            :show-file-list="false"
            :on-success="handleCertificateUpload"
            :on-error="handleUploadError"
          >
            <el-button size="small" type="primary">
              <el-icon><Upload /></el-icon>
              {{ form.certificateUrl ? '替换' : '上传' }}证书
            </el-button>
          </el-upload>
        </div>
      </el-form-item>
    </el-form>
    
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">
          保存修改
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { Delete, Plus, Upload } from '@element-plus/icons-vue'
import { museumApi, type AwardWork } from '../services/museum'

// Props
const props = defineProps<{
  visible: boolean
  work: AwardWork | null
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
  year: '',
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

// 提交状态
const submitting = ref(false)

// 上传配置
const uploadUrl = computed(() => {
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
  return `${baseUrl}/api/museum/upload`
})

const uploadHeaders = computed(() => {
  return {
    // 如果需要认证，在这里添加 token
  }
})

// 文件处理方法
const getFileUrl = (filePath: string) => {
  if (!filePath) return ''
  if (filePath.startsWith('http')) return filePath
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
  return `${baseUrl}/${filePath.startsWith('uploads/') ? '' : 'uploads/'}${filePath}`
}

const removeImage = (index: number) => {
  form.value.images.splice(index, 1)
}

const removeModel = () => {
  form.value.modelUrl = ''
}

const removeAudio = () => {
  form.value.audioUrl = ''
}

const removeCertificate = () => {
  form.value.certificateUrl = ''
}

const handleImageUpload = (response: any) => {
  if (response.success && response.data) {
    form.value.images.push(response.data.path)
    ElMessage.success('图片上传成功')
  }
}

const handleModelUpload = (response: any) => {
  if (response.success && response.data) {
    form.value.modelUrl = response.data.path
    ElMessage.success('3D模型上传成功')
  }
}

const handleAudioUpload = (response: any) => {
  if (response.success && response.data) {
    form.value.audioUrl = response.data.path
    ElMessage.success('音频上传成功')
  }
}

const handleCertificateUpload = (response: any) => {
  if (response.success && response.data) {
    form.value.certificateUrl = response.data.path
    ElMessage.success('证书上传成功')
  }
}

const handleUploadError = (error: any) => {
  console.error('上传失败:', error)
  ElMessage.error('文件上传失败')
}

// 监听作品数据变化
watch(() => props.work, (newWork) => {
  if (newWork) {
    form.value = {
      title: newWork.title || '',
      description: newWork.description || '',
      author: newWork.author || '',
      school: newWork.school || '',
      year: String(newWork.year || new Date().getFullYear()),
      status: newWork.status || 'published',
      tags: newWork.tags || [],
      images: newWork.images || [],
      modelUrl: newWork.modelUrl || '',
      audioUrl: newWork.audioUrl || '',
      certificateUrl: newWork.certificateUrl || ''
    }
  }
}, { immediate: true })

// 方法
const handleClose = () => {
  dialogVisible.value = false
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

const handleSubmit = async () => {
  if (!formRef.value || !props.work) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        // 准备提交数据
        const submitData = {
          ...form.value,
          year: parseInt(form.value.year)
        }
        
        // 调用更新API
        await museumApi.updateWork(props.work._id, submitData)
        ElMessage.success('作品更新成功')
        emit('success')
        handleClose()
      } catch (error) {
        console.error('更新作品失败:', error)
        ElMessage.error('更新作品失败')
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

.file-manager {
  width: 100%;
}

.current-files {
  margin-bottom: 10px;
}

.file-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.file-item {
  position: relative;
  width: 100px;
  height: 100px;
}

.file-preview {
  width: 100%;
  height: 100%;
  border-radius: 4px;
  border: 1px solid #dcdfe6;
}

.remove-btn {
  position: absolute;
  top: -8px;
  right: -8px;
  padding: 4px !important;
}

.current-file {
  margin-bottom: 10px;
}
</style>