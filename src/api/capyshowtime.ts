import apiClient from './client'

export interface Series {
  id: number
  tmdb_id: number
  name: string
  original_name?: string
  overview?: string
  poster_path?: string
  backdrop_path?: string
  first_air_date?: string
  status?: string
  vote_average: number
  number_of_seasons: number
  number_of_episodes: number
  poster_url?: string
  backdrop_url?: string
}

export interface Season {
  id: number
  series_id: number
  season_number: number
  name?: string
  overview?: string
  poster_path?: string
  poster_url?: string
  episode_count: number
  air_date?: string
}

export interface Episode {
  id: number
  series_id: number
  season_id: number
  season_number: number
  episode_number: number
  name: string
  overview?: string
  still_url?: string
  air_date?: string
  runtime?: number
  comments_count: number
  is_watched: boolean
  watched_at?: string
  user_rating?: number | null
  community_rating?: number | null
  community_votes: number
}

export interface Comment {
  id: number
  user: {
    id: number
    name: string
    username: string
    avatar_url?: string
  }
  content: string
  is_spoiler: boolean
  created_at: string
  likes_count: number
  liked_by_me: boolean
}

export interface DiscoverFilters {
  sort_by?: string
  with_genres?: string
  min_rating?: string | number
  watch_provider?: string | number
  year_from?: string | number
  year_to?: string | number
  language?: string
  status?: string
  page?: number
}

export const capyApi = {
  search(query: string, page = 1) {
    return apiClient.get('/capyshowtime/search', { params: { q: query, page } })
  },

  trending() {
    return apiClient.get('/capyshowtime/trending')
  },

  popular() {
    return apiClient.get('/capyshowtime/popular')
  },

  genres() {
    return apiClient.get('/capyshowtime/genres')
  },

  discover(filters: DiscoverFilters) {
    return apiClient.get('/capyshowtime/discover', { params: filters })
  },

  getSeries(tmdbId: number) {
    return apiClient.get(`/capyshowtime/series/${tmdbId}`)
  },

  getSeason(tmdbId: number, seasonNumber: number) {
    return apiClient.get(`/capyshowtime/series/${tmdbId}/season/${seasonNumber}`)
  },

  setStatus(tmdbId: number, status: string) {
    return apiClient.post('/capyshowtime/series/status', { tmdb_id: tmdbId, status })
  },

  rateEpisode(episodeId: number, rating?: number | null, isWatched: boolean = true, removeRating: boolean = false) {
    return apiClient.post('/capyshowtime/episodes/rate', {
      episode_id: episodeId,
      rating: rating,
      is_watched: isWatched,
      remove_rating: removeRating
    })
  },

  getMyList(status?: string) {
    return apiClient.get('/capyshowtime/my-list', { params: { status } })
  },

  getUpNext() {
    return apiClient.get('/capyshowtime/up-next')
  },

  getEpisodeComments(episodeId: number) {
    return apiClient.get(`/capyshowtime/episodes/${episodeId}/comments`)
  },

  addEpisodeComment(episodeId: number, content: string, isSpoiler: boolean = false) {
    return apiClient.post('/capyshowtime/episodes/comments', {
      episode_id: episodeId,
      content,
      is_spoiler: isSpoiler
    })
  },

  toggleCommentLike(commentId: number) {
    return apiClient.post(`/capyshowtime/comments/${commentId}/like`)
  },

  getCommunityActivity() {
    return apiClient.get('/capyshowtime/community-activity')
  },

  getUsers() {
    return apiClient.get('/capyshowtime/users')
  },

  getUserProfile(userId: number) {
    return apiClient.get(`/capyshowtime/users/${userId}`)
  }
}
