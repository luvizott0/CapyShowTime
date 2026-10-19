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
          v-if="resolveBackdrop(series)"
          :src="resolveBackdrop(series)"
          :alt="series.name"
          class="backdrop-img"
        />
        <div class="backdrop-overlay"></div>
        <button class="back-btn" @click="goBack">
          <ArrowLeft :size="20" />
        </button>
      </div>

      <div class="container main-content">
        <!-- Header Info (Pôster + Título + Status) -->
        <div class="series-header-info">
          <div class="poster-box">
            <img
              v-if="resolvePoster(series)"
              :src="resolvePoster(series)"
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
            <span class="rating-subtext">Média dos amigos</span>
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

        <!-- Amigos assistindo -->
        <div v-if="housemates.length > 0" class="housemates-section">
          <h3 class="section-title">Amigos que acompanham</h3>
          <div class="housemates-avatars">
            <div
              v-for="hm in housemates"
              :key="hm.user.id"
              class="housemate-item"
              :title="`Ver perfil de ${hm.user.name}`"
              @click="goToProfile(hm.user.id)"
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

          <!-- Barra de Ações da Temporada Atual -->
          <div class="season-action-bar">
            <div class="season-info-count">
              <span class="mono count-text">{{ episodes.length }} episódios</span>
              <span v-if="allSeasonWatched && episodes.length > 0" class="season-completed-badge mono">
                <Check :size="12" stroke-width="3" /> Concluída
              </span>
            </div>

            <button
              v-if="episodes.length > 0"
              type="button"
              class="season-watch-all-btn"
              :class="{ 'all-watched': allSeasonWatched }"
              :disabled="seasonLoading || isMarkingSeason"
              @click="handleMarkSeasonWatched"
            >
              <CheckCheck :size="15" stroke-width="2.5" />
              <span>{{ allSeasonWatched ? 'Temporada Assistida' : 'Marcar temporada como assistida' }}</span>
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

    <!-- Estado de Erro / Não Encontrado -->
    <div v-else class="container empty-state-detail fade-in">
      <div class="empty-icon-box">
        <AlertCircle :size="48" class="error-icon" />
      </div>
      <h3 class="error-title">Série não encontrada</h3>
      <p class="error-desc">{{ errorMessage || 'Não foi possível carregar as informações desta série. Verifique sua conexão e se a chave do TMDB está configurada.' }}</p>
      <div class="error-actions">
        <button class="btn-primary" @click="fetchSeriesDetails">
          <RotateCw :size="16" />
          <span>Tentar Novamente</span>
        </button>
        <button class="btn-secondary" @click="goBack">
          <span>Voltar</span>
        </button>
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

    <!-- Modal de Confirmação para Marcar Anteriores -->
    <MarkPreviousModal
      :is-open="isMarkPreviousOpen"
      :episode="targetPreviousEpisode"
      @close="isMarkPreviousOpen = false"
      @confirm-all="onConfirmMarkPreviousAll"
      @confirm-only-this="onConfirmOnlyThisEpisode"
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
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Film, Star, Users, AlertCircle, RotateCw, Check, CheckCheck } from 'lucide-vue-next'
import { capyApi, type Series, type Season, type Episode } from '@/api/capyshowtime'
import { useSeriesStore } from '@/stores/series'
import { getPosterUrl, getBackdropUrl } from '@/utils/images'
import EpisodeCard from '@/components/EpisodeCard.vue'
import RatingModal from '@/components/RatingModal.vue'
import MarkPreviousModal from '@/components/MarkPreviousModal.vue'
import EpisodeCommentsModal from '@/components/EpisodeCommentsModal.vue'

const route = useRoute()
const router = useRouter()
const tmdbId = Number(route.params.id)
const seriesStore = useSeriesStore()

function resolvePoster(s: any): string {
  return getPosterUrl(s?.poster_url || s?.poster_path)
}

function resolveBackdrop(s: any): string {
  return getBackdropUrl(s?.backdrop_url || s?.backdrop_path)
}

function goBack() {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/')
  }
}

const loading = ref(true)
const seasonLoading = ref(false)
const errorMessage = ref<string | null>(null)
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
  errorMessage.value = null
  try {
    const res = await capyApi.getSeries(tmdbId)
    if (!res.data || !res.data.series) {
      throw new Error('Série não encontrada')
    }
    series.value = res.data.series
    // Filtra temporada 0 se for especiais, ou mantém
    seasons.value = (res.data.seasons || []).filter((s: Season) => s.season_number > 0)
    userStatus.value = res.data.user_status || null
    userRatings.value = res.data.user_ratings || null
    communityRatings.value = res.data.community_ratings || null
    housemates.value = res.data.housemates || []

    // Carregar primeira temporada ou a temporada passada via query
    const querySeason = Number(route.query.season) || (seasons.value[0]?.season_number ?? 1)
    if (seasons.value.length > 0) {
      await selectSeason(querySeason)
    }
  } catch (err: any) {
    console.error('Erro ao carregar série:', err)
    errorMessage.value = err.response?.data?.message || err.message || 'Não foi possível carregar as informações desta série.'
  } finally {
    loading.value = false
  }
}

async function selectSeason(num: number) {
  selectedSeasonNum.value = num
  seasonLoading.value = true
  try {
    const res = await capyApi.getSeason(tmdbId, num)
    episodes.value = res.data.episodes || []
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
    if (val === 'completed' || res.data.marked_episodes_watched) {
      episodes.value = episodes.value.map(ep => ({
        ...ep,
        is_watched: true
      }))
    }
    seriesStore.invalidateAllCache()
  } catch (err) {
    console.error('Erro ao alterar status:', err)
  }
}

function goToProfile(userId: number) {
  router.push(`/profile/${userId}`)
}

const isMarkingSeason = ref(false)
const allSeasonWatched = computed(() => {
  return episodes.value.length > 0 && episodes.value.every(ep => ep.is_watched)
})

async function handleMarkSeasonWatched() {
  if (seasonLoading.value || isMarkingSeason.value) return
  isMarkingSeason.value = true
  try {
    const res = await capyApi.watchSeason(tmdbId, selectedSeasonNum.value)
    episodes.value = episodes.value.map(ep => ({
      ...ep,
      is_watched: true
    }))
    if (res.data?.user_status) {
      userStatus.value = res.data.user_status
    }
    updateRatingsFromResponse(res.data)
    seriesStore.invalidateAllCache()
  } catch (err) {
    console.error('Erro ao marcar temporada como assistida:', err)
  } finally {
    isMarkingSeason.value = false
  }
}

// Modal de marcação de episódios anteriores
const isMarkPreviousOpen = ref(false)
const targetPreviousEpisode = ref<Episode | null>(null)

async function handleToggleWatched(ep: Episode) {
  if (ep.is_watched) {
    // Desmarcando episódio: não precisa de confirmação
    ep.is_watched = false
    try {
      const res = await capyApi.rateEpisode(ep.id, ep.user_rating, false)
      updateRatingsFromResponse(res.data)
      seriesStore.invalidateAllCache()
    } catch (err) {
      ep.is_watched = true // rollback
      console.error('Erro ao desmarcar assistido:', err)
    }
    return
  }

  // Marcando como assistido:
  // Verifica se existem episódios anteriores desmarcados na temporada atual
  const hasUnwatchedPreviousInSeason = episodes.value.some(
    e => e.episode_number < ep.episode_number && !e.is_watched
  )

  if (hasUnwatchedPreviousInSeason) {
    targetPreviousEpisode.value = ep
    isMarkPreviousOpen.value = true
    return
  }

  await markSingleEpisode(ep)
}

async function markSingleEpisode(ep: Episode) {
  ep.is_watched = true
  try {
    const res = await capyApi.rateEpisode(ep.id, ep.user_rating, true)
    updateRatingsFromResponse(res.data)
    seriesStore.invalidateAllCache()
  } catch (err) {
    ep.is_watched = false // rollback
    console.error('Erro ao marcar assistido:', err)
  }
}

async function onConfirmMarkPreviousAll() {
  if (!targetPreviousEpisode.value) return
  const ep = targetPreviousEpisode.value
  isMarkPreviousOpen.value = false

  // Episódios da temporada atual até o selecionado que ainda não estão marcados
  const toMark = episodes.value.filter(
    e => e.episode_number <= ep.episode_number && !e.is_watched
  )

  // Otimisticamente marca os episódios locais até o selecionado como assistidos
  episodes.value = episodes.value.map(e => {
    if (e.episode_number <= ep.episode_number) {
      return { ...e, is_watched: true }
    }
    return e
  })

  try {
    for (const item of toMark) {
      const res = await capyApi.rateEpisode(item.id, item.user_rating, true)
      updateRatingsFromResponse(res.data)
    }
    seriesStore.invalidateAllCache()
  } catch (err) {
    console.error('Erro ao marcar episódios anteriores como assistidos:', err)
    await selectSeason(selectedSeasonNum.value)
  }
}

async function onConfirmOnlyThisEpisode() {
  if (!targetPreviousEpisode.value) return
  const ep = targetPreviousEpisode.value
  isMarkPreviousOpen.value = false
  await markSingleEpisode(ep)
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
    seriesStore.invalidateAllCache()
  } catch (err) {
    console.error('Erro ao salvar nota:', err)
  }
}

async function onRatingRemoved() {
  if (!activeEpisode.value) return
  isRatingOpen.value = false
  try {
    const res = await capyApi.rateEpisode(activeEpisode.value.id, null, activeEpisode.value.is_watched, true)
    activeEpisode.value.user_rating = null
    updateRatingsFromResponse(res.data)
    seriesStore.invalidateAllCache()
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
  height: calc(220px + var(--safe-top));
  background-color: var(--bg-surface-elevated);
  overflow: hidden;
}

@media (min-width: 640px) {
  .backdrop-wrapper {
    height: calc(320px + var(--safe-top));
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
  top: calc(var(--safe-top) + 14px);
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
  cursor: pointer;
  transition: transform 0.15s ease;
}

.housemate-item:hover {
  transform: translateY(-2px);
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

.season-action-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
  gap: 12px;
  flex-wrap: wrap;
}

.season-info-count {
  display: flex;
  align-items: center;
  gap: 8px;
}

.count-text {
  font-size: 0.8rem;
  color: var(--text-dim);
}

.season-completed-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.72rem;
  font-weight: 700;
  color: #12100e;
  background-color: var(--color-accent);
  padding: 2px 7px;
  border-radius: var(--radius-sm);
}

.season-watch-all-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--color-border);
  color: var(--text-main);
  padding: 6px 12px;
  border-radius: var(--radius-full);
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.season-watch-all-btn:hover:not(:disabled) {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.season-watch-all-btn.all-watched {
  background-color: rgba(245, 197, 24, 0.15);
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.season-watch-all-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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

.empty-state-detail {
  text-align: center;
  padding: 80px 20px;
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

.error-icon {
  color: var(--color-danger);
}

.error-title {
  font-size: 1.3rem;
  font-weight: 700;
  margin-bottom: 8px;
  color: var(--text-main);
}

.error-desc {
  color: var(--text-muted);
  font-size: 0.9rem;
  max-width: 400px;
  margin: 0 auto 24px;
}

.error-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
}
</style>
