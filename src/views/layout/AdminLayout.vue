<template>
  <el-container class="app-wrapper">
    <el-aside width="220px" class="sidebar">
      <div class="logo">Jerry's Amazon</div>
      <el-menu
        active-text-color="#409EFF"
        background-color="#304156"
        text-color="#bfcbd9"
        :default-active="activeMenu"
        router
        class="el-menu-vertical"
      >
        <el-menu-item index="/admin/user" v-if="userStore.userInfo.role === UserRole.ADMIN">
          <el-icon><User /></el-icon>
          <span>用户管理 (User)</span>
        </el-menu-item>

        <el-menu-item index="/admin/banner" v-if="userStore.userInfo.role === UserRole.ADMIN">
          <el-icon><Picture /></el-icon>
          <span>轮播图管理 (Banner)</span>
        </el-menu-item>

          <el-menu-item index="/admin/order" v-if="userStore.userInfo.role === UserRole.MANAGER">
          <el-icon><List /></el-icon>
          <span>订单管理 (Order)</span>
        </el-menu-item>


        <el-menu-item index="/admin/shop" v-if="userStore.userInfo.role === UserRole.MANAGER">
          <el-icon><Shop /></el-icon>
          <span>我的商店 (Shop Info)</span>
        </el-menu-item>

        <el-menu-item index="/admin/product" v-if="userStore.userInfo.role === UserRole.MANAGER">
          <el-icon><Goods /></el-icon>
          <span>商品管理 (Product)</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="header">
        <div class="header-content">
          <span>欢迎回来，{{ userStore.userInfo.username }}</span>
          <el-button type="danger" link @click="handleLogout">退出登录</el-button>
        </div>
      </el-header>
      
      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
// 引入 Picture 图标
import { User, Goods, Shop, Picture } from '@element-plus/icons-vue'
import { UserRole } from '@/types'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const activeMenu = computed(() => route.path)

const handleLogout = () => {
  userStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.app-wrapper { height: 100vh; }
.sidebar { background-color: #304156; color: white; }
.logo { height: 60px; line-height: 60px; text-align: center; font-weight: bold; font-size: 18px; background-color: #2b3649; }
.el-menu-vertical { border-right: none; }
.header { background-color: white; border-bottom: 1px solid #e6e6e6; display: flex; align-items: center; justify-content: flex-end; }
.header-content { display: flex; gap: 20px; align-items: center; font-size: 14px; }
.main-content { background-color: #f0f2f5; padding: 20px; }
</style>