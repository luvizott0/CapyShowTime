<template>
  <div v-if="isOpen" class="comments-modal-backdrop" @click.self="close">
    <div class="comments-modal-content fade-in">
      <div class="modal-header">
        <div class="header-titles">
          <span class="mono ep-code">S{{ formatNum(seasonNum) }}E{{ formatNum(episodeNum) }}</span>
          <h3 class="modal-title">{{ episodeName }}</h3>
        </div>
        <button class="close-btn" @click="close">
          <X :size="20" />
        </button>
      </div>

      <!-- Feed de comentários -->
      <div class="comments-body">
        <div v-if="loading" class="comments-loading">
          <div class="spinner"></div>
          <p>Carregando debate...</p>
        </div>

        <div v-else-if="comments.length === 0" class="no-comments">
          <MessageSquare :size="36" class="empty-icon" />
          <p class="empty-title">Nenhum comentário ainda!</p>
          <p class="empty-desc">Seja o primeiro a discutir o que achou deste episódio.</p>
        </div>

        <div v-else class="comments-list">
          <div
            v-for="comment in comments"
            :key="comment.id"
            class="comment-item"
          >
            <div class="comment-author">
              <img
                v-if="comment.user.avatar_url"
                :src="comment.user.avatar_url"
                :alt="comment.user.name"
                class="author-avatar"
              />
              <div v-else class="avatar-placeholder">
                {{ comment.user.name.charAt(0) }}
              </div>
              <div class="author-info">
                <span class="author-name">{{ comment.user.name }}</span>
                <span class="comment-time">{{ comment.created_at }}</span>
              </div>
            </div>

            <!-- Conteúdo com proteção de Spoiler -->
            <div
              v-if="comment.is_spoiler && !revealedSpoilers.has(comment.id)"
              class="spoiler-warning"
              @click="revealSpoiler(comment.id)"
            >
              <AlertTriangle :size="16" />
              <span>Contém spoiler! Clique para revelar</span>
            </div>
            <div v-else class="comment-content">
              {{ comment.content }}
            </div>

            <div class="comment-footer">
              <button
                class="like-btn"
                :class="{ liked: comment.liked_by_me }"
                @click="toggleLike(comment)"
              >
                <Heart :size="14" :fill="comment.liked_by_me ? 'currentColor' : 'none'" />
                <span class="mono">{{ comment.likes_count }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Input de Novo Comentário -->
      <form @submit.prevent="submitComment" class="comment-form">
        <div class="spoiler-toggle">
          <label class="toggle-label">
            <input type="checkbox" v-model="isSpoiler" class="toggle-checkbox" />
            <span>Contém Spoiler</span>
          </label>
        </div>

        <div class="input-row">
          <textarea
            v-model="newCommentText"
            placeholder="O que achou desse episódio?..."
            rows="2"
            class="comment-textarea"
            required
          ></textarea>
          <button type="submit" :disabled="submitting || !newCommentText.trim()" class="send-btn">
            <Send :size="18" />
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { X, MessageSquare, AlertTriangle, Heart, Send } from 'lucide-vue-next'
import { capyApi, type Comment } from '@/api/capyshowtime'

const props = defineProps<{
  isOpen: boolean
  episodeId: number
  episodeName: string
  seasonNum: number
  episodeNum: number
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'comment-added'): void
}>()

const comments = ref<Comment[]>([])
const loading = ref(false)
const submitting = ref(false)
const newCommentText = ref('')
const isSpoiler = ref(false)
const revealedSpoilers = ref(new Set<number>())

watch(
  () => props.isOpen,
  (open) => {
    if (open && props.episodeId) {
      loadComments()
    }
  }
)

async function loadComments() {
  loading.value = true
  try {
    const res = await capyApi.getEpisodeComments(props.episodeId)
    comments.value = res.data
  } catch (err) {
    console.error('Erro ao carregar comentários:', err)
  } finally {
    loading.value = false
  }
}

function revealSpoiler(commentId: number) {
  revealedSpoilers.value.add(commentId)
}

async function toggleLike(comment: Comment) {
  try {
    const res = await capyApi.toggleCommentLike(comment.id)
    comment.liked_by_me = res.data.liked
    comment.likes_count = res.data.likes_count
  } catch (err) {
    console.error('Erro ao curtir comentário:', err)
  }
}

async function submitComment() {
  if (!newCommentText.value.trim() || submitting.value) return

  submitting.value = true
  try {
    const res = await capyApi.addEpisodeComment(
      props.episodeId,
      newCommentText.value.trim(),
      isSpoiler.value
    )
    comments.value.unshift(res.data)
    newCommentText.value = ''
    isSpoiler.value = false
    emit('comment-added')
  } catch (err) {
    console.error('Erro ao enviar comentário:', err)
  } finally {
    submitting.value = false
  }
}

function formatNum(n: number): string {
  return n < 10 ? `0${n}` : `${n}`
}

function close() {
  emit('close')
}
</script>

<style scoped>
.comments-modal-backdrop {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 210;
}

@media (min-width: 640px) {
  .comments-modal-backdrop {
    align-items: center;
    padding: 20px;
  }
}

.comments-modal-content {
  background-color: var(--bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  width: 100%;
  max-width: 520px;
  height: 80vh;
  max-height: 650px;
  display: flex;
  flex-direction: column;
}

@media (min-width: 640px) {
  .comments-modal-content {
    border-radius: var(--radius-lg);
  }
}

.modal-header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--color-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.ep-code {
  font-size: 0.75rem;
  color: var(--color-accent);
  font-weight: 700;
}

.modal-title {
  font-size: 1rem;
  color: var(--text-main);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 320px;
}

.close-btn {
  color: var(--text-muted);
  padding: 4px;
}

.comments-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.comment-item {
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  padding: 12px;
}

.comment-author {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.author-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: var(--color-primary);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.85rem;
}

.author-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-main);
}

.comment-time {
  font-size: 0.7rem;
  color: var(--text-dim);
  margin-left: 6px;
}

.spoiler-warning {
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: rgba(251, 191, 36, 0.15);
  border: 1px dashed var(--color-warning);
  color: var(--color-warning);
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  margin: 6px 0;
}

.comment-content {
  font-size: 0.88rem;
  color: var(--text-main);
  line-height: 1.45;
  white-space: pre-wrap;
  margin: 4px 0 8px;
}

.comment-footer {
  display: flex;
  justify-content: flex-end;
}

.like-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  color: var(--text-dim);
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  transition: all 0.2s;
}

.like-btn.liked {
  color: var(--color-danger);
}

.comment-form {
  border-top: 1px solid var(--color-border);
  padding: 12px 16px calc(12px + var(--safe-bottom));
  background-color: var(--bg-surface);
}

.spoiler-toggle {
  margin-bottom: 8px;
}

.toggle-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  color: var(--text-muted);
  cursor: pointer;
}

.toggle-checkbox {
  accent-color: var(--color-warning);
}

.input-row {
  display: flex;
  gap: 10px;
  align-items: flex-end;
}

.comment-textarea {
  flex: 1;
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 10px 12px;
  color: var(--text-main);
  font-size: 0.88rem;
  resize: none;
  outline: none;
}

.comment-textarea:focus {
  border-color: var(--color-accent);
}

.send-btn {
  background-color: var(--color-accent);
  color: #12100e;
  width: 42px;
  height: 42px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s;
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.no-comments, .comments-loading {
  text-align: center;
  padding: 40px 0;
  color: var(--text-muted);
}

.empty-icon {
  color: var(--color-accent);
  margin-bottom: 12px;
}

.empty-title {
  font-weight: 700;
  color: var(--text-main);
  margin-bottom: 4px;
}

.empty-desc {
  font-size: 0.8rem;
}

.spinner {
  width: 28px;
  height: 28px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 10px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
