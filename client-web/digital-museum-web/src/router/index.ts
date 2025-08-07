import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/museum',
      name: 'museum',
      component: () => import('../views/MuseumView.vue'),
    },
    {
      path: '/museum/work/:id',
      name: 'work-detail',
      component: () => import('../views/WorkDetailView.vue'),
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('../views/AboutView.vue'),
    },
  ],
})

export default router