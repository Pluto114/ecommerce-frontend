<template>
  <div class="order-container">
    <div class="page-header">
      <el-button @click="router.push('/home')" link>
        <el-icon><ArrowLeft /></el-icon> 返回商城
      </el-button>
      <h2>我的订单中心</h2>
    </div>

    <el-tabs v-model="activeTab" @tab-click="handleTabClick" class="order-tabs">
      <el-tab-pane label="全部订单" name="all"></el-tab-pane>
      <el-tab-pane label="待支付" name="0"></el-tab-pane>
      <el-tab-pane label="待发货" name="1"></el-tab-pane>
      <el-tab-pane label="待收货" name="2"></el-tab-pane>
      <el-tab-pane label="已完成" name="3"></el-tab-pane>
    </el-tabs>

    <div class="order-list" v-loading="loading">
      <el-empty v-if="filteredList.length === 0" description="暂无相关订单" />

      <el-card 
        v-for="order in filteredList" 
        :key="order.id" 
        class="order-card" 
        shadow="hover"
      >
        <template #header>
          <div class="card-header">
            <div class="header-left">
              <span class="order-sn">订单号: {{ order.orderSn }}</span>
              <span class="order-time">{{ order.createTime }}</span>
            </div>
            <div class="header-right">
              <el-tag :type="getStatusType(order.status)">
                {{ getStatusText(order.status) }}
              </el-tag>
            </div>
          </div>
        </template>

        <div 
          v-for="item in order.orderItems" 
          :key="item.productId" 
          class="order-item"
        >
          <el-image :src="item.productImage" class="thumb" fit="cover" />
          <div class="info">
            <div class="name">{{ item.productName }}</div>
            <div class="price">¥ {{ item.productPrice }} x {{ item.quantity }}</div>
          </div>
        </div>

        <div class="card-footer">
          <div class="total-price">
            实付金额: <b>¥ {{ order.totalAmount.toFixed(2) }}</b>
          </div>
          <div class="actions">
            <template v-if="order.status === 0">
              <el-button size="small" @click="handleCancel(order)">取消订单</el-button>
              <el-button type="primary" size="small" @click="handlePay(order)">立即支付</el-button>
            </template>
            
            <template v-if="order.status === 2">
               <el-button type="success" size="small" plain @click="handleReceive(order)">确认收货</el-button>
            </template>

            <template v-if="order.status === 3 || order.status === -1">
               <el-button link type="danger" size="small" @click="handleDelete(order.id)">删除记录</el-button>
            </template>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { OrderVO } from '@/types'

const router = useRouter()
const loading = ref(false)
const activeTab = ref('all')
const orderList = ref<OrderVO[]>([])

// 筛选逻辑
const filteredList = computed(() => {
  if (activeTab.value === 'all') return orderList.value
  return orderList.value.filter(item => item.status === Number(activeTab.value))
})

// 获取数据 (Mock)
const fetchOrders = () => {
  loading.value = true
  setTimeout(() => {
    orderList.value = [
      {
        id: 1,
        orderSn: 'ORD202512270001',
        totalAmount: 1098.00,
        status: 0, // 待支付
        createTime: '2025-12-27 10:00:00',
        orderItems: [
          { productId: 101, productName: 'Nike Air Zoom (3D版)', productImage: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff', productPrice: 899, quantity: 1 },
          { productId: 102, productName: '普通帆布鞋', productImage: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77', productPrice: 199, quantity: 1 }
        ]
      },
      {
        id: 2,
        orderSn: 'ORD202512260088',
        totalAmount: 199.00,
        status: 2, // 待收货
        createTime: '2025-12-26 14:30:00',
        orderItems: [
          { productId: 102, productName: '普通帆布鞋', productImage: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77', productPrice: 199, quantity: 1 }
        ]
      },
      {
        id: 3,
        orderSn: 'ORD202512200003',
        totalAmount: 899.00,
        status: 3, // 已完成
        createTime: '2025-12-20 09:15:00',
        orderItems: [
           { productId: 101, productName: 'Nike Air Zoom (3D版)', productImage: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff', productPrice: 899, quantity: 1 }
        ]
      }
    ]
    loading.value = false
  }, 500)
}

// 状态辅助函数
const getStatusText = (status: number) => {
  const map: Record<number, string> = {
    0: '待支付', 1: '待发货', 2: '运输中', 3: '已完成', '-1': '已取消'
  }
  return map[status] || '未知'
}

const getStatusType = (status: number) => {
  if (status === 0) return 'danger'  // 红色
  if (status === 1) return 'warning' // 黄色
  if (status === 2) return 'primary' // 蓝色
  if (status === 3) return 'success' // 绿色
  return 'info'
}

// 业务操作
const handleTabClick = () => {
  // 实际项目中可能需要带参数重新请求后端
  // fetchOrders(activeTab.value)
}

// 支付
const handlePay = (order: OrderVO) => {
  ElMessageBox.confirm(`确认支付订单 ${order.orderSn}?`, '模拟支付', {
    confirmButtonText: '支付 ¥' + order.totalAmount,
    type: 'success'
  }).then(() => {
    order.status = 1 // 支付后变为待发货
    ElMessage.success('支付成功，等待商家发货')
  })
}

// 取消
const handleCancel = (order: OrderVO) => {
  ElMessageBox.confirm('确定要取消该订单吗?', '提示', {
    type: 'warning'
  }).then(() => {
    order.status = -1
    ElMessage.info('订单已取消')
  })
}

// 收货
const handleReceive = (order: OrderVO) => {
  order.status = 3
  ElMessage.success('交易完成！')
}

// 删除
const handleDelete = (id: number) => {
  orderList.value = orderList.value.filter(o => o.id !== id)
  ElMessage.success('订单记录已删除')
}

onMounted(() => {
  fetchOrders()
})
</script>

<style scoped>
.order-container {
  max-width: 1000px;
  margin: 30px auto;
  padding: 0 20px;
}
.page-header { margin-bottom: 20px; display: flex; align-items: center; gap: 10px; }
.order-tabs { margin-bottom: 20px; }

.order-card { margin-bottom: 20px; border-radius: 8px; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.header-left { display: flex; gap: 20px; color: #666; font-size: 14px; }

.order-item {
  display: flex; gap: 15px; padding: 15px 0; border-bottom: 1px solid #f5f7fa;
}
.thumb { width: 80px; height: 80px; border-radius: 4px; border: 1px solid #eee; }
.info { flex: 1; display: flex; flex-direction: column; justify-content: center; }
.name { font-weight: 500; font-size: 14px; color: #333; margin-bottom: 5px; }
.price { color: #999; font-size: 13px; }

.card-footer {
  margin-top: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.total-price b { color: #f56c6c; font-size: 18px; }
.actions { display: flex; gap: 10px; }
</style>