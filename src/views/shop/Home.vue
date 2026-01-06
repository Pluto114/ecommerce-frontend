<template>
  <div class="shop-container">
    <div class="nav-header">
      <div class="logo">Jerry's Amazon</div>
      
      <div class="search-bar">
        <el-input 
          v-model="searchKeyword" 
          placeholder="Search Amazon..." 
          class="search-input"
          clearable
          @keyup.enter="handleSearch"
          @clear="handleSearch"
        >
          <template #append>
            <el-button :icon="Search" @click="handleSearch" class="search-btn" />
          </template>
        </el-input>
      </div>

      <div class="nav-right">
        <el-badge :value="cartCount" class="item">
            <el-button :icon="ShoppingCart" circle class="cart-btn" @click="router.push('/cart')" />
        </el-badge>
  
        <el-dropdown>
            <span class="el-dropdown-link username">
              Hello, {{ userStore.userInfo.username || 'Sign in' }}
              <el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
            <el-dropdown-menu>
                <el-dropdown-item @click="router.push('/order/list')">My Orders</el-dropdown-item>
                <el-dropdown-item divided @click="handleLogout">Sign Out</el-dropdown-item>
            </el-dropdown-menu>
            </template>
        </el-dropdown>
      </div>
    </div>

    <div class="amazon-nav-strip">
      <div class="nav-content">
        <div 
          class="nav-item all-menu" 
          :class="{ active: currentCategoryId === null }"
          @click="selectCategory(null)"
        >
          <el-icon class="menu-icon"><Menu /></el-icon>
          <span>All</span>
        </div>

        <div 
          v-for="cat in categoryList" 
          :key="cat.id"
          class="nav-item"
          :class="{ active: currentCategoryId === cat.id }"
          @click="selectCategory(cat.id)"
        >
          {{ cat.name }}
        </div>
        
        <div class="nav-item">Today's Deals</div>
        <div class="nav-item">Customer Service</div>
        <div class="nav-item">Registry</div>
        <div class="nav-item">Gift Cards</div>
        <div class="nav-item">Sell</div>
      </div>
    </div>

    <div class="banner-container">
      <el-carousel :interval="5000" arrow="always" height="300px" v-if="bannerList.length > 0">
        <el-carousel-item v-for="item in bannerList" :key="item.id">
          <el-image :src="item.imgUrl" class="banner-img" fit="cover" @click="handleBannerClick(item)" />
        </el-carousel-item>
      </el-carousel>
      <el-skeleton v-else style="width: 100%; height: 300px" animated>
        <template #template>
          <el-skeleton-item variant="image" style="width: 100%; height: 300px" />
        </template>
      </el-skeleton>
    </div>

    <div class="product-grid" v-loading="loading">
      <el-empty v-if="!loading && productList.length === 0" description="No products found" />

      <el-card 
        v-for="item in productList" 
        :key="item.id" 
        class="product-card"
        :body-style="{ padding: '0px', height: '100%', display: 'flex', flexDirection: 'column' }"
        shadow="hover"
        @click="goToDetail(item.id)"
      >
        <div class="image-wrapper">
          <el-image :src="item.mainImageUrl" class="image" fit="contain" lazy>
            <template #error>
              <div class="image-slot">
                <el-icon><Picture /></el-icon>
              </div>
            </template>
          </el-image>
          
          <div v-if="item.modelUrl" class="badge-3d">3D VIEW</div>
        </div>
        
        <div class="card-content">
          <span class="product-name" :title="item.name">{{ item.name }}</span>
          
          <div class="rating-row">
            <el-rate v-model="rating" disabled text-color="#ff9900" size="small" />
            <span class="rating-count">1,234</span>
          </div>

          <div class="bottom-area">
            <div class="price-block">
              <span class="currency">¥</span>
              <span class="price-integer">{{ Math.floor(item.price) }}</span>
              <span class="price-decimal">.{{ (item.price % 1).toFixed(2).substring(2) }}</span>
            </div>
            <span class="prime-tag">prime</span>
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
import { ShoppingCart, ArrowDown, Picture, Search, Menu } from '@element-plus/icons-vue' 
import request from '@/utils/request'
import type { Product } from '@/types'

// 简单的类型定义
interface Category { id: number; name: string; }
interface Banner { id: number; imgUrl: string; linkUrl?: string; }

const router = useRouter()
const userStore = useUserStore()
const productList = ref<Product[]>([])
const loading = ref(false)
const cartCount = ref(0) 
const searchKeyword = ref('')
const categoryList = ref<Category[]>([])
const bannerList = ref<Banner[]>([])
const currentCategoryId = ref<number | null>(null)
const rating = ref(4.5) // 假数据：评分

// --- 数据获取逻辑 (保持不变) ---
const fetchProducts = async () => {
  loading.value = true
  try {
    const params: any = {}
    if (searchKeyword.value) params.keyword = searchKeyword.value
    if (currentCategoryId.value !== null) params.categoryId = currentCategoryId.value

    const res = await request.get<any, any>('/product/public/search', { params })
    if (Array.isArray(res)) productList.value = res
    else if (res?.records) productList.value = res.records
    else if (res?.list) productList.value = res.list
    else productList.value = []
  } catch (error) {
    console.error('Error', error)
  } finally {
    loading.value = false
  }
}

const initData = async () => {
  try {
    const [catRes, bannerRes] = await Promise.all([
      request.get<any, any>('/category/public/list'),
      request.get<any, any>('/home/public/banners')
    ])
    if (Array.isArray(catRes)) categoryList.value = catRes
    else if (catRes?.data) categoryList.value = catRes.data
    if (Array.isArray(bannerRes)) bannerList.value = bannerRes
    else if (bannerRes?.data) bannerList.value = bannerRes.data
  } catch (e) { console.error(e) }
}

const selectCategory = (id: number | null) => {
  currentCategoryId.value = id
  fetchProducts()
}

const handleSearch = () => fetchProducts()

const handleBannerClick = (item: Banner) => {
  if (item.linkUrl) window.location.href = item.linkUrl
}

const goToDetail = (id: number) => router.push(`/product/${id}`)

const handleLogout = () => {
    userStore.logout()
    router.push('/login')
}

onMounted(() => {
  initData()
  fetchProducts()
})
</script>

<style scoped>
/* 全局背景：Amazon 浅灰 */
.shop-container {
  background-color: #eaeded; 
  min-height: 100vh;
  font-family: "Amazon Ember", Arial, sans-serif;
}

/* 1. Header 样式 (黑底白字) */
.nav-header {
  height: 60px;
  background: #131921;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  position: sticky;
  top: 0;
  z-index: 1000;
  color: white;
}

.logo { 
  font-size: 24px; 
  font-weight: bold; 
  color: #ffffff; 
  min-width: 140px; 
  cursor: pointer;
  margin-right: 20px;
}

/* 搜索框：模仿 Amazon 的全宽圆角 */
.search-bar { 
  flex: 1; 
  max-width: 800px; 
  margin: 0 10px; 
}
.search-input :deep(.el-input__wrapper) { 
  border-radius: 4px 0 0 4px; 
  box-shadow: none;
}
.search-input :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 3px #f90; /* 聚焦时的橙色光圈 */
}
.search-input :deep(.el-input-group__append) { 
  background-color: #febd69; /* 经典的 Amazon 黄 */
  border-color: #febd69;
  color: #111;
  border-radius: 0 4px 4px 0;
  font-size: 20px;
}
.search-input :deep(.el-input-group__append:hover) { 
  background-color: #f3a847; 
}

.nav-right { display: flex; align-items: center; gap: 20px; min-width: 180px; justify-content: flex-end; }
.username { color: white !important; font-weight: 500; font-size: 14px; display: flex; align-items: center; }
.cart-btn { background: transparent; border: none; color: white; font-size: 24px; }
.cart-btn:hover { color: #febd69; background: transparent; }

/* 2. 导航条样式 (深蓝条) */
.amazon-nav-strip {
  background-color: #232f3e;
  height: 40px;
  display: flex;
  align-items: center;
  padding: 0 20px;
  color: white;
  overflow-x: auto;
}
.nav-content {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
}
.nav-item {
  padding: 8px 10px;
  cursor: pointer;
  font-size: 14px;
  white-space: nowrap;
  border: 1px solid transparent;
  border-radius: 2px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
}
.nav-item:hover { border-color: white; }
.nav-item.active { font-weight: bold; color: #febd69; }
.all-menu { font-weight: bold; gap: 5px; margin-right: 10px; }
.menu-icon { font-size: 18px; }

/* 3. 轮播图样式 */
.banner-container {
  max-width: 1500px;
  margin: 0 auto;
  position: relative;
  /* 渐变遮罩，让底部平滑过渡到背景 */
  mask-image: linear-gradient(to bottom, black 70%, transparent 100%);
  -webkit-mask-image: linear-gradient(to bottom, black 70%, transparent 100%);
}
.banner-img { width: 100%; height: 100%; cursor: pointer; object-fit: cover; }

/* 4. 商品列表核心样式 (Fix Card Layout) */
.product-grid {
  max-width: 1400px;
  margin: -80px auto 30px; /* 负边距，让商品压在轮播图上，增加层次感 */
  position: relative;
  z-index: 2;
  display: grid;
  /* 自适应列宽，保证卡片不会太窄 */
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 20px;
  padding: 0 20px;
}

.product-card { 
  cursor: pointer; 
  border: none;
  border-radius: 0; /* Amazon 风格通常是直角或微圆角 */
  background: white;
  height: 420px; /* 【关键】固定卡片总高度，解决参差不齐的问题 */
  display: flex;
  flex-direction: column;
}

.product-card:hover { 
  transform: translateY(-2px); 
  box-shadow: 0 0 10px rgba(0,0,0,0.15); 
}

/* 图片容器 */
.image-wrapper { 
  height: 240px; /* 固定图片区域高度 */
  background: #fff; 
  display: flex; 
  justify-content: center; 
  align-items: center; 
  padding: 20px; /* 增加内边距，让图片呼吸 */
  position: relative;
  border-bottom: 1px solid #f0f0f0;
}
.image { 
  width: 100%; 
  height: 100%; 
  /* 【关键】contain 确保看到完整商品，而不是被裁切的局部 */
  object-fit: contain; 
}

/* 内容区域 */
.card-content {
  padding: 12px 16px;
  flex: 1; /* 占据剩余空间 */
  display: flex;
  flex-direction: column;
  justify-content: space-between; /* 上下对齐 */
}

/* 商品标题 */
.product-name { 
  font-size: 16px; 
  color: #0F1111; 
  line-height: 1.4;
  /* 【关键】限制两行，超出显示省略号，并固定高度 */
  height: 44px; 
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  margin-bottom: 8px;
}
.product-name:hover { color: #c7511f; } /* Amazon 链接悬浮色 */

/* 价格区域 */
.rating-row { display: flex; align-items: center; gap: 5px; margin-bottom: 8px; }
.rating-count { font-size: 12px; color: #007185; }

.bottom-area {
  margin-top: auto; /* 强制推到底部 */
  display: flex;
  align-items: flex-end;
  gap: 10px;
}
.price-block { color: #0F1111; display: flex; align-items: flex-start; }
.currency { font-size: 12px; margin-top: 4px; }
.price-integer { font-size: 24px; font-weight: 500; line-height: 1; }
.price-decimal { font-size: 12px; margin-top: 4px; }

.prime-tag {
  color: #00a8e1;
  font-weight: bold;
  font-style: italic;
  font-size: 13px;
}

.badge-3d { 
  position: absolute; 
  top: 10px; 
  left: 10px; 
  background: rgba(0,0,0,0.6); 
  color: #fff; 
  padding: 2px 6px; 
  font-size: 10px; 
  border-radius: 2px;
}

/* 移动端适配 */
@media screen and (max-width: 768px) {
  .nav-header { padding: 0 10px; flex-wrap: wrap; height: auto; padding-bottom: 10px; }
  .logo { display: none; }
  .search-bar { order: 2; width: 100%; margin: 10px 0; max-width: none; } 
  .nav-right { order: 1; width: 100%; justify-content: space-between; }
  .product-grid { margin-top: 10px; grid-template-columns: repeat(2, 1fr); gap: 10px; padding: 0 5px; }
  .product-card { height: 320px; } /* 手机端卡片矮一点 */
  .image-wrapper { height: 160px; padding: 10px; }
  .product-name { font-size: 14px; height: 40px; }
  .price-integer { font-size: 20px; }
}
</style>