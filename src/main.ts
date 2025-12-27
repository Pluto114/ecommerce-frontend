import { createApp } from 'vue'
import './style.css'
import App from './App.vue'

// 1. 引入 Element Plus 及其样式
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
// 引入图标注册器 (后续用到)
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

// 2. 引入 Pinia
import { createPinia } from 'pinia'

// 3. 引入 路由 (稍后我们会创建这个文件，现在先import只要不报错就行，或者先注释掉)
import router from './router' 

const app = createApp(App)

// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(createPinia())
app.use(ElementPlus)
app.use(router) // 暂时注释，等下创建了路由文件再解开

app.mount('#app')