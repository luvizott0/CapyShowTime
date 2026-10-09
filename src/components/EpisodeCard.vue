<template>
  <div class="episode-card" :class="{ watched: episode.is_watched }">
    <div class="episode-media" @click="$emit('open-detail', episode)">
      <img
        v-if="resolveStill(episode)"
        :src="resolveStill(episode)"
        :alt="episode.name"
        class="episode-thumbnail"
        loading="lazy"
      />
      <div v-else class="episode-placeholder">
        <Film :size="24" class="placeholder-icon" />
      </div>
      <div class="episode-code mono">
        E{{ formatNum(episode.episode_number) }}
      </div>
    </div>

    <div class="episode-content">
      <div class="episode-header" @click="$emit('open-detail', episode)">
        <h4 class="episode-title">{{ episode.name }}</h4>
        <span v-if="episode.air_date" class="episode-date">{{ formatDate(episode.air_date) }}</span>
      </div>

      <p v-if="episode.overview" class="episode-overview" @click="$emit('open-detail', episode)">
        {{ episode.overview }}
      </p>

      <div class="episode-footer">
        <!-- Botão de Check-in Estilo TV Time -->
        <button
          class="check-btn"
          :class="{ active: episode.is_watched }"
          @click.stop="$emit('toggle-watched', episode)"
          :title="episode.is_watched ? 'Marcar como não visto' : 'Marcar como assistido'"
        >
          <Check :size="18" stroke-width="3" />
        </button>

        <!-- Botão de Avaliação (1 a 10) -->
        <button
          class="rating-btn mono"
          :class="{ rated: episode.user_rating !== null && episode.user_rating !== undefined }"
          @click.stop="$emit('open-rating', episode)"
        >
          <Star :size="15" :fill="episode.user_rating ? 'currentColor' : 'none'" />
          <span>{{ episode.user_rating ? episode.user_rating.toFixed(1) : 'Nota' }}</span>
        </button>

        <!-- Botão de Discussão / Comentários -->
        <button
          class="comments-btn"
          @click.stop="$emit('open-comments', episode)"
        >
          <MessageSquare :size="15" />
          <span class="mono">{{ episode.comments_count || 0 }}</span>
        </button>

        <!-- Média da Capihouse (se houver) -->
        <div v-if="episode.community_rating" class="community-rating" title="Média dos moradores">
          <span class="mono">Casa: {{ episode.community_rating.toFixed(1) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Check, Star, MessageSquare, Film } from 'lucide-vue-next'
import type { Episode } from '@/api/capyshowtime'
import { getStillUrl } from '@/utils/images'

defineProps<{
  episode: Episode
}>()

defineEmits<{
  (e: 'toggle-watched', episode: Episode): void
  (e: 'open-rating', episode: Episode): void
  (e: 'open-comments', episode: Episode): void
  (e: 'open-detail', episode: Episode): void
}>()

function resolveStill(episode: any): string {
  return getStillUrl(episode.still_url || episode.still_path)
}

function formatNum(n: number): string {
  return n < 10 ? `0${n}` : `${n}`
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  } catch {
    return dateStr
  }
}
</script>

<style scoped>
.episode-card {
  display: flex;
  gap: 14px;
  background-color: var(--bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 12px;
  transition: all 0.2s;
}

.episode-card.watched {
  border-color: rgba(245, 197, 24, 0.25);
}

.episode-media {
  position: relative;
  width: 105px;
  height: 68px;
  border-radius: var(--radius-sm);
  overflow: hidden;
  flex-shrink: 0;
  cursor: pointer;
  background-color: var(--bg-surface-elevated);
}

.episode-thumbnail {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.episode-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-dim);
}

.episode-code {
  position: absolute;
  bottom: 4px;
  left: 4px;
  background: rgba(0, 0, 0, 0.75);
  color: var(--color-accent);
  font-size: 0.7rem;
  font-weight: 700;
  padding: 1px 4px;
  border-radius: 4px;
}

.episode-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-width: 0;
}

.episode-header {
  cursor: pointer;
}

.episode-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-main);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.episode-date {
  font-size: 0.75rem;
  color: var(--text-dim);
}

.episode-overview {
  font-size: 0.8rem;
  color: var(--text-muted);
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin: 4px 0 8px;
  cursor: pointer;
}

.episode-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: auto;
}

/* TV Time Check Button */
.check-btn {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--color-border);
  color: var(--text-dim);
  background-color: var(--bg-surface-elevated);
  transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.check-btn:hover {
  transform: scale(1.08);
}

.check-btn.active {
  background-color: var(--color-accent);
  border-color: var(--color-accent);
  color: #12100e;
  box-shadow: 0 0 10px rgba(245, 197, 24, 0.4);
}

.rating-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 6px 10px;
  border-radius: var(--radius-full);
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--color-border);
  color: var(--text-muted);
  transition: all 0.2s;
}

.rating-btn.rated {
  background-color: var(--color-accent-dim);
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.comments-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  padding: 6px 10px;
  border-radius: var(--radius-full);
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--color-border);
  color: var(--text-muted);
  transition: all 0.2s;
}

.community-rating {
  font-size: 0.7rem;
  color: var(--text-dim);
  margin-left: auto;
}
</style>
