interface Props {
  value: number
  onChange?: (v: number) => void
  readonly?: boolean
  size?: 'sm' | 'md'
}

export function StarRating({ value, onChange, readonly, size = 'md' }: Props) {
  const sz = size === 'sm' ? 'text-xl' : 'text-2xl'

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star === value ? 0 : star)}
          className={`${sz} transition-colors ${
            star <= value ? 'text-[#f5b730]' : 'text-[#333]'
          } ${!readonly ? 'cursor-pointer' : 'cursor-default'}`}
        >
          ★
        </button>
      ))}
    </div>
  )
}
