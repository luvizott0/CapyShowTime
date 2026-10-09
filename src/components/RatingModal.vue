<template>
  <div v-if="isOpen" class="modal-backdrop" @click.self="close">
    <div class="modal-content fade-in">
      <div class="modal-header">
        <h3 class="modal-title">Avaliar Episódio</h3>
        <button class="close-btn" @click="close">
          <X :size="20" />
        </button>
      </div>

      <div class="episode-info">
        <span class="mono ep-code">S{{ formatNum(seasonNum) }}E{{ formatNum(episodeNum) }}</span>
        <p class="ep-name">{{ episodeName }}</p>
      </div>

      <div class="rating-display">
        <Star :size="36" class="star-icon" fill="currentColor" />
        <span class="mono rating-value">{{ rating.toFixed(1) }}</span>
        <span class="rating-max">/ 10</span>
      </div>

      <div class="slider-container">
        <input
          type="range"
          min="1"
          max="10"
          step="0.5"
          v-model.number="rating"
          class="rating-range"
        />
        <div class="range-labels mono">
          <span>1.0</span>
          <span>5.0</span>
          <span>10.0</span>
        </div>
      </div>

      <div class="quick-ratings">
        <button
          v-for="val in [6, 7, 8, 9, 10]"
          :key="val"
          class="quick-btn mono"
          :class="{ active: Math.round(rating) === val }"
          @click="rating = val"
        >
          {{ val }}
        </button>
      </div>

      <div class="modal-actions">
        <button v-if="hasInitialRating" class="btn-remove" @click="removeRating">
          Remover Nota
        </button>
        <button class="btn-primary flex-1" @click="confirmRating">
          Confirmar Nota
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { X, Star } from 'lucide-vue-next'

const props = defineProps<{
  isOpen: boolean
  episodeId: number
  episodeName: string
  seasonNum: number
  episodeNum: number
  currentRating?: number | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save', rating: number): void
  (e: 'remove'): void
}>()

const rating = ref<number>(8.0)
const hasInitialRating = ref(false)

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      if (props.currentRating) {
        rating.value = props.currentRating
        hasInitialRating.value = true
      } else {
        rating.value = 8.0
        hasInitialRating.value = false
      }
    }
  }
)

function formatNum(n: number): string {
  return n < 10 ? `0${n}` : `${n}`
}

function close() {
  emit('close')
}

function confirmRating() {
  emit('save', rating.value)
}

function removeRating() {
  emit('remove')
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 200;
  padding: 16px;
}

@media (min-width: 640px) {
  .modal-backdrop {
    align-items: center;
  }
}

.modal-content {
  background-color: var(--bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  width: 100%;
  max-width: 440px;
  padding: 24px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.modal-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--text-main);
}

.close-btn {
  color: var(--text-muted);
  padding: 4px;
}

.episode-info {
  margin-bottom: 20px;
}

.ep-code {
  font-size: 0.85rem;
  color: var(--color-accent);
  font-weight: 700;
}

.ep-name {
  color: var(--text-muted);
  font-size: 0.95rem;
  margin-top: 2px;
}

.rating-display {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 20px 0;
}

.star-icon {
  color: var(--color-accent);
}

.rating-value {
  font-size: 3.5rem;
  font-weight: 700;
  color: var(--text-main);
  line-height: 1;
}

.rating-max {
  font-size: 1.25rem;
  color: var(--text-muted);
  align-self: flex-end;
  margin-bottom: 8px;
}

.slider-container {
  margin: 16px 0 24px;
}

.rating-range {
  width: 100%;
  height: 8px;
  border-radius: 4px;
  background: var(--bg-surface-elevated);
  accent-color: var(--color-accent);
  cursor: pointer;
}

.range-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: var(--text-dim);
  margin-top: 6px;
}

.quick-ratings {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 24px;
}

.quick-btn {
  flex: 1;
  padding: 8px 0;
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--text-main);
  font-weight: 700;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.quick-btn.active {
  background-color: var(--color-accent);
  color: #12100e;
  border-color: var(--color-accent);
}

.modal-actions {
  display: flex;
  gap: 12px;
}

.flex-1 {
  flex: 1;
}

.btn-remove {
  background: none;
  border: 1px solid var(--color-border);
  color: var(--color-danger);
  padding: 12px 16px;
  border-radius: var(--radius-md);
  font-size: 0.9rem;
  font-weight: 600;
}
</style>
