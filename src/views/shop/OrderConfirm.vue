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
                <div class="price">¥ {{ item.price }} x {{ item.quantity }}</div>
              </div>
              <div class="total">¥ {{ (item.price * item.quantity).toFixed(2) }}</div>
            </div>
          </div>
        </el-card>
      </div>

      <div class="right-section">
        <el-card shadow="hover" class="summary-card">
          <div class="summary-row">
            <span>商品总额</span>
            <span>¥ {{ totalPrice.toFixed(2) }}</span>
          </div>
          <div class="summary-row">
            <span>运费</span>
            <span>¥ 0.00</span>
          </div>
          <el-divider />
          <div class="final-price">
            <span class="label">应付金额:</span>
            <span class="amount">¥ {{ totalPrice.toFixed(2) }}</span>
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
import { useRouter } from 'vue-router'
import { ArrowLeft, Location, Goods } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox, ElLoading } from 'element-plus'
import type { FormInstance } from 'element-plus'
import type { CartVO } from '@/types'

const router = useRouter()
const checkoutItems = ref<CartVO[]>([])
const submitting = ref(false)
const formRef = ref<FormInstance>()

// 表单数据
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

// 初始化：从 sessionStorage 读取数据
onMounted(() => {
  const data = sessionStorage.getItem('checkoutItems')
  if (data) {
    checkoutItems.value = JSON.parse(data)
  } else {
    ElMessage.error('没有结算商品，返回购物车')
    router.replace('/cart')
  }
})

// 提交订单
const handleSubmitOrder = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      
      // --- 模拟调用后端下单接口 ---
      // const res = await request.post('/order/create', { ... })
      
      setTimeout(() => {
        submitting.value = false
        // 模拟生成订单号
        const mockOrderSn = 'ORD' + Date.now()
        
        // 弹出模拟支付窗口
        ElMessageBox.confirm(
          `订单提交成功！订单号：${mockOrderSn}\n需支付金额：¥${totalPrice.value}`,
          '收银台',
          {
            confirmButtonText: '立即支付 (模拟)',
            cancelButtonText: '稍后支付',
            type: 'success',
            center: true
          }
        ).then(() => {
          // 支付成功逻辑
          ElMessage.success('支付成功！')
          // 清空购物车缓存
          sessionStorage.removeItem('checkoutItems')
          // 这里可以跳转到“我的订单”页（暂未开发，先回首页）
          router.push('/home')
        }).catch(() => {
          ElMessage.info('已取消支付，请在订单列表中查看')
          router.push('/home')
        })
        
      }, 1500)
    }
  })
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

/* 商品列表 */
.item-list { display: flex; flex-direction: column; gap: 15px; }
.order-item { display: flex; align-items: center; gap: 15px; padding-bottom: 15px; border-bottom: 1px solid #f0f0f0; }
.order-item:last-child { border-bottom: none; padding-bottom: 0; }
.thumb { width: 60px; height: 60px; border-radius: 4px; border: 1px solid #eee; }
.info { flex: 1; }
.name { font-size: 14px; color: #333; margin-bottom: 5px; }
.price { font-size: 12px; color: #999; }
.total { font-weight: bold; color: #333; }

/* 右侧结算栏 */
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