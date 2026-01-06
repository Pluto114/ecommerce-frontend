<template>
  <div class="detail-container" v-loading="pageLoading">
    <div class="header-actions">
      <el-button class="back-btn" @click="handleBack" :icon="ArrowLeft" plain>返回列表</el-button>
    </div>

    <div class="content-wrapper" v-if="product">
      
      <div class="gallery-section" :class="{ 'ar-active': isARMode }">
        
        <video ref="videoRef" class="video-background" v-show="isARMode" playsinline muted autoplay></video>

        <div v-show="is3DActive" class="canvas-wrapper" ref="canvasRef"></div>

        <div v-show="!is3DActive" class="image-view">
          <el-image :src="product.mainImageUrl" fit="contain" class="main-img">
            <template #error>
              <div class="image-error">
                <el-icon><Picture /></el-icon>
                <span>图片加载失败</span>
              </div>
            </template>
          </el-image>
          
          <div v-if="product.modelUrl" class="overlay-btn">
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
        <h1>{{ product.name }}</h1>
        <div class="price">¥ {{ product.price }}</div>
        
        <div class="feature-tags">
          <el-tag>官方正品</el-tag>
          <el-tag v-if="product.modelUrl" type="success">支持 3D / AR</el-tag>
          <el-tag type="info">库存: {{ product.stock }}</el-tag>
        </div>

        <div class="desc-box">
          <p class="desc-title">商品简介：</p>
          <p class="desc-content">
             {{ product.modelUrl ? '该商品支持 WebGL 实时渲染与 AI 手势交互。' : '该商品暂未上传 3D 模型，仅支持图片预览。' }}
          </p>
        </div>
        
        <div class="actions">
          <el-input-number v-model="quantity" :min="1" :max="product.stock" />
          <el-button type="primary" size="large" color="#2c3e50" @click="addToCart">
            加入购物车
          </el-button>
        </div>
      </div>
    </div>
    
    <el-empty v-else description="未找到该商品信息" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, View, Camera, Close, CloseBold, Picture } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import request from '@/utils/request' // 真实请求
import type { Product } from '@/types'

// Three.js & MediaPipe
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { Hands } from '@mediapipe/hands'

const route = useRoute()
const router = useRouter()

// --- 状态 ---
const pageLoading = ref(true)
const product = ref<Product | null>(null)
const quantity = ref(1)

// 3D/AR 状态
const is3DActive = ref(false)
const isARMode = ref(false)
const loading3D = ref(false)
const loadingCamera = ref(false)
const loadProgress = ref(0)
const handStatus = ref('正在寻找手势...')

// DOM Refs
const canvasRef = ref<HTMLDivElement>()
const videoRef = ref<HTMLVideoElement>()

// Engine Vars
let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let controls: OrbitControls
let model: THREE.Group
let animationId: number
let hands: Hands
let cameraStream: MediaStream

// --- 1. 获取真实商品详情 ---
const fetchProductDetail = async () => {
  pageLoading.value = true
  const id = route.params.id
  try {
    // 对应后端文档接口: GET /product/detail/{id}
    const res = await request.get<any, Product>(`/product/detail/${id}`)
    product.value = res
  } catch (error) {
    console.error('获取商品详情失败', error)
    ElMessage.error('商品不存在或已下架')
  } finally {
    pageLoading.value = false
  }
}

// --- 2. 加入购物车 (真实接口) ---
const addToCart = async () => {
  if (!product.value) return
  try {
    await request.post('/cart/add', {
      productId: product.value.id,
      quantity: quantity.value
    })
    ElMessage.success('成功加入购物车！')
  } catch (error) {
    console.error(error)
  }
}

// --- 3. 3D 模式逻辑 (复用之前代码) ---
const init3DMode = async () => {
  if (!product.value?.modelUrl) return
  is3DActive.value = true
  loading3D.value = true
  await nextTick()
  if (!renderer) initThreeScene()
  loadModel(product.value.modelUrl)
}

const initThreeScene = () => {
  const container = canvasRef.value!
  const width = container.clientWidth
  const height = container.clientHeight
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0xf5f7fa)
  camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100)
  camera.position.set(0, 0, 0.5)
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setSize(width, height)
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  container.appendChild(renderer.domElement)
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.8)
  scene.add(ambientLight)
  const dirLight = new THREE.DirectionalLight(0xffffff, 1.5)
  dirLight.position.set(2, 5, 5)
  scene.add(dirLight)
  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  animate()
}

const loadModel = (url: string) => {
  const loader = new GLTFLoader()
  loader.load(url, (gltf) => {
    if (model) scene.remove(model)
    model = gltf.scene
    const box = new THREE.Box3().setFromObject(model)
    const center = box.getCenter(new THREE.Vector3())
    model.position.sub(center)
    scene.add(model)
    loading3D.value = false
  }, (xhr) => {
    loadProgress.value = Math.round((xhr.loaded / xhr.total) * 100)
  }, (err) => {
    console.error(err)
    loading3D.value = false
    ElMessage.error('3D模型加载失败 (跨域或地址错误)')
    exit3DMode()
  })
}

const exit3DMode = () => {
  is3DActive.value = false
  if (isARMode.value) stopAR()
}

const animate = () => {
  animationId = requestAnimationFrame(animate)
  if (isARMode.value) {
     controls.enabled = false
  } else {
     controls.enabled = true
     controls.update()
  }
  renderer.render(scene, camera)
}

// --- 4. AR 模式逻辑 (复用之前代码) ---
const toggleARMode = async () => {
  if (isARMode.value) { stopAR() } else { await startAR() }
}

const startAR = async () => {
  loadingCamera.value = true
  try {
    const constraints = { video: { width: 1280, height: 720, facingMode: 'user' } }
    cameraStream = await navigator.mediaDevices.getUserMedia(constraints)
    if (videoRef.value) {
      videoRef.value.srcObject = cameraStream
      await videoRef.value.play()
    }
    scene.background = null 
    if (!hands) {
      hands = new Hands({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}` })
      hands.setOptions({ maxNumHands: 1, modelComplexity: 1, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 })
      hands.onResults(onHandResults)
    }
    detectHandsLoop()
    isARMode.value = true
    ElMessage.success('AR 引擎已启动')
  } catch (error) {
    ElMessage.error('无法启动摄像头')
  } finally {
    loadingCamera.value = false
  }
}

const stopAR = () => {
  isARMode.value = false
  if (scene) scene.background = new THREE.Color(0xf5f7fa)
  if (cameraStream) cameraStream.getTracks().forEach(t => t.stop())
  if (videoRef.value) videoRef.value.srcObject = null
}

const detectHandsLoop = async () => {
  if (!isARMode.value || !videoRef.value) return
  if (videoRef.value.readyState >= 2) await hands.send({ image: videoRef.value })
  requestAnimationFrame(detectHandsLoop)
}

const onHandResults = (results: any) => {
  if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
    handStatus.value = '已连接手部信号'
    const landmarks = results.multiHandLandmarks[0]
    const x = landmarks[8].x
    const y = landmarks[8].y
    if (model) {
      const sensitivity = 4.0
      const targetY = (x - 0.5) * sensitivity * Math.PI
      const targetX = (y - 0.5) * sensitivity * Math.PI
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

onMounted(() => {
  fetchProductDetail()
})

onUnmounted(() => {
  cancelAnimationFrame(animationId)
  stopAR()
  if (renderer) renderer.dispose()
})
</script>

<style scoped>
/* 样式复用之前的，保持不变 */
.detail-container { max-width: 1200px; margin: 20px auto; padding: 0 20px; }
.header-actions { margin-bottom: 20px; }
.content-wrapper { display: flex; gap: 40px; background: white; padding: 30px; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); min-height: 600px; }
.gallery-section { position: relative; flex: 0 0 60%; height: 500px; background: #f8f9fa; border-radius: 12px; overflow: hidden; transition: all 0.3s; }
.gallery-section.ar-active { box-shadow: 0 0 0 4px #67c23a; }
.video-background { position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; transform: scaleX(-1); z-index: 1; }
.canvas-wrapper { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 10; }
.image-view { width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; position: relative; background: white; z-index: 20; }
.main-img { max-width: 80%; max-height: 80%; }
.image-error { display: flex; flex-direction: column; align-items: center; color: #909399; font-size: 14px; }
.overlay-btn { position: absolute; bottom: 10%; }
.controls-ui { position: absolute; bottom: 20px; left: 0; right: 0; z-index: 30; display: flex; justify-content: center; pointer-events: none; }
.ar-toggle-wrapper { pointer-events: auto; display: flex; flex-direction: column; align-items: center; gap: 8px; }
.ar-btn { box-shadow: 0 4px 12px rgba(0,0,0,0.2); width: 56px; height: 56px; font-size: 24px; }
.ar-label { font-size: 12px; color: #666; font-weight: bold; background: rgba(255,255,255,0.8); padding: 2px 8px; border-radius: 4px; }
.text-green { color: #67c23a; }
.close-3d { position: absolute; top: -420px; right: 20px; pointer-events: auto; }
.gesture-status { position: absolute; top: -450px; left: 20px; background: rgba(0,0,0,0.6); color: #fff; padding: 6px 12px; border-radius: 20px; font-size: 12px; display: flex; align-items: center; gap: 8px; }
.pulse-dot { width: 8px; height: 8px; background: #67c23a; border-radius: 50%; animation: pulse 1.5s infinite; }
.loading-overlay { position: absolute; top:0; left:0; width:100%; height:100%; background: rgba(255,255,255,0.8); z-index: 50; display: flex; justify-content: center; align-items: center; }
.info-section { flex: 1; padding: 10px; }
.info-section h1 { font-size: 28px; margin-bottom: 10px; }
.price { font-size: 32px; color: #f56c6c; font-weight: bold; margin-bottom: 20px; }
.feature-tags { display: flex; gap: 10px; margin-bottom: 30px; }
.desc-box { background: #f4f4f5; padding: 15px; border-radius: 8px; margin-bottom: 40px; }
.desc-title { font-weight: bold; margin-bottom: 8px; font-size: 14px; }
.desc-content { font-size: 14px; color: #606266; line-height: 1.6; }
.actions { display: flex; gap: 15px; }
@keyframes pulse { 0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(103, 194, 58, 0.7); } 70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(103, 194, 58, 0); } 100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(103, 194, 58, 0); } }
.fade-enter-active, .fade-leave-active { transition: opacity 0.5s; } .fade-enter-from, .fade-leave-to { opacity: 0; }
</style>