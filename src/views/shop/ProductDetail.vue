<template>
  <div class="detail-container">
    <div class="header-actions">
      <el-button class="back-btn" @click="handleBack" :icon="ArrowLeft" plain>返回列表</el-button>
    </div>

    <div class="content-wrapper">
      
      <div class="gallery-section" :class="{ 'ar-active': isARMode }">
        
        <video 
          ref="videoRef" 
          class="video-background" 
          v-show="isARMode" 
          playsinline 
          muted 
          autoplay
        ></video>

        <div v-show="is3DActive" class="canvas-wrapper" ref="canvasRef"></div>

        <div v-show="!is3DActive" class="image-view">
          <img :src="product?.mainImageUrl" alt="Product" />
          
          <div v-if="product?.modelUrl" class="overlay-btn">
            <el-button type="primary" size="large" round @click="init3DMode" :loading="loading3D">
              <el-icon class="mr-2"><View /></el-icon> 启动 3D 鉴赏
            </el-button>
          </div>
        </div>

        <div v-if="is3DActive" class="controls-ui">
          
          <div class="ar-toggle-wrapper">
             <el-tooltip content="体验黑科技：用手势控制模型" placement="top" :disabled="isARMode">
                <el-button 
                  :type="isARMode ? 'danger' : 'success'" 
                  circle 
                  size="large" 
                  @click="toggleARMode"
                  :loading="loadingCamera"
                  class="ar-btn"
                >
                  <el-icon v-if="!isARMode"><Camera /></el-icon>
                  <el-icon v-else><CloseBold /></el-icon>
                </el-button>
             </el-tooltip>
             <div class="ar-label" :class="{ 'text-green': isARMode }">
               {{ isARMode ? 'AR 模式已开启' : 'AR 手势操控' }}
             </div>
          </div>

          <el-button class="close-3d" circle size="small" @click="exit3DMode" v-if="!isARMode">
             <el-icon><Close /></el-icon>
          </el-button>

          <transition name="fade">
            <div v-if="isARMode" class="gesture-status">
               <div class="pulse-dot"></div>
               {{ handStatus }}
            </div>
          </transition>
        </div>

        <div v-if="loading3D" class="loading-overlay">
           <div class="loading-text">模型加载中 {{ loadProgress }}%</div>
        </div>

      </div>

      <div class="info-section">
        <h1>{{ product?.name }}</h1>
        <div class="price">¥ {{ product?.price }}</div>
        
        <div class="feature-tags">
          <el-tag>WebGL 渲染</el-tag>
          <el-tag type="success">AI 手势识别</el-tag>
        </div>

        <div class="desc-box">
          <p class="desc-title">交互说明：</p>
          <ul class="desc-list">
            <li><strong>常规模式：</strong> 使用鼠标左键旋转，右键平移，滚轮缩放。</li>
            <li><strong>AR 模式：</strong> 点击绿色相机图标，允许摄像头权限。举起手掌，用食指在空中划动即可控制旋转。</li>
          </ul>
        </div>
        
        <div class="actions">
          <el-input-number v-model="quantity" :min="1" />
          <el-button type="primary" size="large" color="#2c3e50" @click="addToCart">
            加入购物车
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, View, Camera, Close, CloseBold } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { Product } from '@/types'

// Three.js
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

// MediaPipe Hands
import { Hands } from '@mediapipe/hands'

const route = useRoute()
const router = useRouter()

// --- 状态定义 ---
const product = ref<Product | null>(null)
const quantity = ref(1)

// 模式状态
const is3DActive = ref(false) // 是否进入了 3D 视图
const isARMode = ref(false)   // 是否开启了 AR/摄像头
const loading3D = ref(false)
const loadingCamera = ref(false)
const loadProgress = ref(0)
const handStatus = ref('正在寻找手势...')

// --- DOM 引用 ---
const canvasRef = ref<HTMLDivElement>()
const videoRef = ref<HTMLVideoElement>()

// --- 引擎变量 ---
let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let controls: OrbitControls
let model: THREE.Group
let animationId: number
let hands: Hands
let cameraStream: MediaStream

// Mock Data
onMounted(() => {
  const id = Number(route.params.id)
  if (id === 101) {
    product.value = {
      id: 101, shopId: 1, name: 'Nike Air Zoom (3D版)', price: 899, stock: 50,
      mainImageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff', status: 1, createTime: '',
      modelUrl: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/MaterialsVariantsShoe/glTF-Binary/MaterialsVariantsShoe.glb'
    }
  } else {
    product.value = {
      id: 102, shopId: 1, name: '普通帆布鞋', price: 199, stock: 200,
      mainImageUrl: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77', status: 1, createTime: '', modelUrl: ''
    }
  }
})

// ================= Lv2: 3D 模式逻辑 =================

const init3DMode = async () => {
  if (!product.value?.modelUrl) return
  is3DActive.value = true
  loading3D.value = true

  await nextTick()
  // 初始化 Three.js (如果还没初始化过)
  if (!renderer) {
    initThreeScene()
  }
  
  // 加载模型
  loadModel(product.value.modelUrl)
}

const initThreeScene = () => {
  const container = canvasRef.value!
  const width = container.clientWidth
  const height = container.clientHeight

  // 1. Scene
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0xf5f7fa) // 默认浅灰背景

  // 2. Camera
  camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100)
  camera.position.set(0, 0, 0.5)

  // 3. Renderer (关键：alpha: true)
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setSize(width, height)
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  container.appendChild(renderer.domElement)

  // 4. Lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.8)
  scene.add(ambientLight)
  const dirLight = new THREE.DirectionalLight(0xffffff, 1.5)
  dirLight.position.set(2, 5, 5)
  scene.add(dirLight)

  // 5. Controls (默认开启鼠标控制)
  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  
  // 启动渲染循环
  animate()
}

const loadModel = (url: string) => {
  const loader = new GLTFLoader()
  loader.load(url, 
    (gltf) => {
      if (model) scene.remove(model)
      model = gltf.scene
      // 居中与缩放
      const box = new THREE.Box3().setFromObject(model)
      const center = box.getCenter(new THREE.Vector3())
      model.position.sub(center)
      
      scene.add(model)
      loading3D.value = false
    },
    (xhr) => {
      loadProgress.value = Math.round((xhr.loaded / xhr.total) * 100)
    },
    (err) => {
      console.error(err)
      loading3D.value = false
      ElMessage.error('模型加载失败')
      exit3DMode()
    }
  )
}

const exit3DMode = () => {
  is3DActive.value = false
  if (isARMode.value) stopAR() // 如果正在AR，先退AR
}

const animate = () => {
  animationId = requestAnimationFrame(animate)
  
  // 关键逻辑：如果在 AR 模式，OrbitControls 禁用（交给手势）；否则启用。
  if (isARMode.value) {
     controls.enabled = false
  } else {
     controls.enabled = true
     controls.update()
  }
  
  renderer.render(scene, camera)
}


// ================= Lv3: AR 模式逻辑 =================

const toggleARMode = async () => {
  if (isARMode.value) {
    stopAR()
  } else {
    await startAR()
  }
}

const startAR = async () => {
  loadingCamera.value = true
  try {
    // 1. 摄像头流
    const constraints = { video: { width: 1280, height: 720, facingMode: 'user' } }
    cameraStream = await navigator.mediaDevices.getUserMedia(constraints)
    
    if (videoRef.value) {
      videoRef.value.srcObject = cameraStream
      await videoRef.value.play()
    }

    // 2. 场景背景变透明 (露出 Video)
    scene.background = null 

    // 3. 初始化 MediaPipe (仅在首次点击时加载，节省资源)
    if (!hands) {
      hands = new Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
      })
      hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      })
      hands.onResults(onHandResults)
    }

    // 4. 启动 AI 检测循环
    detectHandsLoop()

    isARMode.value = true
    ElMessage.success('AR 引擎已启动，挥动你的手！')
  } catch (error) {
    console.error(error)
    ElMessage.error('摄像头启动失败或被拒绝')
  } finally {
    loadingCamera.value = false
  }
}

const stopAR = () => {
  isARMode.value = false
  handStatus.value = '正在寻找手势...'
  
  // 恢复背景色
  if (scene) scene.background = new THREE.Color(0xf5f7fa)
  
  // 停止视频流
  if (cameraStream) {
    cameraStream.getTracks().forEach(t => t.stop())
  }
  if (videoRef.value) {
    videoRef.value.srcObject = null
  }
}

// 循环检测手势
const detectHandsLoop = async () => {
  if (!isARMode.value || !videoRef.value) return
  if (videoRef.value.readyState >= 2) {
    await hands.send({ image: videoRef.value })
  }
  requestAnimationFrame(detectHandsLoop)
}

// 手势回调
const onHandResults = (results: any) => {
  if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
    handStatus.value = '已连接手部信号'
    const landmarks = results.multiHandLandmarks[0]
    
    // 使用食指指尖 (Index 8) 控制
    const x = landmarks[8].x
    const y = landmarks[8].y
    
    if (model) {
      // 简单的映射算法：手的位置映射到模型角度
      const sensitivity = 4.0
      const targetY = (x - 0.5) * sensitivity * Math.PI
      const targetX = (y - 0.5) * sensitivity * Math.PI
      
      // 平滑插值 (Lerp)
      model.rotation.y += (targetY - model.rotation.y) * 0.1
      model.rotation.x += (targetX - model.rotation.x) * 0.1
    }
  } else {
    handStatus.value = '请将手放入画面中...'
  }
}

const handleBack = () => {
  stopAR()
  router.back()
}

const addToCart = () => ElMessage.success('已加入购物车')

onUnmounted(() => {
  cancelAnimationFrame(animationId)
  stopAR()
  if (renderer) renderer.dispose()
})
</script>

<style scoped>
.detail-container {
  max-width: 1200px;
  margin: 20px auto;
  padding: 0 20px;
}
.header-actions { margin-bottom: 20px; }

.content-wrapper {
  display: flex;
  gap: 40px;
  background: white;
  padding: 30px;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.05);
  min-height: 600px;
}

/* ====== 左侧视窗核心样式 ====== */
.gallery-section {
  position: relative;
  flex: 0 0 60%; /* 占据 60% 宽度 */
  height: 500px;
  background: #f8f9fa;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s;
}

.gallery-section.ar-active {
  box-shadow: 0 0 0 4px #67c23a; /* AR 开启时的高亮边框 */
}

/* 1. 视频底层 */
.video-background {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  object-fit: cover;
  transform: scaleX(-1); /* 镜像 */
  z-index: 1; 
}

/* 2. Canvas 中间层 */
.canvas-wrapper {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  z-index: 10;
}

/* 3. 图片顶层 */
.image-view {
  width: 100%; height: 100%;
  display: flex; justify-content: center; align-items: center;
  position: relative;
  background: white;
  z-index: 20;
}
.image-view img {
  max-width: 80%; max-height: 80%;
  object-fit: contain;
}
.overlay-btn {
  position: absolute;
  bottom: 10%;
}

/* 4. UI 控制层 */
.controls-ui {
  position: absolute;
  bottom: 20px; left: 0; right: 0;
  z-index: 30; /* 最高层级 */
  display: flex;
  justify-content: center;
  pointer-events: none; /* 让点击穿透，不挡住鼠标旋转模型 */
}

.ar-toggle-wrapper {
  pointer-events: auto; /* 按钮可以点击 */
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.ar-btn {
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  width: 56px; height: 56px;
  font-size: 24px;
}
.ar-label {
  font-size: 12px; color: #666; font-weight: bold;
  background: rgba(255,255,255,0.8);
  padding: 2px 8px; border-radius: 4px;
}
.text-green { color: #67c23a; }

.close-3d {
  position: absolute;
  top: -420px; right: 20px; /* 右上角关闭 */
  pointer-events: auto;
}

.gesture-status {
  position: absolute;
  top: -450px; left: 20px; /* 左上角状态 */
  background: rgba(0,0,0,0.6);
  color: #fff;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  display: flex; align-items: center; gap: 8px;
}
.pulse-dot {
  width: 8px; height: 8px; background: #67c23a;
  border-radius: 50%;
  animation: pulse 1.5s infinite;
}

.loading-overlay {
  position: absolute; top:0; left:0; width:100%; height:100%;
  background: rgba(255,255,255,0.8);
  z-index: 50;
  display: flex; justify-content: center; align-items: center;
}

/* ====== 右侧信息样式 ====== */
.info-section { flex: 1; padding: 10px; }
.info-section h1 { font-size: 28px; margin-bottom: 10px; }
.price { font-size: 32px; color: #f56c6c; font-weight: bold; margin-bottom: 20px; }
.feature-tags { display: flex; gap: 10px; margin-bottom: 30px; }
.desc-box { 
  background: #f4f4f5; 
  padding: 15px; 
  border-radius: 8px; 
  margin-bottom: 40px; 
}
.desc-title { font-weight: bold; margin-bottom: 8px; font-size: 14px; }
.desc-list { 
  padding-left: 20px; margin: 0; font-size: 13px; color: #606266; line-height: 1.8; 
}
.actions { display: flex; gap: 15px; }

@keyframes pulse {
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(103, 194, 58, 0.7); }
  70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(103, 194, 58, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(103, 194, 58, 0); }
}

/* Vue Transition */
.fade-enter-active, .fade-leave-active { transition: opacity 0.5s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>