export function EpisodeCheckbox({ checked, onChange, size = 'md', disabled = false }: {
  checked: boolean
  onChange: () => void
  size?: 'sm' | 'md'
  disabled?: boolean
}) {
  return (
    <label
      className={`ep-check${size === 'sm' ? ' sm' : ''}`}
      style={disabled ? { opacity: 0.5, pointerEvents: 'none' } : undefined}
      onClick={e => e.stopPropagation()}
    >
      <input type="checkbox" checked={checked} onChange={onChange} disabled={disabled} />
      <div className="ep-check-mark" />
    </label>
  )
}
