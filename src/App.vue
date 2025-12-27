<template>
  <router-view />
</template>

<script setup lang="ts">
// 这里目前什么都不用写
</script>

<style>
/* 全局重置一些默认样式，去掉浏览器默认的边距 */
body {
  margin: 0;
  padding: 0;
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB',
    'Microsoft YaHei', '微软雅黑', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#app {
  width: 100%;
  height: 100%;
}
</style>