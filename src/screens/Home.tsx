import { GameController, Lightbulb, Play, Smiley, Star } from '@phosphor-icons/react'
import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { appById, apps, type AppDef } from '../apps/registry'
import { Dock } from '../components/Dock'
import { Picture } from '../components/Picture'
import { ChatBubble } from '../components/ChatBubble'
import { ParentHint } from '../components/ParentHint'
import { Smoczek, type Pose } from '../components/Smoczek'
import { useTalk } from '../components/Companion'
import { useNow } from '../components/TopBar'
import { pl } from '../i18n/pl'
import { celebrate } from '../lib/confetti'
import { play } from '../lib/sound'
import { starsToday, useDomek, type CompanionColor } from '../store/useDomek'
import { GadgetPicture } from '../wardrobe/GadgetArt'
import { GADGETS, balanceOf, nextGoal } from '../wardrobe/items'

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
          <WardrobeCard />
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

/** Smoczek's wardrobe: what he wears now, and the next gadget she is saving up for. */
function WardrobeCard() {
  const { profile, progress, wardrobe, launch } = useDomek()
  const wallet = balanceOf(progress)
  const canBuy = GADGETS.some((g) => !wardrobe.owned.includes(g.id) && g.price <= wallet)
  const goal = nextGoal(wardrobe)
  const open = () => {
    play('pop')
    launch('szafa')
  }
  return (
    <motion.section {...rise(0.1)} data-app="shop" className="tile relative flex flex-1 items-center gap-4 overflow-hidden rounded-[32px] p-5">
      <ParentHint text={pl.parentHint.wardrobe} className="absolute top-4 right-4 z-10" />
      <button type="button" onClick={open} aria-label={pl.apps.wardrobe} className="shrink-0 cursor-pointer rounded-full">
        <Smoczek pose={canBuy ? 'happy' : 'idle'} color={profile?.companionColor} size="min(150px, 21vh)" followEyes={false} />
      </button>
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <p className="font-display text-[min(30px,3.8vh)] leading-tight font-extrabold text-accent-deep">{pl.apps.wardrobe}</p>
        {canBuy ? (
          <p className="flex items-center gap-2 font-display text-xl font-bold text-accent-deep">
            <Star size={26} weight="fill" className="text-butter-500" />
            {pl.wardrobe.canBuyNow}
          </p>
        ) : goal ? (
          <div className="flex items-center gap-3" aria-label={`${pl.wardrobe.next}: ${goal.name}, ${pl.wardrobe.goal(wallet, goal.price)}`}>
            <span className="grid size-14 shrink-0 place-items-center rounded-[18px] bg-white/80">
              <GadgetPicture id={goal.id} size={40} />
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <div className="h-3.5 overflow-hidden rounded-full bg-white/80">
                <motion.div className="h-full rounded-full bg-butter-500" initial={false} animate={{ width: `${Math.min(100, (wallet / goal.price) * 100)}%` }} />
              </div>
              <span className="flex items-center gap-1 font-display text-lg font-bold text-accent-deep tabular-nums">
                <Star size={18} weight="fill" className="text-butter-500" />
                {pl.wardrobe.goal(wallet, goal.price)}
              </span>
            </div>
          </div>
        ) : null}
        <button type="button" onClick={open} className="pressable h-14 shrink-0 rounded-full bg-accent-strong px-6 font-display text-xl font-bold text-white shadow-button">
          {pl.wardrobe.open}
        </button>
      </div>
    </motion.section>
  )
}
