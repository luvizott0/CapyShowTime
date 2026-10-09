import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

import UpNextView from '@/views/UpNextView.vue'
import DiscoverView from '@/views/DiscoverView.vue'
import MyListView from '@/views/MyListView.vue'
import SeriesDetailView from '@/views/SeriesDetailView.vue'
import CommunityView from '@/views/CommunityView.vue'
import ProfileView from '@/views/ProfileView.vue'
import LoginView from '@/views/LoginView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'up-next',
      component: UpNextView,
      meta: { requiresAuth: true }
    },
    {
      path: '/discover',
      name: 'discover',
      component: DiscoverView,
      meta: { requiresAuth: true }
    },
    {
      path: '/my-list',
      name: 'my-list',
      component: MyListView,
      meta: { requiresAuth: true }
    },
    {
      path: '/series/:id',
      name: 'series-detail',
      component: SeriesDetailView,
      meta: { requiresAuth: true }
    },
    {
      path: '/community',
      name: 'community',
      component: CommunityView,
      meta: { requiresAuth: true }
    },
    {
      path: '/profile/:id?',
      name: 'profile',
      component: ProfileView,
      meta: { requiresAuth: true }
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { guestOnly: true }
    }
  ]
})

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // Se tem token salvo mas não carregou usuário ainda
  if (authStore.token && !authStore.user) {
    await authStore.checkAuth()
  }

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'login' })
  } else if (to.meta.guestOnly && authStore.isAuthenticated) {
    next({ name: 'up-next' })
  } else {
    next()
  }
})

export default router
