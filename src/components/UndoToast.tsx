import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

const DURATION = 5000

export function UndoToast({ title, onUndo, onExpire }: {
  title: string
  onUndo: () => void
  onExpire: () => void
}) {
  const [pct, setPct] = useState(100)
  const onExpireRef = useRef(onExpire)
  onExpireRef.current = onExpire

  useEffect(() => {
    const start = Date.now()
    const id = setInterval(() => {
      const remaining = Math.max(0, 100 - ((Date.now() - start) / DURATION) * 100)
      setPct(remaining)
      if (remaining === 0) {
        clearInterval(id)
        onExpireRef.current()
      }
    }, 50)
    return () => clearInterval(id)
  }, [])

  return createPortal(
    <div style={{
      position: 'fixed',
      bottom: '80px',
      left: '16px',
      right: '16px',
      background: '#1a1a1a',
      border: '1px solid #2a2a2a',
      borderRadius: '14px',
      overflow: 'hidden',
      zIndex: 9997,
      boxShadow: '0 8px 32px rgba(0,0,0,0.7)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', gap: '12px' }}>
        <p style={{ flex: 1, color: '#aaa', fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          <span style={{ color: '#fff', fontWeight: 600 }}>"{title}"</span> removido
        </p>
        <button
          onClick={onUndo}
          style={{ color: '#f5b730', fontSize: '13px', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0, padding: 0 }}
        >
          Desfazer
        </button>
      </div>
      <div style={{ height: '3px', background: '#333' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: '#f5b730', transition: 'width 50ms linear' }} />
      </div>
    </div>,
    document.body
  )
}
