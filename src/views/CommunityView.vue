<template>
  <div class="community-page">
    <header class="page-header">
      <div class="container">
        <h1 class="header-title mono">Atividade da Casa</h1>
        <p class="header-subtitle">O que os moradores da Capihouse estão assistindo</p>
      </div>
    </header>

    <main class="container page-body">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Carregando atividades...</p>
      </div>

      <div v-else-if="activities.length === 0" class="empty-state fade-in">
        <Users :size="48" class="empty-icon" />
        <h3 class="empty-title">Nenhuma atividade recente</h3>
        <p class="empty-desc">Assim que alguém marcar episódios como assistidos, as novidades aparecerão aqui!</p>
      </div>

      <div v-else class="activities-list fade-in">
        <div
          v-for="act in activities"
          :key="act.id"
          class="activity-card"
        >
          <div class="user-row" @click="goToProfile(act.user.id)">
            <img
              v-if="act.user.avatar_url"
              :src="act.user.avatar_url"
              :alt="act.user.name"
              class="user-avatar"
            />
            <div v-else class="user-avatar-placeholder">
              {{ act.user.name.charAt(0) }}
            </div>
            <div class="user-meta">
              <span class="user-name">{{ act.user.name }}</span>
              <span class="activity-time">{{ act.watched_at }}</span>
            </div>
          </div>

          <div class="activity-content" @click="goToSeries(act.series.tmdb_id)">
            <img
              v-if="act.series.poster_url"
              :src="act.series.poster_url"
              :alt="act.series.name"
              class="series-poster"
            />
            <div class="content-details">
              <h4 class="series-name">{{ act.series.name }}</h4>
              <p class="ep-info">
                <span class="mono ep-code">S{{ formatNum(act.episode.season_number) }}E{{ formatNum(act.episode.episode_number) }}</span>
                <span>{{ act.episode.name }}</span>
              </p>

              <div v-if="act.rating" class="rating-badge-row">
                <div class="badge-rating mono">
                  <Star :size="14" fill="currentColor" />
                  <span>{{ act.rating.toFixed(1) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Users, Star } from 'lucide-vue-next'
import { capyApi } from '@/api/capyshowtime'

const router = useRouter()
const activities = ref<any[]>([])
const loading = ref(true)

async function loadActivities() {
  loading.value = true
  try {
    const res = await capyApi.getCommunityActivity()
    activities.value = res.data
  } catch (err) {
    console.error('Erro ao carregar atividade:', err)
  } finally {
    loading.value = false
  }
}

function formatNum(n: number): string {
  return n < 10 ? `0${n}` : `${n}`
}

function goToProfile(userId: number) {
  router.push(`/profile/${userId}`)
}

function goToSeries(tmdbId: number) {
  router.push(`/series/${tmdbId}`)
}

onMounted(() => {
  loadActivities()
})
</script>

<style scoped>
.community-page {
  padding-bottom: 90px;
}

.page-header {
  padding: 24px 0 16px;
  background-color: var(--bg-surface);
  border-bottom: 1px solid var(--color-border);
}

.header-title {
  font-size: 1.4rem;
  font-weight: 700;
}

.header-subtitle {
  font-size: 0.85rem;
  color: var(--text-muted);
}

.page-body {
  padding-top: 20px;
}

.activities-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.activity-card {
  background-color: var(--bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 16px;
}

.user-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
  cursor: pointer;
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
}

.user-avatar-placeholder {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: var(--color-primary);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.85rem;
}

.user-meta {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-main);
}

.activity-time {
  font-size: 0.72rem;
  color: var(--text-dim);
}

.activity-content {
  display: flex;
  gap: 14px;
  background-color: var(--bg-surface-elevated);
  border-radius: var(--radius-md);
  padding: 10px;
  cursor: pointer;
  border: 1px solid var(--color-border-subtle);
}

.series-poster {
  width: 50px;
  height: 75px;
  border-radius: var(--radius-sm);
  object-fit: cover;
}

.content-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.series-name {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text-main);
}

.ep-info {
  font-size: 0.8rem;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 2px 0 6px;
}

.ep-code {
  color: var(--color-accent);
  font-weight: 700;
}

.rating-badge-row {
  display: flex;
}

.loading-state, .empty-state {
  text-align: center;
  padding: 60px 0;
  color: var(--text-muted);
}

.empty-icon {
  color: var(--color-accent);
  margin-bottom: 12px;
}

.empty-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--text-main);
  margin-bottom: 4px;
}

.empty-desc {
  font-size: 0.85rem;
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
