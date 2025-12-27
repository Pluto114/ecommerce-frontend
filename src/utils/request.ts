import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios';
import { ElMessage } from 'element-plus';
import router from '@/router'; // 稍后我们会配置路由，这里先引入
// 引入我们在上一步定义的通用响应结构
import type { Result } from '@/types';

// 创建 axios 实例
const service = axios.create({
  // 如果是生产环境(打包后)，用 Render 的地址；如果是开发环境，用本地
  baseURL: import.meta.env.PROD ? 'https://ecommerce-backend-ys07.onrender.com' : 'http://localhost:8080',
  timeout: 5000
});

// --- 请求拦截器 (Request Interceptor) ---
// 作用：每次发请求前，自动把 Token 塞进 Header
service.interceptors.request.use(
  (config) => {
    // 从 LocalStorage 获取 Token (登录时我们会存进去)
    const token = localStorage.getItem('token');
    
    if (token && config.headers) {
      // 文档 [cite: 30] 明确要求格式: Bearer <token_string> (注意 Bearer 后有空格)
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// --- 响应拦截器 (Response Interceptor) ---
// 作用：收到响应后，自动判断是成功还是失败
service.interceptors.response.use(
  (response: AxiosResponse) => {
    // res 是后端返回的 JSON 数据，结构符合 Result<T>
    const res = response.data as Result<any>;

    // 文档[cite: 23]: 当 code === 200 时，业务成功
    if (res.code === 200) {
      return res.data; // 脱壳：直接把 data 返回给页面，外层的 code/message 丢弃
    }

    // 文档[cite: 24]: 当 code !== 200 时，通过 UI 组件弹出 message
    ElMessage.error(res.message || '系统错误');
    return Promise.reject(new Error(res.message || 'Error'));
  },
  (error) => {
    // 文档[cite: 26]: HTTP 401/403 代表 Token 无效，强制跳转登录
    if (error.response) {
        if (error.response.status === 401 || error.response.status === 403) {
            ElMessage.error('登录已过期，请重新登录');
            localStorage.removeItem('token'); // 清除脏数据
            localStorage.removeItem('user');
            router.push('/login'); // 跳转登录页
        } else {
            ElMessage.error(error.message || '网络异常');
        }
    }
    return Promise.reject(error);
  }
);

export default service;