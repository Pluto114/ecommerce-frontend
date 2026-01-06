<template>
  <div class="login-container">
    <div class="brand-section">
      <h1 class="brand-title">Jerry's Amazon</h1>
      <p class="brand-slogan">Next Generation E-Commerce Platform</p>
    </div>
    
    <el-card class="login-card">
      <template #header>
        <div class="card-header">
          <span>Sign In</span>
          <el-button link type="primary" @click="router.push('/register')">
            Create Account
          </el-button>
        </div>
      </template>
      
      <el-form 
        ref="loginFormRef"
        :model="loginForm"
        :rules="rules"
        label-position="top"
        size="large"
      >
        <el-form-item label="账号" prop="username">
  <el-input 
    v-model="loginForm.username" 
    placeholder="请输入用户名 或 邮箱" 
    :prefix-icon="User"
  />
</el-form-item>
        
        <el-form-item label="Password" prop="password">
          <el-input 
            v-model="loginForm.password" 
            type="password" 
            placeholder="Enter your password"
            :prefix-icon="Lock"
            show-password
            @keyup.enter="handleLogin"
          />
        </el-form-item>

        <el-form-item>
          <el-button 
            type="primary" 
            :loading="loading" 
            class="login-button" 
            @click="handleLogin"
            color="#2c3e50" 
          >
            Sign In
          </el-button>
        </el-form-item>
      </el-form>
      
      <div class="tips">
        <p>Admin: admin / 123456</p>
        <p>User: user / 123456</p>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { User, Lock } from '@element-plus/icons-vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
// 注意：后端返回的 role 是数字，前端最好定义枚举映射
// 1: Admin, 2: Manager, 3: User
const UserRole = { ADMIN: 1, MANAGER: 2, USER: 3 }

const router = useRouter()
const userStore = useUserStore()
const loginFormRef = ref<FormInstance>()
const loading = ref(false)

const loginForm = reactive({
  username: '',
  password: ''
})

const rules = reactive<FormRules>({
  username: [{ required: true, message: 'Required', trigger: 'blur' }],
  password: [{ required: true, message: 'Required', trigger: 'blur' }]
})

const handleLogin = async () => {
  if (!loginFormRef.value) return
  await loginFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        await userStore.login(loginForm)
        ElMessage.success('Login Successful!')
        
        // 根据后端返回的 role 进行跳转
        const role = userStore.userInfo.role
        
        if (role === UserRole.ADMIN) {
           router.push('/admin/user') 
        } else if (role === UserRole.MANAGER) {
           router.push('/admin/product')
        } else {
           // 普通用户跳转首页
           router.push('/home')
        }
      } catch (error) {
        console.error('Login failed', error)
      } finally {
        loading.value = false
      }
    }
  })
}
</script>

<style scoped>
/* 样式保持你原来的不变，完美复用 */
.login-container {
  min-height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: row; 
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  overflow: hidden; 
  gap: 100px;
}
.brand-section { text-align: left; max-width: 400px; }
.brand-title { font-size: 3.5rem; font-weight: 800; color: #2c3e50; margin: 0; letter-spacing: -2px; line-height: 1.2; }
.brand-slogan { font-size: 1.5rem; color: #606266; margin-top: 10px; }
.login-card { width: 400px; border-radius: 12px; box-shadow: 0 20px 50px rgba(0,0,0,0.1); border: none; background-color: rgba(255, 255, 255, 0.95); }
.card-header { display: flex; justify-content: space-between; align-items: center; font-weight: bold; }
.login-button { width: 100%; height: 45px; font-size: 16px; font-weight: bold; }
.tips { margin-top: 20px; font-size: 12px; color: #909399; text-align: center; }

@media screen and (max-width: 768px) {
  .login-container { flex-direction: column; gap: 30px; padding: 20px; overflow-y: auto; }
  .brand-section { text-align: center; margin-top: 40px; }
  .brand-title { font-size: 2.5rem; }
  .brand-slogan { font-size: 1rem; }
  .login-card { width: 100%; max-width: 400px; margin-bottom: 40px; }
}
</style>