import { GameController, Lightbulb, Palette, Play, Smiley, Star } from '@phosphor-icons/react'
import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { appById, apps, type AppDef } from '../apps/registry'
import { Dock } from '../components/Dock'
import { Picture } from '../components/Picture'
import { DESKS } from '../components/Wallpaper'
import { ChatBubble } from '../components/ChatBubble'
import { ParentHint } from '../components/ParentHint'
import { Smoczek, type Pose } from '../components/Smoczek'
import { useTalk } from '../components/Companion'
import { useNow } from '../components/TopBar'
import { pl } from '../i18n/pl'
import { celebrate } from '../lib/confetti'
import { play } from '../lib/sound'
import { speak } from '../lib/speak'
import { starsToday, useDomek } from '../store/useDomek'
import { GadgetPicture } from '../wardrobe/GadgetArt'
import { GADGETS, balanceOf, nextGoal } from '../wardrobe/items'

const rise = (delay: number) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, type: 'spring' as const, stiffness: 260, damping: 28 },
})

/** Hands out lines from a list in a shuffled order, so nothing repeats until the list is used up. */
function useBag<T>(items: readonly T[]) {
  const bag = useRef<T[]>([])
  return useCallback(() => {
    if (!bag.current.length) bag.current = [...items].sort(() => Math.random() - 0.5)
    return bag.current.shift()!
  }, [items])
}

/** Everyday short names, so Smoczek talks like family: Helena is Hela. */
const NICK: Record<string, string> = { helena: 'Hela', aleksandra: 'Ola', aleksander: 'Olek', katarzyna: 'Kasia', małgorzata: 'Gosia', zuzanna: 'Zuzia', magdalena: 'Madzia', joanna: 'Asia', agnieszka: 'Agnisia', barbara: 'Basia', weronika: 'Wera', wiktoria: 'Wiki', alicja: 'Ala', antonina: 'Tosia', maria: 'Marysia', zofia: 'Zosia', jakub: 'Kuba', mateusz: 'Mati', antoni: 'Antek', franciszek: 'Franek', stanisław: 'Staś', jan: 'Janek', michał: 'Michałek', szymon: 'Szymek', wojciech: 'Wojtek', tomasz: 'Tomek' }
const nick = (name: string) => NICK[name.toLowerCase()] ?? name

/** The opening line, said once when she arrives. */
function greeting(name: string) {
  return pl.smoczek.welcome(nick(name))
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
  const { profile, progress, wardrobe, screen, launch } = useDomek()
  const name = profile?.childName ?? ''
  const wallet = balanceOf(progress)
  const canBuy = GADGETS.some((g) => !wardrobe.owned.includes(g.id) && g.price <= wallet)
  const goal = nextGoal(wardrobe)

  const nextJoke = useBag(pl.smoczek.jokes)
  const nextFact = useBag(pl.smoczek.facts)
  const nextPet = useBag(pl.smoczek.pet)
  const nextApp = useBag(apps)
  const nextIdle = useBag(pl.smoczek.idle)

  const [line, setLine] = useState<Line>(() => ({ text: greeting(name) + (canBuy ? ` ${pl.smoczek.canBuy(wallet)}` : ''), pose: 'happy', key: 0, app: canBuy ? appById('szafa') ?? undefined : undefined }))
  const say = useCallback((text: string, pose: Pose = 'happy', app?: AppDef) => setLine((l) => ({ text, pose, app, key: l.key + 1 })), [])
  const { talking, repeat } = useTalk(line.text, line.key)
  const lastPoke = useRef(Date.now())
  const idleCount = useRef(0)
  const pets = useRef<number[]>([])

  const poked = () => {
    lastPoke.current = Date.now()
  }

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
      } else if (pick === 2 && canBuy) say(pl.smoczek.canBuy(wallet), 'happy', appById('szafa') ?? undefined)
      else if (pick === 2 && goal) say(pl.smoczek.saving(goal.price - wallet, goal.name), 'idle')
      else say(nextIdle(), 'idle')
    }, 5000)
    return () => window.clearInterval(t)
  }, [screen, say, nextApp, nextIdle, canBuy, wallet, goal])

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
    <div className="relative flex min-h-0 flex-1 flex-col px-6 pt-2 pb-4" onPointerDown={poked}>
      {/* One desktop: the friend, today and the wardrobe all live on the wallpaper, no cards. */}
      <div className="relative min-h-0 flex-1">
        <DateWidget />
        <div className="absolute top-2 right-0 z-20 flex items-start gap-2">
          <DeskPicker onPick={(n) => say(pl.home.deskSay(n), 'happy')} />
          <ParentHint text={pl.parentHint.home} />
        </div>

        <div className="absolute inset-0 flex items-center justify-center gap-8 pt-10 pr-[min(260px,18vw)] pl-[min(120px,8vw)]">
          <motion.button
            {...rise(0)}
            type="button"
            onClick={pet}
            aria-label={pl.home.chipPet}
            title={pl.home.petHint}
            className="group relative shrink-0 cursor-pointer rounded-full outline-offset-8"
          >
            {/* A soft rug to stand on, so the friend belongs to the room. */}
            <span className="absolute inset-x-[-12%] bottom-[-6%] h-[22%] rounded-[50%] bg-white/45 shadow-[inset_0_-6px_16px_rgb(255_255_255/0.6)]" aria-hidden />
            <Smoczek pose={line.pose} beat={line.key} talking={talking && line.pose !== 'thinking'} color={profile?.companionColor} size="min(290px, 40vh)" className="relative transition-transform duration-300 group-hover:-rotate-3" />
          </motion.button>

          <motion.div {...rise(0.05)} className="relative flex max-w-[560px] min-w-0 flex-1 flex-col gap-4">
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
                  className="pressable flex h-14 items-center gap-2 rounded-full bg-white/80 px-5 font-display text-lg font-semibold text-ink-800 shadow-button hover:bg-white"
                >
                  {c.icon}
                  {c.label}
                </button>
              ))}
            </div>
          </motion.div>
        </div>

        <WardrobeSpot />
      </div>

      {/* The wardrobe stands on the desktop, so the dock does not repeat it. */}
      <motion.div {...rise(0.1)} className="flex shrink-0 justify-center pt-4">
        <Dock exclude={['szafa']} />
      </motion.div>
    </div>
  )
}

/** Today, written straight on the desktop like a wall calendar: the day, the date and today's stars. */
function DateWidget() {
  const progress = useDomek((s) => s.progress)
  const now = useNow()
  const weekday = now.toLocaleDateString('pl-PL', { weekday: 'long' })
  const date = now.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long' })
  const today = starsToday(progress)
  return (
    <motion.div {...rise(0.05)} className="absolute top-2 left-0 z-10 flex items-center gap-4">
      <div>
        <p className="font-display text-[min(40px,5vh)] leading-tight font-extrabold tracking-tight text-ink first-letter:uppercase">{weekday}</p>
        <p className="font-display text-xl font-semibold text-ink-700">{date}</p>
      </div>
      <span className="flex items-center gap-1.5 rounded-full bg-white/75 py-2 pr-4 pl-3 shadow-button" aria-label={pl.os.starsToday(today)} title={pl.os.starsToday(today)}>
        <Star size={28} weight="fill" className="text-butter-500 drop-shadow-[0_1px_0_var(--color-butter-700)]" />
        <span className="font-display text-3xl leading-none font-extrabold text-butter-900 tabular-nums">{today}</span>
      </span>
    </motion.div>
  )
}

/** Paint the desktop: a palette button that opens six colour swatches. */
function DeskPicker({ onPick }: { onPick: (name: string) => void }) {
  const wallpaper = useDomek((s) => s.settings.wallpaper)
  const setSettings = useDomek((s) => s.setSettings)
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button
        type="button"
        aria-label={pl.home.desk}
        aria-expanded={open}
        title={pl.home.desk}
        onClick={() => {
          play('click')
          setOpen((o) => !o)
        }}
        className="pressable grid size-12 place-items-center rounded-full bg-white/80 text-ink-800 shadow-button hover:bg-white"
      >
        <Palette size={26} weight="bold" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="absolute top-14 right-0 flex gap-2 rounded-full bg-white/90 p-2 shadow-button"
            role="radiogroup"
            aria-label={pl.home.desk}
          >
            {DESKS.map((d) => {
              const on = d.id === wallpaper
              return (
                <button
                  key={d.id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  aria-label={d.name}
                  title={d.name}
                  onClick={() => {
                    play('pop')
                    setSettings({ wallpaper: d.id })
                    setOpen(false)
                    onPick(d.name)
                  }}
                  className={`pressable size-11 rounded-full ${on ? 'ring-4 ring-accent-strong ring-offset-2' : 'ring-2 ring-white'}`}
                  style={{ background: `linear-gradient(135deg, ${d.swatch[0]}, ${d.swatch[1]})` }}
                />
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/**
 * The wardrobe as a piece of furniture on the desktop. Its doors swing open on hover,
 * a star badge shows when she can afford something, and the next goal sits underneath.
 */
function WardrobeSpot() {
  const { progress, wardrobe, launch } = useDomek()
  const wallet = balanceOf(progress)
  const canBuy = GADGETS.some((g) => !wardrobe.owned.includes(g.id) && g.price <= wallet)
  const goal = nextGoal(wardrobe)
  const [hover, setHover] = useState(false)
  const open = () => {
    play('pop')
    launch('szafa')
  }
  return (
    <motion.div {...rise(0.12)} className="absolute right-0 bottom-0 z-10 flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={open}
        onPointerEnter={() => {
          setHover(true)
          speak(pl.apps.wardrobe)
        }}
        onPointerLeave={() => setHover(false)}
        aria-label={pl.apps.wardrobe}
        title={pl.apps.wardrobe}
        className="relative cursor-pointer rounded-[24px] outline-offset-4"
      >
        <Closet open={hover} />
        {canBuy && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: [1, 1.12, 1] }}
            transition={{ duration: 1.6, repeat: Infinity }}
            className="absolute -top-2 -right-2 grid size-11 place-items-center rounded-full bg-butter-100 shadow-button ring-2 ring-white"
            aria-hidden
          >
            <Star size={26} weight="fill" className="text-butter-500" />
          </motion.span>
        )}
      </button>
      <span className="rounded-full bg-white/80 px-4 py-1.5 font-display text-lg font-bold text-ink-800 shadow-button">{pl.apps.wardrobe}</span>
      {!canBuy && goal && (
        <span className="flex w-[min(180px,13vw)] items-center gap-2" aria-label={`${pl.wardrobe.next}: ${goal.name}, ${pl.wardrobe.goal(wallet, goal.price)}`}>
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white/80">
            <GadgetPicture id={goal.id} size={26} />
          </span>
          <span className="h-3 flex-1 overflow-hidden rounded-full bg-white/80">
            <motion.span className="block h-full rounded-full bg-butter-500" initial={false} animate={{ width: `${Math.min(100, (wallet / goal.price) * 100)}%` }} />
          </span>
        </span>
      )}
    </motion.div>
  )
}

/** A small pastel wardrobe. With the doors open you see a dress, a striped shirt and a hat inside. */
function Closet({ open }: { open: boolean }) {
  const ink = '#2E2A33'
  const door = { stroke: ink, strokeWidth: 4, strokeLinejoin: 'round' as const }
  const swing = { type: 'spring' as const, stiffness: 220, damping: 18 }
  return (
    <svg viewBox="0 0 160 190" className="block h-[min(190px,24vh)] w-auto overflow-visible" aria-hidden>
      <ellipse cx="80" cy="184" rx="66" ry="6" fill={ink} opacity=".08" />
      <rect x="28" y="170" width="14" height="12" rx="4" fill="#C9A0D9" stroke={ink} strokeWidth="4" />
      <rect x="118" y="170" width="14" height="12" rx="4" fill="#C9A0D9" stroke={ink} strokeWidth="4" />
      <path d="M16 54Q16 20 80 16Q144 20 144 54V172H16Z" fill="#E7D8F5" {...door} />
      <path d="M58 16q22-14 44 0" fill="none" stroke={ink} strokeWidth="4" strokeLinecap="round" />
      <path d="M68 12L72 2L80 9L88 2L92 12Z" fill="#F6D58A" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
      {/* Inside */}
      <rect x="26" y="40" width="108" height="122" rx="10" fill="#5B4C6E" />
      <path d="M30 52H130" stroke="#C9A0D9" strokeWidth="4" strokeLinecap="round" />
      <path d="M44 52v8M44 60l-12 8h24z" fill="none" stroke="#F6D58A" strokeWidth="3" strokeLinejoin="round" />
      <path d="M34 68H54L60 120Q44 126 28 120Z" fill="#F2A7C0" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
      <path d="M80 52v8M80 60l-12 8h24z" fill="none" stroke="#F6D58A" strokeWidth="3" strokeLinejoin="round" />
      <path d="M66 68H94V108H66Z" fill="#7DB9E8" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
      <path d="M66 80H94M66 94H94" stroke="#FFFDF5" strokeWidth="5" />
      <path d="M104 66Q104 54 116 54Q128 54 128 66Z" fill="#E8857C" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
      <rect x="100" y="64" width="32" height="7" rx="3.5" fill="#FFFDF5" stroke={ink} strokeWidth="3" />
      {/* Doors */}
      <motion.g style={{ transformOrigin: '18px 100px', transformBox: 'view-box' }} animate={{ scaleX: open ? 0.25 : 1 }} transition={swing}>
        <rect x="18" y="38" width="62" height="128" rx="8" fill="#F2C4DA" {...door} />
        <path d="M30 52h38v52H30z" fill="none" stroke="#E7A9C6" strokeWidth="3" strokeLinejoin="round" />
        <circle cx="70" cy="112" r="5" fill="#F6D58A" stroke={ink} strokeWidth="3" />
      </motion.g>
      <motion.g style={{ transformOrigin: '142px 100px', transformBox: 'view-box' }} animate={{ scaleX: open ? 0.25 : 1 }} transition={swing}>
        <rect x="80" y="38" width="62" height="128" rx="8" fill="#F2C4DA" {...door} />
        <path d="M92 52h38v52H92z" fill="none" stroke="#E7A9C6" strokeWidth="3" strokeLinejoin="round" />
        <circle cx="90" cy="112" r="5" fill="#F6D58A" stroke={ink} strokeWidth="3" />
      </motion.g>
    </svg>
  )
}
