<template>
  <div class="profile-page">
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Carregando perfil...</p>
    </div>

    <div v-else-if="profile" class="container page-body fade-in">
      <div class="profile-card">
        <div class="user-header">
          <img
            v-if="profile.user.avatar_url"
            :src="profile.user.avatar_url"
            :alt="profile.user.name"
            class="avatar-lg"
          />
          <div v-else class="avatar-lg-placeholder">
            {{ profile.user.name.charAt(0) }}
          </div>

          <h2 class="user-name">{{ profile.user.name }}</h2>
          <span class="user-username">@{{ profile.user.username }}</span>
        </div>

        <!-- TV Show Time Time-Spent Counter -->
        <div class="time-spent-banner">
          <Clock :size="24" class="clock-icon" />
          <div class="time-spent-info">
            <span class="time-spent-label">Tempo gasto assistindo séries</span>
            <span class="time-spent-value mono">
              {{ profile.stats.time_spent.days }}d {{ profile.stats.time_spent.hours }}h
            </span>
          </div>
        </div>

        <!-- Stats Grid -->
        <div class="stats-grid">
          <div class="stat-box">
            <span class="stat-val mono">{{ profile.stats.episodes_watched }}</span>
            <span class="stat-label">Episódios Vistos</span>
          </div>
          <div class="stat-box">
            <span class="stat-val mono">{{ profile.stats.episodes_rated }}</span>
            <span class="stat-label">Episódios Avaliados</span>
          </div>
          <div class="stat-box">
            <span class="stat-val mono">{{ profile.stats.series_counts?.completed || 0 }}</span>
            <span class="stat-label">Séries Completas</span>
          </div>
        </div>

        <div v-if="isMe" class="logout-section">
          <button class="btn-secondary logout-btn" @click="handleLogout">
            <LogOut :size="16" />
            <span>Sair da Conta</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Clock, LogOut } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { capyApi } from '@/api/capyshowtime'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const profile = ref<any>(null)
const loading = ref(true)

const targetUserId = computed(() => {
  return route.params.id ? Number(route.params.id) : authStore.user?.id
})

const isMe = computed(() => {
  return !route.params.id || Number(route.params.id) === authStore.user?.id
})

async function loadProfile() {
  if (!targetUserId.value) return

  loading.value = true
  try {
    const res = await capyApi.getUserProfile(targetUserId.value)
    profile.value = res.data
  } catch (err) {
    console.error('Erro ao carregar perfil:', err)
  } finally {
    loading.value = false
  }
}

async function handleLogout() {
  await authStore.logout()
  router.push('/login')
}

onMounted(() => {
  loadProfile()
})
</script>

<style scoped>
.profile-page {
  padding: calc(var(--safe-top) + 24px) 0 90px;
}

.profile-card {
  background-color: var(--bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 28px 20px;
}

.user-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin-bottom: 24px;
}

.avatar-lg {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--color-accent);
  margin-bottom: 12px;
}

.avatar-lg-placeholder {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background-color: var(--color-primary);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 12px;
  border: 2px solid var(--color-accent);
}

.user-name {
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--text-main);
}

.user-username {
  font-size: 0.85rem;
  color: var(--text-muted);
}

.time-spent-banner {
  display: flex;
  align-items: center;
  gap: 16px;
  background: linear-gradient(135deg, rgba(245, 197, 24, 0.15) 0%, rgba(166, 97, 48, 0.15) 100%);
  border: 1px solid rgba(245, 197, 24, 0.3);
  border-radius: var(--radius-md);
  padding: 16px;
  margin-bottom: 20px;
}

.clock-icon {
  color: var(--color-accent);
}

.time-spent-info {
  display: flex;
  flex-direction: column;
}

.time-spent-label {
  font-size: 0.75rem;
  color: var(--text-muted);
  text-transform: uppercase;
  font-weight: 600;
}

.time-spent-value {
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--color-accent);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 28px;
}

.stat-box {
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 14px 8px;
  text-align: center;
}

.stat-val {
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--text-main);
  display: block;
}

.stat-label {
  font-size: 0.68rem;
  color: var(--text-muted);
  margin-top: 4px;
  display: block;
}

.logout-section {
  display: flex;
  justify-content: center;
}

.logout-btn {
  width: 100%;
}

.loading-state {
  text-align: center;
  padding: 60px 0;
  color: var(--text-muted);
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 12px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
