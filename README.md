# 📺 CapyShowTime PWA

PWA dedicado exclusivamente ao acompanhamento de séries para os moradores da **Capihouse**, fortemente inspirado no clássico **TV Show Time**.

---

## ✨ Funcionalidades Principais

1. **Minha Lista & Próximos Episódios (Up Next)**:
   - Acompanhamento do próximo episódio pendente de cada série em andamento.
   - Botão de check-in circular de 1 toque no estilo clássico do TV Show Time.
   - Barra de progresso visual de cada série (`8/10 eps • 80%`).

2. **Sistema de Avaliação & Cálculo de Médias**:
   - **Nota por episódio**: Escala de **1.0 a 10.0** (com precisão decimal).
   - **Nota da Temporada**: Média aritmética automática dos episódios avaliados daquela temporada.
   - **Nota da Série**: Média aritmética automática das médias das temporadas avaliadas.
   - **Média dos Moradores**: Exibição da nota média da comunidade Capihouse para cada episódio, temporada e série.

3. **Debates e Comentários por Episódio**:
   - Seção de comentários em tempo real para cada episódio.
   - Suporte a marcação de **Spoiler** (com aviso e clique para revelar).
   - Curtidas em comentários dos outros moradores.

4. **Catálogo & Integração TMDB**:
   - Busca em tempo real de qualquer série via The Movie Database (TMDB).
   - Sessões "Em Alta na Semana" e "Mais Populares".
   - Pôsteres oficiais, banners em alta resolução e fotos dos episódios.

5. **Login Unificado Capihouse**:
   - Utiliza as mesmas credenciais (e-mail/username e senha) da Capihouse via tokens do Laravel Sanctum.
   - Lista os moradores que também assistem à mesma série.

6. **Perfil & Estatísticas**:
   - Contador de tempo total gasto assistindo séries (Dias e Horas).
   - Total de episódios vistos e avaliados.

---

## 🚀 Como Rodar em Desenvolvimento Local

### 1. Backend (capihouse-api)
Certifique-se de preencher as variáveis do TMDB no `.env` do `capihouse-api`:
```env
TMDB_API_KEY=sua_api_key_aqui
# ou TMDB_READ_ACCESS_TOKEN=seu_token_v4_aqui
TMDB_LANGUAGE=pt-BR
```
E rodar as migrações:
```bash
php artisan migrate
php artisan serve
```

### 2. Frontend (capyshowtime-pwa)
```bash
cd capyshowtime-pwa
npm install
npm run dev
```
Acesse `http://localhost:5174` no navegador.

---

## 🐳 Deploy no Docker / Homelab
Para rodar via container:
```bash
docker build -t capyshowtime-pwa:latest .
docker run -d --name capyshowtime-pwa -p 8007:80 capyshowtime-pwa:latest
```
Ou adicionar ao `docker-compose.yml` da Capihouse no servidor BMO com proxy reverso no Nginx Proxy Manager apontando para `capyshowtime.bmo`.
