<template>
  <div class="order-container">
    <div class="page-header">
      <el-button @click="router.push('/home')" link>
        <el-icon><ArrowLeft /></el-icon> 返回商城
      </el-button>
      <h2>我的订单中心</h2>
    </div>

    <!-- 你的后端状态：0/1/2/3/4/-1/-2/-3/-4 -->
    <el-tabs v-model="activeTab" @tab-click="handleTabClick" class="order-tabs">
      <el-tab-pane label="全部订单" name="all" />
      <el-tab-pane label="待支付" name="0" />
      <el-tab-pane label="待发货" name="1" />
      <el-tab-pane label="待收货" name="2" />
      <el-tab-pane label="待评价" name="3" />
      <el-tab-pane label="已完成" name="4" />
      <el-tab-pane label="已取消" name="-1" />
      <el-tab-pane label="退单中" name="-2" />
    </el-tabs>

    <div class="order-list" v-loading="loading">
      <el-empty v-if="orderList.length === 0" description="暂无相关订单" />

      <el-card
        v-for="order in orderList"
        :key="order.id"
        class="order-card"
        shadow="hover"
      >
        <template #header>
          <div class="card-header">
            <div class="header-left">
              <span class="order-sn">订单号: {{ order.orderSn }}</span>
              <span class="order-time">{{ formatTime(order.createTime) }}</span>
            </div>
            <div class="header-right">
              <el-tag :type="getStatusType(order.status)">
                {{ order.statusText || getStatusText(order.status) }}
              </el-tag>
            </div>
          </div>
        </template>

        <!-- 收货信息展示：优先结构化字段，兜底 receiverInfo -->
        <div class="receiver" v-if="receiverText(order)">
          <el-icon class="receiver-icon"><Location /></el-icon>
          <span>{{ receiverText(order) }}</span>
        </div>

        <div
          v-for="item in order.orderItems || []"
          :key="item.productId"
          class="order-item"
        >
          <el-image :src="item.productImage" class="thumb" fit="cover" />
          <div class="info">
            <div class="name">{{ item.productName }}</div>
            <div class="price">
              ¥ {{ toMoney(item.productPrice) }} x {{ item.quantity }}
            </div>
          </div>
        </div>

        <div class="card-footer">
          <div class="total-price">
            实付金额:
            <b>¥ {{ payMoney(order) }}</b>
          </div>

          <div class="actions">
            <!-- 待支付 -->
            <template v-if="order.status === 0">
              <el-button size="small" @click="handleCancel(order)">取消订单</el-button>
              <el-button type="primary" size="small" :loading="opLoading" @click="handlePay(order)">
                立即支付
              </el-button>
            </template>

            <!-- 待发货：允许申请退单 -->
            <template v-else-if="order.status === 1">
              <el-button size="small" type="danger" plain @click="handleApplyRefund(order)">
                申请退单
              </el-button>
            </template>

            <!-- 待收货 -->
            <template v-else-if="order.status === 2">
              <el-button size="small" type="danger" plain @click="handleApplyRefund(order)">
                申请退单
              </el-button>
              <el-button type="success" size="small" plain :loading="opLoading" @click="handleReceive(order)">
                确认收货
              </el-button>
            </template>

            <!-- 待评价 -->
            <template v-else-if="order.status === 3">
              <el-button type="primary" size="small" plain :loading="opLoading" @click="handleFinishComment(order)">
                评价完成
              </el-button>
            </template>

            <!-- 已完成/已取消/退单终态：只展示 -->
            <template v-else>
              <el-button size="small" @click="refresh()">刷新</el-button>
            </template>
          </div>
        </div>
      </el-card>

      <!-- 分页 -->
      <div v-if="total > 0" class="pager">
        <el-pagination
          layout="prev, pager, next, jumper"
          :total="total"
          :page-size="pageSize"
          :current-page="pageNum"
          @current-change="handlePageChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Location } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { OrderVO } from '@/types' // 你项目的 OrderVO 类型
import { myOrderList, payOrder, cancelOrder, receiveOrder, finishComment, applyRefund } from '@/api/order'

const router = useRouter()

const loading = ref(false)
const opLoading = ref(false)

const activeTab = ref('all')
const orderList = ref<OrderVO[]>([])

const pageNum = ref(1)
const pageSize = ref(10)
const total = ref(0)

const refresh = async () => {
  loading.value = true
  try {
    const status = activeTab.value === 'all' ? undefined : Number(activeTab.value)
    const page = await myOrderList({ pageNum: pageNum.value, pageSize: pageSize.value, status })
    orderList.value = page.records || []
    total.value = page.total || 0
  } catch (e) {
    // request.ts 已统一弹 toast，这里不重复
  } finally {
    loading.value = false
  }
}

const handleTabClick = () => {
  pageNum.value = 1
  refresh()
}

const handlePageChange = (p: number) => {
  pageNum.value = p
  refresh()
}

// =================== 展示辅助 ===================
const formatTime = (t: any) => {
  if (!t) return ''
  // 后端可能返回 ISO 或 "yyyy-MM-dd HH:mm:ss"
  return String(t).replace('T', ' ').slice(0, 19)
}

const toMoney = (v: any) => {
  const n = Number(v || 0)
  return Number.isFinite(n) ? n.toFixed(2) : '0.00'
}

const payMoney = (order: any) => {
  // payAmount 为空时用 totalAmount
  const n = Number(order.payAmount ?? order.totalAmount ?? 0)
  return Number.isFinite(n) ? n.toFixed(2) : '0.00'
}

const receiverText = (order: any) => {
  const n = order.receiverName
  const p = order.receiverPhone
  const a = order.address
  const structured = [n, p, a].filter(Boolean).join(' ')
  return structured || order.receiverInfo || ''
}

const getStatusText = (status: number) => {
  const map: Record<number, string> = {
    0: '待支付',
    1: '待发货',
    2: '待收货',
    3: '待评价',
    4: '已完成',
    '-1': '已取消',
    '-2': '退单中',
    '-3': '退单被拒',
    '-4': '已退款'
  }
  return map[status] || '未知状态'
}


const getStatusType = (status: number) => {
  if (status === 0) return 'danger'
  if (status === 1) return 'warning'
  if (status === 2) return 'primary'
  if (status === 3) return 'info'
  if (status === 4) return 'success'
  if (status === -2) return 'warning'
  if (status === -3) return 'danger'
  if (status === -4) return 'success'
  if (status === -1) return 'info'
  return 'info'
}

// =================== 业务动作：全部走后端 ===================
const opLoadingSn = ref<string | null>(null)

// 支付
const handlePay = async (order: any) => {
  await ElMessageBox.confirm(`确认支付订单 ${order.orderSn} ?`, '模拟支付', {
    confirmButtonText: `支付 ¥${payMoney(order)}`,
    type: 'success'
  })

  opLoadingSn.value = order.orderSn
  try {
    await payOrder(order.orderSn)
    ElMessage.success('支付成功，等待商家发货')
    refresh()
  } finally {
    opLoadingSn.value = null
  }
}

const handleCancel = async (order: any) => {
  await ElMessageBox.confirm('确定要取消该订单吗?', '提示', { type: 'warning' })
  opLoadingSn.value = order.orderSn
  try {
    await cancelOrder(order.orderSn)
    ElMessage.success('订单已取消')
    refresh()
  } finally {
    opLoadingSn.value = null
  }
}

const handleReceive = async (order: any) => {
  await ElMessageBox.confirm('确认已收到货物？', '确认收货', { type: 'warning' })
  opLoadingSn.value = order.orderSn
  try {
    await receiveOrder(order.orderSn)
    ElMessage.success('确认收货成功，待评价')
    refresh()
  } finally {
    opLoadingSn.value = null
  }
}

const handleFinishComment = async (order: any) => {
  await ElMessageBox.confirm('确认完成评价？（演示：仅推进订单状态）', '评价完成', { type: 'success' })
  opLoadingSn.value = order.orderSn
  try {
    await finishComment(order.orderSn)
    ElMessage.success('订单已完成')
    refresh()
  } finally {
    opLoadingSn.value = null
  }
}

const handleApplyRefund = async (order: any) => {
  const { value } = await ElMessageBox.prompt('请输入退单原因', '申请退单', {
    confirmButtonText: '提交',
    cancelButtonText: '取消',
    inputPlaceholder: '例如：拍错了/不想要了/信息填错'
  })
  const reason = String(value || '').trim()
  if (!reason) {
    ElMessage.warning('退单原因不能为空')
    return
  }

  opLoadingSn.value = order.orderSn
  try {
    await applyRefund({ orderSn: order.orderSn, refundReason: reason })
    ElMessage.success('退单申请已提交')
    refresh()
  } finally {
    opLoadingSn.value = null
  }
}


onMounted(() => {
  refresh()
})
</script>

<style scoped>
.order-container {
  max-width: 1000px;
  margin: 30px auto;
  padding: 0 20px;
}
.page-header {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
}
.order-tabs {
  margin-bottom: 20px;
}

.order-card {
  margin-bottom: 20px;
  border-radius: 8px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.header-left {
  display: flex;
  gap: 20px;
  color: #666;
  font-size: 14px;
}

.receiver{
  display:flex;
  align-items:center;
  gap:8px;
  color:#666;
  font-size:13px;
  padding: 8px 0 4px 0;
}
.receiver-icon{
  font-size: 16px;
  color:#909399;
}

.order-item {
  display: flex;
  gap: 15px;
  padding: 15px 0;
  border-bottom: 1px solid #f5f7fa;
}
.thumb {
  width: 80px;
  height: 80px;
  border-radius: 4px;
  border: 1px solid #eee;
}
.info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.name {
  font-weight: 500;
  font-size: 14px;
  color: #333;
  margin-bottom: 5px;
}
.price {
  color: #999;
  font-size: 13px;
}

.card-footer {
  margin-top: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.total-price b {
  color: #f56c6c;
  font-size: 18px;
}
.actions {
  display: flex;
  gap: 10px;
}
.pager{
  display:flex;
  justify-content:flex-end;
  padding: 12px 0 0;
}
</style>
