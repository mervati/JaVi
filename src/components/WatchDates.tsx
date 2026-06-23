import { useRef, useState } from 'react'
import type { LibraryItem } from '../hooks/useLibrary'

function fmt(ts: number) {
  return new Date(ts).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function toInput(ts?: number) {
  if (!ts) return ''
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function fromInput(val: string): number | undefined {
  return val ? new Date(val + 'T12:00:00').getTime() : undefined
}

interface Props {
  item: LibraryItem
  onSave: (updates: { startedAt?: number; finishedAt?: number }) => void
}

function DateRow({ label, value, onSave }: { label: string; value?: number; onSave: (ts: number | undefined) => void }) {
  const [editing, setEditing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function open() {
    setEditing(true)
    setTimeout(() => inputRef.current?.showPicker?.(), 50)
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <span style={{ color: '#555', fontSize: '12px', width: '68px', flexShrink: 0 }}>{label}</span>
      {editing ? (
        <input
          ref={inputRef}
          type="date"
          defaultValue={toInput(value)}
          autoFocus
          onChange={e => { onSave(fromInput(e.target.value)); setEditing(false) }}
          onBlur={() => setEditing(false)}
          style={{ fontSize: '16px', background: '#111', border: '1px solid #333', borderRadius: '8px', padding: '5px 10px', color: '#fff', colorScheme: 'dark', outline: 'none' }}
        />
      ) : (
        <button
          onClick={open}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
        >
          <span style={{ color: value ? '#ccc' : '#3a3a3a', fontSize: '13px' }}>
            {value ? fmt(value) : 'Toque para registrar'}
          </span>
          <svg width="11" height="11" fill="none" stroke={value ? '#444' : '#2a2a2a'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>
      )}
    </div>
  )
}

export function WatchDates({ item, onSave }: Props) {
  const showStart  = item.status !== 'watchlist'
  const showFinish = item.status === 'watched' || item.status === 'abandoned'

  if (!showStart && !showFinish) return null

  return (
    <div style={{ marginBottom: '20px' }}>
      <p className="text-white text-xs font-bold uppercase tracking-wider mb-3">Datas</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {showStart && (
          <DateRow
            label="Iniciado"
            value={item.startedAt}
            onSave={startedAt => onSave({ startedAt })}
          />
        )}
        {showFinish && (
          <DateRow
            label="Concluído"
            value={item.finishedAt}
            onSave={finishedAt => onSave({ finishedAt })}
          />
        )}
      </div>
    </div>
  )
}
