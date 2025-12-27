import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useUserStore } from '@/store/user'
import { UserRole } from '@/types' 

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/home' 
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/Login.vue'), 
    meta: { title: '登录' }
  },
  
  // ================= 商城前台 (Role 3: User) =================
  {
    path: '/home',
    name: 'Home',
    component: () => import('@/views/shop/Home.vue'),
    meta: { title: '商城首页', role: UserRole.USER }
  },
  {
    path: '/cart',
    name: 'Cart',
    component: () => import('@/views/shop/Cart.vue'),
    meta: { title: '购物车', role: UserRole.USER }
  },
  {
    path: '/product/:id', 
    name: 'ProductDetail',
    component: () => import('@/views/shop/ProductDetail.vue'),
    meta: { title: '商品详情' } 
  },
  {
    path: '/order/confirm',
    name: 'OrderConfirm',
    component: () => import('@/views/shop/OrderConfirm.vue'),
    meta: { title: '确认订单', role: UserRole.USER }
  },
  // --- 修正：把 OrderList 移到这里，作为顶级路由 ---
  {
    path: '/order/list',
    name: 'OrderList',
    component: () => import('@/views/shop/OrderList.vue'),
    meta: { title: '我的订单', role: UserRole.USER }
  },

  // ================= 后台管理 (Role 1 & 2) =================
  {
    path: '/admin',
    component: () => import('@/views/layout/AdminLayout.vue'), 
    meta: { requiresAuth: true }, 
    children: [
      {
        path: 'user', // 访问路径：/admin/user
        name: 'UserManage',
        component: () => import('@/views/admin/UserManage.vue'),
        meta: { title: '用户管理', role: UserRole.ADMIN } 
      },
      {
        path: 'shop', // 访问路径: /admin/shop
        name: 'ShopManage',
        component: () => import('@/views/admin/ShopManage.vue'),
        meta: { title: '我的商店', role: UserRole.MANAGER } // 仅商家可见
    },
      {
        path: 'product', // 访问路径：/admin/product
        name: 'ProductManage',
        component: () => import('@/views/admin/ProductManage.vue'),
        meta: { title: '商品管理', role: UserRole.MANAGER } 
      }
    ]
  },
  
  // 404 页面
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/error/404.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// --- 路由守卫 ---
router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  const token = userStore.token
  const userRole = userStore.userInfo.role

  // 1. 登录页放行
  if (to.path === '/login') {
    next()
    return
  }

  // 2. 后台管理强制检查 Token
  if (to.path.startsWith('/admin') && !token) {
    next('/login')
    return
  }

  // 3. 角色权限检查
  if (to.meta.role) {
    if (userRole !== to.meta.role) {
        // 简单处理：权限不符去登录页，防止死循环
        next('/login') 
        return
    }
  }

  next()
})

export default router