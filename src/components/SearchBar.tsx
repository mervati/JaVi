import { useState } from 'react'

interface Props {
  onSearch: (query: string) => void
}

export function SearchBar({ onSearch }: Props) {
  const [value, setValue] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (value.trim()) onSearch(value.trim())
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Buscar filmes ou séries..."
        className="flex-1 bg-[#1a1a1a] text-white placeholder-gray-500 border border-gray-700 rounded-full px-5 py-3 outline-none focus:border-[#e50914] transition-colors"
      />
      <button
        type="submit"
        className="bg-[#e50914] text-white px-6 py-3 rounded-full font-medium hover:bg-[#b20710] transition-colors"
      >
        Buscar
      </button>
    </form>
  )
}
