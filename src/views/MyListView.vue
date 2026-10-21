<template>
  <div class="my-list-page">
    <header class="page-header">
      <div class="container">
        <div class="header-top">
          <h1 class="header-title mono">Minha Lista</h1>
          <!-- Botão de Recarregamento Forçado -->
          <RefreshButton
            :is-refreshing="seriesStore.isRefreshingMyList"
            @refresh="onForceRefresh"
          />
        </div>

        <!-- Abas de Filtro -->
        <div class="tabs-container">
          <button
            v-for="tab in tabs"
            :key="tab.value"
            class="tab-btn"
            :class="{ active: currentTab === tab.value }"
            @click="setTab(tab.value)"
          >
            {{ tab.label }}
          </button>
        </div>
      </div>
    </header>

    <main class="container page-body">
      <!-- Loading State Inicial -->
      <div v-if="seriesStore.isRefreshingMyList && !seriesStore.myListLoaded" class="loading-state">
        <div class="spinner"></div>
        <p>Carregando sua lista...</p>
      </div>

      <div v-else-if="filteredList.length === 0" class="empty-state fade-in">
        <Bookmark :size="48" class="empty-icon" />
        <h3 class="empty-title">Nenhuma série aqui ainda</h3>
        <p class="empty-desc">Adicione séries para organizar o que você quer assistir ou já viu!</p>
        <router-link to="/discover" class="btn-primary">
          <Search :size="18" />
          <span>Buscar Séries</span>
        </router-link>
      </div>

      <div v-else class="fade-in">
        <!-- Cabeçalho da Lista + Seletor de Modo de Visualização -->
        <div class="results-header">
          <span class="results-count mono">
            {{ filteredList.length }} {{ filteredList.length === 1 ? 'série' : 'séries' }}
          </span>

          <!-- Seletor de visualização -->
          <div class="view-mode-toggle">
            <button
              type="button"
              class="view-toggle-btn"
              :class="{ active: viewMode === 'normal' }"
              title="Visualização Padrão (com detalhes)"
              @click="setViewMode('normal')"
            >
              <LayoutGrid :size="16" />
              <span class="mode-label">Padrão</span>
            </button>

            <button
              type="button"
              class="view-toggle-btn"
              :class="{ active: viewMode === 'compact' }"
              title="Visualização Compacta (apenas capas, 4 por linha)"
              @click="setViewMode('compact')"
            >
              <Grid :size="16" />
              <span class="mode-label">4 por linha</span>
            </button>
          </div>
        </div>

        <div
          class="series-grid"
          :class="{ 'compact-grid': viewMode === 'compact' }"
        >
          <div
            v-for="item in filteredList"
            :key="item.id"
            class="series-card"
            :class="{ 'is-compact': viewMode === 'compact' }"
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
                <Film :size="28" />
              </div>
              <div
                class="status-badge"
                :class="{ 'status-mini': viewMode === 'compact' }"
              >
                {{ getStatusLabel(item.status) }}
              </div>
            </div>
            <div v-if="viewMode !== 'compact'" class="series-info">
              <h3 class="series-title">{{ item.series.name }}</h3>
              <span class="series-seasons mono">{{ item.series.number_of_seasons }} temp.</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Bookmark, Search, Film, LayoutGrid, Grid } from 'lucide-vue-next'
import { useSeriesStore } from '@/stores/series'
import { getPosterUrl } from '@/utils/images'
import RefreshButton from '@/components/RefreshButton.vue'

const router = useRouter()
const seriesStore = useSeriesStore()

// Modo de visualização: 'normal' ou 'compact' (4 capas por linha)
const savedViewMode = (localStorage.getItem('capyshowtime_view_mode') as 'normal' | 'compact') || 'normal'
const viewMode = ref<'normal' | 'compact'>(savedViewMode)

function setViewMode(mode: 'normal' | 'compact') {
  viewMode.value = mode
  localStorage.setItem('capyshowtime_view_mode', mode)
}
const currentTab = computed({
  get: () => seriesStore.myListActiveTab,
  set: (val: string) => { seriesStore.myListActiveTab = val }
})

const tabs = [
  { label: 'Todas', value: 'all' },
  { label: 'Assistindo', value: 'watching' },
  { label: 'Quero Assistir', value: 'plan_to_watch' },
  { label: 'Concluídas', value: 'completed' },
  { label: 'Abandonadas', value: 'dropped' },
]

function resolvePoster(series: any): string {
  return getPosterUrl(series.poster_url || series.poster_path)
}

function onForceRefresh() {
  seriesStore.fetchMyList(true)
}

const filteredList = computed(() => {
  if (currentTab.value === 'all') return seriesStore.myList
  return seriesStore.myList.filter(i => i.status === currentTab.value)
})

function setTab(tab: string) {
  seriesStore.myListActiveTab = tab
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'plan_to_watch': return 'Na Fila'
    case 'watching': return 'Assistindo'
    case 'completed': return 'Concluída'
    case 'dropped': return 'Abandonada'
    default: return status
  }
}

function goToSeries(tmdbId: number) {
  router.push(`/series/${tmdbId}`)
}

onMounted(() => {
  seriesStore.fetchMyList(true)
})
</script>

<style scoped>
.my-list-page {
  padding-bottom: 90px;
}

.page-header {
  padding: calc(var(--safe-top) + 16px) 0 12px;
  background-color: var(--bg-surface);
  border-bottom: 1px solid var(--color-border);
  position: sticky;
  top: 0;
  z-index: 10;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}

.header-title {
  font-size: 1.4rem;
  font-weight: 700;
}

.tabs-container {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  padding-bottom: 4px;
  scrollbar-width: none;
}
.tabs-container::-webkit-scrollbar {
  display: none;
}

.tab-btn {
  padding: 6px 14px;
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  font-size: 0.8rem;
  font-weight: 600;
  white-space: nowrap;
  transition: all 0.2s;
}

.tab-btn:hover {
  color: var(--text-main);
  border-color: var(--color-primary-light);
}

.tab-btn.active {
  background-color: var(--color-accent);
  color: #12100e;
  border-color: var(--color-accent);
  font-weight: 700;
}

.page-body {
  padding-top: 20px;
}

/* Cabeçalho da Lista com Seletor */
.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  gap: 12px;
}

.results-count {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-muted);
}

/* Grade Padrão */
.series-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 14px;
}

@media (min-width: 640px) {
  .series-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 16px;
  }
}

/* Grade Compacta: 4 por linha apenas com as capas */
.series-grid.compact-grid {
  grid-template-columns: repeat(4, 1fr) !important;
  gap: 8px;
}

@media (min-width: 640px) {
  .series-grid.compact-grid {
    gap: 12px;
  }
}

.series-card {
  cursor: pointer;
  transition: transform 0.2s;
  width: 100%;
}

.series-card:hover {
  transform: translateY(-4px);
}

.series-card.is-compact:hover {
  transform: translateY(-3px) scale(1.02);
}

.poster-container {
  position: relative;
  width: 100%;
  aspect-ratio: 2 / 3;
  border-radius: var(--radius-sm);
  overflow: hidden;
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--color-border);
}

.poster-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.series-card:hover .poster-img {
  transform: scale(1.03);
}

.poster-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-dim);
}

.status-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  background: rgba(0, 0, 0, 0.8);
  color: var(--text-main);
  font-size: 0.7rem;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  backdrop-filter: blur(4px);
}

.status-badge.status-mini {
  top: 4px;
  left: 4px;
  font-size: 0.58rem;
  padding: 1px 4px;
  border-radius: 2px;
}

.series-info {
  margin-top: 8px;
}

.series-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-main);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.series-seasons {
  font-size: 0.75rem;
  color: var(--text-dim);
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
  margin-bottom: 6px;
  color: var(--text-main);
}

.empty-desc {
  font-size: 0.85rem;
  margin-bottom: 20px;
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
