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

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <SearchBar onSearch={handleSearch} />

      {loading && (
        <p className="text-gray-400 text-center mt-8">Buscando...</p>
      )}

      {!loading && searched && results.length === 0 && (
        <p className="text-gray-400 text-center mt-8">Nenhum resultado encontrado.</p>
      )}

      {!loading && results.length > 0 && (
        <div className="grid grid-cols-2 gap-4 mt-6 sm:grid-cols-3">
          {results.map((item) => (
            <MediaCard key={`${item.media_type}-${item.id}`} media={item} />
          ))}
        </div>
      )}
    </div>
  )
}
