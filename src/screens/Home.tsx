import { ChatCircleDots, GameController, Lightbulb, Play, Smiley, SpeakerHigh, Star } from '@phosphor-icons/react'
import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { apps, type AppDef } from '../apps/registry'
import { AppIcon } from '../components/Dock'
import { Picture } from '../components/Picture'
import { Smoczek, type Pose } from '../components/Smoczek'
import { useTalk } from '../components/Companion'
import { useNow } from '../components/TopBar'
import { pl, plural, stars } from '../i18n/pl'
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

  const games = apps.filter((a) => a.kind === 'game')
  const tools = apps.filter((a) => a.kind === 'tool')

  return (
    <div className="relative flex min-h-0 flex-1 flex-col gap-4 p-4" onPointerDown={poked}>
      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1.7fr)_minmax(300px,1fr)] gap-4">
        {/* Smoczek hero */}
        <motion.section {...rise(0)} data-app={HERO_ACCENT[profile?.companionColor ?? 'mint']} className="tile relative flex min-h-0 items-center gap-6 overflow-hidden rounded-[36px] px-8">
          <div className="dots-bg pointer-events-none absolute inset-0 opacity-70" aria-hidden />
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
            <span className="absolute -top-1 left-1/2 -translate-x-1/2 rounded-full bg-white px-3 py-1 font-display text-sm font-bold whitespace-nowrap text-accent-deep opacity-0 shadow-button transition-opacity group-hover:opacity-100">
              {pl.home.petHint}
            </span>
          </button>

          <div className="relative flex min-w-0 flex-1 flex-col gap-4">
            <AnimatePresence mode="popLayout">
              <motion.div
                key={line.key}
                initial={{ opacity: 0, y: 10, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.1 } }}
                transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                className="relative flex items-start gap-3 rounded-[28px] rounded-bl-[8px] bg-surface py-5 pr-4 pl-7 shadow-card"
                role="status"
              >
                <p className="flex-1 font-body text-[min(30px,3.6vh)] leading-snug text-ink">{line.text}</p>
                <button type="button" aria-label="Powiedz jeszcze raz" title="Powiedz jeszcze raz" onClick={repeat} className="grid size-11 shrink-0 place-items-center rounded-full text-accent-strong transition-colors hover:bg-accent-soft">
                  <SpeakerHigh size={24} weight="bold" />
                </button>
              </motion.div>
            </AnimatePresence>

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
                  {pl.home.playThis(line.app.name)}
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
          <RoomCard canUpgrade={canUpgrade} left={left} onBuild={() => setUpgradeOpen(true)} />
        </div>
      </div>

      {/* Apps */}
      <motion.section {...rise(0.1)} aria-label={pl.home.games} className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between px-2">
          <h2 className="font-display text-2xl font-extrabold text-ink">{pl.home.games}</h2>
          <span className="flex items-center gap-2 text-lg text-muted">
            <ChatCircleDots size={22} weight="bold" /> {pl.home.petHint}
          </span>
        </div>
        <div className="grid grid-cols-6 gap-4">
          {[...games, ...tools].map((app, i) => (
            <AppTile key={app.id} app={app} index={i} best={bestFor(app.id, progress.levels)} />
          ))}
        </div>
      </motion.section>
    </div>
  )
}

/** Best stars a game has seen, summed over its levels (level ids start with the game's prefix). */
const LEVEL_PREFIX: Record<string, string[]> = {
  'balonowy-las': ['domowy', 'gorny', 'alfabet', 'polskie'],
  'obrazkowe-slowa': ['slowa-'],
  'lap-biedronki': ['biedronki-'],
  'smocze-memory': ['memory-'],
  'liczymy-jablka': ['liczenie-'],
}
function bestFor(id: string, levels: Record<string, number>) {
  const pre = LEVEL_PREFIX[id]
  if (!pre) return null
  return Object.entries(levels).reduce((n, [k, v]) => (pre.some((p) => (p.endsWith('-') ? k.startsWith(p) : k === p)) ? n + v : n), 0)
}

function AppTile({ app, index, best }: { app: AppDef; index: number; best: number | null }) {
  const launch = useDomek((s) => s.launch)
  return (
    <motion.button
      type="button"
      data-app={app.accent}
      initial={{ y: 24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.15 + index * 0.05, type: 'spring', stiffness: 320, damping: 26 }}
      whileHover={{ y: -6 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => {
        play('pop')
        launch(app.id)
      }}
      aria-label={pl.home.open(app.name)}
      className="tile group relative flex h-[min(200px,24vh)] cursor-pointer flex-col justify-between overflow-hidden rounded-[30px] p-4 text-left"
    >
      <span className="pointer-events-none absolute -top-10 -right-10 size-36 rounded-full bg-white/45" aria-hidden />
      <span className="relative flex items-start justify-between">
        <span className="transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6">
          <AppIcon icon={app.icon} size={64} />
        </span>
        {best !== null && best > 0 && (
          <span className="flex items-center gap-1 rounded-full bg-white/85 px-2 py-0.5 font-display text-sm font-bold text-butter-900">
            <Star size={14} weight="fill" className="text-butter-600" />
            {best}
          </span>
        )}
      </span>
      <span className="relative">
        <span className="block font-display text-xl leading-tight font-extrabold text-accent-deep">{app.name}</span>
        <span className="block text-base leading-snug text-ink-700">{app.blurb}</span>
      </span>
    </motion.button>
  )
}

function TodayCard() {
  const progress = useDomek((s) => s.progress)
  const now = useNow()
  const weekday = now.toLocaleDateString('pl-PL', { weekday: 'long' })
  const date = now.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long' })
  const today = starsToday(progress)
  return (
    <motion.section {...rise(0.05)} className="card flex flex-1 flex-col justify-between rounded-[32px] p-6">
      <div>
        <p className="font-display text-base font-bold text-muted">{pl.home.today}</p>
        <p className="font-display text-[min(44px,5.4vh)] leading-tight font-extrabold tracking-tight text-ink first-letter:uppercase">{weekday}</p>
        <p className="font-display text-xl font-semibold text-ink-700">{date}</p>
      </div>
      <div className="flex items-end justify-between">
        <span className="flex items-center gap-3">
          <span className="grid size-14 place-items-center rounded-[18px] bg-butter-100">
            <Star size={34} weight="fill" className="text-butter-500 drop-shadow-[0_1px_0_var(--color-butter-700)]" />
          </span>
          <span>
            <span className="block font-display text-4xl leading-none font-extrabold text-ink tabular-nums">{today}</span>
            <span className="text-base text-muted">{plural(today, 'gwiazdka dziś', 'gwiazdki dziś', 'gwiazdek dziś')}</span>
          </span>
        </span>
        <span className="text-base text-muted">{pl.home.total(progress.stars)}</span>
      </div>
    </motion.section>
  )
}

/** The update, in kid terms: stars buy bricks, bricks build Smoczek a new room. */
function RoomCard({ canUpgrade, left, onBuild }: { canUpgrade: boolean; left: number; onBuild: () => void }) {
  const { progress, os } = useDomek()
  const have = Math.min(progress.stars, UPGRADE_STARS)
  const built = os.version !== '1.0'
  const room = useMemo(() => Array.from({ length: UPGRADE_STARS }, (_, i) => i < have), [have])

  if (built) {
    return (
      <motion.section {...rise(0.1)} data-app="typing" className="tile flex flex-1 flex-col justify-center gap-4 rounded-[32px] p-6">
        <div className="flex items-center gap-4">
          <Picture id="domek" size={72} />
          <p className="font-display text-2xl leading-tight font-extrabold text-accent-deep">{pl.home.roomDone}</p>
        </div>
        <p className="text-lg leading-snug text-ink-700">{pl.home.roomDoneLead}</p>
      </motion.section>
    )
  }

  return (
    <motion.section {...rise(0.1)} data-app="notes" className="tile relative flex flex-1 flex-col justify-center gap-5 overflow-hidden rounded-[32px] p-6">
      <div className="flex items-center gap-4">
        <BrickHouse filled={have} />
        <div>
          <p className="font-display text-2xl leading-tight font-extrabold text-accent-deep">{canUpgrade ? pl.home.roomReady : pl.home.roomTitle}</p>
          <p className="mt-1 text-lg leading-snug text-ink-700">{pl.home.roomLead}</p>
        </div>
      </div>
      {canUpgrade ? (
        <button type="button" onClick={onBuild} className="pressable h-14 shrink-0 rounded-full bg-accent-strong font-display text-xl font-bold text-white shadow-button">
          {pl.upgrade.install}
        </button>
      ) : (
        <div className="flex items-center justify-between gap-3">
          <div className="flex gap-1.5" aria-label={`${have} z ${UPGRADE_STARS}`}>
            {room.map((on, i) => (
              <motion.span key={i} initial={false} animate={{ scale: on ? 1 : 0.9 }}>
                <Star size={32} weight="fill" className={on ? 'text-butter-500 drop-shadow-[0_1px_0_var(--color-butter-700)]' : 'text-white'} />
              </motion.span>
            ))}
          </div>
          <span className="font-display text-lg font-bold text-accent-deep">{left > 0 ? pl.os.starsLeft(left) : stars(have)}</span>
        </div>
      )}
    </motion.section>
  )
}

/** A tiny room outline that fills in, one brick row per star. */
function BrickHouse({ filled }: { filled: number }) {
  return (
    <svg viewBox="0 0 64 60" className="h-[min(110px,13vh)] w-auto shrink-0" aria-hidden>
      <path d="M6 26 32 6l26 20" fill="none" stroke="var(--color-butter-600)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={filled >= UPGRADE_STARS ? undefined : '5 5'} />
      <rect x="11" y="24" width="42" height="32" rx="5" fill="rgb(255 255 255 / 0.6)" stroke="var(--color-butter-600)" strokeWidth="2.5" strokeDasharray="4 4" />
      {Array.from({ length: UPGRADE_STARS }, (_, i) => (
        <motion.rect
          key={i}
          x="13"
          width="38"
          height="5"
          rx="1.5"
          y={50 - i * 6}
          fill={i % 2 ? 'var(--color-peach-400)' : 'var(--color-peach-300)'}
          initial={false}
          animate={{ opacity: i < filled ? 1 : 0, y: i < filled ? 50 - i * 6 : 40 - i * 6 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20, delay: i * 0.08 }}
        />
      ))}
    </svg>
  )
}
