<template>
  <el-card>
    <template #header>
      <div class="card-header">
        <span>商品管理 (商家版)</span>

        <div class="header-right">
          <el-select
            v-model="currentShopId"
            placeholder="请选择店铺"
            class="shop-select"
            :disabled="shopList.length === 0"
            @change="handleShopChange"
          >
            <el-option
              v-for="s in shopList"
              :key="s.id"
              :label="`${s.name} (ID:${s.id})`"
              :value="s.id"
            />
          </el-select>

          <el-input
            v-model="searchKeyword"
            placeholder="搜索商品名称..."
            class="search-input"
            clearable
            @clear="handleSearch"
            @keyup.enter="handleSearch"
          >
            <template #append>
              <el-button :icon="Search" @click="handleSearch" />
            </template>
          </el-input>

          <el-button type="primary" :disabled="!currentShopId" @click="openDialog('add')">
            {{ currentShopId ? '发布新商品' : '请先创建店铺' }}
          </el-button>
        </div>
      </div>
    </template>

    <el-empty v-if="shopList.length === 0" description="暂无店铺，请先创建店铺">
      <el-button type="primary" @click="goShopPage">去创建店铺</el-button>
    </el-empty>

    <el-table
      v-else
      :data="tableData"
      v-loading="loading"
      stripe
      style="width: 100%"
      empty-text="当前店铺暂无商品"
    >
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column label="商品图" width="100">
        <template #default="scope">
          <el-image
            style="width: 60px; height: 60px; border-radius: 4px"
            :src="scope.row.mainImageUrl"
            fit="cover"
            preview-teleported
          />
        </template>
      </el-table-column>

      <el-table-column prop="name" label="商品名称" />

      <el-table-column label="分类" width="120">
        <template #default="scope">
          <el-tag v-if="scope.row.categoryName" type="warning" effect="plain">
            {{ scope.row.categoryName }}
          </el-tag>
          <span v-else style="color:#ccc">未分类</span>
        </template>
      </el-table-column>

      <el-table-column prop="price" label="价格">
        <template #default="scope">¥{{ scope.row.price }}</template>
      </el-table-column>

      <el-table-column prop="stock" label="库存" />

      <el-table-column label="3D预览" width="90" align="center">
        <template #default="scope">
          <el-tag v-if="scope.row.modelUrl" type="success" effect="dark">已启用</el-tag>
          <span v-else style="color:#ddd">无</span>
        </template>
      </el-table-column>

      <el-table-column prop="status" label="状态" width="100">
        <template #default="scope">
          <el-tag :type="scope.row.status === 1 ? 'success' : 'info'">
            {{ scope.row.status === 1 ? '在售' : '下架' }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column label="操作" width="150">
        <template #default="scope">
          <el-button link type="primary" @click="openDialog('edit', scope.row)">编辑</el-button>
          <el-button link type="danger" @click="handleDelete(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'add' ? '发布新商品' : '编辑商品'"
      width="600px"
    >
      <el-form :model="form" label-width="100px">
        <el-form-item label="商品名称">
          <el-input v-model="form.name" placeholder="请输入商品名称" />
        </el-form-item>

        <el-form-item label="商品分类">
          <el-select v-model="form.categoryId" placeholder="请选择商品所属分类" style="width: 100%">
            <el-option
              v-for="item in categoryList"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="价格">
          <el-input-number v-model="form.price" :min="0" :precision="2" />
        </el-form-item>

        <el-form-item label="库存">
          <el-input-number v-model="form.stock" :min="0" :step="1" />
        </el-form-item>

        <el-form-item label="商品图片">
          <el-upload
            class="avatar-uploader"
            action="#"
            :http-request="uploadImage"
            :show-file-list="false"
            accept=".jpg,.jpeg,.png"
            :before-upload="beforeImageUpload"
          >
            <img v-if="form.mainImageUrl" :src="form.mainImageUrl" class="avatar" />
            <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
          </el-upload>
          <div class="tip">支持 JPG/PNG，不超过 5MB</div>
        </el-form-item>

        <el-form-item label="3D模型">
          <el-upload
            class="model-uploader"
            action="#"
            :http-request="uploadModel"
            :show-file-list="false"
            accept=".glb"
            :before-upload="beforeModelUpload"
          >
            <el-button type="warning" plain :loading="uploadingModel">
              {{ form.modelUrl ? '更换模型' : '点击上传 .glb 文件' }}
            </el-button>
            <div v-if="form.modelUrl" class="file-success">
              <el-icon><Check /></el-icon> 模型已上传: ...{{ form.modelUrl.slice(-15) }}
            </div>
          </el-upload>
          <div class="tip">请上传 .glb 格式，不超过 100MB</div>
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSave" :loading="submitting">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </el-card>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, onBeforeUnmount } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { UploadRequestOptions, UploadProps } from 'element-plus'
import { Plus, Check, Search } from '@element-plus/icons-vue'
import request from '@/utils/request'
import type { Product, Shop } from '@/types'
import { useRouter } from 'vue-router'

interface Category {
  id: number
  name: string
}

const router = useRouter()
const SHOP_ID_KEY = 'merchant_current_shop_id'

const searchKeyword = ref('')
const loading = ref(false)
const submitting = ref(false)
const uploadingModel = ref(false)
const tableData = ref<Product[]>([])
const categoryList = ref<Category[]>([])
const dialogVisible = ref(false)
const dialogType = ref<'add' | 'edit'>('add')

const shopList = ref<Shop[]>([])
const currentShopId = ref<number | null>(null)

const form = reactive<Partial<Product> & { categoryId?: number }>({
  id: undefined,
  name: '',
  price: 0,
  stock: 100,
  mainImageUrl: '',
  modelUrl: '',
  categoryId: undefined
})

const readStoredShopId = (): number | null => {
  const v = localStorage.getItem(SHOP_ID_KEY)
  if (!v) return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}
const writeStoredShopId = (id: number | null) => {
  if (id == null) localStorage.removeItem(SHOP_ID_KEY)
  else localStorage.setItem(SHOP_ID_KEY, String(id))
}

const goShopPage = () => {
  router.push('/merchant/shop') // 你项目里“我的商店”路由如果不是这个，改成你的真实路径
}

const fetchShops = async () => {
  try {
    const res = await request.get<any, Shop[]>('/shop/my-list')
    shopList.value = res || []

    if (shopList.value.length === 0) {
      currentShopId.value = null
      writeStoredShopId(null)
      tableData.value = []
      return
    }

    const stored = readStoredShopId()
    const found = stored ? shopList.value.find(s => s.id === stored) : undefined
    const id = found ? found.id : shopList.value[0].id

    currentShopId.value = id
    writeStoredShopId(id)
  } catch (e) {
    console.error(e)
  }
}

const handleShopChange = async (id: number) => {
  currentShopId.value = id
  writeStoredShopId(id)
  await fetchProducts()
}

const fetchCategories = async () => {
  try {
    const res = await request.get<any, Category[]>('/category/public/list')
    categoryList.value = res || []
  } catch (error) {
    console.error('获取分类失败', error)
  }
}

const fetchProducts = async () => {
  if (!currentShopId.value) {
    tableData.value = []
    return
  }

  loading.value = true
  try {
    const params: any = {}
    if (searchKeyword.value) params.name = searchKeyword.value

    // ✅ 后端从 X-Shop-Id 取店铺，request.ts 会自动注入 header
    const res = await request.get<any, Product[]>('/product/my-list', { params })
    tableData.value = res || []
  } catch (error) {
    console.error(error)
    ElMessage.error('获取商品列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  fetchProducts()
}

const openDialog = (type: 'add' | 'edit', row?: Product) => {
  if (!currentShopId.value) {
    ElMessage.warning('请先选择/创建店铺')
    return
  }

  dialogType.value = type
  dialogVisible.value = true
  if (type === 'edit' && row) {
    Object.assign(form, row)
  } else {
    form.id = undefined
    form.name = ''
    form.price = 0
    form.stock = 100
    form.mainImageUrl = ''
    form.modelUrl = ''
    form.categoryId = undefined
  }
}

const handleSave = async () => {
  if (!currentShopId.value) return ElMessage.warning('请先选择/创建店铺')
  if (!form.mainImageUrl) return ElMessage.warning('请上传商品图片')
  if (!form.categoryId) return ElMessage.warning('请选择商品分类')

  submitting.value = true
  try {
    const payload = {
      name: form.name,
      price: form.price,
      stock: form.stock,
      mainImageUrl: form.mainImageUrl,
      modelUrl: form.modelUrl,
      categoryId: form.categoryId
    }

    if (dialogType.value === 'add') {
      // ✅ 不再传 shopId，后端从 X-Shop-Id 取
      await request.post('/product/add', { ...payload, status: 1 })
      ElMessage.success('发布成功')
    } else {
      await request.put('/product/update', { ...payload, id: form.id })
      ElMessage.success('更新成功')
    }

    dialogVisible.value = false
    fetchProducts()
  } catch (error) {
    console.error(error)
    ElMessage.error('保存失败')
  } finally {
    submitting.value = false
  }
}

const handleDelete = (row: Product) => {
  ElMessageBox.confirm('确定要永久删除该商品吗?', '警告', { type: 'warning' })
    .then(async () => {
      await request.delete(`/product/${row.id}`)
      ElMessage.success('已删除')
      fetchProducts()
    })
}

const uploadImage = async (options: UploadRequestOptions) => {
  try {
    const formData = new FormData()
    formData.append('file', options.file)
    const url = await request.post<any, string>('/common/upload', formData, { timeout: 60000 })
    form.mainImageUrl = url
    ElMessage.success('图片上传成功')
  } catch (error) {
    ElMessage.error('图片上传失败')
  }
}

const beforeImageUpload: UploadProps['beforeUpload'] = (rawFile) => {
  if (rawFile.type !== 'image/jpeg' && rawFile.type !== 'image/png') {
    ElMessage.error('图片必须是 JPG 或 PNG 格式!')
    return false
  }
  if (rawFile.size / 1024 / 1024 > 5) {
    ElMessage.error('图片大小不能超过 5MB!')
    return false
  }
  return true
}

const uploadModel = async (options: UploadRequestOptions) => {
  uploadingModel.value = true
  try {
    const formData = new FormData()
    formData.append('file', options.file)
    const url = await request.post<any, string>('/common/upload', formData, { timeout: 600000 })
    form.modelUrl = url
    ElMessage.success('3D模型上传成功')
  } catch (error) {
    ElMessage.error('模型上传失败')
  } finally {
    uploadingModel.value = false
  }
}

const beforeModelUpload: UploadProps['beforeUpload'] = (rawFile) => {
  const isGLB = rawFile.name.endsWith('.glb')
  if (!isGLB) {
    ElMessage.error('请上传 .glb 格式的模型文件!')
    return false
  }
  if (rawFile.size / 1024 / 1024 > 100) {
    ElMessage.error('模型大小不能超过 100MB!')
    return false
  }
  return true
}

// ✅ 监听 ShopManage 切换/创建后触发的事件
const onShopChanged = (e: any) => {
  const shopId = e?.detail?.shopId as number | null
  currentShopId.value = shopId
  if (shopId) writeStoredShopId(shopId)
  fetchProducts()
}

onMounted(async () => {
  await fetchShops()
  await fetchCategories()
  await fetchProducts()
  window.addEventListener('shop-changed', onShopChanged)
})

onBeforeUnmount(() => {
  window.removeEventListener('shop-changed', onShopChanged)
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.header-right {
  display: flex;
  gap: 10px;
  align-items: center;
}
.search-input {
  width: 250px;
}
.shop-select {
  width: 240px;
}
.tip {
  font-size: 12px;
  color: #999;
  margin-top: 5px;
  line-height: 1.4;
}
.avatar-uploader {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  width: 100px;
  height: 100px;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: border-color 0.3s;
}
.avatar-uploader:hover {
  border-color: #409eff;
}
.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
}
.avatar {
  width: 100px;
  height: 100px;
  display: block;
  object-fit: cover;
}
.model-uploader {
  display: flex;
  flex-direction: column;
}
.file-success {
  margin-top: 5px;
  font-size: 12px;
  color: #67c23a;
  display: flex;
  align-items: center;
  gap: 5px;
}
</style>
