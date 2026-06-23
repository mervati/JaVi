import { useEffect, useState } from 'react'

interface Props {
  done: boolean
  onFinished: () => void
}

export function SplashScreen({ done, onFinished }: Props) {
  const [phase, setPhase]       = useState<'in' | 'hold' | 'out'>('in')
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const t = setTimeout(() => setPhase('hold'), 50)
    return () => clearTimeout(t)
  }, [])

  // progresso simulado enquanto carrega
  useEffect(() => {
    if (progress >= 100) return
    const interval = setInterval(() => {
      setProgress(p => {
        if (done) return Math.min(p + 8, 100)       // acelera ao terminar
        const cap = 85
        if (p >= cap) return p                       // trava em 85% enquanto aguarda
        const step = Math.max(1, (cap - p) * 0.08)  // desacelera conforme chega em 85%
        return Math.min(p + step, cap)
      })
    }, 60)
    return () => clearInterval(interval)
  }, [done, progress])

  // fade-out só depois que a barra chegou a 100%
  useEffect(() => {
    if (progress < 100 || phase === 'in') return
    const t = setTimeout(() => {
      setPhase('out')
      setTimeout(onFinished, 500)
    }, 200)
    return () => clearTimeout(t)
  }, [progress, phase])

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        background: '#0a0a0a',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '20px',
        opacity: phase === 'out' ? 0 : 1,
        transition: phase === 'out' ? 'opacity 0.5s ease' : 'none',
      }}
    >
      <style>{`
        @keyframes splash-logo {
          from { transform: scale(0.7); opacity: 0; }
          to   { transform: scale(1);   opacity: 1; }
        }
        @keyframes splash-text {
          from { transform: translateY(10px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>

      <img
        src="/icon-192.png"
        alt="JáVi"
        style={{
          width: 88,
          height: 88,
          borderRadius: 22,
          animation: 'splash-logo 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards',
          boxShadow: '0 8px 40px rgba(245,183,48,0.15)',
        }}
      />

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '6px',
          animation: 'splash-text 0.4s ease 0.25s both',
        }}
      >
        <span style={{ color: '#fff', fontSize: '36px', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1 }}>
          JáVi
        </span>
        <span style={{ color: '#555', fontSize: '13px', fontWeight: 500, letterSpacing: '0.04em' }}>
          Seus filmes e séries
        </span>
      </div>

      {/* barra de progresso */}
      <div
        style={{
          width: '50%',
          animation: 'splash-text 0.3s ease 0.4s both',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '6px' }}>
          <span style={{ color: '#4a9eff', fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em' }}>
            {Math.floor(progress)}%
          </span>
        </div>
        <div style={{ height: '3px', background: '#1a1a1a', borderRadius: '999px', overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #2563eb, #4a9eff)',
              borderRadius: '999px',
              transition: 'width 0.12s ease',
            }}
          />
        </div>
      </div>
    </div>
  )
}
