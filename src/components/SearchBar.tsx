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
    else onClear?.()
  }

  function handleCancel() {
    setValue('')
    onClear?.()
    inputRef.current?.blur()
    setFocused(false)
  }

  return (
    <div className="flex items-center gap-3 px-4 pt-4 pb-3">
      <div className="search-group">
        <svg viewBox="0 0 24 24" aria-hidden="true" className="search-icon">
          <g>
            <path d="M21.53 20.47l-3.66-3.66C19.195 15.24 20 13.214 20 11c0-4.97-4.03-9-9-9s-9 4.03-9 9 4.03 9 9 9c2.215 0 4.24-.804 5.808-2.13l3.66 3.66c.147.146.34.22.53.22s.385-.073.53-.22c.295-.293.295-.767.002-1.06zM3.5 11c0-4.135 3.365-7.5 7.5-7.5s7.5 3.365 7.5 7.5-3.365 7.5-7.5 7.5-7.5-3.365-7.5-7.5z" />
          </g>
        </svg>
        <input
          ref={inputRef}
          id="query"
          className="search-input"
          type="search"
          placeholder="Buscar séries e filmes..."
          name="searchbar"
          value={value}
          onChange={handleChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </div>
      {focused && (
        <button onClick={handleCancel} className="text-[#f5b730] text-sm font-medium flex-shrink-0">
          Cancelar
        </button>
      )}
    </div>
  )
}
