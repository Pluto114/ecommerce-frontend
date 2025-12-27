<template>
  <el-card>
    <template #header>
      <div class="card-header">
        <span>用户管理</span>
        <el-button type="primary" @click="fetchData">刷新列表</el-button>
      </div>
    </template>

    <el-table :data="tableData" v-loading="loading" style="width: 100%" stripe>
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="username" label="用户名" />
      <el-table-column prop="role" label="角色">
        <template #default="scope">
          <el-tag v-if="scope.row.role === 1" type="danger">超管</el-tag>
          <el-tag v-else-if="scope.row.role === 2" type="warning">商家</el-tag>
          <el-tag v-else type="success">用户</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态">
        <template #default="scope">
          <el-switch 
            v-model="scope.row.status" 
            :active-value="1" 
            :inactive-value="0"
            @change="handleStatusChange(scope.row)"
          />
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="注册时间" />
      <el-table-column label="操作">
        <template #default="scope">
          <el-button link type="primary" @click="handleResetPwd(scope.row)">重置密码</el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import request from '@/utils/request' // 使用我们封装的 axios
import { ElMessage } from 'element-plus'
import type { User } from '@/types'

const loading = ref(false)
const tableData = ref<User[]>([])

// 获取用户列表
const fetchData = async () => {
  loading.value = true
  try {
    // 1. 发起请求
    const res: any = await request.post('/user/list', {
      pageNum: 1,
      pageSize: 100
    })

    // 2. 调试日志 (关键：按 F12 看看控制台打印了什么，确认后端到底返了什么)
    console.log('用户列表接口返回:', res)

    // 3. 智能判断数据结构
    if (Array.isArray(res)) {
      // 情况A: 后端直接返回了数组
      tableData.value = res
    } else if (res && Array.isArray(res.list)) {
      // 情况B: 后端返回 { list: [], total: 10 }
      tableData.value = res.list
    } else if (res && Array.isArray(res.records)) {
      // 情况C: 后端返回 { records: [], total: 10 } (MyBatis-Plus 默认格式)
      tableData.value = res.records
    } else if (res && Array.isArray(res.data)) {
      // 情况D: 后端返回 { data: [], ... }
      tableData.value = res.data
    } else {
      // 情况E: 格式不对，强行置空，防止报错 "not iterable"
      console.warn('未识别的数据格式，重置为空数组')
      tableData.value = [] 
    }

  } catch (error) {
    console.warn('后端连接失败或接口异常，切换到 Mock 数据模式')
    // Mock 数据 (确保这里是数组)
    tableData.value = [
      { id: 1, username: 'admin', role: 1, status: 1, createTime: '2025-12-20' },
      { id: 2, username: 'shop_owner', role: 2, status: 1, createTime: '2025-12-21' },
      { id: 3, username: 'jerry_buyer', role: 3, status: 0, createTime: '2025-12-22' },
    ]
  } finally {
    loading.value = false
  }
}

// 修改状态
const handleStatusChange = async (row: User) => {
  try {
    await request.put(`/user/status/${row.id}/${row.status}`)
    ElMessage.success('状态更新成功')
  } catch (error) {
    // 失败回调
    row.status = row.status === 1 ? 0 : 1
  }
}

// 重置密码
const handleResetPwd = async (row: User) => {
  try {
    await request.put(`/user/reset-password/${row.id}`)
    ElMessage.success(`用户 ${row.username} 密码已重置为 123456`)
  } catch (error) {}
}

onMounted(() => {
  fetchData()
})
</script>