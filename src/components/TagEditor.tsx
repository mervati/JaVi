import { useState, useRef } from 'react'
import type { LibraryItem } from '../hooks/useLibrary'

interface Props {
  item: LibraryItem
  onSave: (tags: string[]) => void
}

export function TagEditor({ item, onSave }: Props) {
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const tags = item.tags ?? []

  function addTag() {
    const t = input.trim().toLowerCase().replace(/\s+/g, '-')
    if (!t || tags.includes(t)) { setInput(''); return }
    onSave([...tags, t])
    setInput('')
    inputRef.current?.focus()
  }

  function removeTag(tag: string) {
    onSave(tags.filter(t => t !== tag))
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') { e.preventDefault(); addTag() }
    if (e.key === 'Backspace' && !input && tags.length > 0) {
      removeTag(tags[tags.length - 1])
    }
  }

  return (
    <div style={{ marginBottom: '20px' }}>
      <p className="text-white text-xs font-bold uppercase tracking-wider mb-3">Minhas tags</p>
      {tags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
          {tags.map(tag => (
            <span
              key={tag}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                background: '#1a1a1a', border: '1px solid #333',
                borderRadius: '999px', padding: '3px 10px',
                fontSize: '12px', color: '#bbb',
              }}
            >
              #{tag}
              <button
                onClick={() => removeTag(tag)}
                style={{ color: '#555', fontSize: '16px', lineHeight: 1, marginLeft: '2px', cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Nova tag..."
          maxLength={20}
          style={{
            flex: 1,
            background: '#111',
            border: '1px solid #2a2a2a',
            borderRadius: '8px',
            padding: '7px 12px',
            fontSize: '16px',
            color: '#fff',
            outline: 'none',
          }}
        />
        <button
          onClick={addTag}
          style={{
            background: '#1a1a1a',
            border: '1px solid #333',
            borderRadius: '8px',
            padding: '7px 16px',
            fontSize: '18px',
            color: '#f5b730',
            fontWeight: 'bold',
            cursor: 'pointer',
          }}
        >
          +
        </button>
      </div>
    </div>
  )
}
