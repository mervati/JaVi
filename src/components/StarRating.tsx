import { useRef, useState } from 'react'

interface Props {
  value: number
  onChange?: (v: number) => void
  readonly?: boolean
  size?: 'sm' | 'md'
}

export function StarRating({ value, onChange, readonly, size = 'md' }: Props) {
  const sz = size === 'sm' ? 'text-xl' : 'text-2xl'
  const containerRef = useRef<HTMLDivElement>(null)
  const [dragValue, setDragValue] = useState<number | null>(null)
  const displayed = dragValue ?? value

  function getStarFromX(clientX: number): number {
    if (!containerRef.current) return 1
    const rect = containerRef.current.getBoundingClientRect()
    const x = clientX - rect.left
    const star = Math.ceil((x / rect.width) * 5)
    return Math.min(5, Math.max(1, star))
  }

  function handleTouchStart(e: React.TouchEvent) {
    if (readonly) return
    e.preventDefault()
    setDragValue(getStarFromX(e.touches[0].clientX))
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (readonly) return
    setDragValue(getStarFromX(e.touches[0].clientX))
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (readonly || dragValue === null) return
    e.preventDefault()
    onChange?.(dragValue === value ? 0 : dragValue)
    setDragValue(null)
  }

  return (
    <div
      ref={containerRef}
      className="flex gap-0.5"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star === value ? 0 : star)}
          className={`${sz} transition-colors ${
            star <= displayed ? 'text-[#f5b730]' : 'text-[#333]'
          } ${!readonly ? 'cursor-pointer' : 'cursor-default'}`}
        >
          ★
        </button>
      ))}
    </div>
  )
}
