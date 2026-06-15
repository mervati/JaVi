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

export async function getDetails(id: number, type: 'movie' | 'tv', language = 'pt-BR') {
  const res = await fetch(
    `${BASE_URL}/${type}/${id}?language=${language}`,
    { headers }
  )
  return res.json()
}

export async function getSeriesDetails(id: number, language = 'pt-BR') {
  const res = await fetch(`${BASE_URL}/tv/${id}?language=${language}`, { headers })
  return res.json()
}

export async function getSeasonEpisodes(seriesId: number, seasonNumber: number) {
  const res = await fetch(
    `${BASE_URL}/tv/${seriesId}/season/${seasonNumber}?language=pt-BR`,
    { headers }
  )
  return res.json()
}

export async function getCredits(id: number, type: 'movie' | 'tv') {
  const res = await fetch(`${BASE_URL}/${type}/${id}/credits?language=pt-BR`, { headers })
  const data = await res.json()
  return data.cast ?? []
}

export async function getTrending(timeWindow: 'day' | 'week') {
  const res = await fetch(`${BASE_URL}/trending/all/${timeWindow}?language=pt-BR`, { headers })
  const data = await res.json()
  return data.results ?? []
}

export async function getTopRated(type: 'movie' | 'tv') {
  const res = await fetch(`${BASE_URL}/${type}/top_rated?language=pt-BR&page=1`, { headers })
  const data = await res.json()
  return data.results ?? []
}

export async function getAiringToday() {
  const res = await fetch(`${BASE_URL}/tv/airing_today?language=pt-BR&page=1`, { headers })
  const data = await res.json()
  return data.results ?? []
}

export async function getSimilar(id: number, type: 'movie' | 'tv') {
  const res = await fetch(`${BASE_URL}/${type}/${id}/similar?language=pt-BR&page=1`, { headers })
  const data = await res.json()
  return (data.results ?? []).map((r: any) => ({ ...r, media_type: type }))
}

export async function getRecommendations(id: number, type: 'movie' | 'tv') {
  const res = await fetch(`${BASE_URL}/${type}/${id}/recommendations?language=pt-BR&page=1`, { headers })
  const data = await res.json()
  return (data.results ?? []).map((r: any) => ({ ...r, media_type: type }))
}

export async function getVideos(id: number, type: 'movie' | 'tv') {
  const res = await fetch(`${BASE_URL}/${type}/${id}/videos?language=en-US`, { headers })
  const data = await res.json()
  return data.results ?? []
}

const DISCOVER_YEAR_RANGES: Record<string, [number, number]> = {
  '2025': [2025, 2025], '2024': [2024, 2024], '2023': [2023, 2023],
  '2022': [2022, 2022], '2021': [2021, 2021], '2020': [2020, 2020],
  '2010s': [2010, 2019], '2000s': [2000, 2009], 'Anos 90': [1990, 1999],
}

export async function discoverContent({
  type, genreId, yearLabel, ratingMin, page = 1,
}: {
  type: 'movie' | 'tv'
  genreId?: number | null
  yearLabel?: string | null
  ratingMin?: number | null
  page?: number
}): Promise<any[]> {
  const params = new URLSearchParams({
    language: 'pt-BR',
    sort_by: 'popularity.desc',
    page: String(page),
    'vote_count.gte': '10',
  })
  if (genreId) params.set('with_genres', String(genreId))
  if (ratingMin) params.set('vote_average.gte', String(ratingMin))
  if (yearLabel) {
    const range = DISCOVER_YEAR_RANGES[yearLabel]
    if (range) {
      const [from, to] = range
      if (type === 'movie') {
        params.set('primary_release_date.gte', `${from}-01-01`)
        params.set('primary_release_date.lte', `${to}-12-31`)
      } else {
        params.set('first_air_date.gte', `${from}-01-01`)
        params.set('first_air_date.lte', `${to}-12-31`)
      }
    }
  }
  const res = await fetch(`${BASE_URL}/discover/${type}?${params}`, { headers })
  const data = await res.json()
  return (data.results ?? []).map((r: any) => ({ ...r, media_type: type }))
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
