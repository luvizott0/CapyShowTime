export function getPosterUrl(pathOrUrl?: string | null): string {
  if (!pathOrUrl) return ''
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    return pathOrUrl
  }
  const cleanPath = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`
  return `https://image.tmdb.org/t/p/w500${cleanPath}`
}

export function getBackdropUrl(pathOrUrl?: string | null): string {
  if (!pathOrUrl) return ''
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    return pathOrUrl
  }
  const cleanPath = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`
  return `https://image.tmdb.org/t/p/original${cleanPath}`
}

export function getStillUrl(pathOrUrl?: string | null): string {
  if (!pathOrUrl) return ''
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    return pathOrUrl
  }
  const cleanPath = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`
  return `https://image.tmdb.org/t/p/w500${cleanPath}`
}
