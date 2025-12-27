<template>
  <div class="cart-container">
    <div class="page-header">
      <h2>我的购物车 (Shopping Cart)</h2>
      <span class="subtitle">共 {{ cartList.length }} 件商品</span>
    </div>

    <el-card shadow="never" class="cart-card">
      <el-table 
        :data="cartList" 
        style="width: 100%" 
        @selection-change="handleSelectionChange"
        empty-text="购物车是空的，去逛逛吧"
      >
        <el-table-column type="selection" width="55" />

        <el-table-column label="商品信息" min-width="400">
          <template #default="scope">
            <div class="product-info">
              <el-image 
                :src="scope.row.productImage" 
                class="product-img" 
                fit="cover"
              />
              <div class="product-detail">
                <div class="name">{{ scope.row.productName }}</div>
                <div class="id-tag">ID: {{ scope.row.productId }}</div>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="单价" width="150">
          <template #default="scope">
            <span class="price">¥ {{ scope.row.price.toFixed(2) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="数量" width="200">
          <template #default="scope">
            <el-input-number 
              v-model="scope.row.quantity" 
              :min="1" 
              :max="99" 
              size="small"
              @change="(val) => handleQuantityChange(scope.row, val)"
            />
          </template>
        </el-table-column>

        <el-table-column label="小计" width="150">
          <template #default="scope">
            <span class="subtotal">¥ {{ (scope.row.price * scope.row.quantity).toFixed(2) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="100">
          <template #default="scope">
            <el-button 
              type="danger" 
              link 
              :icon="Delete" 
              @click="handleDelete(scope.row.id)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <div class="action-bar">
      <div class="left">
        <el-button link @click="router.push('/home')">继续购物</el-button>
        <span class="selected-count">已选 <b>{{ selectedItems.length }}</b> 件</span>
      </div>
      
      <div class="right">
        <div class="total-box">
          <span class="label">合计 (不含运费):</span>
          <span class="grand-total">¥ {{ grandTotal.toFixed(2) }}</span>
        </div>
        <el-button 
          type="primary" 
          size="large" 
          class="checkout-btn" 
          :disabled="selectedItems.length === 0"
          @click="handleCheckout"
        >
          去结算
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Delete } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'
import type { CartVO } from '@/types'

const router = useRouter()
const loading = ref(false)
const cartList = ref<CartVO[]>([])
const selectedItems = ref<CartVO[]>([])

// 计算总价
const grandTotal = computed(() => {
  return selectedItems.value.reduce((sum, item) => {
    return sum + item.price * item.quantity
  }, 0)
})

// 获取购物车列表
const fetchCart = async () => {
  loading.value = true
  try {
    // 真实接口: await request.get('/cart/list')
    // Mock 数据：模拟用户之前加购了我们在 Detail 页看到的商品
    setTimeout(() => {
      cartList.value = [
        {
          id: 1,
          productId: 101,
          productName: 'Nike Air Zoom (3D版)',
          productImage: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff',
          price: 899,
          quantity: 1,
          valid: true
        },
        {
          id: 2,
          productId: 102,
          productName: '普通帆布鞋',
          productImage: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77',
          price: 199,
          quantity: 2,
          valid: true
        }
      ]
      loading.value = false
    }, 500)
  } catch (error) {
    console.error(error)
    loading.value = false
  }
}

// 处理勾选
const handleSelectionChange = (val: CartVO[]) => {
  selectedItems.value = val
}

// 修改数量
const handleQuantityChange = async (row: CartVO, newVal: number | undefined) => {
    if(!newVal) return
    console.log(`Update cart ${row.id} to ${newVal}`)
    // await request.put('/cart/update', { id: row.id, quantity: newVal })
}

// 删除商品
const handleDelete = (id: number) => {
  ElMessageBox.confirm('确定要从购物车删除这件商品吗?', '提示', {
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    // await request.delete(`/cart/${id}`)
    cartList.value = cartList.value.filter(item => item.id !== id)
    ElMessage.success('删除成功')
  })
}

// 去结算
// src/views/shop/Cart.vue 中的 handleCheckout 方法

const handleCheckout = () => {
  if (selectedItems.value.length === 0) {
    ElMessage.warning('请至少选择一件商品')
    return
  }
  
  // 1. 本地存储选中的商品 (模拟数据传递，真实项目通常传 ID 给后端生成预览)
  sessionStorage.setItem('checkoutItems', JSON.stringify(selectedItems.value))
  
  // 2. 跳转到确认页
  ElMessage.success('正在前往收银台...')
  router.push('/order/confirm')
}

onMounted(() => {
  fetchCart()
})
</script>

<style scoped>
.cart-container {
  max-width: 1200px;
  margin: 30px auto;
  padding: 0 20px;
}

.page-header {
  margin-bottom: 20px;
  display: flex;
  align-items: baseline;
  gap: 15px;
}
.page-header h2 { margin: 0; font-size: 24px; color: #333; }
.subtitle { color: #999; font-size: 14px; }

.cart-card { border-radius: 8px; border: none; }

.product-info { display: flex; align-items: center; gap: 15px; }
.product-img { width: 80px; height: 80px; border-radius: 4px; border: 1px solid #eee; }
.product-detail { display: flex; flex-direction: column; gap: 5px; }
.name { font-weight: 500; font-size: 14px; color: #333; }
.id-tag { font-size: 12px; color: #999; }

.price { font-weight: bold; color: #333; }
.subtotal { font-weight: bold; color: #f56c6c; }

/* 底部结算悬浮栏 */
.action-bar {
  margin-top: 30px;
  background: white;
  padding: 20px 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-radius: 8px;
  box-shadow: 0 -4px 20px rgba(0,0,0,0.05);
  position: sticky;
  bottom: 0;
  z-index: 100;
}

.left { display: flex; align-items: center; gap: 20px; }
.selected-count b { color: #f56c6c; font-size: 18px; }

.right { display: flex; align-items: center; gap: 30px; }
.total-box { display: flex; align-items: baseline; gap: 10px; }
.label { color: #666; }
.grand-total { font-size: 28px; color: #f56c6c; font-weight: bold; }
.checkout-btn { width: 150px; background-color: #f56c6c; border-color: #f56c6c; font-weight: bold; }
.checkout-btn:hover { background-color: #e64242; border-color: #e64242; }
.checkout-btn:disabled { background-color: #fab6b6; border-color: #fab6b6; }
</style>