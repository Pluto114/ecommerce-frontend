<template>
  <el-card>
    <template #header>
      <div class="card-header">
        <span>商品管理 (商家版)</span>
        <el-button type="primary" @click="openDialog('add')">发布新商品</el-button>
      </div>
    </template>

    <el-table :data="tableData" v-loading="loading" stripe style="width: 100%">
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
      <el-table-column prop="price" label="价格">
        <template #default="scope">¥{{ scope.row.price }}</template>
      </el-table-column>
      <el-table-column prop="stock" label="库存" />
      
      <el-table-column label="3D预览" width="80" align="center">
        <template #default="scope">
          <el-tag v-if="scope.row.modelUrl" type="success" effect="dark">
             已启用
          </el-tag>
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
          <el-button link type="danger" @click="handleDelete(scope.row)">下架</el-button>
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
        
        <el-form-item label="价格">
          <el-input-number v-model="form.price" :min="0" :precision="2" />
        </el-form-item>
        
        <el-form-item label="库存">
          <el-input-number v-model="form.stock" :min="0" :step="1" />
        </el-form-item>

        <el-form-item label="图片URL">
          <el-input v-model="form.mainImageUrl" placeholder="输入图片直链 (Mock阶段)" />
          <div class="tip">测试图: https://via.placeholder.com/150</div>
        </el-form-item>

        <el-form-item label="3D模型">
          <el-upload
            class="upload-demo"
            action="#"
            :auto-upload="false"
            :limit="1"
            :on-change="handleFileChange"
            :show-file-list="false"
          >
            <el-button type="warning" plain>点击上传 .glb / .gltf 文件</el-button>
            <template #tip>
              <div class="el-upload__tip">
                (期末演示黑科技：上传任意文件，系统将自动挂载测试用3D鞋模型)
              </div>
            </template>
          </el-upload>
          
          <div v-if="form.modelUrl" style="margin-top: 10px; color: #67C23A;">
             ✅ 模型已挂载: {{ form.modelUrl }}
          </div>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSave">确定发布</el-button>
        </span>
      </template>
    </el-dialog>
  </el-card>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import type { Product } from '@/types' // 记得我们在 Phase 1 定义了这个

const loading = ref(false)
const tableData = ref<Product[]>([])
const dialogVisible = ref(false)
const dialogType = ref<'add' | 'edit'>('add')

// 表单数据
const form = reactive<Partial<Product>>({
  name: '',
  price: 0,
  stock: 100,
  mainImageUrl: '',
  modelUrl: ''
})

// 初始化/获取数据
const fetchData = async () => {
  loading.value = true
  // --- Mock Data (模拟后端返回) ---
  setTimeout(() => {
    tableData.value = [
      {
        id: 101,
        shopId: 1,
        name: 'Nike Air Zoom (3D版)',
        price: 899,
        stock: 50,
        mainImageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=200',
        status: 1,
        createTime: '2025-12-25',
        // 这里直接放入一个真实的 glb 地址，方便等会儿测试
        modelUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/MaterialsVariantsShoe/glTF-Binary/MaterialsVariantsShoe.glb'
      },
      {
        id: 102,
        shopId: 1,
        name: '普通帆布鞋',
        price: 199,
        stock: 200,
        mainImageUrl: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?q=80&w=200',
        status: 1,
        createTime: '2025-12-26',
        modelUrl: '' // 没有3D模型
      }
    ]
    loading.value = false
  }, 500)
}

// 打开弹窗
const openDialog = (type: 'add' | 'edit', row?: Product) => {
  dialogType.value = type
  dialogVisible.value = true
  if (type === 'edit' && row) {
    Object.assign(form, row)
  } else {
    // 重置表单
    form.name = ''
    form.price = 0
    form.mainImageUrl = 'https://via.placeholder.com/150'
    form.modelUrl = ''
  }
}

// 模拟文件上传：不管你传什么，我都给你一个能用的3D模型链接
const handleFileChange = (uploadFile: any) => {
  ElMessage.success(`文件 ${uploadFile.name} 读取成功！(Mock模式)`)
  // 强行赋值一个网络地址，为了让 Three.js 有东西可加载
  form.modelUrl = 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/MaterialsVariantsShoe/glTF-Binary/MaterialsVariantsShoe.glb'
}

// 保存逻辑
const handleSave = () => {
  if (dialogType.value === 'add') {
    tableData.value.push({
      id: Math.floor(Math.random() * 1000),
      shopId: 1,
      name: form.name!,
      price: form.price!,
      stock: form.stock!,
      mainImageUrl: form.mainImageUrl,
      status: 1,
      createTime: new Date().toISOString().split('T')[0],
      modelUrl: form.modelUrl // 存入关键的3D数据
    } as Product)
  } else {
    // 编辑逻辑简单mock一下
    const index = tableData.value.findIndex(p => p.id === form.id)
    if(index !== -1) Object.assign(tableData.value[index], form)
  }
  dialogVisible.value = false
  ElMessage.success('操作成功')
}

const handleDelete = (row: Product) => {
    row.status = 0
    ElMessage.warning('已下架')
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.tip {
  font-size: 12px;
  color: #999;
}
</style>