<template>
  <div class="discover-page">
    <header class="page-header">
      <div class="container">
        <div class="header-top">
          <h1 class="header-title mono">Descobrir Séries</h1>
          <div class="header-actions">
            <button
              type="button"
              class="filter-toggle-btn"
              :class="{ active: showFiltersPanel || activeFilterCount > 0 }"
              @click="showFiltersPanel = !showFiltersPanel"
            >
              <SlidersHorizontal :size="16" />
              <span>Filtros</span>
              <span v-if="activeFilterCount > 0" class="filter-count-badge mono">
                {{ activeFilterCount }}
              </span>
            </button>

            <RefreshButton
              v-if="!searchQuery.trim() && !hasActiveFilters"
              :is-refreshing="seriesStore.isRefreshingDiscover"
              @refresh="onForceRefresh"
            />
          </div>
        </div>

        <!-- Barra de Busca por Texto -->
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

        <!-- Barra Rápida de Gêneros / Categorias (Scroll Lateral) -->
        <div v-if="!searchQuery.trim()" class="genres-scroll-bar">
          <button
            type="button"
            class="genre-pill"
            :class="{ active: selectedGenres.length === 0 }"
            @click="clearGenres"
          >
            Todos
          </button>
          <button
            v-for="genre in genresList"
            :key="genre.id"
            type="button"
            class="genre-pill"
            :class="{ active: selectedGenres.includes(genre.id) }"
            @click="toggleGenre(genre.id)"
          >
            {{ genre.name }}
          </button>
        </div>

        <!-- Painel Expansível de Filtros Avançados -->
        <div v-if="showFiltersPanel && !searchQuery.trim()" class="filters-panel fade-in">
          <!-- 1. Nota mínima no TMDB -->
          <div class="filter-group">
            <label class="filter-label">
              <Star :size="14" class="label-icon accent" />
              <span>Nota mínima no TMDB</span>
            </label>
            <div class="chips-row">
              <button
                v-for="opt in ratingOptions"
                :key="opt.value"
                type="button"
                class="filter-chip mono"
                :class="{ active: filters.minRating === opt.value }"
                @click="setFilter('minRating', opt.value)"
              >
                {{ opt.label }}
              </button>
            </div>
          </div>

          <!-- 2. Ordenar por -->
          <div class="filter-group">
            <label class="filter-label">
              <ArrowUpDown :size="14" class="label-icon" />
              <span>Ordenar por</span>
            </label>
            <div class="chips-row">
              <button
                v-for="opt in sortOptions"
                :key="opt.value"
                type="button"
                class="filter-chip"
                :class="{ active: filters.sortBy === opt.value }"
                @click="setFilter('sortBy', opt.value)"
              >
                {{ opt.label }}
              </button>
            </div>
          </div>

          <!-- 3. Onde Assistir (Streaming BR) -->
          <div class="filter-group">
            <label class="filter-label">
              <Tv :size="14" class="label-icon" />
              <span>Streaming (Brasil)</span>
            </label>
            <div class="chips-row">
              <button
                v-for="opt in providerOptions"
                :key="opt.value"
                type="button"
                class="filter-chip"
                :class="{ active: filters.watchProvider === opt.value }"
                @click="setFilter('watchProvider', opt.value)"
              >
                {{ opt.label }}
              </button>
            </div>
          </div>

          <!-- 4. Época / Década + Idioma / Origem + Status -->
          <div class="filter-selects-grid">
            <div class="filter-group">
              <label class="filter-label">
                <Calendar :size="14" class="label-icon" />
                <span>Época de Estreia</span>
              </label>
              <select v-model="filters.era" class="filter-select" @change="applyDiscoverFilters(true)">
                <option value="">Qualquer ano</option>
                <option value="2025-2026">Lançamentos (2025–2026)</option>
                <option value="2020-2026">Anos 2020</option>
                <option value="2010-2019">Anos 2010</option>
                <option value="2000-2009">Anos 2000</option>
                <option value="1950-1999">Clássicas (Até 1999)</option>
              </select>
            </div>

            <div class="filter-group">
              <label class="filter-label">
                <Globe :size="14" class="label-icon" />
                <span>Idioma / Origem</span>
              </label>
              <select v-model="filters.language" class="filter-select" @change="applyDiscoverFilters(true)">
                <option value="">Todos os idiomas</option>
                <option value="en">Inglês (EUA / UK)</option>
                <option value="ko">Coreano (K-Drama)</option>
                <option value="ja">Japonês (Anime / J-Drama)</option>
                <option value="pt">Português (Brasil / PT)</option>
                <option value="es">Espanhol</option>
                <option value="fr">Francês</option>
                <option value="de">Alemão</option>
              </select>
            </div>

            <div class="filter-group">
              <label class="filter-label">
                <Film :size="14" class="label-icon" />
                <span>Status da Série</span>
              </label>
              <select v-model="filters.status" class="filter-select" @change="applyDiscoverFilters(true)">
                <option value="">Qualquer status</option>
                <option value="0">Em exibição (Renovada)</option>
                <option value="3">Finalizada (Completa)</option>
              </select>
            </div>
          </div>

          <div v-if="hasActiveFilters" class="filters-footer">
            <button type="button" class="reset-filters-btn" @click="resetAllFilters">
              <RotateCcw :size="14" />
              <span>Limpar todos os filtros</span>
            </button>
          </div>
        </div>
      </div>
    </header>

    <main class="container page-body">
      <!-- Loading State da Busca por Texto -->
      <div v-if="searching" class="loading-state">
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
                v-if="resolvePoster(show)"
                :src="resolvePoster(show)"
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

      <!-- Resultados Filtrados (quando algum filtro de categoria/nota/etc está ativo) -->
      <section v-else-if="hasActiveFilters" class="section fade-in">
        <div class="filtered-header">
          <div>
            <h2 class="section-title mono">Séries Filtradas</h2>
            <p v-if="totalFilteredResults > 0" class="filtered-subtitle">
              {{ totalFilteredResults }} séries encontradas no TMDB
            </p>
          </div>
          <button type="button" class="clear-inline-btn" @click="resetAllFilters">
            <X :size="14" />
            <span>Limpar</span>
          </button>
        </div>

        <div v-if="discoverLoading && filteredResults.length === 0" class="loading-state">
          <div class="spinner"></div>
          <p>Filtrando catálogo...</p>
        </div>

        <div v-else-if="filteredResults.length === 0" class="empty-search">
          <p>Nenhuma série encontrada com essa combinação de filtros.</p>
          <button type="button" class="btn-secondary mt-btn" @click="resetAllFilters">
            Remover Filtros
          </button>
        </div>

        <div v-else>
          <div class="series-grid">
            <div
              v-for="show in filteredResults"
              :key="show.id"
              class="series-card"
              @click="goToSeries(show.id)"
            >
              <div class="poster-container">
                <img
                  v-if="resolvePoster(show)"
                  :src="resolvePoster(show)"
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

          <div v-if="hasMorePages" class="load-more-box">
            <button
              type="button"
              class="btn-secondary load-more-btn"
              :disabled="discoverLoading"
              @click="loadMoreFiltered"
            >
              <span>{{ discoverLoading ? 'Carregando...' : 'Carregar mais séries' }}</span>
            </button>
          </div>
        </div>
      </section>

      <!-- Trending / Popular (padrão sem filtros ativos) -->
      <div v-else class="fade-in">
        <section class="section">
          <h2 class="section-title mono">Em Alta Esta Semana</h2>
          <div class="series-grid">
            <div
              v-for="show in seriesStore.trendingShows"
              :key="show.id"
              class="series-card"
              @click="goToSeries(show.id)"
            >
              <div class="poster-container">
                <img
                  v-if="resolvePoster(show)"
                  :src="resolvePoster(show)"
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
              v-for="show in seriesStore.popularShows"
              :key="show.id"
              class="series-card"
              @click="goToSeries(show.id)"
            >
              <div class="poster-container">
                <img
                  v-if="resolvePoster(show)"
                  :src="resolvePoster(show)"
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
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  Search,
  X,
  Film,
  SlidersHorizontal,
  Star,
  ArrowUpDown,
  Tv,
  Calendar,
  Globe,
  RotateCcw
} from 'lucide-vue-next'
import { capyApi } from '@/api/capyshowtime'
import { useSeriesStore } from '@/stores/series'
import { getPosterUrl } from '@/utils/images'
import RefreshButton from '@/components/RefreshButton.vue'

const router = useRouter()
const seriesStore = useSeriesStore()

const searchQuery = ref('')
const searchResults = ref<any[]>([])
const searching = ref(false)
let debounceTimeout: any = null

// Tradução garantida de gêneros do TMDB para Português
const GENRE_PT_MAP: Record<number, string> = {
  10759: 'Ação e Aventura',
  16: 'Animação',
  35: 'Comédia',
  80: 'Crime',
  99: 'Documentário',
  18: 'Drama',
  10751: 'Família',
  10762: 'Infantil',
  9648: 'Mistério',
  10763: 'Notícias',
  10764: 'Reality Show',
  10765: 'Ficção Científica e Fantasia',
  10766: 'Novela',
  10767: 'Entrevistas',
  10768: 'Guerra e Política',
  37: 'Faroeste'
}

const GENRE_NAME_PT_MAP: Record<string, string> = {
  'Action & Adventure': 'Ação e Aventura',
  'Animation': 'Animação',
  'Comedy': 'Comédia',
  'Crime': 'Crime',
  'Documentary': 'Documentário',
  'Drama': 'Drama',
  'Family': 'Família',
  'Kids': 'Infantil',
  'Mystery': 'Mistério',
  'News': 'Notícias',
  'Reality': 'Reality Show',
  'Sci-Fi & Fantasy': 'Ficção Científica e Fantasia',
  'Sci-Fi & Fantasia': 'Ficção Científica e Fantasia',
  'Soap': 'Novela',
  'Talk': 'Entrevistas',
  'Talk Show': 'Entrevistas',
  'War & Politics': 'Guerra e Política',
  'Western': 'Faroeste'
}

function translateGenre(g: { id: number; name: string }) {
  return {
    id: g.id,
    name: GENRE_PT_MAP[g.id] || GENRE_NAME_PT_MAP[g.name] || g.name
  }
}

// Estado dos filtros
const showFiltersPanel = ref(false)
const genresList = ref<{ id: number; name: string }[]>([
  { id: 10759, name: 'Ação e Aventura' },
  { id: 16, name: 'Animação' },
  { id: 35, name: 'Comédia' },
  { id: 80, name: 'Crime' },
  { id: 99, name: 'Documentário' },
  { id: 18, name: 'Drama' },
  { id: 10751, name: 'Família' },
  { id: 10762, name: 'Infantil' },
  { id: 9648, name: 'Mistério' },
  { id: 10764, name: 'Reality Show' },
  { id: 10765, name: 'Ficção Científica e Fantasia' },
  { id: 10766, name: 'Novela' },
  { id: 10768, name: 'Guerra e Política' },
  { id: 37, name: 'Faroeste' }
])

const selectedGenres = ref<number[]>([])
const filters = reactive({
  minRating: '',
  sortBy: 'popularity.desc',
  watchProvider: '',
  era: '',
  language: '',
  status: ''
})

const ratingOptions = [
  { label: 'Qualquer', value: '' },
  { label: '★ 7.0+', value: '7' },
  { label: '★ 7.5+', value: '7.5' },
  { label: '★ 8.0+', value: '8' },
  { label: '★ 8.5+', value: '8.5' }
]

const sortOptions = [
  { label: 'Mais Populares', value: 'popularity.desc' },
  { label: 'Melhor Nota TMDB', value: 'vote_average.desc' },
  { label: 'Mais Recentes', value: 'first_air_date.desc' },
  { label: 'Mais Votadas', value: 'vote_count.desc' }
]

const providerOptions = [
  { label: 'Todos', value: '' },
  { label: 'Netflix', value: '8' },
  { label: 'Prime Video', value: '119' },
  { label: 'Max', value: '1899' },
  { label: 'Disney+', value: '337' },
  { label: 'Apple TV+', value: '350' },
  { label: 'Globoplay', value: '307' },
  { label: 'Paramount+', value: '531' },
  { label: 'Crunchyroll', value: '283' }
]

const filteredResults = ref<any[]>([])
const discoverLoading = ref(false)
const currentPage = ref(1)
const totalPages = ref(1)
const totalFilteredResults = ref(0)

const activeFilterCount = computed(() => {
  let count = 0
  if (selectedGenres.value.length > 0) count++
  if (filters.minRating !== '') count++
  if (filters.sortBy !== 'popularity.desc') count++
  if (filters.watchProvider !== '') count++
  if (filters.era !== '') count++
  if (filters.language !== '') count++
  if (filters.status !== '') count++
  return count
})

const hasActiveFilters = computed(() => activeFilterCount.value > 0)
const hasMorePages = computed(() => currentPage.value < totalPages.value)

function resolvePoster(show: any): string {
  return getPosterUrl(show.poster_url || show.poster_path)
}

function onForceRefresh() {
  seriesStore.fetchDiscover(true)
}

async function fetchGenres() {
  try {
    const res = await capyApi.genres()
    if (res.data?.genres?.length) {
      genresList.value = res.data.genres.map(translateGenre)
    }
  } catch (err) {
    console.error('Erro ao carregar gêneros:', err)
  }
}

function toggleGenre(genreId: number) {
  const idx = selectedGenres.value.indexOf(genreId)
  if (idx >= 0) {
    selectedGenres.value.splice(idx, 1)
  } else {
    selectedGenres.value.push(genreId)
  }
  applyDiscoverFilters(true)
}

function clearGenres() {
  if (selectedGenres.value.length === 0) return
  selectedGenres.value = []
  applyDiscoverFilters(true)
}

function setFilter(key: 'minRating' | 'sortBy' | 'watchProvider', value: string) {
  filters[key] = value
  applyDiscoverFilters(true)
}

function resetAllFilters() {
  selectedGenres.value = []
  filters.minRating = ''
  filters.sortBy = 'popularity.desc'
  filters.watchProvider = ''
  filters.era = ''
  filters.language = ''
  filters.status = ''
  filteredResults.value = []
  currentPage.value = 1
  totalPages.value = 1
  totalFilteredResults.value = 0
}

async function applyDiscoverFilters(resetPage = true) {
  if (!hasActiveFilters.value) {
    filteredResults.value = []
    return
  }

  if (resetPage) {
    currentPage.value = 1
    filteredResults.value = []
  }

  let yearFrom: string | undefined
  let yearTo: string | undefined
  if (filters.era) {
    const [from, to] = filters.era.split('-')
    yearFrom = from
    yearTo = to
  }

  discoverLoading.value = true
  try {
    const res = await capyApi.discover({
      sort_by: filters.sortBy,
      with_genres: selectedGenres.value.length > 0 ? selectedGenres.value.join(',') : undefined,
      min_rating: filters.minRating || undefined,
      watch_provider: filters.watchProvider || undefined,
      year_from: yearFrom,
      year_to: yearTo,
      language: filters.language || undefined,
      status: filters.status !== '' ? filters.status : undefined,
      page: currentPage.value
    })

    const results = res.data?.results || []
    if (resetPage) {
      filteredResults.value = results
    } else {
      filteredResults.value.push(...results)
    }
    totalPages.value = res.data?.total_pages || 1
    totalFilteredResults.value = res.data?.total_results || results.length
  } catch (err) {
    console.error('Erro ao filtrar séries:', err)
  } finally {
    discoverLoading.value = false
  }
}

function loadMoreFiltered() {
  if (discoverLoading.value || !hasMorePages.value) return
  currentPage.value++
  applyDiscoverFilters(false)
}

function onSearchInput() {
  clearTimeout(debounceTimeout)
  if (!searchQuery.value.trim()) {
    searchResults.value = []
    return
  }

  debounceTimeout = setTimeout(async () => {
    searching.value = true
    try {
      const res = await capyApi.search(searchQuery.value)
      searchResults.value = res.data.results || []
    } catch (err) {
      console.error('Erro na busca:', err)
    } finally {
      searching.value = false
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
  seriesStore.fetchDiscover(false)
  fetchGenres()
})
</script>

<style scoped>
.discover-page {
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

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-toggle-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: var(--radius-md);
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--color-border);
  color: var(--text-muted);
  font-size: 0.82rem;
  font-weight: 600;
  transition: all 0.2s;
}

.filter-toggle-btn.active {
  border-color: var(--color-accent);
  color: var(--color-accent);
  background-color: rgba(245, 197, 24, 0.1);
}

.filter-count-badge {
  background-color: var(--color-accent);
  color: #12100e;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: var(--radius-full);
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

/* Barra de Gêneros */
.genres-scroll-bar {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 12px 0 4px;
  scrollbar-width: none;
}

.genres-scroll-bar::-webkit-scrollbar {
  display: none;
}

.genre-pill {
  padding: 6px 14px;
  border-radius: var(--radius-full);
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--color-border);
  color: var(--text-muted);
  font-size: 0.8rem;
  font-weight: 600;
  white-space: nowrap;
  transition: all 0.2s;
}

.genre-pill:hover {
  color: var(--text-main);
}

.genre-pill.active {
  background-color: var(--color-accent);
  color: #12100e;
  border-color: var(--color-accent);
  font-weight: 700;
}

/* Painel de Filtros Avançados */
.filters-panel {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  gap: 14px;
  max-height: 60vh;
  overflow-y: auto;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.filter-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.label-icon {
  color: var(--text-dim);
}

.label-icon.accent {
  color: var(--color-accent);
}

.chips-row {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 2px;
  scrollbar-width: none;
}

.chips-row::-webkit-scrollbar {
  display: none;
}

.filter-chip {
  padding: 6px 12px;
  border-radius: var(--radius-sm);
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--color-border);
  color: var(--text-muted);
  font-size: 0.78rem;
  font-weight: 600;
  white-space: nowrap;
  transition: all 0.15s;
}

.filter-chip.active {
  background-color: rgba(245, 197, 24, 0.15);
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.filter-selects-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}

@media (min-width: 640px) {
  .filter-selects-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.filter-select {
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 8px 10px;
  color: var(--text-main);
  font-size: 0.82rem;
  outline: none;
}

.filter-select:focus {
  border-color: var(--color-accent);
}

.filters-footer {
  display: flex;
  justify-content: flex-end;
  padding-top: 4px;
}

.reset-filters-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--color-danger);
  padding: 6px 10px;
  border-radius: var(--radius-sm);
  background-color: rgba(239, 68, 68, 0.1);
}

.page-body {
  padding-top: 24px;
}

.section {
  margin-bottom: 32px;
}

.filtered-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.filtered-header .section-title {
  margin-bottom: 2px;
}

.filtered-subtitle {
  font-size: 0.78rem;
  color: var(--text-muted);
}

.clear-inline-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.78rem;
  color: var(--text-muted);
  padding: 6px 10px;
  border-radius: var(--radius-sm);
  background-color: var(--bg-surface);
  border: 1px solid var(--color-border);
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

.load-more-box {
  display: flex;
  justify-content: center;
  margin-top: 28px;
}

.load-more-btn {
  min-width: 220px;
}

.mt-btn {
  margin-top: 12px;
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
