<template>
  <div class="discover-page">
    <header class="page-header">
      <div class="container">
        <h1 class="header-title mono">Descobrir Séries</h1>
        <div class="search-bar">
          <Search :size="18" class="search-icon" />
          <input
            v-model="searchQuery"
            type="search"
            placeholder="Buscar por título (ex: Breaking Bad, Succession)..."
            class="search-input"
            @input="onSearchInput"
          />
          <button v-if="searchQuery" class="clear-btn" @click="clearSearch">
            <X :size="16" />
          </button>
        </div>
      </div>
    </header>

    <main class="container page-body">
      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Buscando séries...</p>
      </div>

      <!-- Search Results -->
      <section v-else-if="searchQuery.trim()" class="section fade-in">
        <h2 class="section-title mono">Resultados da Busca</h2>
        <div v-if="searchResults.length === 0" class="empty-search">
          <p>Nenhuma série encontrada para "{{ searchQuery }}".</p>
        </div>
        <div v-else class="series-grid">
          <div
            v-for="show in searchResults"
            :key="show.id"
            class="series-card"
            @click="goToSeries(show.id)"
          >
            <div class="poster-container">
              <img
                v-if="show.poster_path"
                :src="`https://image.tmdb.org/t/p/w500${show.poster_path}`"
                :alt="show.name"
                class="poster-img"
                loading="lazy"
              />
              <div v-else class="poster-placeholder">
                <Film :size="28" />
              </div>
              <div v-if="show.vote_average" class="rating-badge mono">
                ★ {{ show.vote_average.toFixed(1) }}
              </div>
            </div>
            <div class="series-info">
              <h3 class="series-title">{{ show.name }}</h3>
              <span class="series-year">{{ getYear(show.first_air_date) }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Trending / Popular (quando não há busca ativa) -->
      <div v-else class="fade-in">
        <section class="section">
          <h2 class="section-title mono">Em Alta Esta Semana</h2>
          <div class="series-grid">
            <div
              v-for="show in trendingShows"
              :key="show.id"
              class="series-card"
              @click="goToSeries(show.id)"
            >
              <div class="poster-container">
                <img
                  v-if="show.poster_path"
                  :src="`https://image.tmdb.org/t/p/w500${show.poster_path}`"
                  :alt="show.name"
                  class="poster-img"
                  loading="lazy"
                />
                <div v-else class="poster-placeholder">
                  <Film :size="28" />
                </div>
                <div v-if="show.vote_average" class="rating-badge mono">
                  ★ {{ show.vote_average.toFixed(1) }}
                </div>
              </div>
              <div class="series-info">
                <h3 class="series-title">{{ show.name }}</h3>
                <span class="series-year">{{ getYear(show.first_air_date) }}</span>
              </div>
            </div>
          </div>
        </section>

        <section class="section">
          <h2 class="section-title mono">Mais Populares</h2>
          <div class="series-grid">
            <div
              v-for="show in popularShows"
              :key="show.id"
              class="series-card"
              @click="goToSeries(show.id)"
            >
              <div class="poster-container">
                <img
                  v-if="show.poster_path"
                  :src="`https://image.tmdb.org/t/p/w500${show.poster_path}`"
                  :alt="show.name"
                  class="poster-img"
                  loading="lazy"
                />
                <div v-else class="poster-placeholder">
                  <Film :size="28" />
                </div>
                <div v-if="show.vote_average" class="rating-badge mono">
                  ★ {{ show.vote_average.toFixed(1) }}
                </div>
              </div>
              <div class="series-info">
                <h3 class="series-title">{{ show.name }}</h3>
                <span class="series-year">{{ getYear(show.first_air_date) }}</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search, X, Film } from 'lucide-vue-next'
import { capyApi } from '@/api/capyshowtime'

const router = useRouter()
const searchQuery = ref('')
const searchResults = ref<any[]>([])
const trendingShows = ref<any[]>([])
const popularShows = ref<any[]>([])
const loading = ref(false)
let debounceTimeout: any = null

async function loadInitialData() {
  try {
    const [trendRes, popRes] = await Promise.all([
      capyApi.trending(),
      capyApi.popular()
    ])
    trendingShows.value = trendRes.data.results || []
    popularShows.value = popRes.data.results || []
  } catch (err) {
    console.error('Erro ao carregar catálogo inicial:', err)
  }
}

function onSearchInput() {
  clearTimeout(debounceTimeout)
  if (!searchQuery.value.trim()) {
    searchResults.value = []
    return
  }

  debounceTimeout = setTimeout(async () => {
    loading.value = true
    try {
      const res = await capyApi.search(searchQuery.value)
      searchResults.value = res.data.results || []
    } catch (err) {
      console.error('Erro na busca:', err)
    } finally {
      loading.value = false
    }
  }, 400)
}

function clearSearch() {
  searchQuery.value = ''
  searchResults.value = []
}

function getYear(dateStr?: string): string {
  if (!dateStr) return ''
  return dateStr.substring(0, 4)
}

function goToSeries(tmdbId: number) {
  router.push(`/series/${tmdbId}`)
}

onMounted(() => {
  loadInitialData()
})
</script>

<style scoped>
.discover-page {
  padding-bottom: 90px;
}

.page-header {
  padding: 24px 0 16px;
  background-color: var(--bg-surface);
  border-bottom: 1px solid var(--color-border);
  position: sticky;
  top: 0;
  z-index: 10;
}

.header-title {
  font-size: 1.4rem;
  font-weight: 700;
  margin-bottom: 14px;
}

.search-bar {
  display: flex;
  align-items: center;
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 0 12px;
  gap: 8px;
}

.search-icon {
  color: var(--text-muted);
}

.search-input {
  flex: 1;
  background: none;
  border: none;
  padding: 12px 0;
  color: var(--text-main);
  font-size: 0.95rem;
  outline: none;
}

.clear-btn {
  color: var(--text-muted);
  padding: 4px;
}

.page-body {
  padding-top: 24px;
}

.section {
  margin-bottom: 32px;
}

.section-title {
  font-size: 1.1rem;
  color: var(--text-main);
  margin-bottom: 16px;
}

.series-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 16px;
}

@media (min-width: 640px) {
  .series-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }
}

.series-card {
  cursor: pointer;
  transition: transform 0.2s;
}

.series-card:hover {
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

.rating-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.8);
  color: var(--color-accent);
  font-size: 0.75rem;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  backdrop-filter: blur(4px);
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

.series-year {
  font-size: 0.75rem;
  color: var(--text-dim);
}

.loading-state, .empty-search {
  text-align: center;
  padding: 48px 0;
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
