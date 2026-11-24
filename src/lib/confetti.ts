import confetti from 'canvas-confetti'

const reduced = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches

// Pastel confetti from the token ramps (300 and 400 steps).
const COLORS = ['#9EDAFE', '#91E7B9', '#FFBAD4', '#D0CAFE', '#EECC85', '#FEC2A0', '#5ED19A', '#FE8FBC']

export function burst(x: number, y: number) {
  if (reduced()) return
  confetti({ particleCount: 28, spread: 70, startVelocity: 26, gravity: 0.9, ticks: 90, scalar: 0.9, origin: { x, y }, colors: COLORS, disableForReducedMotion: true })
}

export function celebrate() {
  if (reduced()) return
  const end = Date.now() + 900
  const frame = () => {
    confetti({ particleCount: 6, angle: 60, spread: 60, origin: { x: 0, y: 0.7 }, colors: COLORS, disableForReducedMotion: true })
    confetti({ particleCount: 6, angle: 120, spread: 60, origin: { x: 1, y: 0.7 }, colors: COLORS, disableForReducedMotion: true })
    if (Date.now() < end) requestAnimationFrame(frame)
  }
  frame()
}
