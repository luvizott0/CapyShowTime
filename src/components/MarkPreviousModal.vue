<template>
  <div v-if="isOpen && episode" class="modal-backdrop" @click.self="close">
    <div class="modal-content fade-in">
      <div class="modal-header">
        <div class="modal-title-group">
          <CheckCheck :size="20" class="modal-title-icon" />
          <h3 class="modal-title">Marcar Anteriores?</h3>
        </div>
        <button class="close-btn" @click="close">
          <X :size="20" />
        </button>
      </div>

      <div class="modal-body">
        <div class="target-episode-box">
          <span class="mono ep-code">S{{ formatNum(episode.season_number) }}E{{ formatNum(episode.episode_number) }}</span>
          <p class="ep-name">{{ episode.name }}</p>
        </div>

        <p class="confirmation-text">
          Você marcou o episódio <strong>E{{ formatNum(episode.episode_number) }}</strong> como assistido, mas existem episódios anteriores nesta temporada que ainda estão desmarcados.
        </p>

        <p class="confirmation-subtext">
          Deseja marcar também todos os episódios anteriores desta temporada como assistidos?
        </p>
      </div>

      <div class="modal-actions-column">
        <button type="button" class="btn-primary action-btn-full" @click="confirmAll">
          <CheckCheck :size="18" />
          <span>Sim, marcar anteriores</span>
        </button>

        <button type="button" class="btn-secondary action-btn-full" @click="confirmOnlyThis">
          <Check :size="18" />
          <span>Apenas este episódio</span>
        </button>

        <button type="button" class="btn-ghost action-btn-full" @click="close">
          Cancelar
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { X, Check, CheckCheck } from 'lucide-vue-next'
import type { Episode } from '@/api/capyshowtime'

defineProps<{
  isOpen: boolean
  episode: Episode | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'confirm-all'): void
  (e: 'confirm-only-this'): void
}>()

function formatNum(n: number): string {
  return n < 10 ? `0${n}` : `${n}`
}

function close() {
  emit('close')
}

function confirmAll() {
  emit('confirm-all')
}

function confirmOnlyThis() {
  emit('confirm-only-this')
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background-color: var(--bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  width: 100%;
  max-width: 440px;
  padding: 24px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.modal-title-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.modal-title-icon {
  color: var(--color-accent);
}

.modal-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--text-main);
}

.close-btn {
  background: none;
  border: none;
  color: var(--text-dim);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
}

.close-btn:hover {
  color: var(--text-main);
}

.modal-body {
  margin-bottom: 24px;
}

.target-episode-box {
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 12px 14px;
  margin-bottom: 16px;
}

.ep-code {
  color: var(--color-accent);
  font-weight: 700;
  font-size: 0.85rem;
}

.ep-name {
  color: var(--text-main);
  font-size: 0.95rem;
  font-weight: 600;
  margin-top: 2px;
}

.confirmation-text {
  font-size: 0.92rem;
  color: var(--text-main);
  line-height: 1.45;
  margin-bottom: 10px;
}

.confirmation-subtext {
  font-size: 0.88rem;
  color: var(--text-muted);
  line-height: 1.4;
}

.modal-actions-column {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.action-btn-full {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 16px;
  font-size: 0.92rem;
  font-weight: 600;
  border-radius: var(--radius-md);
}

.btn-ghost {
  background: transparent;
  border: none;
  color: var(--text-dim);
  cursor: pointer;
  padding: 8px 16px;
  transition: color 0.15s;
}

.btn-ghost:hover {
  color: var(--text-main);
}
</style>
