<template>
  <div class="up-next-page">
    <header class="page-header">
      <div class="container">
        <div class="header-content">
          <div class="header-title-box">
            <h1 class="header-title mono">Para Assistir</h1>
            <p class="header-subtitle">Seus próximos episódios na fila</p>
          </div>
          <router-link to="/discover" class="btn-icon-link" title="Buscar Séries">
            <Plus :size="20" />
          </router-link>
        </div>
      </div>
    </header>

    <main class="container page-body">
      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Carregando sua fila...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="upNextList.length === 0" class="empty-state fade-in">
        <div class="empty-icon-box">
          <Tv :size="48" class="empty-icon" />
        </div>
        <h3 class="empty-title">Nenhum episódio pendente!</h3>
        <p class="empty-desc">
          Você está em dia com todas as suas séries ou ainda não adicionou nenhuma série para acompanhar.
        </p>
        <router-link to="/discover" class="btn-primary">
          <Search :size="18" />
          <span>Explorar Séries</span>
        </router-link>
      </div>

      <!-- Up Next List -->
      <div v-else class="up-next-grid fade-in">
        <div
          v-for="item in upNextList"
          :key="item.series.id"
          class="up-next-card"
        >
          <div class="card-poster" @click="goToSeries(item.series.tmdb_id)">
            <img
              v-if="item.series.poster_url"
              :src="item.series.poster_url"
              :alt="item.series.name"
              class="poster-img"
              loading="lazy"
            />
            <div v-else class="poster-placeholder">
              <Film :size="32" />
            </div>
          </div>

          <div class="card-details">
            <div class="series-name" @click="goToSeries(item.series.tmdb_id)">
              {{ item.series.name }}
            </div>

            <div class="next-ep-box" @click="goToEpisode(item.series.tmdb_id, item.next_episode.season_number, item.next_episode.id)">
              <span class="mono ep-tag">
                S{{ formatNum(item.next_episode.season_number) }}E{{ formatNum(item.next_episode.episode_number) }}
              </span>
              <span class="ep-title">{{ item.next_episode.name }}</span>
            </div>

            <div class="progress-container">
              <div class="progress-bar-bg">
                <div
                  class="progress-bar-fill"
                  :style="{ width: `${item.progress.percentage}%` }"
                ></div>
              </div>
              <div class="progress-labels mono">
                <span>{{ item.progress.watched }}/{{ item.progress.total }} eps</span>
                <span>{{ item.progress.percentage }}%</span>
              </div>
            </div>

            <div class="card-actions">
              <button
                class="check-action-btn"
                @click="markWatchedAndRate(item)"
                title="Marcar como assistido e avaliar"
              >
                <Check :size="18" stroke-width="3" />
                <span>Assisti</span>
              </button>

              <button
                class="details-btn"
                @click="goToSeries(item.series.tmdb_id)"
              >
                <span>Ver Série</span>
                <ChevronRight :size="16" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Modal de Avaliação Rápida ao marcar assistido -->
    <RatingModal
      :is-open="isRatingModalOpen"
      :episode-id="currentRatingEp?.id || 0"
      :episode-name="currentRatingEp?.name || ''"
      :season-num="currentRatingEp?.season_number || 1"
      :episode-num="currentRatingEp?.episode_number || 1"
      :current-rating="null"
      @close="isRatingModalOpen = false"
      @save="handleSaveRating"
      @remove="isRatingModalOpen = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Tv, Plus, Search, Film, Check, ChevronRight } from 'lucide-vue-next'
import { capyApi } from '@/api/capyshowtime'
import RatingModal from '@/components/RatingModal.vue'

const router = useRouter()
const upNextList = ref<any[]>([])
const loading = ref(true)

const isRatingModalOpen = ref(false)
const currentRatingEp = ref<any | null>(null)

async function fetchUpNext() {
  loading.value = true
  try {
    const res = await capyApi.getUpNext()
    upNextList.value = res.data
  } catch (err) {
    console.error('Erro ao carregar Up Next:', err)
  } finally {
    loading.value = false
  }
}

function formatNum(n: number): string {
  return n < 10 ? `0${n}` : `${n}`
}

function goToSeries(tmdbId: number) {
  router.push(`/series/${tmdbId}`)
}

function goToEpisode(tmdbId: number, seasonNumber: number, episodeId: number) {
  router.push(`/series/${tmdbId}?season=${seasonNumber}&openEp=${episodeId}`)
}

function markWatchedAndRate(item: any) {
  currentRatingEp.value = item.next_episode
  // Marcar como visto no backend imediatamente
  capyApi.rateEpisode(item.next_episode.id, null, true).then(() => {
    // Abre o modal de nota para ele dar a nota se desejar
    isRatingModalOpen.value = true
  })
}

async function handleSaveRating(rating: number) {
  if (currentRatingEp.value) {
    await capyApi.rateEpisode(currentRatingEp.value.id, rating, true)
    isRatingModalOpen.value = false
    await fetchUpNext()
  }
}

onMounted(() => {
  fetchUpNext()
})
</script>

<style scoped>
.up-next-page {
  padding-bottom: 90px;
}

.page-header {
  padding: 24px 0 16px;
  border-bottom: 1px solid var(--color-border);
  background-color: var(--bg-surface);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-main);
}

.header-subtitle {
  font-size: 0.85rem;
  color: var(--text-muted);
}

.btn-icon-link {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  color: var(--text-main);
}

.page-body {
  padding-top: 20px;
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

.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.empty-icon-box {
  width: 80px;
  height: 80px;
  background-color: var(--bg-surface-elevated);
  border-radius: var(--radius-full);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.empty-icon {
  color: var(--color-accent);
}

.empty-title {
  font-size: 1.2rem;
  font-weight: 700;
  margin-bottom: 8px;
}

.empty-desc {
  color: var(--text-muted);
  font-size: 0.9rem;
  max-width: 380px;
  margin: 0 auto 24px;
}

.up-next-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.up-next-card {
  display: flex;
  gap: 16px;
  background-color: var(--bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 14px;
  transition: all 0.2s;
}

.card-poster {
  width: 90px;
  height: 130px;
  border-radius: var(--radius-sm);
  overflow: hidden;
  flex-shrink: 0;
  background-color: var(--bg-surface-elevated);
  cursor: pointer;
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

.card-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-width: 0;
}

.series-name {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text-main);
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.next-ep-box {
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-sm);
  padding: 6px 10px;
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 6px 0;
  cursor: pointer;
}

.ep-tag {
  color: var(--color-accent);
  font-size: 0.75rem;
  font-weight: 700;
  flex-shrink: 0;
}

.ep-title {
  font-size: 0.85rem;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.progress-container {
  margin: 4px 0 10px;
}

.progress-bar-bg {
  width: 100%;
  height: 6px;
  background-color: var(--bg-surface-elevated);
  border-radius: 3px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background-color: var(--color-accent);
  border-radius: 3px;
  transition: width 0.3s;
}

.progress-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.7rem;
  color: var(--text-dim);
  margin-top: 3px;
}

.card-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.check-action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background-color: var(--color-accent);
  color: #12100e;
  font-weight: 700;
  font-size: 0.85rem;
  padding: 8px 16px;
  border-radius: var(--radius-full);
  transition: all 0.2s;
}

.check-action-btn:hover {
  background-color: var(--color-accent-hover);
  transform: scale(1.02);
}

.details-btn {
  display: flex;
  align-items: center;
  gap: 2px;
  color: var(--text-muted);
  font-size: 0.8rem;
  padding: 6px 8px;
}
</style>
