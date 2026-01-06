<template>
  <div class="cart-container">
    <div class="page-header">
      <h2>我的购物车 (Shopping Cart)</h2>
      <span class="subtitle">实时云端同步</span>
    </div>

    <el-card shadow="never" class="cart-card" v-loading="loading">
      <el-table 
        :data="cartList" 
        style="width: 100%" 
        @selection-change="handleSelectionChange"
        empty-text="购物车空空如也，快去选购吧"
      >
        <el-table-column type="selection" width="55" />
        
        <el-table-column label="商品信息" min-width="400">
          <template #default="scope">
            <div class="product-info">
              <el-image :src="scope.row.productImage" class="product-img" fit="cover" />
              <div class="product-detail">
                <div class="name">{{ scope.row.productName }}</div>
                <div class="id-tag">Cart ID: {{ scope.row.id }} | Pro ID: {{ scope.row.productId }}</div>
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
          <span class="label">合计:</span>
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
import request from '@/utils/request' // 使用真实的 Axios
import type { CartVO } from '@/types'

const router = useRouter()
const loading = ref(false)
const cartList = ref<CartVO[]>([])
const selectedItems = ref<CartVO[]>([])

const grandTotal = computed(() => {
  return selectedItems.value.reduce((sum, item) => sum + item.price * item.quantity, 0)
})

// 1. 获取购物车列表 (Real API)
const fetchCart = async () => {
  loading.value = true
  try {
    // 对应文档 3.5 GET /cart/list
    const res = await request.get<any, CartVO[]>('/cart/list')
    cartList.value = res || []
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 2. 修改数量 (Real API)
const handleQuantityChange = async (row: CartVO, newVal: number | undefined) => {
  if (!newVal) return
  try {
    await request.put('/cart/update', {
      id: row.id,
      quantity: newVal
    })

    // ✅ 同步已选列表中的数量（避免已选数组里还是旧 quantity）
    const idx = selectedItems.value.findIndex(i => i.id === row.id)
    if (idx !== -1) {
      selectedItems.value[idx].quantity = newVal
    }

    console.log('数量同步成功')
  } catch (error) {
    fetchCart()
  }
}


// 3. 删除商品 (Real API)
const handleDelete = (id: number) => {
  ElMessageBox.confirm('确定要移出购物车吗?', '提示', {
    type: 'warning',
  }).then(async () => {
    try {
      // 对应文档 3.5 DELETE /cart/{id}
      await request.delete(`/cart/${id}`)
      ElMessage.success('删除成功')
      // 从本地列表移除，减少请求
      cartList.value = cartList.value.filter(item => item.id !== id)
      // 同时也把选中状态里的该项移除
      selectedItems.value = selectedItems.value.filter(item => item.id !== id)
    } catch (error) {
      console.error(error)
    }
  })
}

const handleSelectionChange = (val: CartVO[]) => {
  selectedItems.value = val
}

const handleCheckout = () => {
  if (selectedItems.value.length === 0) return

  // ✅ 结算页展示用（你原来就有）
  sessionStorage.setItem('checkoutItems', JSON.stringify(selectedItems.value))

  // ✅ 后端下单必需：购物车记录ID列表
  const cartIds = selectedItems.value.map(i => i.id)
  sessionStorage.setItem('checkoutCartIds', JSON.stringify(cartIds))

  // ✅ 同时放到路由 query，刷新/分享链接也不丢
  router.push({
    path: '/order/confirm',
    query: { cartIds: cartIds.join(',') }
  })
}


onMounted(() => {
  fetchCart()
})
</script>

<style scoped>
/* 样式保持不变，直接复用之前的 */
.cart-container { max-width: 1200px; margin: 30px auto; padding: 0 20px; }
.page-header { margin-bottom: 20px; display: flex; align-items: baseline; gap: 15px; }
.subtitle { color: #999; font-size: 14px; }
.cart-card { border-radius: 8px; border: none; }
.product-info { display: flex; align-items: center; gap: 15px; }
.product-img { width: 80px; height: 80px; border-radius: 4px; border: 1px solid #eee; }
.product-detail { display: flex; flex-direction: column; gap: 5px; }
.name { font-weight: 500; font-size: 14px; color: #333; }
.id-tag { font-size: 12px; color: #999; }
.price { font-weight: bold; color: #333; }
.subtotal { font-weight: bold; color: #f56c6c; }
.action-bar { margin-top: 30px; background: white; padding: 20px 30px; display: flex; justify-content: space-between; align-items: center; border-radius: 8px; box-shadow: 0 -4px 20px rgba(0,0,0,0.05); position: sticky; bottom: 0; z-index: 100; }
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
