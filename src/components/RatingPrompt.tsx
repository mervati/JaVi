import { useState } from 'react'
import { StarRating } from './StarRating'

interface Props {
  title: string
  onSave: (rating: number) => void
  onSkip: () => void
}

export function RatingPrompt({ title, onSave, onSkip }: Props) {
  const [rating, setRating] = useState(0)

  return (
    <>
      <div className="fixed inset-0 z-50" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={onSkip} />
      <div
        className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl flex flex-col items-center"
        style={{ background: '#0f0f0f', border: '1px solid #222', borderBottom: 'none', padding: '24px 24px', paddingBottom: 'calc(env(safe-area-inset-bottom) + 70px + 24px)' }}
      >
        <div className="w-10 h-1 rounded-full mb-6" style={{ background: '#333' }} />

        <p className="text-[#888] text-xs font-bold uppercase tracking-widest mb-2">O que achou?</p>
        <p className="text-white font-black text-lg text-center leading-tight mb-6 px-4" style={{ maxWidth: '280px' }}>
          {title}
        </p>

        <div className="mb-8">
          <StarRating value={rating} onChange={setRating} size="md" />
        </div>

        <div className="flex gap-3 w-full">
          <button
            onClick={onSkip}
            className="flex-1 py-[13px] rounded-xl text-sm font-bold"
            style={{ background: '#1a1a1a', color: '#666', border: '1px solid #2a2a2a' }}
          >
            Pular
          </button>
          <button
            onClick={() => onSave(rating)}
            className="flex-1 py-[13px] rounded-xl text-sm font-bold"
            style={{ background: rating > 0 ? '#f5b730' : '#1a1a1a', color: rating > 0 ? '#000' : '#444', border: '1px solid #2a2a2a', transition: 'all 0.2s' }}
          >
            Salvar
          </button>
        </div>
      </div>
    </>
  )
}
