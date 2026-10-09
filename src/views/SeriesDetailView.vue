<template>
  <div class="series-detail-page">
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Carregando série...</p>
    </div>

    <div v-else-if="series" class="detail-container fade-in">
      <!-- Backdrop Banner Header -->
      <div class="backdrop-wrapper">
        <img
          v-if="series.backdrop_url"
          :src="series.backdrop_url"
          :alt="series.name"
          class="backdrop-img"
        />
        <div class="backdrop-overlay"></div>
        <button class="back-btn" @click="$router.back()">
          <ArrowLeft :size="20" />
        </button>
      </div>

      <div class="container main-content">
        <!-- Header Info (Pôster + Título + Status) -->
        <div class="series-header-info">
          <div class="poster-box">
            <img
              v-if="series.poster_url"
              :src="series.poster_url"
              :alt="series.name"
              class="poster-img"
            />
            <div v-else class="poster-placeholder">
              <Film :size="40" />
            </div>
          </div>

          <div class="titles-box">
            <h1 class="series-title">{{ series.name }}</h1>
            <div class="meta-row">
              <span v-if="series.first_air_date" class="meta-item">{{ getYear(series.first_air_date) }}</span>
              <span class="meta-bullet">•</span>
              <span class="meta-item mono">{{ series.number_of_seasons }} temp.</span>
              <span class="meta-bullet">•</span>
              <span class="meta-item">{{ series.status === 'Ended' ? 'Finalizada' : 'Em exibição' }}</span>
            </div>

            <!-- Seletor de Status na Lista -->
            <div class="status-selector">
              <select :value="userStatus || 'none'" @change="onStatusChange" class="status-select">
                <option value="none">+ Adicionar à Lista</option>
                <option value="plan_to_watch">📌 Quero Assistir</option>
                <option value="watching">▶ Assistindo</option>
                <option value="completed">✓ Concluída</option>
                <option value="dropped">✕ Abandonada</option>
                <option v-if="userStatus" value="remove">Remover da Lista</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Bloco de Médias de Notas (Regra do Usuário) -->
        <div class="ratings-dashboard">
          <!-- 1. Sua Nota da Série (baseada na média das temporadas) -->
          <div class="rating-card highlight">
            <span class="rating-label">Sua Média Geral</span>
            <div class="rating-value-box">
              <Star :size="22" class="star-accent" fill="currentColor" />
              <span v-if="userRatings?.series_average" class="rating-val mono">
                {{ userRatings.series_average.toFixed(1) }}
              </span>
              <span v-else class="rating-val-empty mono">--</span>
            </div>
            <span class="rating-subtext">Média das temporadas</span>
          </div>

          <!-- 2. Média da Capihouse (Comunidade) -->
          <div class="rating-card">
            <span class="rating-label">Capihouse</span>
            <div class="rating-value-box">
              <Users :size="20" class="icon-users" />
              <span v-if="communityRatings?.series_average" class="rating-val mono">
                {{ communityRatings.series_average.toFixed(1) }}
              </span>
              <span v-else class="rating-val-empty mono">--</span>
            </div>
            <span class="rating-subtext">Média dos moradores</span>
          </div>

          <!-- 3. Média TMDB -->
          <div class="rating-card">
            <span class="rating-label">TMDB</span>
            <div class="rating-value-box">
              <span class="rating-val mono">{{ series.vote_average?.toFixed(1) || '--' }}</span>
            </div>
            <span class="rating-subtext">Crítica mundial</span>
          </div>
        </div>

        <!-- Sinopse -->
        <div v-if="series.overview" class="overview-section">
          <h3 class="section-title">Sinopse</h3>
          <p class="overview-text">{{ series.overview }}</p>
        </div>

        <!-- Moradores assistindo -->
        <div v-if="housemates.length > 0" class="housemates-section">
          <h3 class="section-title">Moradores que acompanham</h3>
          <div class="housemates-avatars">
            <div
              v-for="hm in housemates"
              :key="hm.user.id"
              class="housemate-item"
              :title="`${hm.user.name} (${hm.status})`"
            >
              <img
                v-if="hm.user.avatar_url"
                :src="hm.user.avatar_url"
                :alt="hm.user.name"
                class="hm-avatar"
              />
              <div v-else class="hm-avatar-placeholder">
                {{ hm.user.name.charAt(0) }}
              </div>
              <span class="hm-name">{{ hm.user.name.split(' ')[0] }}</span>
            </div>
          </div>
        </div>

        <!-- Seletor de Temporadas -->
        <div class="seasons-section">
          <div class="seasons-tabs-header">
            <h3 class="section-title">Temporadas</h3>
            <span v-if="currentSeasonAverage" class="season-avg-badge mono">
              Média da temp: {{ currentSeasonAverage.toFixed(1) }}
            </span>
          </div>

          <div class="season-tabs">
            <button
              v-for="s in seasons"
              :key="s.season_number"
              class="season-tab-btn mono"
              :class="{ active: selectedSeasonNum === s.season_number }"
              @click="selectSeason(s.season_number)"
            >
              T{{ s.season_number }}
            </button>
          </div>

          <!-- Lista de Episódios da Temporada -->
          <div v-if="seasonLoading" class="season-loading">
            <div class="spinner"></div>
            <p>Carregando episódios...</p>
          </div>

          <div v-else class="episodes-list">
            <EpisodeCard
              v-for="ep in episodes"
              :key="ep.id"
              :episode="ep"
              @toggle-watched="handleToggleWatched"
              @open-rating="openRatingModal"
              @open-comments="openCommentsModal"
              @open-detail="openEpisodeDetail"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Avaliação de Episódio -->
    <RatingModal
      :is-open="isRatingOpen"
      :episode-id="activeEpisode?.id || 0"
      :episode-name="activeEpisode?.name || ''"
      :season-num="activeEpisode?.season_number || 1"
      :episode-num="activeEpisode?.episode_number || 1"
      :current-rating="activeEpisode?.user_rating"
      @close="isRatingOpen = false"
      @save="onRatingSaved"
      @remove="onRatingRemoved"
    />

    <!-- Modal de Comentários / Discussão -->
    <EpisodeCommentsModal
      :is-open="isCommentsOpen"
      :episode-id="activeEpisode?.id || 0"
      :episode-name="activeEpisode?.name || ''"
      :season-num="activeEpisode?.season_number || 1"
      :episode-num="activeEpisode?.episode_number || 1"
      @close="isCommentsOpen = false"
      @comment-added="onCommentAdded"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowLeft, Film, Star, Users } from 'lucide-vue-next'
import { capyApi, type Series, type Season, type Episode } from '@/api/capyshowtime'
import EpisodeCard from '@/components/EpisodeCard.vue'
import RatingModal from '@/components/RatingModal.vue'
import EpisodeCommentsModal from '@/components/EpisodeCommentsModal.vue'

const route = useRoute()
const tmdbId = Number(route.params.id)

const loading = ref(true)
const seasonLoading = ref(false)
const series = ref<Series | null>(null)
const seasons = ref<Season[]>([])
const episodes = ref<Episode[]>([])
const userStatus = ref<string | null>(null)
const userRatings = ref<any>(null)
const communityRatings = ref<any>(null)
const housemates = ref<any[]>([])

const selectedSeasonNum = ref<number>(1)

// Modais
const isRatingOpen = ref(false)
const isCommentsOpen = ref(false)
const activeEpisode = ref<Episode | null>(null)

const currentSeasonAverage = computed(() => {
  return userRatings.value?.seasons?.[selectedSeasonNum.value]?.average || null
})

async function fetchSeriesDetails() {
  loading.value = true
  try {
    const res = await capyApi.getSeries(tmdbId)
    series.value = res.data.series
    // Filtra temporada 0 se for especiais, ou mantém
    seasons.value = res.data.seasons.filter((s: Season) => s.season_number > 0)
    userStatus.value = res.data.user_status
    userRatings.value = res.data.user_ratings
    communityRatings.value = res.data.community_ratings
    housemates.value = res.data.housemates

    // Carregar primeira temporada ou a temporada passada via query
    const querySeason = Number(route.query.season) || (seasons.value[0]?.season_number ?? 1)
    await selectSeason(querySeason)
  } catch (err) {
    console.error('Erro ao carregar série:', err)
  } finally {
    loading.value = false
  }
}

async function selectSeason(num: number) {
  selectedSeasonNum.value = num
  seasonLoading.value = true
  try {
    const res = await capyApi.getSeason(tmdbId, num)
    episodes.value = res.data.episodes
  } catch (err) {
    console.error('Erro ao carregar episódios da temporada:', err)
  } finally {
    seasonLoading.value = false
  }
}

async function onStatusChange(e: Event) {
  const target = e.target as HTMLSelectElement
  const val = target.value
  if (val === 'none') return

  try {
    const res = await capyApi.setStatus(tmdbId, val)
    userStatus.value = res.data.status
  } catch (err) {
    console.error('Erro ao alterar status:', err)
  }
}

async function handleToggleWatched(ep: Episode) {
  const newWatched = !ep.is_watched
  ep.is_watched = newWatched
  try {
    const res = await capyApi.rateEpisode(ep.id, ep.user_rating, newWatched)
    updateRatingsFromResponse(res.data)
  } catch (err) {
    ep.is_watched = !newWatched // rollback
    console.error('Erro ao marcar assistido:', err)
  }
}

function openRatingModal(ep: Episode) {
  activeEpisode.value = ep
  isRatingOpen.value = true
}

function openCommentsModal(ep: Episode) {
  activeEpisode.value = ep
  isCommentsOpen.value = true
}

function openEpisodeDetail(ep: Episode) {
  openCommentsModal(ep)
}

async function onRatingSaved(rating: number) {
  if (!activeEpisode.value) return
  isRatingOpen.value = false
  try {
    const res = await capyApi.rateEpisode(activeEpisode.value.id, rating, true)
    activeEpisode.value.is_watched = true
    activeEpisode.value.user_rating = rating
    updateRatingsFromResponse(res.data)
  } catch (err) {
    console.error('Erro ao salvar nota:', err)
  }
}

async function onRatingRemoved() {
  if (!activeEpisode.value) return
  isRatingOpen.value = false
  try {
    const res = await capyApi.rateEpisode(activeEpisode.value.id, null, activeEpisode.value.is_watched)
    activeEpisode.value.user_rating = null
    updateRatingsFromResponse(res.data)
  } catch (err) {
    console.error('Erro ao remover nota:', err)
  }
}

function updateRatingsFromResponse(data: any) {
  if (!userRatings.value) userRatings.value = { seasons: {} }
  userRatings.value.series_average = data.series_average
  if (!userRatings.value.seasons) userRatings.value.seasons = {}
  if (userRatings.value.seasons[selectedSeasonNum.value]) {
    userRatings.value.seasons[selectedSeasonNum.value].average = data.season_average
  }
}

function onCommentAdded() {
  if (activeEpisode.value) {
    activeEpisode.value.comments_count = (activeEpisode.value.comments_count || 0) + 1
  }
}

function getYear(dateStr?: string): string {
  return dateStr ? dateStr.substring(0, 4) : ''
}

onMounted(() => {
  fetchSeriesDetails()
})
</script>

<style scoped>
.series-detail-page {
  padding-bottom: 90px;
}

.backdrop-wrapper {
  position: relative;
  width: 100%;
  height: 220px;
  background-color: var(--bg-surface-elevated);
  overflow: hidden;
}

@media (min-width: 640px) {
  .backdrop-wrapper {
    height: 320px;
  }
}

.backdrop-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.backdrop-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, rgba(18, 16, 14, 0.2) 0%, rgba(18, 16, 14, 0.95) 100%);
}

.back-btn {
  position: absolute;
  top: 16px;
  left: 16px;
  width: 38px;
  height: 38px;
  border-radius: var(--radius-full);
  background-color: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  color: var(--text-main);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 5;
}

.main-content {
  margin-top: -60px;
  position: relative;
  z-index: 10;
}

.series-header-info {
  display: flex;
  gap: 16px;
  align-items: flex-end;
  margin-bottom: 24px;
}

.poster-box {
  width: 110px;
  height: 160px;
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.6);
  flex-shrink: 0;
  border: 1px solid var(--color-border);
  background-color: var(--bg-surface);
}

@media (min-width: 640px) {
  .poster-box {
    width: 140px;
    height: 200px;
  }
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

.titles-box {
  flex: 1;
}

.series-title {
  font-size: 1.4rem;
  font-weight: 800;
  color: var(--text-main);
  line-height: 1.2;
  margin-bottom: 6px;
}

.meta-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  color: var(--text-muted);
  margin-bottom: 12px;
}

.meta-bullet {
  color: var(--text-dim);
}

.status-select {
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--color-border);
  color: var(--text-main);
  padding: 8px 12px;
  border-radius: var(--radius-md);
  font-size: 0.85rem;
  font-weight: 600;
  outline: none;
  cursor: pointer;
}

/* Dashboard de Notas */
.ratings-dashboard {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 24px;
}

.rating-card {
  background-color: var(--bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 12px;
  text-align: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.rating-card.highlight {
  border-color: rgba(245, 197, 24, 0.35);
  background: linear-gradient(180deg, rgba(245, 197, 24, 0.05) 0%, var(--bg-surface) 100%);
}

.rating-label {
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  margin-bottom: 4px;
}

.rating-value-box {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.star-accent {
  color: var(--color-accent);
}

.icon-users {
  color: var(--color-primary-light);
}

.rating-val {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-main);
}

.rating-val-empty {
  font-size: 1.2rem;
  color: var(--text-dim);
}

.rating-subtext {
  font-size: 0.68rem;
  color: var(--text-dim);
  margin-top: 2px;
}

.overview-section, .housemates-section {
  margin-bottom: 24px;
}

.section-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-main);
  margin-bottom: 8px;
}

.overview-text {
  font-size: 0.88rem;
  color: var(--text-muted);
  line-height: 1.5;
}

.housemates-avatars {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding: 4px 0;
}

.housemate-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.hm-avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid var(--color-border);
}

.hm-avatar-placeholder {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background-color: var(--color-primary);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.9rem;
}

.hm-name {
  font-size: 0.7rem;
  color: var(--text-dim);
}

/* Temporadas */
.seasons-section {
  margin-top: 28px;
}

.seasons-tabs-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.season-avg-badge {
  background-color: var(--color-accent);
  color: #12100e;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: var(--radius-sm);
}

.season-tabs {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 8px;
  margin-bottom: 16px;
  scrollbar-width: none;
}
.season-tabs::-webkit-scrollbar {
  display: none;
}

.season-tab-btn {
  padding: 8px 14px;
  border-radius: var(--radius-md);
  background-color: var(--bg-surface);
  border: 1px solid var(--color-border);
  color: var(--text-muted);
  font-weight: 700;
  font-size: 0.85rem;
  white-space: nowrap;
  transition: all 0.2s;
}

.season-tab-btn.active {
  background-color: var(--color-accent);
  color: #12100e;
  border-color: var(--color-accent);
}

.episodes-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.loading-state, .season-loading {
  text-align: center;
  padding: 40px 0;
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
