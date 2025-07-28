<template>
  <div id="app">
    <header class="app-header">
      <nav class="app-nav">
        <div class="nav-brand">
          <h2>元宇宙教学平台</h2>
        </div>
        <div class="nav-links">
          <RouterLink to="/" class="nav-link">首页</RouterLink>
          <RouterLink to="/museum" class="nav-link">数字馆</RouterLink>
          <RouterLink to="/about" class="nav-link">关于</RouterLink>
        </div>
      </nav>
    </header>

    <main class="app-main">
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<style scoped>
#app {
  min-height: 100vh;
  background-color: #f5f7fa;
}

.app-header {
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.app-nav {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 60px;
}

.nav-brand h2 {
  color: #2c3e50;
  margin: 0;
  font-size: 1.3rem;
}

.nav-links {
  display: flex;
  gap: 30px;
}

.nav-link {
  color: #606266;
  text-decoration: none;
  font-weight: 500;
  padding: 8px 16px;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.nav-link:hover {
  color: #409eff;
  background-color: #f0f9ff;
}

.nav-link.router-link-active {
  color: #409eff;
  background-color: #e1f3ff;
}

.app-main {
  min-height: calc(100vh - 60px);
}
</style>