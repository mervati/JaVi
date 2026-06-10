export function PillTabs<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      padding: '6px',
      background: '#111',
      border: '1px solid #222',
      borderRadius: '999px',
      boxShadow: '0 1px 1px rgba(14,17,22,0.08), 0 20px 40px -24px rgba(14,17,22,0.4)',
    }}>
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '34px',
            padding: '0 16px',
            borderRadius: '999px',
            fontSize: '13px',
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            color: value === opt.value ? '#0a0a0a' : '#666',
            background: value === opt.value ? '#f5b730' : 'transparent',
            boxShadow: value === opt.value
              ? '0 1px 1px rgba(14,17,22,0.06), 0 8px 18px -10px rgba(245,183,48,0.4)'
              : 'none',
            transition: 'background 220ms cubic-bezier(0.22,1,0.36,1), color 220ms cubic-bezier(0.22,1,0.36,1)',
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
