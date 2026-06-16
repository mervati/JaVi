import { useRef, useState } from 'react'
import { doc, getDoc, increment, setDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../contexts/AuthContext'

let stopCurrent: (() => void) | null = null

export function TrailerPlayer({ videoKey, title }: { videoKey: string; title: string }) {
  const [playing, setPlaying] = useState(false)
  const stopRef = useRef<(() => void) | undefined>(undefined)
  stopRef.current = () => setPlaying(false)
  const { user } = useAuth()

  async function handlePlay() {
    if (stopCurrent && stopCurrent !== stopRef.current) stopCurrent()
    stopCurrent = stopRef.current ?? null
    setPlaying(true)

    if (user) {
      try {
        const dataRef = doc(db, 'users', user.uid, 'achievement_data', 'trailers')
        await setDoc(dataRef, { count: increment(1) }, { merge: true })
        const snap = await getDoc(dataRef)
        if ((snap.data()?.count ?? 0) >= 5) {
          await setDoc(
            doc(db, 'users', user.uid, 'achievements', 'sommelier'),
            { unlockedAt: Date.now() },
            { merge: true }
          )
        }
      } catch { /* non-blocking */ }
    }
  }

  if (playing) {
    return (
      <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, borderRadius: '12px', overflow: 'hidden', background: '#000' }}>
        <iframe
          src={`https://www.youtube.com/embed/${videoKey}?autoplay=1&rel=0&cc_load_policy=1&cc_lang_pref=pt-BR`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
        />
      </div>
    )
  }

  return (
    <button
      onClick={handlePlay}
      className="active:opacity-80 w-full"
      style={{ position: 'relative', display: 'block', borderRadius: '12px', overflow: 'hidden', background: '#111' }}
    >
      <img
        src={`https://img.youtube.com/vi/${videoKey}/hqdefault.jpg`}
        alt={title}
        style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', display: 'block' }}
      />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)' }} />
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%,-50%)',
        width: '56px', height: '56px', borderRadius: '50%',
        background: 'rgba(255,255,255,0.92)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="#000">
          <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
      </div>
    </button>
  )
}
