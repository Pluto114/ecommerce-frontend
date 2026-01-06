import { defineStore } from 'pinia'
import { ref } from 'vue'
import request from '@/utils/request'
import type { UserLoginVO } from '@/types'
import { ElMessage } from 'element-plus'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '')
  const userInfo = ref(JSON.parse(localStorage.getItem('user') || '{}'))

  // 1. 登录 (无需改动逻辑，后端支持 username 字段传邮箱)
  async function login(loginForm: { username: string; password: string }) {
    const data = await request.post<any, UserLoginVO>('/auth/login', loginForm)
    token.value = data.token
    userInfo.value = {
        id: data.id,
        username: data.username,
        role: data.role,
        token: data.token
    }
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(userInfo.value))
    return data 
  }

  // 2. 旧的普通注册 (保留，防备用)
  async function register(regForm: any) {
    await request.post('/auth/register', regForm)
  }

  // 3. [新增] 邮箱注册 Action
  async function registerByEmail(payload: { 
    email: string; 
    emailCode: string; 
    password: string; 
    username?: string 
  }) {
    // 对应接口 3) 邮箱注册
    await request.post('/auth/register/email', payload)
  }

  function logout() {
    token.value = ''
    userInfo.value = {}
    localStorage.clear() 
    ElMessage.success('已安全退出')
  }

  return { token, userInfo, login, register, registerByEmail, logout }
})