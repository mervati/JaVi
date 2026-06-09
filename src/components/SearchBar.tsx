import { useState, useRef } from 'react'

interface Props {
  onSearch: (query: string) => void
  onClear?: () => void
}

export function SearchBar({ onSearch, onClear }: Props) {
  const [value, setValue] = useState('')
  const [focused, setFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setValue(e.target.value)
    if (e.target.value.trim()) onSearch(e.target.value.trim())
  }

  function handleCancel() {
    setValue('')
    onClear?.()
    inputRef.current?.blur()
    setFocused(false)
  }

  return (
    <div className="flex items-center gap-3 px-4 pt-4 pb-2">
      <div className={`flex-1 flex items-center gap-2 border-b-2 pb-2 transition-colors ${focused ? 'border-white' : 'border-[#333]'}`}>
        <svg className="w-4 h-4 text-[#888] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          ref={inputRef}
          value={value}
          onChange={handleChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Buscar séries e filmes..."
          className="flex-1 bg-transparent text-white placeholder-[#555] text-base outline-none"
        />
        {value && (
          <button onClick={handleCancel} className="text-[#888] p-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>
      {focused && (
        <button onClick={handleCancel} className="text-[#f5b730] text-sm font-medium flex-shrink-0">
          Cancelar
        </button>
      )}
    </div>
  )
}
