
import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('./view/index.vue')
  },
  {
    path: '/create',
    name: 'create',
    component: () => import('./view/create.vue')
  }
  ,{
    path: '/login',
    name: 'login',
    component: () => import('./view/login.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router