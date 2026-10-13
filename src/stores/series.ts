import { defineStore } from 'pinia'
import { ref } from 'vue'
import { capyApi } from '@/api/capyshowtime'

const UP_NEXT_CACHE_KEY = 'capyshowtime_up_next_cache'
const MY_LIST_CACHE_KEY = 'capyshowtime_my_list_cache'
const DISCOVER_CACHE_KEY = 'capyshowtime_discover_cache'
const COMMUNITY_CACHE_KEY = 'capyshowtime_community_cache'

function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (raw) {
      return JSON.parse(raw) as T
    }
  } catch (e) {
    console.error(`Erro ao ler cache ${key}:`, e)
  }
  return defaultValue
}

function saveToStorage<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    console.error(`Erro ao salvar cache ${key}:`, e)
  }
}

export const useSeriesStore = defineStore('series', () => {
  // 1. Up Next State
  const upNextList = ref<any[]>(loadFromStorage(UP_NEXT_CACHE_KEY, []))
  const upNextLoaded = ref(upNextList.value.length > 0)
  const isRefreshingUpNext = ref(false)

  // 2. My List State
  const myList = ref<any[]>(loadFromStorage(MY_LIST_CACHE_KEY, []))
  const myListLoaded = ref(myList.value.length > 0)
  const isRefreshingMyList = ref(false)

  // 3. Discover State
  const discoverCache = loadFromStorage(DISCOVER_CACHE_KEY, { trending: [], popular: [] })
  const trendingShows = ref<any[]>(discoverCache.trending || [])
  const popularShows = ref<any[]>(discoverCache.popular || [])
  const discoverLoaded = ref(trendingShows.value.length > 0)
  const isRefreshingDiscover = ref(false)

  // 4. Community State
  const communityActivities = ref<any[]>(loadFromStorage(COMMUNITY_CACHE_KEY, []))
  const communityLoaded = ref(communityActivities.value.length > 0)
  const isRefreshingCommunity = ref(false)

  // 5. Discover Filter & Search State (Persistente durante a sessão de navegação)
  const discoverSearchQuery = ref('')
  const discoverSearchResults = ref<any[]>([])
  const discoverSelectedGenres = ref<number[]>([])
  const discoverFilters = ref({
    minRating: '',
    sortBy: 'popularity.desc',
    watchProvider: '',
    era: '',
    language: '',
    status: ''
  })
  const discoverFilteredResults = ref<any[]>([])
  const discoverCurrentPage = ref(1)
  const discoverTotalPages = ref(1)
  const discoverTotalFilteredResults = ref(0)
  const discoverShowFiltersPanel = ref(false)

  // 6. My List Active Tab
  const myListActiveTab = ref('all')

  // 7. Profile Cache por ID de usuário
  const profilesCache = ref<Record<number, any>>({})

  // Actions
  async function fetchUpNext(force = false) {
    if (!force && upNextLoaded.value) {
      return
    }

    isRefreshingUpNext.value = true
    try {
      const res = await capyApi.getUpNext()
      upNextList.value = res.data
      upNextLoaded.value = true
      saveToStorage(UP_NEXT_CACHE_KEY, res.data)
    } catch (err) {
      console.error('Erro ao buscar Up Next:', err)
    } finally {
      isRefreshingUpNext.value = false
    }
  }

  async function fetchMyList(force = false) {
    if (!force && myListLoaded.value) {
      return
    }

    isRefreshingMyList.value = true
    try {
      const res = await capyApi.getMyList()
      myList.value = res.data
      myListLoaded.value = true
      saveToStorage(MY_LIST_CACHE_KEY, res.data)
    } catch (err) {
      console.error('Erro ao buscar Minha Lista:', err)
    } finally {
      isRefreshingMyList.value = false
    }
  }

  async function fetchDiscover(force = false) {
    if (!force && discoverLoaded.value) {
      return
    }

    isRefreshingDiscover.value = true
    try {
      const [trendRes, popRes] = await Promise.all([
        capyApi.trending(),
        capyApi.popular()
      ])
      trendingShows.value = trendRes.data.results || []
      popularShows.value = popRes.data.results || []
      discoverLoaded.value = true
      saveToStorage(DISCOVER_CACHE_KEY, {
        trending: trendingShows.value,
        popular: popularShows.value
      })
    } catch (err) {
      console.error('Erro ao buscar Descobrir:', err)
    } finally {
      isRefreshingDiscover.value = false
    }
  }

  async function fetchCommunity(force = false) {
    if (!force && communityLoaded.value) {
      return
    }

    isRefreshingCommunity.value = true
    try {
      const res = await capyApi.getCommunityActivity()
      communityActivities.value = res.data
      communityLoaded.value = true
      saveToStorage(COMMUNITY_CACHE_KEY, res.data)
    } catch (err) {
      console.error('Erro ao buscar Atividade da Casa:', err)
    } finally {
      isRefreshingCommunity.value = false
    }
  }

  function invalidateAllCache() {
    upNextLoaded.value = false
    myListLoaded.value = false
    communityLoaded.value = false
  }

  function getCachedProfile(userId: number) {
    return profilesCache.value[userId] || null
  }

  function setCachedProfile(userId: number, data: any) {
    profilesCache.value[userId] = data
  }

  function resetDiscoverFilters() {
    discoverSelectedGenres.value = []
    discoverFilters.value = {
      minRating: '',
      sortBy: 'popularity.desc',
      watchProvider: '',
      era: '',
      language: '',
      status: ''
    }
    discoverFilteredResults.value = []
    discoverCurrentPage.value = 1
    discoverTotalPages.value = 1
    discoverTotalFilteredResults.value = 0
  }

  function clearDiscoverSearch() {
    discoverSearchQuery.value = ''
    discoverSearchResults.value = []
  }

  return {
    upNextList,
    upNextLoaded,
    isRefreshingUpNext,
    fetchUpNext,

    myList,
    myListLoaded,
    isRefreshingMyList,
    fetchMyList,

    trendingShows,
    popularShows,
    discoverLoaded,
    isRefreshingDiscover,
    fetchDiscover,

    communityActivities,
    communityLoaded,
    isRefreshingCommunity,
    fetchCommunity,

    // Discover Filter State
    discoverSearchQuery,
    discoverSearchResults,
    discoverSelectedGenres,
    discoverFilters,
    discoverFilteredResults,
    discoverCurrentPage,
    discoverTotalPages,
    discoverTotalFilteredResults,
    discoverShowFiltersPanel,
    resetDiscoverFilters,
    clearDiscoverSearch,

    // My List
    myListActiveTab,

    // Profiles Cache
    profilesCache,
    getCachedProfile,
    setCachedProfile,

    invalidateAllCache
  }
})
