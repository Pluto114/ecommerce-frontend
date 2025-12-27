<template>
  <el-card class="shop-card">
    <template #header>
      <div class="card-header">
        <span>我的店铺信息</span>
        <el-tag type="warning" effect="dark">商家版</el-tag>
      </div>
    </template>

    <div v-loading="loading" class="content">
      <el-empty v-if="!shopInfo && !isEditing" description="您还没有创建店铺">
        <el-button type="primary" @click="isEditing = true">立即开店</el-button>
      </el-empty>

      <div v-if="shopInfo && !isEditing" class="shop-info">
        <div class="info-header">
          <el-avatar :size="100" :src="shopInfo.logoUrl" class="shop-logo">
             {{ shopInfo.name.charAt(0) }}
          </el-avatar>
          <div class="info-text">
            <h2>{{ shopInfo.name }}</h2>
            <p class="address"><el-icon><Location /></el-icon> {{ shopInfo.address }}</p>
            <div class="meta">
              <el-tag :type="shopInfo.status === 1 ? 'success' : 'info'">
                {{ shopInfo.status === 1 ? '营业中' : '休息中' }}
              </el-tag>
              <span class="id-text">Shop ID: {{ shopInfo.id }}</span>
            </div>
          </div>
        </div>
        
        <el-divider />
        
        <div class="actions">
          <el-button type="primary" :icon="Edit" @click="startEdit">编辑资料</el-button>
          <el-button type="danger" plain :icon="Delete" @click="handleCloseShop">申请关店</el-button>
        </div>
      </div>

      <div v-if="isEditing" class="edit-form-container">
        <h3>{{ shopInfo ? '编辑店铺资料' : '创建新店铺' }}</h3>
        <el-form :model="form" label-width="80px">
          <el-form-item label="店铺名称">
            <el-input v-model="form.name" placeholder="给你的店铺起个响亮的名字" />
          </el-form-item>
          
          <el-form-item label="店铺地址">
            <el-input v-model="form.address" placeholder="填写发货地址" />
          </el-form-item>
          
          <el-form-item label="Logo链接">
            <el-input v-model="form.logoUrl" placeholder="输入图片URL (Mock)" />
            <div class="preview" v-if="form.logoUrl">
              <img :src="form.logoUrl" class="logo-preview" />
            </div>
          </el-form-item>

          <el-form-item>
            <el-button type="primary" @click="handleSave" :loading="saving">保存提交</el-button>
            <el-button @click="cancelEdit">取消</el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Edit, Delete, Location } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { Shop } from '@/types'

const loading = ref(false)
const saving = ref(false)
const isEditing = ref(false)
const shopInfo = ref<Shop | null>(null)

// 表单数据
const form = reactive({
  name: '',
  address: '',
  logoUrl: ''
})

// 获取店铺信息
const fetchShop = () => {
  loading.value = true
  // Mock: 模拟后端返回
  setTimeout(() => {
    // 假设商家已经有一个店铺
    shopInfo.value = {
      id: 88,
      adminId: 2,
      name: "Jerry's 3D 旗舰店",
      address: "厦门市思明区前埔路",
      logoUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=200",
      status: 1
    }
    loading.value = false
  }, 500)
}

// 开始编辑
const startEdit = () => {
  if (shopInfo.value) {
    form.name = shopInfo.value.name
    form.address = shopInfo.value.address
    form.logoUrl = shopInfo.value.logoUrl || ''
  }
  isEditing.value = true
}

const cancelEdit = () => {
  isEditing.value = false
}

// 保存
const handleSave = () => {
  saving.value = true
  setTimeout(() => {
    // Mock Update
    shopInfo.value = {
      ...shopInfo.value!,
      name: form.name,
      address: form.address,
      logoUrl: form.logoUrl
    }
    saving.value = false
    isEditing.value = false
    ElMessage.success('店铺信息更新成功！')
  }, 800)
}

// 关店
const handleCloseShop = () => {
  ElMessageBox.confirm('确定要关闭店铺吗？商品将无法售卖。', '警告', {
    type: 'warning'
  }).then(() => {
    if (shopInfo.value) shopInfo.value.status = 0
    ElMessage.info('店铺已暂停营业')
  })
}

onMounted(() => {
  fetchShop()
})
</script>

<style scoped>
.shop-card {
  max-width: 800px;
  margin: 20px auto;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.shop-info {
  padding: 20px;
}
.info-header {
  display: flex;
  gap: 30px;
  align-items: center;
}
.info-text h2 { margin: 0 0 10px 0; font-size: 24px; }
.address { color: #666; margin-bottom: 10px; display: flex; align-items: center; gap: 5px;}
.meta { display: flex; gap: 15px; align-items: center; }
.id-text { font-size: 12px; color: #999; }

.actions { margin-top: 20px; display: flex; gap: 15px; }

.edit-form-container {
  max-width: 500px;
  margin: 0 auto;
}
.logo-preview {
  width: 100px; height: 100px; border-radius: 8px; margin-top: 10px; object-fit: cover;
}
</style>