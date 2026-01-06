<template>
  <el-card class="shop-card" v-loading="loading">
    <template #header>
      <div class="card-header">
        <div class="left">
          <span>我的店铺 (商家版)</span>
          <el-tag type="warning" effect="dark">多店铺</el-tag>
        </div>

        <div class="right">
          <el-select
            v-model="currentShopId"
            placeholder="请选择当前店铺"
            style="width: 240px"
            :disabled="shopList.length === 0"
            @change="handleShopChange"
          >
            <el-option
              v-for="s in shopList"
              :key="s.id"
              :label="`${s.name} (ID:${s.id})`"
              :value="s.id"
            />
          </el-select>

          <el-button type="primary" @click="startCreate">
            创建新店铺
          </el-button>
        </div>
      </div>
    </template>

    <!-- 没店铺 -->
    <el-empty
      v-if="shopList.length === 0 && !isEditing"
      description="您还没有创建店铺，无法发布商品"
    >
      <el-button type="primary" size="large" @click="startCreate">立即开店</el-button>
    </el-empty>

    <!-- 店铺列表 -->
    <div v-if="shopList.length > 0 && !isEditing" class="shop-list">
      <el-row :gutter="16">
        <el-col :xs="24" :sm="12" :md="8" v-for="s in shopList" :key="s.id">
          <el-card class="shop-item" shadow="hover">
            <div class="shop-item-header">
              <el-avatar :size="64" :src="s.logoUrl" class="shop-logo">
                {{ s.name ? s.name.charAt(0) : 'S' }}
              </el-avatar>
              <div class="shop-text">
                <div class="name-row">
                  <div class="name">{{ s.name }}</div>
                  <el-tag
                    size="small"
                    :type="s.status === 1 ? 'success' : 'info'"
                  >
                    {{ s.status === 1 ? '营业中' : '休息中' }}
                  </el-tag>
                </div>

                <div class="address">
                  <el-icon><Location /></el-icon>
                  <span>{{ s.address || '未填写地址' }}</span>
                </div>

                <div class="meta">
                  <span class="id-text">Shop ID: {{ s.id }}</span>
                  <el-tag v-if="s.id === currentShopId" type="primary" effect="dark" size="small">
                    当前店铺
                  </el-tag>
                </div>
              </div>
            </div>

            <el-divider />

            <div class="actions">
              <el-button
                type="primary"
                plain
                :disabled="s.id === currentShopId"
                @click="setAsCurrent(s.id)"
              >
                设为当前店铺
              </el-button>

              <el-button :icon="Edit" @click="startEdit(s)">编辑</el-button>

              <el-button type="danger" plain @click="handleDelete(s)">
                删除
              </el-button>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 编辑/创建表单 -->
    <el-dialog
      v-model="isEditing"
      :title="isCreating ? '创建新店铺' : '编辑店铺资料'"
      width="560px"
      destroy-on-close
    >
      <el-form :model="form" label-width="90px">
        <el-form-item label="店铺名称">
          <el-input v-model="form.name" placeholder="给你的店铺起个响亮的名字" />
        </el-form-item>

        <el-form-item label="店铺地址">
          <el-input v-model="form.address" placeholder="填写发货地址" />
        </el-form-item>

        <el-form-item label="Logo链接">
          <el-input v-model="form.logoUrl" placeholder="输入图片URL" />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSave" :loading="saving">保存提交</el-button>
          <el-button @click="cancelEdit">取消</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>
  </el-card>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Edit, Location } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'
import type { Shop } from '@/types'

const SHOP_ID_KEY = 'merchant_current_shop_id'

const loading = ref(false)
const saving = ref(false)
const isEditing = ref(false)
const isCreating = ref(false)

const shopList = ref<Shop[]>([])
const currentShopId = ref<number | null>(null)

const form = reactive({
  id: undefined as number | undefined,
  name: '',
  address: '',
  logoUrl: ''
})

const readStoredShopId = (): number | null => {
  const v = localStorage.getItem(SHOP_ID_KEY)
  if (!v) return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

const writeStoredShopId = (id: number | null) => {
  if (id == null) localStorage.removeItem(SHOP_ID_KEY)
  else localStorage.setItem(SHOP_ID_KEY, String(id))
}

/** 给其他页面一个“店铺已切换”的信号（ProductManage 会监听并刷新） */
const emitShopChanged = (id: number | null) => {
  window.dispatchEvent(new CustomEvent('shop-changed', { detail: { shopId: id } }))
}

const fetchShops = async () => {
  loading.value = true
  try {
    const res = await request.get<any, Shop[]>('/shop/my-list')
    shopList.value = res || []

    if (shopList.value.length === 0) {
      currentShopId.value = null
      writeStoredShopId(null)
      emitShopChanged(null)
      return
    }

    const stored = readStoredShopId()
    const found = stored ? shopList.value.find(s => s.id === stored) : undefined
    const id = found ? found.id : shopList.value[0].id

    currentShopId.value = id
    writeStoredShopId(id)
    emitShopChanged(id)
  } catch (e) {
    console.error(e)
    ElMessage.error('获取店铺列表失败')
  } finally {
    loading.value = false
  }
}

const setAsCurrent = (id: number) => {
  currentShopId.value = id
  writeStoredShopId(id)
  emitShopChanged(id)
  ElMessage.success('已切换当前店铺')
}

const handleShopChange = (id: number) => {
  setAsCurrent(id)
}

const startCreate = () => {
  isCreating.value = true
  isEditing.value = true
  form.id = undefined
  form.name = ''
  form.address = ''
  form.logoUrl = 'https://via.placeholder.com/150'
}

const startEdit = (shop: Shop) => {
  isCreating.value = false
  isEditing.value = true
  form.id = shop.id
  form.name = shop.name || ''
  form.address = shop.address || ''
  form.logoUrl = shop.logoUrl || ''
}

const cancelEdit = () => {
  isEditing.value = false
  isCreating.value = false
}

const handleSave = async () => {
  if (!form.name) return ElMessage.warning('店铺名不能为空')

  saving.value = true
  try {
    if (isCreating.value) {
      const created = await request.post<any, Shop>('/shop/add', {
        name: form.name,
        address: form.address,
        logoUrl: form.logoUrl,
        status: 1
      })
      ElMessage.success('店铺创建成功！')

      // 创建成功后：刷新列表并设为当前店铺（体验最顺）
      await fetchShops()
      if (created?.id) setAsCurrent(created.id)
    } else {
      await request.put('/shop/update', {
        id: form.id,
        name: form.name,
        address: form.address,
        logoUrl: form.logoUrl
      })
      ElMessage.success('店铺信息已更新')
      await fetchShops()
      // 若编辑的是当前店铺，保持 currentShopId 不变即可
    }

    isEditing.value = false
    isCreating.value = false
  } catch (e) {
    console.error(e)
  } finally {
    saving.value = false
  }
}

const handleDelete = async (shop: Shop) => {
  await ElMessageBox.confirm(
    `确定要删除店铺「${shop.name}」吗？（该操作会删除店铺本身，店铺下商品/订单的处理取决于后端约束）`,
    '警告',
    { type: 'warning' }
  )

  try {
    await request.delete(`/shop/${shop.id}`)
    ElMessage.success('已删除')

    // 如果删的是当前店铺，切到第一个或置空
    const wasCurrent = shop.id === currentShopId.value
    await fetchShops()
    if (wasCurrent) {
      const next = shopList.value.length > 0 ? shopList.value[0].id : null
      currentShopId.value = next
      writeStoredShopId(next)
      emitShopChanged(next)
    }
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  fetchShops()
})
</script>

<style scoped>
.shop-card {
  max-width: 1100px;
  margin: 20px auto;
  min-height: 500px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.left {
  display: flex;
  gap: 12px;
  align-items: center;
}
.right {
  display: flex;
  gap: 12px;
  align-items: center;
}
.shop-list {
  padding: 8px 8px 20px 8px;
}
.shop-item {
  margin-bottom: 16px;
  border-radius: 10px;
}
.shop-item-header {
  display: flex;
  gap: 14px;
  align-items: center;
}
.shop-text {
  flex: 1;
  min-width: 0;
}
.name-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}
.name {
  font-size: 16px;
  font-weight: 700;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.address {
  color: #666;
  margin-top: 6px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
}
.meta {
  margin-top: 8px;
  display: flex;
  gap: 10px;
  align-items: center;
}
.id-text {
  font-size: 12px;
  color: #999;
}
.actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  flex-wrap: wrap;
}
.shop-logo {
  border: 1px solid #f0f0f0;
}
</style>
