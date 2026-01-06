<template>
  <div class="confirm-container">
    <div class="page-header">
      <el-button @click="router.back()" link>
        <el-icon><ArrowLeft /></el-icon> 返回购物车
      </el-button>
      <h2>填写并核对订单信息</h2>
    </div>

    <div class="content-wrapper">
      <div class="left-section">
        <el-card shadow="never" class="section-card">
          <template #header>
            <div class="card-header">
              <span><el-icon><Location /></el-icon> 收货人信息</span>
            </div>
          </template>

          <el-form :model="addressForm" label-width="90px" :rules="rules" ref="formRef">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="收货人" prop="name">
                  <el-input v-model="addressForm.name" placeholder="姓名" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="手机号" prop="phone">
                  <el-input v-model="addressForm.phone" placeholder="11位手机号" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-form-item label="收货地址" prop="address">
              <el-input
                v-model="addressForm.address"
                type="textarea"
                rows="2"
                placeholder="省/市/区/街道门牌号"
              />
            </el-form-item>
          </el-form>
        </el-card>

        <el-card shadow="never" class="section-card mt-20">
          <template #header>
            <div class="card-header">
              <span><el-icon><Goods /></el-icon> 商品清单</span>
              <span class="sub-text">共 {{ checkoutItems.length }} 件</span>
            </div>
          </template>

          <div class="item-list">
            <div v-for="item in checkoutItems" :key="item.id" class="order-item">
              <el-image :src="item.productImage" class="thumb" />
              <div class="info">
                <div class="name">{{ item.productName }}</div>
                <div class="price">¥ {{ toMoney(item.price) }} x {{ item.quantity }}</div>
              </div>
              <div class="total">¥ {{ toMoney(item.price * item.quantity) }}</div>
            </div>
          </div>
        </el-card>
      </div>

      <div class="right-section">
        <el-card shadow="hover" class="summary-card">
          <div class="summary-row">
            <span>商品总额</span>
            <span>¥ {{ toMoney(totalPrice) }}</span>
          </div>
          <div class="summary-row">
            <span>运费</span>
            <span>¥ 0.00</span>
          </div>
          <el-divider />
          <div class="final-price">
            <span class="label">应付金额:</span>
            <span class="amount">¥ {{ toMoney(totalPrice) }}</span>
          </div>

          <div class="address-preview" v-if="addressForm.address">
            <small>配送至: {{ addressForm.address }}</small>
            <small>{{ addressForm.name }} {{ addressForm.phone }}</small>
          </div>

          <el-button
            type="primary"
            size="large"
            class="pay-btn"
            @click="handleSubmitOrder"
            :loading="submitting"
          >
            提交订单
          </el-button>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ArrowLeft, Location, Goods } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance } from 'element-plus'
import type { CartVO } from '@/types'
import { payOrder } from '@/api/order'
import request from '@/utils/request'

const router = useRouter()
const route = useRoute()

const checkoutItems = ref<CartVO[]>([])
const submitting = ref(false)
const formRef = ref<FormInstance>()

// cartIds：后端下单必传（购物车记录ID）
const cartIds = ref<number[]>([])

// 表单数据（你可以把默认值改空；我先保留你原来的默认便于测试）
const addressForm = reactive({
  name: 'Jerry',
  phone: '13800138000',
  address: '福建省厦门市思明区软件园二期'
})

const rules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  phone: [{ required: true, message: '请输入手机号', trigger: 'blur' }],
  address: [{ required: true, message: '请输入详细地址', trigger: 'blur' }]
}

// 计算总价
const totalPrice = computed(() => {
  return checkoutItems.value.reduce((sum, item) => sum + item.price * item.quantity, 0)
})

const toMoney = (v: any) => {
  const n = Number(v || 0)
  return Number.isFinite(n) ? n.toFixed(2) : '0.00'
}

// 初始化：从 sessionStorage / query 读取数据
onMounted(() => {
  // 1) 展示用商品列表
  const data = sessionStorage.getItem('checkoutItems')
  if (data) {
    checkoutItems.value = JSON.parse(data)
  }

  // 2) cartIds：优先 query（可刷新），兜底 sessionStorage
  const q = route.query.cartIds
  if (typeof q === 'string' && q.trim()) {
    cartIds.value = q.split(',').map(s => Number(s)).filter(n => Number.isFinite(n))
  } else {
    const cid = sessionStorage.getItem('checkoutCartIds')
    if (cid) {
      try {
        cartIds.value = JSON.parse(cid)
      } catch {
        cartIds.value = []
      }
    }
  }

  // 如果缺关键数据，直接回购物车
  if (!checkoutItems.value.length || !cartIds.value.length) {
    ElMessage.error('没有结算商品，返回购物车')
    router.replace('/cart')
  }
})

// 提交订单（真实）
const handleSubmitOrder = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    if (!cartIds.value.length) {
      ElMessage.error('结算数据丢失，请返回购物车重新勾选')
      router.replace('/cart')
      return
    }

    submitting.value = true
    try {
      // ✅ 调后端：POST /order/create（返回 orderSn）
      // 你的 request.ts 会解包 Result<T>，所以这里拿到的是字符串 orderSn
      const orderSn = await request.post<any, string>('/order/create', {
        cartIds: cartIds.value,
        receiverName: addressForm.name,
        receiverPhone: addressForm.phone,
        address: addressForm.address
      })

      // 立刻清理结算缓存（避免重复提交）
      sessionStorage.removeItem('checkoutItems')
      sessionStorage.removeItem('checkoutCartIds')

      // 收银台：支付 or 稍后支付
      await showCashier(orderSn)
    } catch (e) {
      // request.ts 已 toast，这里不重复
    } finally {
      submitting.value = false
    }
  })
}

const showCashier = async (orderSn: string) => {
  try {
    await ElMessageBox.confirm(
      `订单提交成功！订单号：${orderSn}\n需支付金额：¥${toMoney(totalPrice.value)}`,
      '收银台',
      {
        confirmButtonText: '立即支付 (模拟)',
        cancelButtonText: '稍后支付',
        type: 'success',
        center: true
      }
    )

    // ✅ 选择立即支付：调后端 pay
    await payOrder(orderSn)
    ElMessage.success('支付成功！')
    // 跳到订单列表（你 OrderList.vue 页面）并默认切到待发货
    router.push({ path: '/order/list', query: { tab: '1' } })
  } catch {
    ElMessage.info('已取消支付，请在订单列表中完成支付')
    router.push({ path: '/order/list', query: { tab: '0' } })
  }
}
</script>

<style scoped>
.confirm-container {
  max-width: 1100px;
  margin: 30px auto;
  padding: 0 20px;
}
.page-header { margin-bottom: 20px; display: flex; align-items: center; gap: 10px; }
.content-wrapper { display: flex; gap: 30px; }
.left-section { flex: 1; }
.right-section { width: 350px; }

.section-card { border-radius: 8px; }
.mt-20 { margin-top: 20px; }
.card-header { font-weight: bold; display: flex; justify-content: space-between; align-items: center; }
.sub-text { font-size: 12px; color: #999; font-weight: normal; }

.item-list { display: flex; flex-direction: column; gap: 15px; }
.order-item { display: flex; align-items: center; gap: 15px; padding-bottom: 15px; border-bottom: 1px solid #f0f0f0; }
.order-item:last-child { border-bottom: none; padding-bottom: 0; }
.thumb { width: 60px; height: 60px; border-radius: 4px; border: 1px solid #eee; }
.info { flex: 1; }
.name { font-size: 14px; color: #333; margin-bottom: 5px; }
.price { font-size: 12px; color: #999; }
.total { font-weight: bold; color: #333; }

.summary-card { position: sticky; top: 20px; border-radius: 8px; }
.summary-row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px; color: #666; }
.final-price { display: flex; justify-content: space-between; align-items: baseline; margin-top: 10px; margin-bottom: 20px; }
.final-price .label { font-weight: bold; }
.final-price .amount { font-size: 28px; color: #f56c6c; font-weight: bold; }

.address-preview {
  background: #fdf6ec;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  font-size: 12px;
  color: #e6a23c;
}

.pay-btn { width: 100%; font-weight: bold; }
</style>
