import axios, { type AxiosResponse } from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'
import type { Result } from '@/types'

const SHOP_ID_KEY = 'merchant_current_shop_id' // ✅ 新增：当前店铺ID存储key

const service = axios.create({
  baseURL: import.meta.env.PROD ? '/api' : 'http://localhost:8080',
  

  timeout: 15000 // 全局默认 15s；上传会单独更长
})

service.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // ✅ 新增：商家端/商品端统一携带 shopId（后端从 Header 取 X-Shop-Id）
    // 只要本地存在 shopId，就带上；公共接口带了也不会有副作用
    const shopId = localStorage.getItem(SHOP_ID_KEY)
    if (shopId && config.headers) {
      ;(config.headers as any)['X-Shop-Id'] = shopId
    }

    // 关键：FormData 不要手动写 Content-Type，让浏览器自动带 boundary
    if (config.data instanceof FormData && config.headers) {
      delete (config.headers as any)['Content-Type']
    }

    return config
  },
  (error) => Promise.reject(error)
)

service.interceptors.response.use(
  (response: AxiosResponse) => {
    const data = response.data

    // 兼容：如果后端是统一 Result<T>，则按 code 解包
    if (data && typeof data === 'object' && 'code' in data) {
      const res = data as Result<any>
      if (res.code === 200) return res.data
      ElMessage.error(res.message || '系统错误')
      return Promise.reject(new Error(res.message || 'Error'))
    }

    // 非统一结构就原样返回
    return data
  },
  (error) => {
    // 401/403：登录过期
    if (error.response) {
      const status = error.response.status
      if (status === 401 || status === 403) {
        ElMessage.error('登录已过期，请重新登录')
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        localStorage.removeItem(SHOP_ID_KEY) // ✅ 新增：顺手清掉店铺上下文
        router.push('/login')
      } else {
        // 尽量读到后端返回的 message
        const msg =
          error.response.data?.message ||
          error.response.data?.msg ||
          error.message ||
          '网络异常'
        ElMessage.error(msg)
      }
    } else {
      ElMessage.error(error.message || '网络异常')
    }
    return Promise.reject(error)
  }
)

export default service
