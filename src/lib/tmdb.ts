const BASE_URL = 'https://api.themoviedb.org/3'
const TOKEN = import.meta.env.VITE_TMDB_TOKEN

const headers = {
  Authorization: `Bearer ${TOKEN}`,
  'Content-Type': 'application/json',
}

export async function searchMulti(query: string) {
  const res = await fetch(
    `${BASE_URL}/search/multi?query=${encodeURIComponent(query)}&language=pt-BR&page=1`,
    { headers }
  )
  const data = await res.json()
  return data.results ?? []
}

export async function getWatchProviders(id: number, type: 'movie' | 'tv') {
  const res = await fetch(
    `${BASE_URL}/${type}/${id}/watch/providers`,
    { headers }
  )
  const data = await res.json()
  return data.results?.BR ?? null
}

export async function getDetails(id: number, type: 'movie' | 'tv') {
  const res = await fetch(
    `${BASE_URL}/${type}/${id}?language=pt-BR`,
    { headers }
  )
  return res.json()
}

export async function getSeriesDetails(id: number) {
  const res = await fetch(`${BASE_URL}/tv/${id}?language=pt-BR`, { headers })
  return res.json()
}

export async function getSeasonEpisodes(seriesId: number, seasonNumber: number) {
  const res = await fetch(
    `${BASE_URL}/tv/${seriesId}/season/${seasonNumber}?language=pt-BR`,
    { headers }
  )
  return res.json()
}

export function getPosterUrl(path: string | null) {
  if (!path) return null
  return `https://image.tmdb.org/t/p/w500${path}`
}

export function getBackdropUrl(path: string | null) {
  if (!path) return null
  return `https://image.tmdb.org/t/p/w780${path}`
}

export function getThumbUrl(path: string | null) {
  if (!path) return null
  return `https://image.tmdb.org/t/p/w185${path}`
}
