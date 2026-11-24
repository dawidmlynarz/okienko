import { GameController, Lightbulb, Play, Smiley, Star } from '@phosphor-icons/react'
import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { apps, type AppDef } from '../apps/registry'
import { Dock } from '../components/Dock'
import { Picture } from '../components/Picture'
import { ChatBubble } from '../components/ChatBubble'
import { House } from '../components/House'
import { ParentHint } from '../components/ParentHint'
import { Smoczek, type Pose } from '../components/Smoczek'
import { useTalk } from '../components/Companion'
import { useNow } from '../components/TopBar'
import { pl } from '../i18n/pl'
import { celebrate } from '../lib/confetti'
import { play } from '../lib/sound'
import { UPGRADE_STARS, starsToday, useDomek, type CompanionColor } from '../store/useDomek'

const rise = (delay: number) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, type: 'spring' as const, stiffness: 260, damping: 28 },
})

/** The hero card takes its tint from Smoczek's colour. */
const HERO_ACCENT: Record<CompanionColor, string> = { mint: 'typing', sky: 'system', lavender: 'maths', peach: 'web', pink: 'english' }

/** Hands out lines from a list in a shuffled order, so nothing repeats until the list is used up. */
function useBag<T>(items: readonly T[]) {
  const bag = useRef<T[]>([])
  return useCallback(() => {
    if (!bag.current.length) bag.current = [...items].sort(() => Math.random() - 0.5)
    return bag.current.shift()!
  }, [items])
}

function greeting(name: string, h: number) {
  const g = pl.smoczek.greet
  const list = h >= 5 && h < 11 ? g.morning(name) : h >= 11 && h < 17 ? g.day(name) : h >= 17 && h < 21 ? g.evening(name) : g.night(name)
  return list[Math.floor(Math.random() * list.length)]
}

/** The bubble shows only the first sentence; Smoczek says the whole line. */
const firstSentence = (t: string) => /^.*?[.!?…](?=\s|$)/.exec(t)?.[0] ?? t

interface Line {
  text: string
  pose: Pose
  key: number
  /** An app Smoczek suggests; shows a "play" button under the bubble. */
  app?: AppDef
}

const IDLE_MS = 30_000
const MAX_IDLE = 3

export function Home() {
  const { profile, progress, os, screen, setUpgradeOpen, launch } = useDomek()
  const name = profile?.childName ?? ''
  const canUpgrade = os.version === '1.0' && progress.stars >= UPGRADE_STARS
  const left = Math.max(0, UPGRADE_STARS - progress.stars)

  const nextJoke = useBag(pl.smoczek.jokes)
  const nextFact = useBag(pl.smoczek.facts)
  const nextPet = useBag(pl.smoczek.pet)
  const nextApp = useBag(apps)
  const nextIdle = useBag(pl.smoczek.idle)

  const [line, setLine] = useState<Line>(() => ({ text: canUpgrade ? pl.home.surprise(name) : greeting(name, new Date().getHours()), pose: canUpgrade ? 'cheer' : 'happy', key: 0 }))
  const say = useCallback((text: string, pose: Pose = 'happy', app?: AppDef) => setLine((l) => ({ text, pose, app, key: l.key + 1 })), [])
  const { talking, repeat } = useTalk(line.text, line.key)
  const lastPoke = useRef(Date.now())
  const idleCount = useRef(0)
  const pets = useRef<number[]>([])

  const poked = () => {
    lastPoke.current = Date.now()
  }

  // Offer the room when she is back home, never in the middle of an app.
  useEffect(() => {
    if (canUpgrade && screen === 'home') {
      const t = window.setTimeout(() => setUpgradeOpen(true), 1600)
      return () => window.clearTimeout(t)
    }
  }, [canUpgrade, screen, setUpgradeOpen])

  // When nobody has clicked for a while, Smoczek pipes up by himself. A few times, then he waits.
  useEffect(() => {
    if (screen !== 'home') return
    const t = window.setInterval(() => {
      if (Date.now() - lastPoke.current < IDLE_MS || idleCount.current >= MAX_IDLE) return
      idleCount.current += 1
      lastPoke.current = Date.now()
      const pick = idleCount.current % 3
      if (pick === 1) {
        const app = nextApp()
        say(pl.smoczek.play[app.id] ?? pl.smoczek.idle[0], 'happy', app)
      } else if (pick === 2 && os.version === '1.0' && left > 0) say(pl.smoczek.stars(left), 'idle')
      else say(nextIdle(), 'idle')
    }, 5000)
    return () => window.clearInterval(t)
  }, [screen, say, nextApp, nextIdle, os.version, left])

  const pet = () => {
    poked()
    const now = Date.now()
    pets.current = [...pets.current.filter((t) => now - t < 4000), now]
    play('pop')
    if (pets.current.length >= 5) {
      pets.current = []
      celebrate()
      play('fanfare')
      say(pl.smoczek.petLots(name), 'cheer')
    } else say(nextPet(), 'happy')
  }

  const chips = [
    { id: 'joke', label: pl.home.chipJoke, icon: <Smiley size={24} weight="bold" />, run: () => say(nextJoke(), 'happy') },
    { id: 'fact', label: pl.home.chipFact, icon: <Lightbulb size={24} weight="bold" />, run: () => say(nextFact(), 'thinking') },
    {
      id: 'play',
      label: pl.home.chipPlay,
      icon: <GameController size={24} weight="bold" />,
      run: () => {
        const app = nextApp()
        say(pl.smoczek.play[app.id] ?? '', 'happy', app)
      },
    },
  ]


  return (
    <div className="relative flex min-h-0 flex-1 flex-col gap-4 p-4" onPointerDown={poked}>
      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1.7fr)_minmax(300px,1fr)] gap-4">
        {/* Smoczek hero */}
        <motion.section {...rise(0)} data-app={HERO_ACCENT[profile?.companionColor ?? 'mint']} className="tile relative flex min-h-0 items-center gap-6 overflow-hidden rounded-[36px] px-8">
          <div className="dots-bg pointer-events-none absolute inset-0 opacity-70" aria-hidden />
          <ParentHint text={pl.parentHint.home} className="absolute top-4 right-4 z-10" />
          <div className="pointer-events-none absolute -bottom-24 -left-16 size-[420px] rounded-full bg-white/50 blur-2xl" aria-hidden />
          <button
            type="button"
            onClick={pet}
            aria-label={pl.home.chipPet}
            title={pl.home.petHint}
            className="group relative shrink-0 cursor-pointer rounded-full outline-offset-8"
          >
            <span className="absolute inset-x-6 bottom-1 h-6 rounded-full bg-accent-deep/10 blur-md" aria-hidden />
            <Smoczek pose={line.pose} beat={line.key} talking={talking && line.pose !== 'thinking'} color={profile?.companionColor} size="min(270px, 36vh)" className="relative transition-transform duration-300 group-hover:-rotate-3" />
          </button>

          <div className="relative flex min-w-0 flex-1 flex-col gap-4">
            <div className="min-h-[72px]">
              <AnimatePresence mode="popLayout">
                <ChatBubble key={line.key} text={firstSentence(line.text)} onRepeat={repeat} size="lg" />
              </AnimatePresence>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {line.app && (
                <motion.button
                  key={`go-${line.key}`}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  type="button"
                  data-app={line.app.accent}
                  onClick={() => {
                    play('pop')
                    launch(line.app!.id)
                  }}
                  className="pressable flex h-14 items-center gap-2.5 rounded-full bg-accent-strong pr-6 pl-2 font-display text-lg font-bold text-white shadow-button"
                >
                  <span className="grid size-10 place-items-center rounded-full bg-white">
                    <Picture id={line.app.icon} size={28} />
                  </span>
                  {line.app.name}
                  <Play size={18} weight="fill" />
                </motion.button>
              )}
              {chips.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    play('click')
                    poked()
                    c.run()
                  }}
                  className="pressable flex h-14 items-center gap-2 rounded-full bg-white/80 px-5 font-display text-lg font-semibold text-accent-deep shadow-button hover:bg-white"
                >
                  {c.icon}
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Right column */}
        <div className="flex min-h-0 flex-col gap-4">
          <TodayCard />
          <RoomCard canUpgrade={canUpgrade} onBuild={() => setUpgradeOpen(true)} />
        </div>
      </div>

      <motion.div {...rise(0.1)} className="flex shrink-0 justify-center pt-6">
        <Dock />
      </motion.div>
    </div>
  )
}

function TodayCard() {
  const progress = useDomek((s) => s.progress)
  const now = useNow()
  const weekday = now.toLocaleDateString('pl-PL', { weekday: 'long' })
  const date = now.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long' })
  const today = starsToday(progress)
  return (
    <motion.section {...rise(0.05)} className="card flex flex-1 items-center justify-between gap-4 rounded-[32px] p-6">
      <div>
        <p className="font-display text-[min(44px,5.4vh)] leading-tight font-extrabold tracking-tight text-ink first-letter:uppercase">{weekday}</p>
        <p className="font-display text-xl font-semibold text-ink-700">{date}</p>
      </div>
      <span className="flex items-center gap-2 rounded-[22px] bg-butter-100 py-3 pr-5 pl-4" aria-label={pl.os.starsToday(today)} title={pl.os.starsToday(today)}>
        <Star size={40} weight="fill" className="text-butter-500 drop-shadow-[0_1px_0_var(--color-butter-700)]" />
        <span className="font-display text-5xl leading-none font-extrabold text-butter-900 tabular-nums">{today}</span>
      </span>
    </motion.section>
  )
}

/** The update, in kid terms: stars buy bricks, bricks build Smoczek a new room. */
function RoomCard({ canUpgrade, onBuild }: { canUpgrade: boolean; onBuild: () => void }) {
  const { progress, os } = useDomek()
  const have = Math.min(progress.stars, UPGRADE_STARS)
  const built = os.version !== '1.0'
  const room = useMemo(() => Array.from({ length: UPGRADE_STARS }, (_, i) => i < have), [have])

  if (built) {
    return (
      <motion.section {...rise(0.1)} data-app="typing" className="tile relative flex flex-1 items-center gap-5 overflow-hidden rounded-[32px] p-6">
        <ParentHint text={pl.parentHint.room} className="absolute top-4 right-4" />
        <House progress={1} width="min(220px, 27vh)" />
        <p className="font-display text-3xl leading-tight font-extrabold text-accent-deep">{pl.home.roomDone}</p>
      </motion.section>
    )
  }

  return (
    <motion.section {...rise(0.1)} data-app="notes" className="tile relative flex flex-1 items-center gap-5 overflow-hidden rounded-[32px] p-6">
      <ParentHint text={pl.parentHint.room} className="absolute top-4 right-4" />
      <House progress={(have / UPGRADE_STARS) * 0.75} width="min(220px, 27vh)" smoke={false} />
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <p className="font-display text-3xl leading-tight font-extrabold text-accent-deep">{pl.home.roomTitle}</p>
        {canUpgrade ? (
          <button type="button" onClick={onBuild} className="pressable h-14 shrink-0 rounded-full bg-accent-strong font-display text-xl font-bold text-white shadow-button">
            {pl.upgrade.install}
          </button>
        ) : (
          <div className="flex gap-1" aria-label={`${have} z ${UPGRADE_STARS}`}>
            {room.map((on, i) => (
              <motion.span key={i} initial={false} animate={{ scale: on ? 1 : 0.9 }}>
                <Star size={34} weight="fill" className={on ? 'text-butter-500 drop-shadow-[0_1px_0_var(--color-butter-700)]' : 'text-white'} />
              </motion.span>
            ))}
          </div>
        )}
      </div>
    </motion.section>
  )
}
