<template>
  <div class="profile-page">
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Carregando perfil...</p>
    </div>

    <div v-else-if="profile" class="container page-body fade-in">
      <!-- Top Back Bar quando visualizando perfil de amigo -->
      <div v-if="!isMe" class="friend-nav-bar">
        <button class="back-btn" @click="goBack">
          <ArrowLeft :size="18" />
          <span>Voltar</span>
        </button>
      </div>

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
            <span class="stat-val mono">{{ completedSeries.length }}</span>
            <span class="stat-label">Séries Completas</span>
          </div>
        </div>
      </div>

      <!-- 1. Lista de Séries a Assistir (Scroll Lateral) -->
      <section class="profile-list-section">
        <div class="section-header">
          <div class="section-title-group">
            <Bookmark :size="18" class="section-icon" />
            <h3 class="section-title mono">Séries a Assistir</h3>
          </div>
          <span class="section-count mono">{{ toWatchSeries.length }}</span>
        </div>

        <div v-if="toWatchSeries.length === 0" class="empty-list-box">
          <p>{{ isMe ? 'Você ainda não adicionou séries para assistir.' : 'Nenhuma série na fila para assistir.' }}</p>
        </div>

        <div v-else class="horizontal-series-scroll">
          <div
            v-for="item in toWatchSeries"
            :key="item.id"
            class="scroll-series-card"
            @click="goToSeries(item.series.tmdb_id)"
          >
            <div class="poster-container">
              <img
                v-if="resolvePoster(item.series)"
                :src="resolvePoster(item.series)"
                :alt="item.series.name"
                class="poster-img"
                loading="lazy"
              />
              <div v-else class="poster-placeholder">
                <Film :size="26" />
              </div>
              <div class="status-pill" :class="item.status">
                {{ item.status === 'watching' ? 'Assistindo' : 'Na Fila' }}
              </div>
              <div v-if="item.user_rating" class="rating-pill mono">
                ★ {{ item.user_rating.toFixed(1) }}
              </div>
            </div>
            <div class="series-info">
              <h4 class="series-title">{{ item.series.name }}</h4>
              <span class="series-meta mono">{{ item.series.number_of_seasons }} temp.</span>
            </div>
          </div>
        </div>
      </section>

      <!-- 2. Lista de Séries Assistidas / Concluídas (Abaixo) -->
      <section class="profile-list-section">
        <div class="section-header">
          <div class="section-title-group">
            <CheckCircle2 :size="18" class="section-icon completed-icon" />
            <h3 class="section-title mono">Séries Assistidas / Concluídas</h3>
          </div>
          <span class="section-count mono">{{ completedSeries.length }}</span>
        </div>

        <div v-if="completedSeries.length === 0" class="empty-list-box">
          <p>{{ isMe ? 'Você ainda não concluiu nenhuma série.' : 'Nenhuma série concluída ainda.' }}</p>
        </div>

        <div v-else class="horizontal-series-scroll">
          <div
            v-for="item in completedSeries"
            :key="item.id"
            class="scroll-series-card"
            @click="goToSeries(item.series.tmdb_id)"
          >
            <div class="poster-container">
              <img
                v-if="resolvePoster(item.series)"
                :src="resolvePoster(item.series)"
                :alt="item.series.name"
                class="poster-img"
                loading="lazy"
              />
              <div v-else class="poster-placeholder">
                <Film :size="26" />
              </div>
              <div class="status-pill completed">
                Concluída
              </div>
              <div v-if="item.user_rating" class="rating-pill mono">
                ★ {{ item.user_rating.toFixed(1) }}
              </div>
            </div>
            <div class="series-info">
              <h4 class="series-title">{{ item.series.name }}</h4>
              <span class="series-meta mono">{{ item.series.number_of_seasons }} temp.</span>
            </div>
          </div>
        </div>
      </section>

      <!-- 3. Lista de Séries Abandonadas -->
      <section class="profile-list-section">
        <div class="section-header">
          <div class="section-title-group">
            <XCircle :size="18" class="section-icon dropped-icon" />
            <h3 class="section-title mono">Séries Abandonadas</h3>
          </div>
          <span class="section-count mono">{{ droppedSeries.length }}</span>
        </div>

        <div v-if="droppedSeries.length === 0" class="empty-list-box">
          <p>{{ isMe ? 'Você não possui séries marcadas como abandonadas.' : 'Nenhuma série abandonada.' }}</p>
        </div>

        <div v-else class="horizontal-series-scroll">
          <div
            v-for="item in droppedSeries"
            :key="item.id"
            class="scroll-series-card"
            @click="goToSeries(item.series.tmdb_id)"
          >
            <div class="poster-container">
              <img
                v-if="resolvePoster(item.series)"
                :src="resolvePoster(item.series)"
                :alt="item.series.name"
                class="poster-img"
                loading="lazy"
              />
              <div v-else class="poster-placeholder">
                <Film :size="26" />
              </div>
              <div class="status-pill dropped">
                Abandonada
              </div>
              <div v-if="item.user_rating" class="rating-pill mono">
                ★ {{ item.user_rating.toFixed(1) }}
              </div>
            </div>
            <div class="series-info">
              <h4 class="series-title">{{ item.series.name }}</h4>
              <span class="series-meta mono">{{ item.series.number_of_seasons }} temp.</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Seção de Atualizações do App e Logout (Apenas no próprio perfil) -->
      <div v-if="isMe" class="profile-actions-card">
        <div class="app-updates-box">
          <div class="updates-header">
            <RefreshCw :size="18" class="updates-icon" :class="{ spinning: isCheckingUpdates }" />
            <h4 class="updates-title mono">Atualizações do Aplicativo</h4>
          </div>
          <p class="updates-desc">
            Busque a versão mais recente do CapyShowTime ou recarregue o aplicativo para sincronizar novidades.
          </p>

          <!-- Banner de nova atualização pronta -->
          <div v-if="pwaNeedRefresh" class="update-alert-banner">
            <div class="update-alert-text">
              <strong>Nova versão disponível!</strong>
              <span>Uma atualização do CapyShowTime está pronta para instalar.</span>
            </div>
            <button type="button" class="btn-primary apply-update-btn" @click="updateServiceWorker">
              Atualizar Agora
            </button>
          </div>

          <!-- Mensagem de feedback da checagem -->
          <div v-else-if="pwaFeedbackMessage" class="update-feedback-banner">
            <span>ℹ️ {{ pwaFeedbackMessage }}</span>
          </div>

          <div class="updates-buttons-row">
            <button
              type="button"
              class="btn-secondary update-action-btn"
              :disabled="isCheckingUpdates"
              @click="checkForUpdates"
            >
              <RefreshCw :size="16" :class="{ spinning: isCheckingUpdates }" />
              <span>{{ isCheckingUpdates ? 'Buscando...' : 'Buscar Atualizações' }}</span>
            </button>

            <button
              type="button"
              class="btn-secondary update-action-btn"
              @click="forceReloadApp"
            >
              <RotateCcw :size="16" />
              <span>Recarregar App</span>
            </button>
          </div>
        </div>

        <div class="logout-section">
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
import { ref, computed, watch, onMounted, onActivated } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  Clock,
  LogOut,
  ArrowLeft,
  Bookmark,
  CheckCircle2,
  XCircle,
  Film,
  RefreshCw,
  RotateCcw
} from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useSeriesStore } from '@/stores/series'
import { capyApi } from '@/api/capyshowtime'
import { getPosterUrl } from '@/utils/images'
import { usePwaUpdate } from '@/composables/usePwaUpdate'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const seriesStore = useSeriesStore()

const {
  needRefresh: pwaNeedRefresh,
  isChecking: isCheckingUpdates,
  feedbackMessage: pwaFeedbackMessage,
  checkForUpdates,
  updateServiceWorker,
  forceReloadApp
} = usePwaUpdate()

const targetUserId = computed(() => {
  return route.params.id ? Number(route.params.id) : authStore.user?.id
})

const profile = ref<any>(targetUserId.value ? seriesStore.getCachedProfile(targetUserId.value) : null)
const loading = ref(!profile.value)

const isMe = computed(() => {
  return !route.params.id || Number(route.params.id) === authStore.user?.id
})

const seriesList = computed<any[]>(() => {
  return (profile.value?.series_list || []).filter((item: any) => item.series)
})

const toWatchSeries = computed(() => {
  return seriesList.value.filter(
    (item: any) => item.status === 'plan_to_watch' || item.status === 'watching'
  )
})

const completedSeries = computed(() => {
  return seriesList.value.filter((item: any) => item.status === 'completed')
})

const droppedSeries = computed(() => {
  return seriesList.value.filter((item: any) => item.status === 'dropped')
})

function resolvePoster(series: any): string {
  return getPosterUrl(series?.poster_url || series?.poster_path)
}

function goBack() {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/community')
  }
}

function goToSeries(tmdbId: number) {
  router.push(`/series/${tmdbId}`)
}

async function loadProfile(silent = false) {
  if (!targetUserId.value) return

  const cached = seriesStore.getCachedProfile(targetUserId.value)
  if (cached && !profile.value) {
    profile.value = cached
  }

  if (!profile.value && !silent) {
    loading.value = true
  }

  try {
    const res = await capyApi.getUserProfile(targetUserId.value)
    profile.value = res.data
    seriesStore.setCachedProfile(targetUserId.value, res.data)
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

watch(
  () => route.params.id,
  () => {
    pwaFeedbackMessage.value = ''
    if (targetUserId.value) {
      const cached = seriesStore.getCachedProfile(targetUserId.value)
      profile.value = cached
      loading.value = !cached
    }
    loadProfile(!!profile.value)
  }
)

onMounted(() => {
  pwaFeedbackMessage.value = ''
  loadProfile(!!profile.value)
})

onActivated(() => {
  // Atualiza em background de forma silenciosa para não quebrar o scroll
  if (targetUserId.value) {
    loadProfile(true)
  }
})
</script>

<style scoped>
.profile-page {
  padding: calc(var(--safe-top) + 20px) 0 96px;
}

.friend-nav-bar {
  margin-bottom: 14px;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--text-muted);
  font-size: 0.85rem;
  font-weight: 600;
  padding: 6px 12px;
  border-radius: var(--radius-md);
  background-color: var(--bg-surface);
  border: 1px solid var(--color-border);
  transition: all 0.2s;
}

.back-btn:hover {
  color: var(--text-main);
  border-color: var(--color-accent);
}

.profile-card {
  background-color: var(--bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 24px 20px;
  margin-bottom: 24px;
}

.user-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin-bottom: 20px;
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
  margin-bottom: 18px;
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

/* Seções de Listas de Séries */
.profile-list-section {
  margin-bottom: 28px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.section-title-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-icon {
  color: var(--color-accent);
}

.completed-icon {
  color: var(--color-success);
}

.dropped-icon {
  color: var(--color-danger, #ef4444);
}

.section-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-main);
}

.section-count {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--text-muted);
  background-color: var(--bg-surface);
  border: 1px solid var(--color-border);
  padding: 2px 8px;
  border-radius: var(--radius-full);
}

.empty-list-box {
  background-color: var(--bg-surface);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-md);
  padding: 24px 16px;
  text-align: center;
  color: var(--text-muted);
  font-size: 0.85rem;
}

.horizontal-series-scroll {
  display: flex;
  gap: 14px;
  overflow-x: auto;
  padding: 4px 2px 12px;
  scroll-snap-type: x proximity;
  -webkit-overflow-scrolling: touch;
}

.horizontal-series-scroll::-webkit-scrollbar {
  height: 6px;
}

.horizontal-series-scroll::-webkit-scrollbar-thumb {
  background: var(--bg-surface-hover);
  border-radius: var(--radius-full);
}

.scroll-series-card {
  width: 132px;
  flex-shrink: 0;
  cursor: pointer;
  scroll-snap-align: start;
  transition: transform 0.2s ease;
}

@media (min-width: 640px) {
  .scroll-series-card {
    width: 148px;
  }
}

.scroll-series-card:hover {
  transform: translateY(-4px);
}

.poster-container {
  position: relative;
  width: 100%;
  aspect-ratio: 2 / 3;
  border-radius: var(--radius-md);
  overflow: hidden;
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--color-border);
}

.poster-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.poster-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-dim);
}

.status-pill {
  position: absolute;
  top: 8px;
  left: 8px;
  background: rgba(18, 16, 14, 0.85);
  color: var(--text-main);
  font-size: 0.65rem;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: var(--radius-sm);
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.status-pill.watching {
  color: var(--color-accent);
  border-color: rgba(245, 197, 24, 0.35);
}

.status-pill.completed {
  color: var(--color-success);
  border-color: rgba(34, 197, 94, 0.35);
}

.status-pill.dropped {
  color: var(--color-danger, #ef4444);
  border-color: rgba(239, 68, 68, 0.35);
}

.rating-pill {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: rgba(18, 16, 14, 0.88);
  color: var(--color-accent);
  font-size: 0.72rem;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  backdrop-filter: blur(4px);
}

.series-info {
  margin-top: 8px;
}

.series-title {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-main);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.series-meta {
  font-size: 0.72rem;
  color: var(--text-dim);
}

/* Atualizações do App e Logout */
.profile-actions-card {
  background-color: var(--bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 20px;
}

.app-updates-box {
  padding-bottom: 18px;
  margin-bottom: 18px;
  border-bottom: 1px solid var(--color-border);
}

.updates-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.updates-icon {
  color: var(--color-accent);
}

.updates-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text-main);
}

.updates-desc {
  font-size: 0.8rem;
  color: var(--text-muted);
  margin-bottom: 14px;
  line-height: 1.4;
}

.update-alert-banner {
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: rgba(245, 197, 24, 0.12);
  border: 1px solid rgba(245, 197, 24, 0.4);
  border-radius: var(--radius-md);
  padding: 12px;
  margin-bottom: 12px;
}

@media (min-width: 500px) {
  .update-alert-banner {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}

.update-alert-text {
  display: flex;
  flex-direction: column;
  font-size: 0.8rem;
  color: var(--text-main);
}

.update-alert-text span {
  color: var(--text-muted);
  font-size: 0.75rem;
}

.apply-update-btn {
  padding: 8px 14px;
  font-size: 0.8rem;
  white-space: nowrap;
}

.update-feedback-banner {
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 10px 12px;
  font-size: 0.8rem;
  color: var(--text-main);
  margin-bottom: 12px;
}

.updates-buttons-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.update-action-btn {
  width: 100%;
  font-size: 0.82rem;
  padding: 10px 12px;
}

.spinning {
  animation: spin 0.9s linear infinite;
}

.logout-section {
  display: flex;
  justify-content: center;
}

.logout-btn {
  width: 100%;
  color: var(--color-danger);
  border-color: rgba(239, 68, 68, 0.25);
}

.logout-btn:hover {
  background-color: rgba(239, 68, 68, 0.1);
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
