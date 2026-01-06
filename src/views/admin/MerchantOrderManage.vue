<template>
  <el-card>
    <template #header>
      <div class="card-header">
        <span>订单管理 (商家版)</span>

        <div class="header-right">
          <el-select v-model="status" placeholder="状态筛选" clearable style="width: 140px" @change="fetchOrders">
            <el-option label="待发货" :value="1" />
            <el-option label="待收货" :value="2" />
            <el-option label="退单中" :value="-2" />
            <el-option label="已退款" :value="-4" />
            <el-option label="退单拒绝" :value="-3" />
            <el-option label="待支付(一般商家不处理)" :value="0" />
            <el-option label="已取消" :value="-1" />
            <el-option label="待评价" :value="3" />
            <el-option label="已完成" :value="4" />
          </el-select>

          <el-input
            v-model="orderSn"
            placeholder="搜索订单号..."
            class="search-input"
            clearable
            @clear="fetchOrders"
            @keyup.enter="fetchOrders"
          >
            <template #append>
              <el-button :icon="Search" @click="fetchOrders" />
            </template>
          </el-input>

          <el-button type="primary" @click="fetchOrders" :loading="loading">刷新</el-button>
        </div>
      </div>
    </template>

    <el-table :data="tableData" v-loading="loading" stripe style="width: 100%">
      <el-table-column prop="orderSn" label="订单号" min-width="220" />
      <el-table-column prop="createTime" label="下单时间" min-width="170" />
      <el-table-column label="收货信息" min-width="220">
        <template #default="scope">
          <div class="addr">
            <div class="line1">
              <span class="name">{{ scope.row.receiverName || '-' }}</span>
              <span class="phone">{{ scope.row.receiverPhone || '-' }}</span>
            </div>
            <div class="line2">{{ scope.row.address || '-' }}</div>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="金额" width="140">
        <template #default="scope">
          <span class="price">¥ {{ toMoney(scope.row.totalAmount) }}</span>
        </template>
      </el-table-column>

      <el-table-column label="状态" width="120">
        <template #default="scope">
          <el-tag :type="statusType(normalizeStatus(scope.row.status))">
            {{ statusText(normalizeStatus(scope.row.status)) }}
            </el-tag>

        </template>
      </el-table-column>

      <el-table-column label="商品明细" min-width="260">
        <template #default="scope">
          <div v-if="scope.row.orderItems?.length" class="items">
            <div v-for="it in scope.row.orderItems" :key="it.productId" class="item">
              <el-image :src="it.productImage" class="thumb" fit="cover" />
              <div class="meta">
                <div class="pname">{{ it.productName }}</div>
                <div class="pinfo">¥ {{ toMoney(it.productPrice) }} x {{ it.quantity }}</div>
              </div>
            </div>
          </div>
          <span v-else style="color:#bbb">无</span>
        </template>
      </el-table-column>

      <el-table-column label="操作" width="220" fixed="right">
        <template #default="scope">
          <!-- 发货：1 -> 2 -->
          <el-button
            v-if="normalizeStatus(scope.row.status) === 1"
            type="success"
            size="small"
            @click="handleShip(scope.row.orderSn)"
            :loading="actionLoading === scope.row.orderSn"
          >
            发货
          </el-button>

          <!-- 退单审核：-2 -> -3/-4 -->
          <el-button
            v-if="normalizeStatus(scope.row.status) === -2"
            type="warning"
            size="small"
            @click="openRefundDialog(scope.row)"
          >
            退单审核
          </el-button>

          <el-button link type="primary" size="small" @click="openDetailDialog(scope.row)">
            查看
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pager">
      <el-pagination
        background
        layout="total, prev, pager, next, sizes"
        :total="total"
        v-model:current-page="pageNum"
        v-model:page-size="pageSize"
        @current-change="fetchOrders"
        @size-change="fetchOrders"
      />
    </div>

    <!-- 退单审核弹窗 -->
    <el-dialog v-model="refundVisible" title="退单审核" width="520px">
      <div v-if="refundRow" class="refund-box">
        <div class="row"><b>订单号：</b>{{ refundRow.orderSn }}</div>
        <div class="row"><b>退单理由：</b>{{ refundRow.refundReason || '-' }}</div>

        <el-form label-width="90px" class="mt">
          <el-form-item label="处理意见">
            <el-radio-group v-model="refundApprove">
              <el-radio :label="true">同意退款</el-radio>
              <el-radio :label="false">拒绝退单</el-radio>
            </el-radio-group>
          </el-form-item>

          <el-form-item label="备注原因">
            <el-input
              v-model="refundAdminReason"
              type="textarea"
              rows="3"
              placeholder="给用户/记录的原因（必填更友好）"
            />
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <el-button @click="refundVisible=false">取消</el-button>
        <el-button type="primary" :loading="refundSubmitting" @click="submitRefundAudit">提交</el-button>
      </template>
    </el-dialog>

    <!-- 查看订单弹窗（轻量） -->
    <el-dialog v-model="detailVisible" title="订单详情" width="720px">
      <div v-if="detailRow" class="detail">
        <div class="row"><b>订单号：</b>{{ detailRow.orderSn }}</div>
        <div class="row"><b>状态：</b>{{ statusText(detailRow.status) }}</div>
        <div class="row"><b>下单时间：</b>{{ detailRow.createTime }}</div>
        <div class="row"><b>收货信息：</b>{{ detailRow.receiverName }} {{ detailRow.receiverPhone }} / {{ detailRow.address }}</div>
        <div class="row"><b>金额：</b>¥ {{ toMoney(detailRow.totalAmount) }}</div>
        <div class="row" v-if="detailRow.cancelReason"><b>取消原因：</b>{{ detailRow.cancelReason }}</div>
        <div class="row" v-if="detailRow.refundReason"><b>退单理由：</b>{{ detailRow.refundReason }}</div>
        <div class="row" v-if="detailRow.refundAdminReason"><b>商家处理：</b>{{ detailRow.refundAdminReason }}</div>
      </div>

      <div v-if="detailRow?.orderItems?.length" class="items mt">
        <div v-for="it in detailRow.orderItems" :key="it.productId" class="item">
          <el-image :src="it.productImage" class="thumb" fit="cover" />
          <div class="meta">
            <div class="pname">{{ it.productName }}</div>
            <div class="pinfo">¥ {{ toMoney(it.productPrice) }} x {{ it.quantity }}</div>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="detailVisible=false">关闭</el-button>
      </template>
    </el-dialog>
  </el-card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import request from '@/utils/request'
import type { OrderVO } from '@/types'

const loading = ref(false)
const actionLoading = ref<string>('')

const tableData = ref<OrderVO[]>([])
const pageNum = ref(1)
const pageSize = ref(10)
const total = ref(0)

const status = ref<number | undefined>(undefined)
const orderSn = ref('')

const toMoney = (v: any) => {
  const n = Number(v || 0)
  return Number.isFinite(n) ? n.toFixed(2) : '0.00'
}

const normalizeStatus = (s: any): number => {
  if (s === null || s === undefined || s === '') return -999 // ✅ 兜底：当作待支付
  const n = Number(s)
  return Number.isFinite(n) ? n : -999
}


const statusText = (s: number) => {
  const map: Record<number, string> = {
    0: '待支付',
    1: '待发货',
    2: '待收货',
    3: '待评价',
    4: '已完成',
    '-1': '已取消',
    '-2': '退单中',
    '-3': '退单拒绝',
    '-4': '已退款',
    '-999': '未知'
  }
  return map[s] || `未知(${s})`
}

const statusType = (s: number) => {
  if (s === 1) return 'warning'
  if (s === 2) return 'primary'
  if (s === 3) return 'info'
  if (s === 4) return 'success'
  if (s === 0) return 'danger'
  if (s === -2) return 'warning'
  if (s === -4) return 'success'
  if (s === -3 || s === -1) return 'info'
  return 'info'
}

const fetchOrders = async () => {
  loading.value = true
  try {
    const res = await request.get<any, any>('/merchant/order/list', {
      params: {
        pageNum: pageNum.value,
        pageSize: pageSize.value,
        status: status.value,
        orderSn: orderSn.value || undefined
      }
    })
    // 这里 res 是 Page<OrderVO>
    tableData.value = res?.records || []
    total.value = res?.total || 0
  } catch (e) {
    ElMessage.error('获取订单列表失败')
  } finally {
    loading.value = false
  }
}

const handleShip = async (sn: string) => {
  try {
    await ElMessageBox.confirm(`确认对订单 ${sn} 发货？`, '发货确认', {
      type: 'warning',
      confirmButtonText: '确认发货',
      cancelButtonText: '取消'
    })
    actionLoading.value = sn
    await request.post('/merchant/order/ship', { orderSn: sn })
    ElMessage.success('发货成功')
    fetchOrders()
  } catch {
    // ignore
  } finally {
    actionLoading.value = ''
  }
}

// ========== 退单审核 ==========
const refundVisible = ref(false)
const refundRow = ref<OrderVO | null>(null)
const refundApprove = ref(true)
const refundAdminReason = ref('')
const refundSubmitting = ref(false)

const openRefundDialog = (row: OrderVO) => {
  refundRow.value = row
  refundApprove.value = true
  refundAdminReason.value = ''
  refundVisible.value = true
}

const submitRefundAudit = async () => {
  if (!refundRow.value) return
  // 建议必填，避免空备注
  if (!refundAdminReason.value.trim()) {
    ElMessage.warning('请填写处理备注/原因')
    return
  }

  refundSubmitting.value = true
  try {
    await request.post('/merchant/order/refund/audit', {
      orderSn: refundRow.value.orderSn,
      approve: refundApprove.value,
      adminReason: refundAdminReason.value
    })
    ElMessage.success('审核完成')
    refundVisible.value = false
    fetchOrders()
  } catch {
    // request.ts 已提示
  } finally {
    refundSubmitting.value = false
  }
}

// ========== 查看 ==========
const detailVisible = ref(false)
const detailRow = ref<OrderVO | null>(null)
const openDetailDialog = (row: OrderVO) => {
  detailRow.value = row
  detailVisible.value = true
}

onMounted(() => {
  fetchOrders()
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
  width: 240px;
}
.pager {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
.addr .line1 { display:flex; gap:10px; }
.addr .name { font-weight: 600; }
.addr .phone { color:#666; }
.addr .line2 { color:#888; font-size: 12px; margin-top: 2px; }

.items { display:flex; flex-direction: column; gap: 8px; }
.item { display:flex; gap: 10px; align-items: center; }
.thumb { width: 36px; height: 36px; border-radius: 4px; border: 1px solid #eee; }
.meta { display:flex; flex-direction: column; }
.pname { font-size: 13px; color:#333; }
.pinfo { font-size: 12px; color:#888; }
.price { font-weight: 600; }

.mt { margin-top: 12px; }
.refund-box .row, .detail .row { margin-bottom: 8px; }
</style>
