import confetti from 'canvas-confetti'

export function fireSeriesConfetti() {
  const colors = ['#f5b730', '#ffffff', '#5cb85c', '#4a9eff', '#ff6b6b']
  const end = Date.now() + 2500
  ;(function frame() {
    confetti({ particleCount: 4, angle: 60, spread: 70, origin: { x: 0, y: 0.65 }, colors })
    confetti({ particleCount: 4, angle: 120, spread: 70, origin: { x: 1, y: 0.65 }, colors })
    if (Date.now() < end) requestAnimationFrame(frame)
  })()
}
