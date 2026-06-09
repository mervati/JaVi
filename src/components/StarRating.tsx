interface Props {
  value: number
  onChange?: (v: number) => void
  readonly?: boolean
}

export function StarRating({ value, onChange, readonly }: Props) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star === value ? 0 : star)}
          className={`text-xl transition-colors ${
            star <= value ? 'text-yellow-400' : 'text-gray-600'
          } ${!readonly ? 'hover:text-yellow-300 cursor-pointer' : 'cursor-default'}`}
        >
          ★
        </button>
      ))}
    </div>
  )
}
