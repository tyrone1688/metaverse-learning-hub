<template>
  <el-dialog
    v-model="dialogVisible"
    title="创建新作品"
    width="900px"
    :before-close="handleClose"
    :close-on-click-modal="false"
    destroy-on-close
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      class="create-form"
    >
      <!-- 基本信息 -->
      <div class="form-section">
        <h4 class="section-title">基本信息</h4>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="作品标题" prop="title">
              <el-input v-model="formData.title" placeholder="请输入作品标题" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="作品分类" prop="category">
              <el-input v-model="formData.category" placeholder="如：人工智能、机器人等" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="作者" prop="author">
              <el-input v-model="formData.author" placeholder="请输入作者姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="学校" prop="school">
              <el-input v-model="formData.school" placeholder="请输入学校名称" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="获奖年份" prop="year">
              <el-date-picker
                v-model="formData.year"
                type="year"
                placeholder="选择年份"
                value-format="YYYY"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-select v-model="formData.status" placeholder="选择状态" style="width: 100%">
                <el-option label="草稿" value="draft" />
                <el-option label="已发布" value="published" />
                <el-option label="已归档" value="archived" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="作品描述" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="3"
            placeholder="请输入作品描述"
          />
        </el-form-item>

        <el-form-item label="标签">
          <div class="tags-container">
            <el-tag
              v-for="tag in formData.tags"
              :key="tag"
              closable
              @close="removeTag(tag)"
              class="tag-item"
            >
              {{ tag }}
            </el-tag>
            <el-input
              v-if="inputVisible"
              ref="InputRef"
              v-model="inputValue"
              size="small"
              class="tag-input"
              @keyup.enter="handleInputConfirm"
              @blur="handleInputConfirm"
            />
            <el-button v-else size="small" @click="showInput" class="new-tag-btn">
              <el-icon><Plus /></el-icon>
              添加标签
            </el-button>
          </div>
        </el-form-item>
      </div>

      <!-- 文件上传区域 -->
      <div class="form-section">
        <h4 class="section-title">文件上传</h4>
        
        <!-- 作品图片 -->
        <el-form-item label="作品图片">
          <div class="upload-section">
            <el-upload
              v-model:file-list="imageFileList"
              action="#"
              list-type="picture-card"
              :auto-upload="false"
              :on-preview="handlePictureCardPreview"
              :on-remove="handleImageRemove"
              :before-upload="beforeImageUpload"
              multiple
              accept="image/*"
            >
              <el-icon><Plus /></el-icon>
            </el-upload>
            <div class="upload-tip">
              支持 JPG、PNG、GIF 格式，单个文件不超过 10MB
            </div>
          </div>
        </el-form-item>

        <!-- 讲解音频 -->
        <el-form-item label="讲解音频">
          <div class="upload-section">
            <el-upload
              v-model:file-list="audioFileList"
              action="#"
              :auto-upload="false"
              :before-upload="beforeAudioUpload"
              :on-remove="handleAudioRemove"
              accept="audio/*"
              class="audio-upload"
            >
              <el-button size="small" type="primary">
                <el-icon><Upload /></el-icon>
                选择音频文件
              </el-button>
            </el-upload>
            <div class="upload-tip">
              支持 MP3、WAV 格式，不超过 50MB
            </div>
          </div>
        </el-form-item>

        <!-- 获奖证书 -->
        <el-form-item label="获奖证书">
          <div class="upload-section">
            <el-upload
              v-model:file-list="certificateFileList"
              action="#"
              :auto-upload="false"
              :before-upload="beforeCertificateUpload"
              :on-remove="handleCertificateRemove"
              accept=".pdf,.jpg,.jpeg,.png"
              class="certificate-upload"
            >
              <el-button size="small" type="primary">
                <el-icon><Document /></el-icon>
                选择证书文件
              </el-button>
            </el-upload>
            <div class="upload-tip">
              支持 PDF、JPG、PNG 格式，不超过 20MB
            </div>
          </div>
        </el-form-item>

        <!-- 3D模型 -->
        <el-form-item label="3D模型">
          <div class="upload-section">
            <el-upload
              v-model:file-list="modelFileList"
              action="#"
              :auto-upload="false"
              :before-upload="beforeModelUpload"
              :on-remove="handleModelRemove"
              accept=".obj,.fbx,.gltf,.glb"
              class="model-upload"
            >
              <el-button size="small" type="primary">
                <el-icon><Box /></el-icon>
                选择3D模型
              </el-button>
            </el-upload>
            <div class="upload-tip">
              支持 OBJ、FBX、GLTF、GLB 格式，不超过 100MB
            </div>
          </div>
        </el-form-item>
      </div>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">
          <el-icon><Check /></el-icon>
          创建作品
        </el-button>
      </div>
    </template>

    <!-- 图片预览对话框 -->
    <el-dialog v-model="previewVisible" title="图片预览" width="800px">
      <img w-full :src="previewImageUrl" alt="Preview Image" style="width: 100%" />
    </el-dialog>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, nextTick, watch } from 'vue'
import { ElMessage, type FormInstance, type UploadProps, type UploadUserFile } from 'element-plus'
import { Plus, Upload, Document, Box, Check } from '@element-plus/icons-vue'
import { museumApi } from '@/services/museum'

// Props & Emits
interface Props {
  visible: boolean
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'success'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 响应式数据
const dialogVisible = ref(false)
const submitting = ref(false)
const formRef = ref<FormInstance>()
const InputRef = ref()

const formData = reactive({
  title: '',
  description: '',
  category: '',
  year: 2024,
  author: '',
  school: '',
  tags: [] as string[],
  status: 'draft'
})

const formRules = {
  title: [{ required: true, message: '请输入作品标题', trigger: 'blur' }],
  description: [{ required: true, message: '请输入作品描述', trigger: 'blur' }],
  category: [{ required: true, message: '请输入作品分类', trigger: 'blur' }],
  author: [{ required: true, message: '请输入作者姓名', trigger: 'blur' }],
  school: [{ required: true, message: '请输入学校名称', trigger: 'blur' }],
  year: [{ required: true, message: '请选择获奖年份', trigger: 'change' }],
}

// 文件上传相关
const imageFileList = ref<UploadUserFile[]>([])
const audioFileList = ref<UploadUserFile[]>([])
const certificateFileList = ref<UploadUserFile[]>([])
const modelFileList = ref<UploadUserFile[]>([])

// 图片预览
const previewVisible = ref(false)
const previewImageUrl = ref('')

// 标签输入
const inputVisible = ref(false)
const inputValue = ref('')

// 监听 props 变化
watch(() => props.visible, (val) => {
  dialogVisible.value = val
})

watch(dialogVisible, (val) => {
  emit('update:visible', val)
  if (!val) {
    resetForm()
  }
})

// 方法
const resetForm = () => {
  Object.assign(formData, {
    title: '',
    description: '',
    category: '',
    year: 2024,
    author: '',
    school: '',
    tags: [],
    status: 'draft'
  })
  imageFileList.value = []
  audioFileList.value = []
  certificateFileList.value = []
  modelFileList.value = []
  formRef.value?.resetFields()
}

const handleClose = () => {
  dialogVisible.value = false
}

// 标签相关方法
const removeTag = (tag: string) => {
  formData.tags.splice(formData.tags.indexOf(tag), 1)
}

const showInput = () => {
  inputVisible.value = true
  nextTick(() => {
    InputRef.value?.focus()
  })
}

const handleInputConfirm = () => {
  if (inputValue.value && !formData.tags.includes(inputValue.value)) {
    formData.tags.push(inputValue.value)
  }
  inputVisible.value = false
  inputValue.value = ''
}

// 图片上传相关
const handlePictureCardPreview: UploadProps['onPreview'] = (uploadFile) => {
  previewImageUrl.value = uploadFile.url!
  previewVisible.value = true
}

const handleImageRemove = () => {
  // 图片移除处理
}

const beforeImageUpload: UploadProps['beforeUpload'] = (rawFile) => {
  const isImage = rawFile.type.startsWith('image/')
  const isLt10M = rawFile.size / 1024 / 1024 < 10

  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
    return false
  }
  if (!isLt10M) {
    ElMessage.error('图片大小不能超过 10MB!')
    return false
  }
  return true
}

// 音频上传相关
const beforeAudioUpload: UploadProps['beforeUpload'] = (rawFile) => {
  const isAudio = rawFile.type.startsWith('audio/')
  const isLt50M = rawFile.size / 1024 / 1024 < 50

  if (!isAudio) {
    ElMessage.error('只能上传音频文件!')
    return false
  }
  if (!isLt50M) {
    ElMessage.error('音频文件不能超过 50MB!')
    return false
  }
  return true
}

const handleAudioRemove = () => {
  audioFileList.value = []
}

// 证书上传相关
const beforeCertificateUpload: UploadProps['beforeUpload'] = (rawFile) => {
  const validTypes = ['application/pdf', 'image/jpeg', 'image/png']
  const isValidType = validTypes.includes(rawFile.type)
  const isLt20M = rawFile.size / 1024 / 1024 < 20

  if (!isValidType) {
    ElMessage.error('只能上传 PDF、JPG、PNG 格式文件!')
    return false
  }
  if (!isLt20M) {
    ElMessage.error('文件大小不能超过 20MB!')
    return false
  }
  return true
}

const handleCertificateRemove = () => {
  certificateFileList.value = []
}

// 3D模型上传相关
const beforeModelUpload: UploadProps['beforeUpload'] = (rawFile) => {
  const validExtensions = /\.(obj|fbx|gltf|glb)$/i
  const isValidType = validExtensions.test(rawFile.name)
  const isLt100M = rawFile.size / 1024 / 1024 < 100

  if (!isValidType) {
    ElMessage.error('只能上传 OBJ、FBX、GLTF、GLB 格式文件!')
    return false
  }
  if (!isLt100M) {
    ElMessage.error('模型文件不能超过 100MB!')
    return false
  }
  return true
}

const handleModelRemove = () => {
  modelFileList.value = []
}

// 提交表单
const handleSubmit = async () => {
  console.log('=== 开始提交表单 ===')
  console.log('表单数据:', formData)

  if (!formRef.value) return

  const isValid = await formRef.value.validate().catch(() => false)
  if (!isValid) {
    console.log('表单验证失败')
    return
  }

  console.log('表单验证通过')
  submitting.value = true

  try {
    const formDataToSubmit = new FormData()
    
    // 添加基本信息 - 确保数据类型正确
    formDataToSubmit.append('title', formData.title)
    formDataToSubmit.append('description', formData.description)
    formDataToSubmit.append('category', formData.category)
    formDataToSubmit.append('author', formData.author)
    formDataToSubmit.append('school', formData.school)
    formDataToSubmit.append('year', String(formData.year))
    formDataToSubmit.append('status', formData.status)
    
    // 处理标签数组
    if (formData.tags && formData.tags.length > 0) {
      formData.tags.forEach(tag => {
        formDataToSubmit.append('tags', tag)
      })
    } else {
      formDataToSubmit.append('tags', '')
    }

    console.log('基本信息已添加到FormData')

    // 添加文件
    let fileCount = 0
    
    imageFileList.value.forEach((file, index) => {
      if (file.raw) {
        formDataToSubmit.append('files', file.raw)
        console.log(`添加图片文件 ${index}:`, file.name)
        fileCount++
      }
    })

    audioFileList.value.forEach((file, index) => {
      if (file.raw) {
        formDataToSubmit.append('files', file.raw)
        console.log(`添加音频文件 ${index}:`, file.name)
        fileCount++
      }
    })

    certificateFileList.value.forEach((file, index) => {
      if (file.raw) {
        formDataToSubmit.append('files', file.raw)
        console.log(`添加证书文件 ${index}:`, file.name)
        fileCount++
      }
    })

    modelFileList.value.forEach((file, index) => {
      if (file.raw) {
        formDataToSubmit.append('files', file.raw)
        console.log(`添加模型文件 ${index}:`, file.name)
        fileCount++
      }
    })

    console.log(`总共添加了 ${fileCount} 个文件`)

    console.log('准备发送请求...')
    await museumApi.createWork(formDataToSubmit)
    
    console.log('请求成功')
    emit('success')
    ElMessage.success('作品创建成功!')
  } catch (error) {
    console.error('创建作品失败:', error)
    if (error.response?.data?.message) {
      ElMessage.error(`创建失败: ${error.response.data.message}`)
    } else {
      ElMessage.error('创建作品失败')
    }
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.create-form {
  max-height: 70vh;
  overflow-y: auto;
  padding-right: 10px;
}

.form-section {
  margin-bottom: 30px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.section-title {
  margin: 0 0 20px 0;
  padding-bottom: 10px;
  border-bottom: 2px solid #409eff;
  color: #2c3e50;
  font-size: 16px;
  font-weight: 600;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.tag-item {
  margin: 0;
}

.tag-input {
  width: 100px;
}

.new-tag-btn {
  border-style: dashed;
}

.upload-section {
  width: 100%;
}

.upload-tip {
  color: #909399;
  font-size: 12px;
  margin-top: 8px;
  line-height: 1.4;
}

.audio-upload,
.certificate-upload,
.model-upload {
  margin-bottom: 8px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.create-form::-webkit-scrollbar {
  width: 6px;
}

.create-form::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.create-form::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.create-form::-webkit-scrollbar-thumb:hover {
  background: #a1a1a1;
}
</style>