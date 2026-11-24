import { AnimatePresence, motion, useMotionValue, useSpring, useTransform, type MotionValue } from 'motion/react'
import { useRef, useState } from 'react'
import { apps, type AppDef } from '../apps/registry'
import { pl } from '../i18n/pl'
import { play } from '../lib/sound'
import { speak } from '../lib/speak'
import { useDomek } from '../store/useDomek'
import { Picture } from './Picture'

/** App tile: a soft squircle in the app's own accent, used in the dock and window title bars. */
export function AppIcon({ icon, size = 72 }: { icon: Parameters<typeof Picture>[0]['id']; size?: number | string }) {
  return (
    <span
      className="grid size-full shrink-0 place-items-center rounded-[28%] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.7),0_2px_8px_rgb(27_34_64/0.10)]"
      style={{ width: size, height: size, background: 'linear-gradient(160deg, var(--accent-soft), var(--accent-pastel))' }}
    >
      <Picture id={icon} size="62%" />
    </span>
  )
}

/** Where the last app was launched from, so its window can grow out of the dock icon (genie). */
export let launchOrigin: { x: number; y: number } | null = null

const BASE = 76
const MAX = 120
const REACH = 190

/** macOS-style dock: icons swell as the pointer passes over them. */
export function Dock() {
  const mouseX = useMotionValue(Infinity)
  return (
    <nav
      aria-label="Dok"
      onMouseMove={(e) => mouseX.set(e.clientX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      className="glass relative mx-auto flex h-[100px] items-end gap-3 rounded-[32px] px-4 pb-3"
    >
      {apps.map((app, i) => (
        <DockItem key={app.id} app={app} index={i} mouseX={mouseX} />
      ))}
    </nav>
  )
}

function DockItem({ app, index, mouseX }: { app: AppDef; index: number; mouseX: MotionValue<number> }) {
  const launch = useDomek((s) => s.launch)
  const ref = useRef<HTMLButtonElement>(null)
  const [hover, setHover] = useState(false)
  const sayTimer = useRef(0)
  const distance = useTransform(mouseX, (x) => {
    const r = ref.current?.getBoundingClientRect()
    return r ? x - (r.left + r.width / 2) : Infinity
  })
  const target = useTransform(distance, [-REACH, 0, REACH], [BASE, MAX, BASE], { clamp: true })
  const size = useSpring(target, { mass: 0.12, stiffness: 170, damping: 14 })
  return (
    <motion.button
      ref={ref}
      type="button"
      data-app={app.accent}
      initial={{ y: 30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.1 + index * 0.05, type: 'spring', stiffness: 320, damping: 26 }}
      style={{ width: size, height: size }}
      whileTap={{ scale: 0.92 }}
      onHoverStart={() => {
        setHover(true)
        // Say the name too: she may not read it yet.
        sayTimer.current = window.setTimeout(() => speak(app.name), 450)
      }}
      onHoverEnd={() => {
        setHover(false)
        window.clearTimeout(sayTimer.current)
      }}
      onClick={() => {
        const r = ref.current?.getBoundingClientRect()
        if (r) launchOrigin = { x: r.left + r.width / 2, y: r.top + r.height / 2 }
        play('pop')
        launch(app.id)
      }}
      aria-label={pl.home.open(app.name)}
      className="relative shrink-0 cursor-pointer"
    >
      <AppIcon icon={app.icon} size="100%" />
      <AnimatePresence>
        {hover && (
          <motion.span
            initial={{ opacity: 0, y: 6, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, x: '-50%' }}
            transition={{ duration: 0.12 }}
            className="pointer-events-none absolute bottom-full left-1/2 mb-3 rounded-full bg-ink-900/85 px-4 py-1.5 font-display text-lg font-semibold whitespace-nowrap text-white shadow-button"
          >
            {app.name}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  )
}
