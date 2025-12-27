<template>
  <div class="login-container">
    <div class="brand-section">
      <h1 class="brand-title">Jerry's Amazon</h1>
      <p class="brand-slogan">Next Generation E-Commerce Platform</p>
    </div>
    
    <el-card class="login-card">
      <template #header>
        <div class="card-header">
          <span>Admin / User Login</span>
        </div>
      </template>
      
      <el-form 
        ref="loginFormRef"
        :model="loginForm"
        :rules="rules"
        label-position="top"
        size="large"
      >
        <el-form-item label="Username" prop="username">
          <el-input 
            v-model="loginForm.username" 
            placeholder="admin / manager / user"
            :prefix-icon="User"
          />
        </el-form-item>
        
        <el-form-item label="Password" prop="password">
          <el-input 
            v-model="loginForm.password" 
            type="password" 
            placeholder="Default: 123456"
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
import { UserRole } from '@/types'

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
        ElMessage.success('Welcome back, Jerry!')
        
        const role = userStore.userInfo.role
        // 路由跳转逻辑
        if (role === UserRole.ADMIN) {
           router.push('/admin/user') 
        } else if (role === UserRole.MANAGER) {
           router.push('/admin/product')
        } else {
           router.push('/home')
        }
      } catch (error) {
        console.error(error)
      } finally {
        loading.value = false
      }
    }
  })
}
</script>

<style scoped>
.login-container {
  height: 100vh;
  width: 100vw;
  display: flex;
  /* 左侧品牌，右侧登录框的布局 */
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  align-items: center;
  justify-content: center;
  gap: 100px;
}

.brand-section {
  text-align: left;
}
.brand-title {
  font-size: 3.5rem;
  font-weight: 800;
  color: #2c3e50;
  margin: 0;
  letter-spacing: -2px;
}
.brand-slogan {
  font-size: 1.5rem;
  color: #606266;
  margin-top: 10px;
}

.login-card {
  width: 400px;
  border-radius: 12px;
  box-shadow: 0 20px 50px rgba(0,0,0,0.1);
  border: none;
}

.login-button {
  width: 100%;
  height: 45px;
  font-size: 16px;
  font-weight: bold;
}

.tips {
  margin-top: 20px;
  font-size: 12px;
  color: #909399;
  text-align: center;
}
</style>