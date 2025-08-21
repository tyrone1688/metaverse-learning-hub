// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/HomeView.vue')
    },
    {
      path: '/museum',
      name: 'museum',
      component: () => import('../views/MuseumView.vue')
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('../views/AboutView.vue')
    },
    {
      path: '/work/:id',
      name: 'work-detail',
      component: () => import('../views/WorkDetailView.vue')
    },
    {
      path: '/model-test',
      name: 'model-test',
      component: () => import('../views/ModelTestView.vue')
    }
  ]
})

export default router