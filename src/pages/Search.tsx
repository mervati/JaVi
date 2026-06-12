import { useEffect, useState, useMemo } from 'react'
import { searchMulti, getTrending } from '../lib/tmdb'
import { SearchBar } from '../components/SearchBar'
import { MediaCard } from '../components/MediaCard'

const GENRES = [
  { label: 'Ação', ids: [28, 10759] },
  { label: 'Animação', ids: [16] },
  { label: 'Comédia', ids: [35] },
  { label: 'Crime', ids: [80] },
  { label: 'Documentário', ids: [99] },
  { label: 'Drama', ids: [18] },
  { label: 'Fantasia', ids: [14, 10765] },
  { label: 'Terror', ids: [27] },
  { label: 'Romance', ids: [10749] },
  { label: 'Ficção Científica', ids: [878, 10765] },
  { label: 'Suspense', ids: [53, 9648] },
  { label: 'Família', ids: [10751] },
]

const YEARS = [
  { label: '2025', match: (y: number) => y === 2025 },
  { label: '2024', match: (y: number) => y === 2024 },
  { label: '2023', match: (y: number) => y === 2023 },
  { label: '2022', match: (y: number) => y === 2022 },
  { label: '2021', match: (y: number) => y === 2021 },
  { label: '2020', match: (y: number) => y === 2020 },
  { label: '2010s', match: (y: number) => y >= 2010 && y <= 2019 },
  { label: '2000s', match: (y: number) => y >= 2000 && y <= 2009 },
  { label: 'Anos 90', match: (y: number) => y >= 1990 && y <= 1999 },
]

const RATINGS = [
  { label: '≥ 9', min: 9 },
  { label: '≥ 8', min: 8 },
  { label: '≥ 7', min: 7 },
  { label: '≥ 6', min: 6 },
  { label: '≥ 5', min: 5 },
]

const chipBase: React.CSSProperties = {
  flexShrink: 0,
  height: '28px',
  padding: '0 12px',
  borderRadius: '999px',
  fontSize: '11px',
  fontWeight: 600,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  transition: 'background 220ms cubic-bezier(0.22,1,0.36,1), color 220ms cubic-bezier(0.22,1,0.36,1)',
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        ...chipBase,
        color: active ? '#0a0a0a' : '#666',
        background: active ? '#f5b730' : '#111',
        border: active ? 'none' : '1px solid #222',
        boxShadow: active
          ? '0 1px 1px rgba(14,17,22,0.06), 0 8px 18px -10px rgba(245,183,48,0.4)'
          : 'none',
      }}
    >
      {label}
    </button>
  )
}

function applyFilters(
  items: any[],
  selectedGenre: string | null,
  selectedYear: string | null,
  selectedRating: number | null,
  selectedType: 'movie' | 'tv' | null,
) {
  return items.filter(item => {
    if (selectedGenre !== null) {
      const genre = GENRES.find(g => g.label === selectedGenre)
      if (genre && !genre.ids.some(id => (item.genre_ids ?? []).includes(id))) return false
    }
    if (selectedYear !== null) {
      const yearObj = YEARS.find(y => y.label === selectedYear)
      const d = item.release_date ?? item.first_air_date ?? ''
      const y = d ? parseInt(d.slice(0, 4)) : null
      if (yearObj && (y === null || !yearObj.match(y))) return false
    }
    if (selectedRating !== null) {
      if ((item.vote_average ?? 0) < selectedRating) return false
    }
    if (selectedType !== null) {
      if (item.media_type !== selectedType) return false
    }
    return true
  })
}

export function Search() {
  const [results, setResults] = useState<any[]>([])
  const [discovery, setDiscovery] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [discoveryLoading, setDiscoveryLoading] = useState(true)
  const [searched, setSearched] = useState(false)
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null)
  const [selectedYear, setSelectedYear] = useState<string | null>(null)
  const [selectedRating, setSelectedRating] = useState<number | null>(null)
  const [selectedType, setSelectedType] = useState<'movie' | 'tv' | null>(null)

  useEffect(() => {
    getTrending('week').then(data => {
      setDiscovery(data.filter((r: any) => r.media_type === 'movie' || r.media_type === 'tv'))
      setDiscoveryLoading(false)
    })
  }, [])

  async function handleSearch(query: string) {
    setLoading(true)
    setSearched(true)
    const data = await searchMulti(query)
    setResults(data.filter((r: any) => r.media_type === 'movie' || r.media_type === 'tv'))
    setLoading(false)
  }

  function handleClear() {
    setResults([])
    setSearched(false)
  }

  function clearFilters() {
    setSelectedGenre(null)
    setSelectedYear(null)
    setSelectedRating(null)
    setSelectedType(null)
  }

  const hasFilters = selectedGenre !== null || selectedYear !== null || selectedRating !== null || selectedType !== null

  const source = searched ? results : discovery
  const filtered = useMemo(
    () => applyFilters(source, selectedGenre, selectedYear, selectedRating, selectedType),
    [source, selectedGenre, selectedYear, selectedRating, selectedType],
  )

  return (
    <div className="flex flex-col min-h-full">
      <div className="sticky top-0 bg-[#0a0a0a] z-30">
        <SearchBar onSearch={handleSearch} onClear={handleClear} />

        {/* Filtros sempre visíveis */}
        <div style={{ borderBottom: '1px solid #1a1a1a', paddingTop: '10px', paddingBottom: '10px' }}>
          {/* Gênero */}
          <div style={{ marginBottom: '8px' }}>
            <p style={{ color: '#fff', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0 16px', marginBottom: '6px' }}>Gênero</p>
            <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', padding: '0 16px 2px', scrollbarWidth: 'none' }}>
              {GENRES.map(g => (
                <FilterChip
                  key={g.label}
                  label={g.label}
                  active={selectedGenre === g.label}
                  onClick={() => setSelectedGenre(selectedGenre === g.label ? null : g.label)}
                />
              ))}
            </div>
          </div>

          {/* Ano */}
          <div style={{ marginBottom: '8px' }}>
            <p style={{ color: '#fff', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0 16px', marginBottom: '6px' }}>Ano</p>
            <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', padding: '0 16px 2px', scrollbarWidth: 'none' }}>
              {YEARS.map(y => (
                <FilterChip
                  key={y.label}
                  label={y.label}
                  active={selectedYear === y.label}
                  onClick={() => setSelectedYear(selectedYear === y.label ? null : y.label)}
                />
              ))}
            </div>
          </div>

          {/* Nota + Tipo */}
          <div style={{ display: 'flex', gap: '0', alignItems: 'flex-start' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ color: '#fff', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0 16px', marginBottom: '6px' }}>Nota mínima</p>
              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', padding: '0 16px 2px', scrollbarWidth: 'none' }}>
                {RATINGS.map(r => (
                  <FilterChip
                    key={r.min}
                    label={r.label}
                    active={selectedRating === r.min}
                    onClick={() => setSelectedRating(selectedRating === r.min ? null : r.min)}
                  />
                ))}
              </div>
            </div>
            <div style={{ flexShrink: 0, paddingRight: '16px' }}>
              <p style={{ color: '#fff', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>Tipo</p>
              <div style={{ display: 'flex', gap: '6px' }}>
                <FilterChip
                  label="Série"
                  active={selectedType === 'tv'}
                  onClick={() => setSelectedType(selectedType === 'tv' ? null : 'tv')}
                />
                <FilterChip
                  label="Filme"
                  active={selectedType === 'movie'}
                  onClick={() => setSelectedType(selectedType === 'movie' ? null : 'movie')}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      {!searched && !discoveryLoading && (
        <div>
          {!hasFilters && (
            <p style={{ color: '#fff', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '14px 16px 8px' }}>
              Em alta esta semana
            </p>
          )}
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20">
              <p className="text-[#555] text-sm">Nenhum resultado para esses filtros</p>
              <button onClick={clearFilters} className="text-[#f5b730] text-xs font-bold">Limpar filtros</button>
            </div>
          ) : (
            filtered.map(item => (
              <MediaCard key={`${item.media_type}-${item.id}`} media={item} />
            ))
          )}
        </div>
      )}

      {!searched && discoveryLoading && (
        <div className="flex flex-col gap-0">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-[#1a1a1a]">
              <div className="w-14 h-20 bg-[#1a1a1a] rounded-lg animate-pulse" />
              <div className="flex-1 gap-2 flex flex-col">
                <div className="h-3 bg-[#1a1a1a] rounded animate-pulse w-16" />
                <div className="h-4 bg-[#1a1a1a] rounded animate-pulse w-3/4" />
              </div>
            </div>
          ))}
        </div>
      )}

      {loading && (
        <div className="flex flex-col gap-0">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-[#1a1a1a]">
              <div className="w-14 h-20 bg-[#1a1a1a] rounded-lg animate-pulse" />
              <div className="flex-1 gap-2 flex flex-col">
                <div className="h-3 bg-[#1a1a1a] rounded animate-pulse w-16" />
                <div className="h-4 bg-[#1a1a1a] rounded animate-pulse w-3/4" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && searched && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center flex-1 gap-3 py-20">
          <p className="text-[#555] text-sm">
            {hasFilters && results.length > 0 ? 'Nenhum resultado para esses filtros' : 'Nenhum resultado encontrado'}
          </p>
          {hasFilters && results.length > 0 && (
            <button onClick={clearFilters} className="text-[#f5b730] text-xs font-bold">Limpar filtros</button>
          )}
        </div>
      )}

      {!loading && searched && filtered.length > 0 && (
        <div>
          {filtered.map(item => (
            <MediaCard key={`${item.media_type}-${item.id}`} media={item} />
          ))}
        </div>
      )}
    </div>
  )
}
