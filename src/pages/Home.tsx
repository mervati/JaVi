import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getTrending, getTopRated, getAiringToday, getVideos, getPosterUrl, getRecommendations } from '../lib/tmdb'
import { useLibrary } from '../hooks/useLibrary'
import { PillTabs } from '../components/PillTabs'
import { PosterImage } from '../components/PosterImage'
import { useRegisterRefresh } from '../contexts/RefreshContext'

interface TmdbItem {
  id: number
  title?: string
  name?: string
  poster_path: string | null
  vote_average: number
  media_type?: string
  release_date?: string
  first_air_date?: string
}

interface FeedItem {
  id: string
  mediaId: number
  mediaType: 'movie' | 'tv'
  mediaTitle: string
  posterPath: string | null
  videoKey: string
  videoName: string
  videoType: string
}

const VIDEO_TYPE_PT: Record<string, string> = {
  'Behind the Scenes': 'BASTIDORES',
  'Featurette': 'FEATURETTE',
  'Bloopers': 'BLOOPERS',
  'Clip': 'CLIPE',
  'Teaser': 'TEASER',
  'Trailer': 'TRAILER',
}

const BTS_PRIORITY = ['Behind the Scenes', 'Featurette', 'Bloopers', 'Clip', 'Teaser', 'Trailer']

type MainTab = 'paravoc' | 'feed' | 'tendencias' | 'avaliados' | 'hoje'
type TrendWindow = 'day' | 'week'
type TrendFilter = 'all' | 'movie' | 'tv'
type RatingType = 'movie' | 'tv'

function ScoreBadge({ score }: { score: number }) {
  const val = Math.round(score * 10) / 10
  const color = score >= 7.5 ? 'text-[#5cb85c]' : score >= 6 ? 'text-[#f5b730]' : 'text-[#888]'
  return <span className={`text-xs font-bold ${color}`}>★ {val.toFixed(1)}</span>
}

function TypeBadge({ type }: { type: string }) {
  return (
    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
      type === 'movie'
        ? 'text-[#4a9eff] border-[#4a9eff]'
        : 'text-[#a78bfa] border-[#a78bfa]'
    }`}>
      {type === 'movie' ? 'FILME' : 'SÉRIE'}
    </span>
  )
}

function ItemRow({ item, type }: { item: TmdbItem; type: 'movie' | 'tv' }) {
  const navigate = useNavigate()
  const title = item.title ?? item.name ?? ''
  const year = (item.release_date ?? item.first_air_date ?? '').slice(0, 4)

  function handleTap() {
    if (type === 'tv') navigate(`/series/${item.id}`)
    else navigate(`/movie/${item.id}`)
  }

  return (
    <div
      onClick={handleTap}
      className="flex items-center gap-3 px-5 py-3 border-b border-[#1a1a1a] active:bg-[#111] cursor-pointer"
    >
      <div className="w-12 h-18 bg-[#1a1a1a] rounded-lg overflow-hidden flex-shrink-0" style={{ height: '72px', minWidth: '48px' }}>
        <PosterImage src={getPosterUrl(item.poster_path)} alt={title} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-white font-bold text-sm leading-tight line-clamp-2 mb-1">{title}</p>
        <div className="flex items-center gap-2">
          {year && <span className="text-[#555] text-xs">{year}</span>}
          <ScoreBadge score={item.vote_average} />
          <TypeBadge type={type} />
        </div>
      </div>

      <svg className="w-4 h-4 text-[#333] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </div>
  )
}

function LoadingList() {
  return (
    <div className="flex justify-center py-16">
      <div className="w-6 h-6 border-2 border-[#f5b730] border-t-transparent rounded-full animate-spin" />
    </div>
  )
}


function TendenciasTab() {
  const [window, setWindow] = useState<TrendWindow>('week')
  const [filter, setFilter] = useState<TrendFilter>('all')
  const [items, setItems] = useState<TmdbItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getTrending(window).then(data => {
      setItems(data)
      setLoading(false)
    })
  }, [window])

  const filtered = filter === 'all' ? items : items.filter(i => i.media_type === filter)

  return (
    <div>
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#1a1a1a]">
        <PillTabs
          options={[
            { value: 'day' as TrendWindow,  label: 'Hoje'   },
            { value: 'week' as TrendWindow, label: 'Semana' },
          ]}
          value={window}
          onChange={setWindow}
        />
        <PillTabs
          options={[
            { value: 'all'   as TrendFilter, label: 'Tudo'   },
            { value: 'movie' as TrendFilter, label: 'Filmes' },
            { value: 'tv'    as TrendFilter, label: 'Séries' },
          ]}
          value={filter}
          onChange={setFilter}
        />
      </div>
      {loading ? <LoadingList /> : filtered.map(item => (
        <ItemRow
          key={`${item.media_type}-${item.id}`}
          item={item}
          type={(item.media_type === 'movie' ? 'movie' : 'tv') as 'movie' | 'tv'}
        />
      ))}
    </div>
  )
}

function AvaliadosTab() {
  const [type, setType] = useState<RatingType>('movie')
  const [movieItems, setMovieItems] = useState<TmdbItem[]>([])
  const [tvItems, setTvItems] = useState<TmdbItem[]>([])
  const [loadingMovie, setLoadingMovie] = useState(false)
  const [loadingTv, setLoadingTv] = useState(false)

  useEffect(() => {
    if (movieItems.length === 0) {
      setLoadingMovie(true)
      getTopRated('movie').then(data => { setMovieItems(data); setLoadingMovie(false) })
    }
  }, [])

  useEffect(() => {
    if (type === 'tv' && tvItems.length === 0) {
      setLoadingTv(true)
      getTopRated('tv').then(data => { setTvItems(data); setLoadingTv(false) })
    }
  }, [type])

  const items = type === 'movie' ? movieItems : tvItems
  const loading = type === 'movie' ? loadingMovie : loadingTv

  return (
    <div>
      <div className="flex px-5 py-4 border-b border-[#1a1a1a]">
        <PillTabs
          options={[
            { value: 'movie' as RatingType, label: 'Filmes' },
            { value: 'tv'    as RatingType, label: 'Séries' },
          ]}
          value={type}
          onChange={setType}
        />
      </div>
      {loading ? <LoadingList /> : items.map((item, i) => (
        <div key={item.id} className="relative">
          <span className="absolute left-5 top-1/2 -translate-y-1/2 text-[#333] font-black text-lg w-6 text-center select-none">
            {i + 1}
          </span>
          <div className="pl-10">
            <ItemRow item={item} type={type} />
          </div>
        </div>
      ))}
    </div>
  )
}

function HojeTab() {
  const [items, setItems] = useState<TmdbItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAiringToday().then(data => { setItems(data); setLoading(false) })
  }, [])

  return (
    <div>
      {loading ? <LoadingList /> : items.map(item => (
        <ItemRow key={item.id} item={item} type="tv" />
      ))}
    </div>
  )
}

function FeedTab() {
  const navigate = useNavigate()
  const [items, setItems] = useState<FeedItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const trending = await getTrending('week')
      const top = trending.slice(0, 15) as TmdbItem[]

      const results = await Promise.all(
        top.map(async (item) => {
          const type = item.media_type === 'movie' ? 'movie' : 'tv'
          const videos = await getVideos(item.id, type)
          const sorted = BTS_PRIORITY.flatMap(t =>
            videos.filter((v: { type: string; site: string }) => v.type === t && v.site === 'YouTube')
          )
          return sorted.slice(0, 2).map((v: { key: string; name: string; type: string }) => ({
            id: `${item.id}-${v.key}`,
            mediaId: item.id,
            mediaType: type,
            mediaTitle: item.title ?? item.name ?? '',
            posterPath: item.poster_path,
            videoKey: v.key,
            videoName: v.name,
            videoType: v.type,
          } as FeedItem))
        })
      )

      setItems(results.flat())
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-6 h-6 border-2 border-[#f5b730] border-t-transparent rounded-full animate-spin" />
        <p className="text-[#555] text-xs">Buscando bastidores...</p>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-8 gap-3">
        <p className="text-[#555] text-sm text-center">Nenhum vídeo de bastidores encontrado agora.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 py-4 px-4">
      {items.map(item => (
        <div
          key={item.id}
          className="bg-[#111] rounded-2xl overflow-hidden border border-[#1a1a1a]"
        >
          <a
            href={`https://www.youtube.com/watch?v=${item.videoKey}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block relative"
          >
            <img
              src={`https://img.youtube.com/vi/${item.videoKey}/hqdefault.jpg`}
              alt={item.videoName}
              className="w-full aspect-video object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 bg-black/60 rounded-full flex items-center justify-center backdrop-blur-sm">
                <svg className="w-5 h-5 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
            <span className="absolute top-2 right-2 bg-black/70 text-[#f5b730] text-[9px] font-bold px-2 py-0.5 rounded">
              {VIDEO_TYPE_PT[item.videoType] ?? item.videoType.toUpperCase()}
            </span>
          </a>

          <div
            className="flex items-center gap-3 px-3 py-3 cursor-pointer active:bg-[#1a1a1a]"
            onClick={() => item.mediaType === 'tv'
              ? navigate(`/series/${item.mediaId}`)
              : navigate(`/movie/${item.mediaId}`)
            }
          >
            <div className="w-10 h-14 bg-[#1a1a1a] rounded-lg overflow-hidden flex-shrink-0">
              <PosterImage src={getPosterUrl(item.posterPath)} alt={item.mediaTitle} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm leading-tight line-clamp-1">{item.mediaTitle}</p>
              <p className="text-[#888] text-xs line-clamp-1 mt-0.5">{item.videoName}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                  item.mediaType === 'movie'
                    ? 'text-[#4a9eff] border-[#4a9eff]'
                    : 'text-[#a78bfa] border-[#a78bfa]'
                }`}>
                  {item.mediaType === 'movie' ? 'FILME' : 'SÉRIE'}
                </span>
              </div>
            </div>
            <svg className="w-4 h-4 text-[#333] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      ))}
    </div>
  )
}

function ParaVoceTab() {
  const { items } = useLibrary()
  const [results, setResults] = useState<TmdbItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const watched = items.filter(i => i.status === 'watched' || i.status === 'watching')
    if (watched.length === 0) { setLoading(false); return }

    const sample = watched.slice(-8)
    const libraryIds = new Set(items.map(i => `${i.type}-${i.id}`))

    Promise.all(sample.map(i => getRecommendations(i.id, i.type))).then(all => {
      const seen = new Set<string>()
      const merged: TmdbItem[] = []
      for (const list of all) {
        for (const r of list) {
          const key = `${r.media_type}-${r.id}`
          if (!seen.has(key) && !libraryIds.has(key)) {
            seen.add(key)
            merged.push(r)
          }
        }
      }
      setResults(merged.slice(0, 40))
      setLoading(false)
    })
  }, [items.filter(i => i.status === 'watched' || i.status === 'watching').map(i => i.id).join(',')])

  if (loading) return <LoadingList />

  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 px-8">
        <div className="w-16 h-16 bg-[#1a1a1a] rounded-full flex items-center justify-center text-3xl">✨</div>
        <p className="text-white font-bold text-center">Nenhuma recomendação ainda</p>
        <p className="text-[#555] text-sm text-center">Marque filmes e séries como assistidos para receber sugestões personalizadas</p>
      </div>
    )
  }

  return (
    <div>
      {results.map(item => (
        <ItemRow
          key={`${item.media_type}-${item.id}`}
          item={item}
          type={(item.media_type === 'movie' ? 'movie' : 'tv') as 'movie' | 'tv'}
        />
      ))}
    </div>
  )
}

const TABS: { key: MainTab; label: string }[] = [
  { key: 'paravoc',   label: 'Para você' },
  { key: 'feed',      label: 'Feed' },
  { key: 'tendencias', label: 'Tendências' },
  { key: 'avaliados', label: 'Mais Avaliados' },
  { key: 'hoje',      label: 'No Ar Hoje' },
]

export function Home() {
  const [tab, setTab] = useState<MainTab>('feed')
  const [refreshKey, setRefreshKey] = useState(0)

  useRegisterRefresh(async () => setRefreshKey(k => k + 1))

  return (
    <div className="flex flex-col min-h-full">
      <div className="tabs-nav sticky top-0 bg-[#0a0a0a] z-30">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`btn ${tab === t.key ? 'btn-active' : ''}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div>
        {tab === 'paravoc'    && <ParaVoceTab   key={refreshKey} />}
        {tab === 'feed'       && <FeedTab        key={refreshKey} />}
        {tab === 'tendencias' && <TendenciasTab  key={refreshKey} />}
        {tab === 'avaliados'  && <AvaliadosTab   key={refreshKey} />}
        {tab === 'hoje'       && <HojeTab        key={refreshKey} />}
      </div>
    </div>
  )
}
