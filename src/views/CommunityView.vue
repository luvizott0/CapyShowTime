<template>
  <div class="community-page">
    <header class="page-header">
      <div class="container">
        <div class="header-top">
          <div>
            <h1 class="header-title mono">Atividades da CapyShowTime</h1>
            <p class="header-subtitle">O que os amigos da capihouse estão assistindo</p>
          </div>
          <RefreshButton
            :is-refreshing="seriesStore.isRefreshingCommunity"
            @refresh="onForceRefresh"
          />
        </div>
      </div>
    </header>

    <main class="container page-body">
      <!-- Amigos da Casa (acesso rápido aos perfis e listas) -->
      <section v-if="houseUsers.length > 0" class="friends-section fade-in">
        <h2 class="section-heading mono">Amigos da Casa</h2>
        <div class="friends-scroll">
          <div
            v-for="u in houseUsers"
            :key="u.id"
            class="friend-chip"
            @click="goToProfile(u.id)"
          >
            <img
              v-if="u.avatar_url"
              :src="u.avatar_url"
              :alt="u.name"
              class="friend-avatar"
            />
            <div v-else class="friend-avatar-placeholder">
              {{ u.name.charAt(0) }}
            </div>
            <span class="friend-name">{{ u.name.split(' ')[0] }}</span>
          </div>
        </div>
      </section>

      <div v-if="seriesStore.isRefreshingCommunity && !seriesStore.communityLoaded" class="loading-state">
        <div class="spinner"></div>
        <p>Carregando atividades...</p>
      </div>

      <div v-else-if="seriesStore.communityActivities.length === 0" class="empty-state fade-in">
        <Users :size="48" class="empty-icon" />
        <h3 class="empty-title">Nenhuma atividade recente</h3>
        <p class="empty-desc">Assim que algum amigo avaliar episódios, comentar ou concluir séries, as novidades aparecerão aqui!</p>
      </div>

      <div v-else class="activities-list fade-in">
        <h2 class="section-heading mono">Destaques da Casa</h2>
        <div
          v-for="act in seriesStore.communityActivities"
          :key="act.id"
          class="activity-card"
        >
          <div class="user-row" @click="goToProfile(act.user.id)">
            <div class="user-main">
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

            <!-- Badge do tipo de atividade relevante -->
            <div class="activity-type-badge" :class="act.type || 'rating'">
              <Trophy v-if="act.type === 'completed'" :size="13" />
              <MessageSquare v-else-if="act.type === 'comment'" :size="13" />
              <Star v-else :size="13" fill="currentColor" />
              <span>
                {{
                  act.type === 'completed'
                    ? 'Concluiu'
                    : (act.type === 'comment' ? 'Comentou' : 'Avaliou')
                }}
              </span>
            </div>
          </div>

          <div class="activity-content" @click="goToSeries(act.series.tmdb_id)">
            <img
              v-if="resolvePoster(act.series)"
              :src="resolvePoster(act.series)"
              :alt="act.series.name"
              class="series-poster"
            />
            <div class="content-details">
              <h4 class="series-name">{{ act.series.name }}</h4>

              <!-- Série Concluída -->
              <div v-if="act.type === 'completed'" class="completion-box">
                <span class="completion-pill">
                  🏆 Concluiu a série inteira!
                </span>
                <span v-if="act.series.number_of_seasons" class="seasons-total mono">
                  {{ act.series.number_of_seasons }} temp.
                </span>
              </div>

              <!-- Episódio (Rating ou Comment) -->
              <p v-else-if="act.episode" class="ep-info">
                <span class="mono ep-code">S{{ formatNum(act.episode.season_number) }}E{{ formatNum(act.episode.episode_number) }}</span>
                <span class="ep-title">{{ act.episode.name }}</span>
              </p>

              <!-- Avaliação com Nota -->
              <div v-if="act.rating" class="rating-badge-row">
                <div class="badge-rating mono">
                  <Star :size="14" fill="currentColor" />
                  <span>{{ Number(act.rating).toFixed(1) }} ★</span>
                </div>
              </div>

              <!-- Comentário em Episódio -->
              <div v-if="act.comment" class="comment-box" @click.stop>
                <div
                  v-if="act.comment.is_spoiler && !revealedSpoilers[act.id]"
                  class="spoiler-warning"
                  @click="toggleSpoiler(act.id)"
                >
                  <span>⚠️ Contém Spoiler (toque para ver)</span>
                </div>
                <div v-else class="comment-text-wrapper">
                  <p class="comment-text">
                    "{{ act.comment.content }}"
                  </p>
                  <span v-if="act.comment.is_spoiler" class="spoiler-tag mono">Spoiler</span>
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
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Users, Star, MessageSquare, Trophy } from 'lucide-vue-next'
import { capyApi } from '@/api/capyshowtime'
import { useSeriesStore } from '@/stores/series'
import { getPosterUrl } from '@/utils/images'
import RefreshButton from '@/components/RefreshButton.vue'

const router = useRouter()
const seriesStore = useSeriesStore()
const houseUsers = ref<any[]>([])
const revealedSpoilers = reactive<Record<string, boolean>>({})

function toggleSpoiler(id: string) {
  revealedSpoilers[id] = !revealedSpoilers[id]
}

function resolvePoster(series: any): string {
  return getPosterUrl(series.poster_url || series.poster_path)
}

async function fetchUsers() {
  try {
    const res = await capyApi.getUsers()
    houseUsers.value = res.data || []
  } catch (err) {
    console.error('Erro ao buscar amigos:', err)
  }
}

function onForceRefresh() {
  seriesStore.fetchCommunity(true)
  fetchUsers()
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
  seriesStore.fetchCommunity(false)
  fetchUsers()
})
</script>

<style scoped>
.community-page {
  padding-bottom: 90px;
}

.page-header {
  padding: calc(var(--safe-top) + 16px) 0 16px;
  background-color: var(--bg-surface);
  border-bottom: 1px solid var(--color-border);
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
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

.friends-section {
  margin-bottom: 24px;
}

.section-heading {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 12px;
}

.friends-scroll {
  display: flex;
  gap: 14px;
  overflow-x: auto;
  padding: 4px 2px 8px;
  scrollbar-width: none;
}

.friends-scroll::-webkit-scrollbar {
  display: none;
}

.friend-chip {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  flex-shrink: 0;
  transition: transform 0.15s ease;
}

.friend-chip:hover {
  transform: translateY(-2px);
}

.friend-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--color-border);
  transition: border-color 0.2s;
}

.friend-chip:hover .friend-avatar {
  border-color: var(--color-accent);
}

.friend-avatar-placeholder {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: var(--color-primary);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1rem;
  border: 2px solid var(--color-border);
}

.friend-name {
  font-size: 0.75rem;
  color: var(--text-main);
  font-weight: 500;
  max-width: 64px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 12px;
  cursor: pointer;
}

.user-main {
  display: flex;
  align-items: center;
  gap: 10px;
}

.activity-type-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: var(--radius-full);
}

.activity-type-badge.rating {
  background: rgba(245, 197, 24, 0.15);
  color: var(--color-accent);
  border: 1px solid rgba(245, 197, 24, 0.3);
}

.activity-type-badge.comment {
  background: rgba(59, 130, 246, 0.15);
  color: #60a5fa;
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.activity-type-badge.completed {
  background: rgba(34, 197, 94, 0.15);
  color: var(--color-success);
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.completion-box {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 6px 0;
  flex-wrap: wrap;
}

.completion-pill {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--color-success);
  background: rgba(34, 197, 94, 0.12);
  border: 1px solid rgba(34, 197, 94, 0.25);
  padding: 2px 8px;
  border-radius: var(--radius-sm);
}

.seasons-total {
  font-size: 0.75rem;
  color: var(--text-dim);
}

.comment-box {
  margin-top: 8px;
  background-color: var(--bg-surface);
  border-left: 3px solid var(--color-primary);
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
  padding: 8px 10px;
}

.spoiler-warning {
  font-size: 0.75rem;
  color: #f59e0b;
  cursor: pointer;
  font-weight: 600;
  user-select: none;
}

.comment-text {
  font-size: 0.82rem;
  color: var(--text-main);
  font-style: italic;
  line-height: 1.4;
  margin: 0;
}

.comment-text-wrapper {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.spoiler-tag {
  font-size: 0.65rem;
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.15);
  padding: 1px 5px;
  border-radius: 3px;
  flex-shrink: 0;
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
