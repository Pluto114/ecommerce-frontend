<template>
  <el-card>
    <template #header>
      <div class="card-header">
        <span>轮播图管理 (首页)</span>
        <el-button type="primary" @click="openDialog('add')">
          <el-icon><Plus /></el-icon> 发布新轮播图
        </el-button>
      </div>
    </template>

    <el-table :data="tableData" v-loading="loading" stripe style="width: 100%">
      <el-table-column prop="id" label="ID" width="80" />
      
      <el-table-column label="预览图" width="200">
        <template #default="scope">
          <el-image 
            style="width: 160px; height: 80px; border-radius: 4px"
            :src="scope.row.imgUrl" 
            fit="cover"
            preview-teleported
          />
        </template>
      </el-table-column>

      <el-table-column prop="sort" label="排序值" width="100" align="center">
        <template #default="scope">
          <el-tag type="info">{{ scope.row.sort }}</el-tag>
        </template>
      </el-table-column>

      <el-table-column label="状态" width="100">
        <template #default="scope">
          <el-tag :type="scope.row.status === 1 ? 'success' : 'danger'">
            {{ scope.row.status === 1 ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      
      <el-table-column label="操作">
        <template #default="scope">
          <el-button link type="primary" @click="openDialog('edit', scope.row)">编辑</el-button>
          <el-button link type="danger" @click="handleDelete(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'add' ? '发布轮播图' : '编辑轮播图'"
      width="500px"
    >
      <el-form :model="form" label-width="100px">
        
        <el-form-item label="轮播图片">
          <el-upload
            class="banner-uploader"
            action="#" 
            :http-request="uploadImage"
            :show-file-list="false"
            accept=".jpg,.jpeg,.png"
            :before-upload="beforeImageUpload"
          >
            <img v-if="form.imgUrl" :src="form.imgUrl" class="banner-preview" />
            <el-icon v-else class="uploader-icon"><Plus /></el-icon>
          </el-upload>
          <div class="tip">建议尺寸: 1920x600, 支持JPG/PNG</div>
        </el-form-item>

        <el-form-item label="排序值">
          <el-input-number v-model="form.sort" :min="0" :step="1" />
          <div class="tip">数字越小越靠前</div>
        </el-form-item>

        <el-form-item label="状态">
          <el-switch
            v-model="form.status"
            :active-value="1"
            :inactive-value="0"
            active-text="启用"
            inactive-text="禁用"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSave" :loading="submitting">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </el-card>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { UploadRequestOptions, UploadProps } from 'element-plus'
import { Plus } from '@element-plus/icons-vue' 
import request from '@/utils/request'

// 接口定义
interface Banner {
  id: number
  imgUrl: string
  sort: number
  status: number
}

const loading = ref(false)
const submitting = ref(false)
const tableData = ref<Banner[]>([])
const dialogVisible = ref(false)
const dialogType = ref<'add' | 'edit'>('add')

const form = reactive({
  id: undefined as number | undefined,
  imgUrl: '',
  sort: 0,
  status: 1
})

// 1. 获取轮播图列表 (超管接口)
const fetchList = async () => {
  loading.value = true
  try {
    // 对应文档 3) 超管轮播图列表
    const res = await request.get<any, Banner[]>('/home/banner/list')
    tableData.value = res || []
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 2. 图片上传 (复用之前的通用接口)
const uploadImage = async (options: UploadRequestOptions) => {
  try {
    const formData = new FormData()
    formData.append('file', options.file)
    const url = await request.post<any, string>('/common/upload', formData)
    form.imgUrl = url
    ElMessage.success('上传成功')
  } catch (error) {
    ElMessage.error('上传失败')
  }
}
const beforeImageUpload: UploadProps['beforeUpload'] = (rawFile) => {
  if (rawFile.size / 1024 / 1024 > 5) {
    ElMessage.error('图片不能超过 5MB!')
    return false
  }
  return true
}

// 3. 打开弹窗
const openDialog = (type: 'add' | 'edit', row?: Banner) => {
  dialogType.value = type
  dialogVisible.value = true
  if (type === 'edit' && row) {
    form.id = row.id
    form.imgUrl = row.imgUrl
    form.sort = row.sort
    form.status = row.status
  } else {
    // 重置
    form.id = undefined
    form.imgUrl = ''
    form.sort = 0
    form.status = 1
  }
}

// 4. 保存 (新增或修改)
const handleSave = async () => {
  if (!form.imgUrl) return ElMessage.warning('请上传图片')
  
  submitting.value = true
  try {
    if (dialogType.value === 'add') {
      // 对应文档 2) 发布轮播图
      await request.post('/home/banner/add', {
        imgUrl: form.imgUrl,
        sort: form.sort,
        status: form.status
      })
      ElMessage.success('发布成功')
    } else {
      // 对应文档 4) 修改轮播图
      await request.put('/home/banner/update', {
        id: form.id,
        imgUrl: form.imgUrl,
        sort: form.sort,
        status: form.status
      })
      ElMessage.success('更新成功')
    }
    dialogVisible.value = false
    fetchList()
  } catch (error) {
    console.error(error)
  } finally {
    submitting.value = false
  }
}

// 5. 删除
const handleDelete = (row: Banner) => {
  ElMessageBox.confirm('确定要删除这张轮播图吗?', '提示', { type: 'warning' })
    .then(async () => {
      // 对应文档 5) 删除轮播图
      await request.delete(`/home/banner/${row.id}`)
      ElMessage.success('已删除')
      fetchList()
    })
}

onMounted(() => {
  fetchList()
})
</script>

<style scoped>
.card-header { display: flex; justify-content: space-between; align-items: center; }
.tip { font-size: 12px; color: #999; margin-top: 5px; }

/* 上传样式 */
.banner-uploader {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  width: 240px; /* 宽一点适合轮播图预览 */
  height: 120px;
  display: flex;
  justify-content: center;
  align-items: center;
}
.banner-uploader:hover { border-color: #409eff; }
.uploader-icon { font-size: 28px; color: #8c939d; }
.banner-preview { width: 100%; height: 100%; object-fit: cover; }
</style>