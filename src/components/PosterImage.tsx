import { useState } from 'react'

export function PosterImage({ src, alt, style }: {
  src: string | null | undefined
  alt: string
  style?: React.CSSProperties
}) {
  const [loaded, setLoaded] = useState(false)

  if (!src) {
    return <div className="w-full h-full flex items-center justify-center text-[#333] text-xs">?</div>
  }

  return (
    <div className="w-full h-full relative">
      {!loaded && <div className="poster-shimmer" />}
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover"
        style={{ opacity: loaded ? 1 : 0, transition: 'opacity 0.2s ease', ...style }}
        onLoad={() => setLoaded(true)}
      />
    </div>
  )
}
