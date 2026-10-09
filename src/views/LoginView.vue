<template>
  <div class="login-page">
    <div class="login-card fade-in">
      <div class="logo-container">
        <div class="tv-icon-badge">
          <Tv :size="40" class="tv-icon" />
          <div class="capy-ears"></div>
        </div>
        <h1 class="app-title mono">CapyShowTime</h1>
        <p class="app-subtitle">O TV Show Time dos amigos da Capihouse</p>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div v-if="errorMessage" class="error-banner">
          {{ errorMessage }}
        </div>

        <div class="input-group">
          <label for="login" class="input-label">E-mail ou Usuário da Capihouse</label>
          <input
            id="login"
            v-model="loginInput"
            type="text"
            required
            autocomplete="username"
            placeholder="calebe ou seu@email.com"
            class="form-input"
          />
        </div>

        <div class="input-group">
          <label for="password" class="input-label">Senha</label>
          <input
            id="password"
            v-model="passwordInput"
            type="password"
            required
            autocomplete="current-password"
            placeholder="••••••••"
            class="form-input"
          />
        </div>

        <button type="submit" :disabled="authStore.isLoading" class="btn-primary submit-btn">
          <span v-if="authStore.isLoading">Entrando...</span>
          <span v-else>Entrar com Capihouse</span>
        </button>

        <p class="login-hint">
          Sua conta é a mesma que você já utiliza no <strong>Capihouse</strong>.
        </p>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Tv } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const loginInput = ref('')
const passwordInput = ref('')
const errorMessage = ref('')

async function handleLogin() {
  errorMessage.value = ''
  const result = await authStore.login(loginInput.value, passwordInput.value)
  if (result.success) {
    router.push('/')
  } else {
    errorMessage.value = result.message || 'Erro ao realizar login'
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: calc(var(--safe-top) + 20px) 20px calc(var(--safe-bottom) + 20px);
  background: radial-gradient(circle at top, #261f18 0%, #12100e 70%);
}

.login-card {
  width: 100%;
  max-width: 380px;
  background-color: var(--bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 32px 24px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.7);
}

.logo-container {
  text-align: center;
  margin-bottom: 28px;
}

.tv-icon-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 72px;
  height: 72px;
  background-color: var(--color-accent);
  color: #12100e;
  border-radius: var(--radius-md);
  margin-bottom: 16px;
  box-shadow: 0 0 24px rgba(245, 197, 24, 0.35);
}

.app-title {
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--text-main);
  letter-spacing: -0.5px;
}

.app-subtitle {
  color: var(--text-muted);
  font-size: 0.85rem;
  margin-top: 4px;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.error-banner {
  background-color: rgba(248, 113, 113, 0.15);
  border: 1px solid var(--color-danger);
  color: var(--color-danger);
  padding: 10px 14px;
  border-radius: var(--radius-sm);
  font-size: 0.85rem;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.input-label {
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--text-muted);
}

.form-input {
  background-color: var(--bg-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 12px 14px;
  color: var(--text-main);
  font-size: 0.95rem;
  outline: none;
  transition: border-color 0.2s;
}

.form-input:focus {
  border-color: var(--color-accent);
}

.submit-btn {
  width: 100%;
  margin-top: 8px;
}

.login-hint {
  text-align: center;
  font-size: 0.75rem;
  color: var(--text-dim);
  margin-top: 8px;
}
</style>
