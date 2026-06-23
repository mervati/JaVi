import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useLibrary } from '../hooks/useLibrary'
import { getPosterUrl } from '../lib/tmdb'
import { PosterImage } from './PosterImage'

const FAB     = 52
const MARGIN  = 12
const NAV_GAP = 74  // distância do bottom do viewport = nav (~60px) + folga
const POS_KEY = 'javi-fab-pos-v3'

const STATUS_LABEL: Record<string, string> = {
  watched:   'Concluído',
  watchlist: 'Quero ver',
  watching:  'Assistindo',
  abandoned: 'Abandonado',
  archived:  'Arquivada',
}

const STATUS_COLOR: Record<string, string> = {
  watched:   '#5cb85c',
  watchlist: '#f5b730',
  watching:  '#4a9eff',
  abandoned: '#555',
  archived:  '#555',
}

function clampPos(x: number, bottom: number) {
  return {
    x:      Math.max(MARGIN, Math.min(x,      window.innerWidth - FAB - MARGIN)),
    bottom: Math.max(NAV_GAP, Math.min(bottom, window.innerHeight - FAB - MARGIN)),
  }
}

function loadPos() {
  try {
    const s = localStorage.getItem(POS_KEY)
    return s ? (JSON.parse(s) as { x: number; bottom: number }) : null
  } catch { return null }
}

export function FloatingSearch() {
  const { items } = useLibrary()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const isVisible = pathname === '/tv' || pathname === '/movies'

  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'movie' | 'tv'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | string>('all')
  const inputRef = useRef<HTMLInputElement>(null)

  const [pos, setPos] = useState(() => {
    const saved = loadPos()
    if (saved) return clampPos(saved.x, saved.bottom)
    return { x: MARGIN, bottom: NAV_GAP }
  })

  const dragging      = useRef(false)
  const moved         = useRef(false)
  const touchHandled  = useRef(false)
  const startTouch    = useRef({ x: 0, y: 0 })
  const startPos      = useRef({ x: 0, bottom: 0 })

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 80)
    else { setQuery(''); setTypeFilter('all'); setStatusFilter('all') }
  }, [open])

  function onTouchStart(e: React.TouchEvent) {
    dragging.current = true
    moved.current = false
    startTouch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    startPos.current = { x: pos.x, bottom: pos.bottom }
  }

  useEffect(() => {
    function onMove(e: TouchEvent) {
      if (!dragging.current) return
      const dx = e.touches[0].clientX - startTouch.current.x
      const dy = e.touches[0].clientY - startTouch.current.y
      if (!moved.current && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) moved.current = true
      if (!moved.current) return
      e.preventDefault()
      // mover dedo para baixo (dy+) = bottom diminui
      setPos(clampPos(startPos.current.x + dx, startPos.current.bottom - dy))
    }

    function onEnd() {
      if (!dragging.current) return
      dragging.current = false
      touchHandled.current = true
      setTimeout(() => { touchHandled.current = false }, 300)
      if (!moved.current) {
        setOpen(true)
      } else {
        setPos(p => {
          const c = clampPos(p.x, p.bottom)
          localStorage.setItem(POS_KEY, JSON.stringify(c))
          return c
        })
      }
    }

    document.addEventListener('touchmove', onMove, { passive: false })
    document.addEventListener('touchend',  onEnd)
    return () => {
      document.removeEventListener('touchmove', onMove)
      document.removeEventListener('touchend',  onEnd)
    }
  }, [])

  const results = items.filter(item => {
    if (typeFilter !== 'all' && item.type !== typeFilter) return false
    if (statusFilter !== 'all' && item.status !== statusFilter) return false
    if (!query.trim()) return true
    const q = query.trim().toLowerCase()
    if (item.title.toLowerCase().includes(q)) return true
    if (item.tags?.some(t => t.includes(q.replace(/^#/, '')))) return true
    return false
  }).sort((a, b) => a.title.localeCompare(b.title, 'pt-BR'))

  const showResults = query.trim() || typeFilter !== 'all' || statusFilter !== 'all'

  if (!isVisible) return null

  return (
    <>
      {/* FAB */}
      <div
        onTouchStart={onTouchStart}
        onClick={() => { if (touchHandled.current) return; setOpen(true) }}
        style={{
          position: 'fixed',
          left: pos.x,
          bottom: pos.bottom,
          width: FAB,
          height: FAB,
          borderRadius: '50%',
          background: '#161616',
          border: '1.5px solid #2a2a2a',
          boxShadow: '0 4px 20px rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 55,
          touchAction: 'none',
          cursor: 'pointer',
        }}
      >
        <svg width="22" height="22" fill="none" stroke="#f5b730" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
      </div>

      {/* Modal */}
      {open && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 65, background: '#0a0a0a', display: 'flex', flexDirection: 'column' }}>

          {/* Barra superior */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: 'calc(env(safe-area-inset-top) + 14px) 16px 12px', borderBottom: '1px solid #1a1a1a', flexShrink: 0 }}>
            <button
              onClick={() => setOpen(false)}
              style={{ color: '#888', background: 'none', border: 'none', padding: '4px', cursor: 'pointer', flexShrink: 0 }}
            >
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Título ou #tag..."
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="none"
              style={{ flex: 1, background: '#111', border: '1px solid #2a2a2a', borderRadius: '10px', padding: '10px 14px', fontSize: '16px', color: '#fff', outline: 'none' }}
            />
            {query && (
              <button onClick={() => setQuery('')} style={{ color: '#555', background: 'none', border: 'none', padding: '4px', cursor: 'pointer', fontSize: '22px', lineHeight: 1, flexShrink: 0 }}>×</button>
            )}
          </div>

          {/* Filtros */}
          <div style={{ display: 'flex', gap: '7px', padding: '10px 16px', overflowX: 'auto', scrollbarWidth: 'none', flexShrink: 0, borderBottom: '1px solid #1a1a1a' }}>
            {(['all', 'movie', 'tv'] as const).map(t => (
              <button key={t} onClick={() => setTypeFilter(t)} style={{ flexShrink: 0, padding: '5px 13px', borderRadius: '999px', fontSize: '12px', fontWeight: 'bold', border: '1.5px solid', borderColor: typeFilter === t ? '#f5b730' : '#2a2a2a', background: typeFilter === t ? 'rgba(245,183,48,0.1)' : 'transparent', color: typeFilter === t ? '#f5b730' : '#555', cursor: 'pointer' }}>
                {t === 'all' ? 'Tudo' : t === 'movie' ? 'Filmes' : 'Séries'}
              </button>
            ))}
            <div style={{ width: '1px', background: '#222', flexShrink: 0, margin: '4px 2px' }} />
            {(['watching', 'watchlist', 'watched', 'abandoned', 'archived'] as const).map(s => (
              <button key={s} onClick={() => setStatusFilter(statusFilter === s ? 'all' : s)} style={{ flexShrink: 0, padding: '5px 13px', borderRadius: '999px', fontSize: '12px', fontWeight: 'bold', border: '1.5px solid', borderColor: statusFilter === s ? STATUS_COLOR[s] : '#2a2a2a', background: statusFilter === s ? `${STATUS_COLOR[s]}18` : 'transparent', color: statusFilter === s ? STATUS_COLOR[s] : '#555', cursor: 'pointer' }}>
                {STATUS_LABEL[s]}
              </button>
            ))}
          </div>

          {/* Resultados */}
          <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 'calc(env(safe-area-inset-bottom) + 80px)' }}>
            {!showResults ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', gap: '12px' }}>
                <svg width="44" height="44" fill="none" stroke="#2a2a2a" strokeWidth={1.5} viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
                </svg>
                <p style={{ color: '#3a3a3a', fontSize: '14px', textAlign: 'center', lineHeight: 1.5 }}>
                  Digite um título, <span style={{ color: '#555' }}>#tag</span> ou use os filtros acima
                </p>
              </div>
            ) : results.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 24px' }}>
                <p style={{ color: '#444', fontSize: '14px' }}>Nenhum resultado</p>
              </div>
            ) : (
              <>
                <p style={{ color: '#444', fontSize: '11px', fontWeight: 'bold', padding: '10px 16px 4px', letterSpacing: '0.08em' }}>
                  {results.length} {results.length === 1 ? 'RESULTADO' : 'RESULTADOS'}
                </p>
                {results.map(item => (
                  <div
                    key={`${item.type}-${item.id}`}
                    className="active:bg-[#111]"
                    onClick={() => { navigate(`/${item.type === 'movie' ? 'movie' : 'series'}/${item.id}`); setOpen(false) }}
                    style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px', borderBottom: '1px solid #111', cursor: 'pointer' }}
                  >
                    <div style={{ width: 44, height: 62, background: '#1a1a1a', borderRadius: '8px', overflow: 'hidden', flexShrink: 0 }}>
                      <PosterImage src={getPosterUrl(item.poster)} alt={item.title} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ color: '#fff', fontWeight: 'bold', fontSize: '14px', marginBottom: '5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '10px', color: '#444', fontWeight: 'bold', letterSpacing: '0.06em' }}>{item.type === 'movie' ? 'FILME' : 'SÉRIE'}</span>
                        <span style={{ fontSize: '10px', color: STATUS_COLOR[item.status] ?? '#555', fontWeight: 'bold', border: `1px solid ${STATUS_COLOR[item.status] ?? '#555'}33`, borderRadius: '4px', padding: '1px 5px' }}>
                          {STATUS_LABEL[item.status] ?? item.status}
                        </span>
                        {(item.tags ?? []).length > 0 && (
                          <span style={{ fontSize: '10px', color: '#444' }}>
                            {item.tags!.slice(0, 2).map(t => `#${t}`).join(' ')}{item.tags!.length > 2 ? ` +${item.tags!.length - 2}` : ''}
                          </span>
                        )}
                      </div>
                    </div>
                    <svg width="16" height="16" fill="none" stroke="#333" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
