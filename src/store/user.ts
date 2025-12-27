import { defineStore } from 'pinia'
import { ref } from 'vue'
import request from '@/utils/request'
import type { UserLoginVO } from '@/types'

export const useUserStore = defineStore('user', () => {
  // --- State (状态) ---
  // 优先从 LocalStorage 取值，防止刷新页面后登录态丢失
  const token = ref(localStorage.getItem('token') || '')
  
  // 存储用户基本信息 (id, username, role)
  const userInfo = ref(JSON.parse(localStorage.getItem('user') || '{}'))

  // --- Actions (动作) ---
  
  // 登录动作
  async function login(loginForm: { username: string; password: string }) {
    // 1. 发送请求 (根据文档 3.1 认证模块)
    // request.post<请求体类型, 返回值类型>
    const data = await request.post<any, UserLoginVO>('/auth/login', loginForm)
    
    // 2. 更新 State
    token.value = data.token
    // 提取关键信息存入 Store
    userInfo.value = {
        id: data.id,
        username: data.username,
        role: data.role
    }

    // 3. 持久化到 LocalStorage (必须，否则一刷新就退出了)
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(userInfo.value))
  }

  // 登出动作
  function logout() {
    token.value = ''
    userInfo.value = {}
    localStorage.clear() // 清空所有本地存储
  }

  return { token, userInfo, login, logout }
})