import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLibrary } from '../hooks/useLibrary'
import { getPosterUrl } from '../lib/tmdb'
import { StarRating } from '../components/StarRating'
import { FaEye, FaEyeSlash } from 'react-icons/fa'
import type { LibraryItem } from '../hooks/useLibrary'

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  watched:   { label: 'Assistido',  color: 'text-[#5cb85c] border-[#5cb85c]' },
  watchlist: { label: 'Quero ver',  color: 'text-[#f5b730] border-[#f5b730]' },
  abandoned: { label: 'Abandonado', color: 'text-[#555] border-[#555]' },
}

function SwipeableMovieRow({ item }: { item: LibraryItem }) {
  const navigate = useNavigate()
  const { saveItem, removeItem } = useLibrary()
  const [offsetX, setOffsetX] = useState(0)
  const [confirm, setConfirm] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const startXRef = useRef(0)
  const dragging = useRef(false)
  const THRESHOLD_LEFT = -70
  const MAX_SWIPE_LEFT = -80
  const THRESHOLD_RIGHT = 70
  const MAX_SWIPE_RIGHT = 80

  const isWatched = item.status === 'watched'
  const isAbandoned = item.status === 'abandoned'
  const isCompleted = isWatched || isAbandoned

  function onTouchStart(e: React.TouchEvent) {
    startXRef.current = e.touches[0].clientX
    dragging.current = true
  }

  function onTouchMove(e: React.TouchEvent) {
    if (!dragging.current) return
    const dx = e.touches[0].clientX - startXRef.current
    if (dx < 0) setOffsetX(Math.max(dx, MAX_SWIPE_LEFT))
    else setOffsetX(Math.min(dx, MAX_SWIPE_RIGHT))
  }

  async function onTouchEnd() {
    dragging.current = false
    if (offsetX <= THRESHOLD_LEFT) {
      if (isCompleted) {
        // pede confirmação antes de tirar dos assistidos
        setConfirm(true)
      } else {
        saveItem({ ...item, status: 'watched' })
      }
    } else if (offsetX >= THRESHOLD_RIGHT) {
      saveItem({ ...item, status: 'abandoned' })
    }
    setOffsetX(0)
  }

  return (
    <div className="relative overflow-hidden border-b border-[#1a1a1a]">
      {/* modal confirmação de exclusão */}
      {confirmDelete && (
        <div
          className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3"
          style={{ background: 'rgba(10,10,10,0.97)' }}
          onClick={e => e.stopPropagation()}
        >
          <p className="text-white text-sm font-bold text-center px-4">Remover "{item.title}" da biblioteca?</p>
          <div className="flex gap-3">
            <button
              onClick={() => setConfirmDelete(false)}
              className="px-5 py-2 rounded-xl text-sm font-bold"
              style={{ background: '#1a1a1a', color: '#aaa', border: '1px solid #333' }}
            >
              Cancelar
            </button>
            <button
              onClick={() => { removeItem(item.id, item.type); setConfirmDelete(false) }}
              className="px-5 py-2 rounded-xl text-sm font-bold"
              style={{ background: '#e05555', color: '#fff' }}
            >
              Remover
            </button>
          </div>
        </div>
      )}

      {/* modal de confirmação — fora da camada com opacity */}
      {confirm && (
        <div
          className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3"
          style={{ background: 'rgba(10,10,10,0.97)' }}
          onClick={e => e.stopPropagation()}
        >
          <p className="text-white text-sm font-bold text-center px-4">Remover "{item.title}" dos assistidos?</p>
          <div className="flex gap-3">
            <button
              onClick={() => setConfirm(false)}
              className="px-5 py-2 rounded-xl text-sm font-bold"
              style={{ background: '#1a1a1a', color: '#aaa', border: '1px solid #333' }}
            >
              Cancelar
            </button>
            <button
              onClick={() => { saveItem({ ...item, status: 'watchlist' }); setConfirm(false) }}
              className="px-5 py-2 rounded-xl text-sm font-bold"
              style={{ background: '#e05555', color: '#fff' }}
            >
              Remover
            </button>
          </div>
        </div>
      )}

      {/* conteúdo com opacity quando assistido/abandonado */}
      <div style={isCompleted ? { opacity: 0.4 } : {}}>
        {/* fundos de swipe — ocultos para itens concluídos */}
        {!isCompleted && (
          <>
            <div className="absolute left-0 top-0 bottom-0 w-20 flex items-center justify-center bg-[#1a6ef5]">
              <FaEyeSlash className="text-white text-2xl" />
            </div>
            <div className={`absolute right-0 top-0 bottom-0 w-20 flex items-center justify-center ${isWatched ? 'bg-[#e53e3e]' : 'bg-[#5cb85c]'}`}>
              {isWatched ? <FaEyeSlash className="text-white text-2xl" /> : <FaEye className="text-white text-2xl" />}
            </div>
          </>
        )}

        <div
          onTouchStart={isCompleted ? undefined : onTouchStart}
          onTouchMove={isCompleted ? undefined : onTouchMove}
          onTouchEnd={isCompleted ? undefined : onTouchEnd}
          onClick={() => navigate(`/movie/${item.id}`)}
          style={{
            transform: `translateX(${offsetX}px)`,
            transition: dragging.current ? 'none' : 'transform 0.25s ease',
            background: '#0a0a0a',
            padding: '12px 20px',
          }}
          className="flex items-center gap-3"
        >
          <div className="w-14 h-20 bg-[#1a1a1a] rounded-lg overflow-hidden flex-shrink-0"
            style={isCompleted ? { filter: 'grayscale(1)' } : {}}>
            {item.poster
              ? <img src={getPosterUrl(item.poster) ?? ''} alt={item.title} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-[#333] text-xs">?</div>
            }
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-base leading-tight mb-2">{item.title}</p>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${STATUS_LABEL[item.status]?.color ?? 'text-[#555] border-[#555]'}`}>
              {STATUS_LABEL[item.status]?.label ?? item.status}
            </span>
            {(isWatched || isAbandoned) && (
              <div className="mt-1" onClick={e => e.stopPropagation()}>
                <StarRating
                  size="sm"
                  value={item.rating}
                  onChange={rating => saveItem({ ...item, rating })}
                />
              </div>
            )}
          </div>

          <button
            onClick={e => { e.stopPropagation(); setConfirmDelete(true) }}
            className="p-2 text-[#333] flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

export function Movies() {
  const { items } = useLibrary()
  const navigate = useNavigate()
  const movies    = items.filter(i => i.type === 'movie')
  const active    = movies.filter(i => i.status === 'watchlist' || i.status === 'watching')
  const completed = movies.filter(i => i.status === 'watched' || i.status === 'abandoned')

  return (
    <div className="flex flex-col min-h-full">
      {movies.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 gap-5 py-20 px-8">
          <div className="text-5xl">🎬</div>
          <div className="text-center">
            <p className="text-white font-bold mb-1">Nenhum filme ainda</p>
            <p className="text-[#555] text-sm">Marque um filme como assistido e ele aparece aqui automaticamente</p>
          </div>
          <button onClick={() => navigate('/explorar')} className="boton-elegante boton-sm" style={{ padding: '6.6px 15.4px', fontSize: '0.85rem' }}>
            Explorar filmes
          </button>
        </div>
      ) : (
        <div>
          {/* Quero ver — cor normal */}
          {active.length > 0 && (
            <div>
              <div style={{ padding: '20px 20px 10px 20px', textAlign: 'center' }}>
                <span className="boton-elegante" style={{ color: '#f5b730', fontSize: '10px', padding: '6px 16px', letterSpacing: '0.12em', display: 'inline-block' }}>
                  QUERO VER
                </span>
              </div>
              {active.map(item => (
                <SwipeableMovieRow key={`${item.type}-${item.id}`} item={item} />
              ))}
            </div>
          )}

          {/* Assistidos/Abandonados — acinzentado */}
          {completed.length > 0 && (
            <div style={active.length > 0 ? { marginTop: '24px' } : {}}>
              <div style={{ padding: active.length > 0 ? '16px 20px 10px 20px' : '20px 20px 10px 20px', borderTop: active.length > 0 ? '1px solid #1a1a1a' : 'none', textAlign: 'center' }}>
                <span className="boton-elegante" style={{ color: '#9c7420', fontSize: '10px', padding: '6px 16px', letterSpacing: '0.12em', display: 'inline-block' }}>
                  ASSISTIDOS
                </span>
              </div>
              {completed.map(item => (
                <SwipeableMovieRow key={`${item.type}-${item.id}`} item={item} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
