import { useState } from 'react'
import { searchMulti } from '../lib/tmdb'
import { SearchBar } from '../components/SearchBar'
import { MediaCard } from '../components/MediaCard'

export function Search() {
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

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

  return (
    <div className="flex flex-col min-h-full">
      <div className="sticky top-[53px] bg-[#0a0a0a] z-30">
        <SearchBar onSearch={handleSearch} onClear={handleClear} />
        {searched && !loading && results.length > 0 && (
          <div className="flex border-b border-[#1a1a1a]">
            <div className="flex-1 text-center py-2 text-white text-xs font-bold border-b-2 border-white">
              SÉRIES E FILMES
            </div>
          </div>
        )}
      </div>

      {!searched && (
        <div className="flex flex-col items-center justify-center flex-1 gap-4 px-6 py-20">
          <div className="w-16 h-16 bg-[#1a1a1a] rounded-full flex items-center justify-center">
            <svg className="w-7 h-7 text-[#555]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <p className="text-[#555] text-sm text-center">Busque um filme ou série para adicionar à sua lista</p>
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

      {!loading && searched && results.length === 0 && (
        <div className="flex flex-col items-center justify-center flex-1 gap-3 py-20">
          <p className="text-[#555] text-sm">Nenhum resultado encontrado</p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div>
          {results.map((item) => (
            <MediaCard key={`${item.media_type}-${item.id}`} media={item} />
          ))}
        </div>
      )}
    </div>
  )
}
