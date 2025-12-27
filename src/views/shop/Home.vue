<template>
  <div class="shop-container">
    <div class="nav-header">
      <div class="logo">Jerry's Amazon</div>
      <div class="nav-right">
        <el-badge :value="cartCount" class="item">
            <el-button :icon="ShoppingCart" circle @click="router.push('/cart')" />
        </el-badge>
  
        <el-dropdown>
            <span class="el-dropdown-link username">
              Hi, {{ userStore.userInfo.username || 'Guest' }}
              <el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
            <el-dropdown-menu>
                <el-dropdown-item @click="router.push('/order/list')">我的订单</el-dropdown-item>
                <el-dropdown-item divided @click="handleLogout">退出登录</el-dropdown-item>
            </el-dropdown-menu>
            </template>
        </el-dropdown>
      </div>
    </div>

    <div class="product-grid">
      <el-card 
        v-for="item in productList" 
        :key="item.id" 
        class="product-card"
        :body-style="{ padding: '0px' }"
        shadow="hover"
        @click="goToDetail(item.id)"
      >
        <div class="image-wrapper">
          <img :src="item.mainImageUrl" class="image"/>
          <div v-if="item.modelUrl" class="badge-3d">3D VIEW</div>
        </div>
        <div style="padding: 14px">
          <span class="product-name">{{ item.name }}</span>
          <div class="bottom">
            <span class="price">¥ {{ item.price }}</span>
            <el-button type="primary" link class="button">查看详情</el-button>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
// --- 关键修正：必须引入这两个图标 ---
import { ShoppingCart, ArrowDown } from '@element-plus/icons-vue' 
import type { Product } from '@/types'

const router = useRouter()
const userStore = useUserStore()
const productList = ref<Product[]>([])
const cartCount = ref(2) // 这里的数字可以先写死，或者从 Store 获取

// 模拟获取商品列表
const fetchProducts = () => {
  productList.value = [
    {
      id: 101,
      shopId: 1,
      name: 'Nike Air Zoom (3D版)',
      price: 899,
      stock: 50,
      mainImageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff',
      status: 1,
      createTime: '2025-12-25',
      modelUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/MaterialsVariantsShoe/glTF-Binary/MaterialsVariantsShoe.glb'
    },
    {
      id: 102,
      shopId: 1,
      name: '普通帆布鞋',
      price: 199,
      stock: 200,
      mainImageUrl: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77',
      status: 1,
      createTime: '2025-12-26',
      modelUrl: ''
    }
  ]
}

const goToDetail = (id: number) => {
  router.push(`/product/${id}`)
}

const handleLogout = () => {
    userStore.logout()
    router.push('/login')
}

onMounted(() => {
  fetchProducts()
})
</script>

<style scoped>
.shop-container {
  background-color: #f5f7fa;
  min-height: 100vh;
}
.nav-header {
  height: 60px;
  background: white;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 50px;
  position: sticky;
  top: 0;
  z-index: 100;
}
.logo { font-size: 20px; font-weight: bold; color: #2c3e50; }
.nav-right { display: flex; align-items: center; gap: 20px; }

/* 修复下拉菜单鼠标样式 */
.el-dropdown-link {
  cursor: pointer;
  display: flex;
  align-items: center;
  color: #409eff;
}

.product-grid {
  max-width: 1200px;
  margin: 30px auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
  padding: 0 20px;
}

.product-card {
  cursor: pointer;
  transition: transform 0.3s;
}
.product-card:hover { transform: translateY(-5px); }

.image-wrapper {
  position: relative;
  height: 250px;
  overflow: hidden;
}
.image { width: 100%; height: 100%; object-fit: cover; }
.badge-3d {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(0,0,0,0.7);
  color: #00ff88;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: bold;
  font-size: 12px;
  border: 1px solid #00ff88;
}

.product-name { font-size: 16px; font-weight: 500; }
.bottom { margin-top: 10px; display: flex; justify-content: space-between; align-items: center; }
.price { color: #f56c6c; font-size: 18px; font-weight: bold; }
</style>