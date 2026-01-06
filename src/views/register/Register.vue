<template>
  <div class="login-container">
    <div class="brand-section">
      <h1 class="brand-title">加入我们</h1>
      <p class="brand-slogan">Create your account with Email.</p>
    </div>
    
    <el-card class="login-card">
      <template #header>
        <div class="card-header">
          <span>邮箱注册</span>
          <el-button link type="primary" @click="router.push('/login')">
            返回登录
          </el-button>
        </div>
      </template>
      
      <el-form 
        ref="regFormRef"
        :model="regForm"
        :rules="rules"
        label-position="top"
        size="large"
      >
        <el-form-item label="邮箱地址" prop="email">
          <el-input 
            v-model="regForm.email" 
            placeholder="example@outlook.com"
            :prefix-icon="Message"
          />
        </el-form-item>

        <el-form-item label="图形验证码" prop="captchaCode">
          <div class="captcha-row">
            <el-input 
              v-model="regForm.captchaCode" 
              placeholder="输入右侧字符"
              style="flex: 1"
            />
            <div class="captcha-img-box" @click="getCaptcha" title="点击刷新验证码">
  <img v-if="captchaBase64" :src="captchaBase64" alt="验证码" />
  <div v-else class="captcha-loading">加载中...</div>
  <div class="captcha-refresh">换一张</div>
</div>

          </div>
        </el-form-item>

        <el-form-item label="邮箱验证码" prop="emailCode">
          <div class="captcha-row">
            <el-input 
              v-model="regForm.emailCode" 
              placeholder="收到的6位数字"
              style="flex: 1"
              :prefix-icon="Key"
            />
            <el-button 
              type="primary" 
              plain 
              :disabled="timer > 0" 
              @click="handleSendEmailCode"
              style="width: 120px"
            >
              {{ timer > 0 ? `${timer}s后重发` : '发送验证码' }}
            </el-button>
          </div>
        </el-form-item>
        
        <el-form-item label="设置密码" prop="password">
          <el-input 
            v-model="regForm.password" 
            type="password" 
            placeholder="8位以上密码"
            :prefix-icon="Lock"
            show-password
          />
        </el-form-item>

        <el-form-item label="用户昵称 (可选)" prop="username">
          <el-input 
            v-model="regForm.username" 
            placeholder="您的显示名称"
            :prefix-icon="User"
          />
        </el-form-item>

        <el-form-item>
          <el-button 
            type="success" 
            :loading="loading" 
            class="login-button" 
            @click="handleRegister"
          >
            立即注册
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { User, Lock, Message, Key } from '@element-plus/icons-vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import request from '@/utils/request' // 直接引入request用于调用验证码接口

const router = useRouter()
const userStore = useUserStore()
const regFormRef = ref<FormInstance>()
const loading = ref(false)

// 验证码状态
const captchaBase64 = ref('')
const captchaKey = ref('') // 后端返回的key，发送邮件时要带上

// 倒计时状态
const timer = ref(0)
let intervalId: any = null

const regForm = reactive({
  email: '',
  captchaCode: '', // 图形验证码用户输入
  emailCode: '',   // 邮箱验证码用户输入
  password: '',
  username: ''     // 可选
})

// 校验规则
const rules = reactive<FormRules>({
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' }
  ],
  captchaCode: [{ required: true, message: '请输入图形验证码', trigger: 'blur' }],
  emailCode: [{ required: true, message: '请输入邮箱验证码', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }, { min: 6, message: '密码至少6位', trigger: 'blur' }]
})

// 1. 获取图形验证码
const getCaptcha = async () => {
  try {
    // 对应接口 1) GET /auth/captcha
    const res = await request.get<any, any>('/auth/captcha')
    if (res) {
      captchaKey.value = res.captchaKey
      captchaBase64.value = res.captchaImg
    }
  } catch (e) {
    console.error('获取验证码失败', e)
  }
}

// 2. 发送邮箱验证码
const handleSendEmailCode = async () => {
  // 先校验邮箱和图形验证码是否填了
  if (!regForm.email || !regForm.captchaCode) {
    return ElMessage.warning('请先填写邮箱和图形验证码')
  }
  
  try {
    // 对应接口 2) POST /auth/email/send-code
    await request.post('/auth/email/send-code', {
      email: regForm.email,
      captchaKey: captchaKey.value,
      captchaCode: regForm.captchaCode
    })
    
    ElMessage.success('验证码已发送至邮箱，请查收')
    
    // 开始倒计时
    timer.value = 60
    intervalId = setInterval(() => {
      timer.value--
      if (timer.value <= 0) {
        clearInterval(intervalId)
      }
    }, 1000)

  } catch (e) {
    // 如果失败（比如图形验证码错误），通常需要刷新图形验证码
    getCaptcha()
    regForm.captchaCode = '' // 清空错误的输入
  }
}

// 3. 注册提交
const handleRegister = async () => {
  if (!regFormRef.value) return
  await regFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        // 对应接口 3) POST /auth/register/email
        await userStore.registerByEmail({
          email: regForm.email,
          emailCode: regForm.emailCode,
          password: regForm.password,
          username: regForm.username || undefined // 如果空传undefined
        })
        
        ElMessage.success('注册成功！请登录')
        router.push('/login')
      } catch (error) {
        console.error('注册失败', error)
      } finally {
        loading.value = false
      }
    }
  })
}

// 生命周期
onMounted(() => {
  getCaptcha() // 进页面先加载验证码
})
onUnmounted(() => {
  if (intervalId) clearInterval(intervalId)
})
</script>

<style scoped>
/* 保持原有布局风格 */
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
.captcha-refresh {
  position: absolute;
  right: 6px;
  bottom: 3px;
  font-size: 12px;
  color: #409eff;
  background: rgba(255,255,255,0.75);
  padding: 0 4px;
  border-radius: 4px;
  line-height: 18px;
  user-select: none;
}
/* 验证码行样式 */
.captcha-row {
  display: flex;
  gap: 10px;
  width: 100%;
}
.captcha-img-box {
  width: 140px;          /* ✅ 放大 */
  height: 44px;          /* ✅ 稍微高一点更清晰 */
  flex: 0 0 140px;       /* ✅ 不被挤压 */
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  cursor: pointer;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  position: relative;    /* 给“换一张”定位用 */
}

.captcha-img-box img {
  width: 100%;
  height: 100%;
  object-fit: contain;   /* ✅ 关键：完整显示，不裁切 */
  image-rendering: auto;
}
.captcha-loading {
  font-size: 12px;
  color: #909399;
}

@media screen and (max-width: 768px) {
  .login-container { flex-direction: column; gap: 30px; padding: 20px; overflow-y: auto; }
  .brand-section { text-align: center; margin-top: 40px; }
  .login-card { width: 100%; max-width: 400px; margin-bottom: 40px; }
}
</style>