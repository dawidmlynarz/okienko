import { PACE, afterTalk } from '../../lib/speak'
import { firstThen, fresh } from '../../lib/bag'
import { motion } from 'motion/react'
import { useCallback, useMemo, useRef, useState } from 'react'
import type { PictureId } from '../../assets/pictures'
import { Companion } from '../../components/Companion'
import { Picture } from '../../components/Picture'
import type { Pose } from '../../components/Smoczek'
import { DomekLogo } from '../../components/TopBar'
import data from '../../content/smocze-memory.json'
import { pl } from '../../i18n/pl'
import { useTypedKeys } from '../../keyboard/useKeys'
import { burst, celebrate } from '../../lib/confetti'
import { play } from '../../lib/sound'
import type { AppProps } from '../registry'
import { GameHud, GameShell, shuffle, type LevelBase, type RoundProps, type Stars } from '../shared/GameKit'
import { memoryStars } from './scoring'

interface Level extends LevelBase {
  pairs: number
  columns: number
}
const levels = data.levels as Level[]

export default function SmoczeMemory(_: AppProps) {
  return <GameShell levels={levels} lead={pl.memory.lead} hint={pl.parentHint.games['smocze-memory']} backdrop={<Backdrop />} className="bg-sky-50" Round={Round} />
}

function Backdrop() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      <div className="absolute -top-32 right-10 size-[480px] rounded-full bg-sky-100 blur-3xl" />
      <div className="absolute -bottom-40 -left-20 size-[520px] rounded-full bg-lavender-100 blur-3xl" />
    </div>
  )
}

interface Card {
  key: number
  pic: PictureId
}

function Round({ level, onDone, onBack }: RoundProps<Level>) {
  const cards = useMemo<Card[]>(() => {
    const pics = shuffle(data.pictures as PictureId[]).slice(0, level.pairs)
    return shuffle([...pics, ...pics]).map((pic, key) => ({ key, pic }))
  }, [level])
  const [open, setOpen] = useState<number[]>([])
  const [found, setFound] = useState<Set<PictureId>>(() => new Set())
  const [moves, setMoves] = useState(0)
  const [talk, setTalk] = useState<{ text: string | null; say?: string; pose: Pose; key: number }>(() => ({ text: pl.memory.show, say: firstThen('smocze-memory', pl.memory.startSay, pl.memory.startAgain), pose: 'happy', key: 0 }))
  const busy = useRef(false)
  const misses = useRef(0)
  const tell = useCallback((text: string | null, pose: Pose, say?: string) => setTalk((c) => ({ text, pose, say: say ?? '', key: c.key + 1 })), [])

  useTypedKeys((k) => {
    if (k.kind === 'escape') onBack()
  })

  const flip = (c: Card, e: React.MouseEvent) => {
    if (busy.current || open.includes(c.key) || found.has(c.pic)) return
    play('click')
    const next = [...open, c.key]
    setOpen(next)
    if (next.length < 2) return
    const m = moves + 1
    setMoves(m)
    const [a, b] = next.map((k) => cards[k])
    if (a.pic === b.pic) {
      const f = new Set(found).add(a.pic)
      window.setTimeout(() => {
        setFound(f)
        setOpen([])
        play('correct')
        burst(e.clientX / window.innerWidth, e.clientY / window.innerHeight)
        if (f.size === level.pairs) {
          play('fanfare')
          celebrate()
          tell(pl.game.done, 'cheer')
          const stars: Stars = memoryStars(m, level.pairs)
          afterTalk(() => onDone(stars, pl.memory.moves(m)), 1000)
        } else {
          const p = fresh(pl.memory.pair)
          tell(p, 'happy', p)
        }
      }, 450)
    } else {
      busy.current = true
      window.setTimeout(() => {
        setOpen([])
        busy.current = false
        // Say it out loud only now and then: hearing it after every miss gets tiring.
        misses.current += 1
        tell(pl.memory.different, 'thinking', misses.current % 3 === 1 ? pl.memory.differentSay : '')
      }, 1100 * PACE)
    }
  }

  const rows = Math.ceil(cards.length / level.columns)
  // Size cards from the room we have (height, and width beside Smoczek), so 16 cards still fit on a short laptop screen.
  const h = `min(196px, calc((100vh - 300px) / ${rows} - 16px), calc(((100vw - 600px) / ${level.columns} - 16px) * 1.2))`
  return (
    <div className="flex h-full flex-col">
      <GameHud onBack={onBack} done={found.size} total={level.pairs} title={level.title} label={pl.memory.moves(moves)} />
      <div className="relative flex min-h-0 flex-1 items-center justify-center gap-10 p-6">
        <div className="w-[300px] shrink-0 self-end">
          <Companion text={talk.text} say={talk.say} sayKey={talk.key} pose={talk.pose} size={120} bubbleSide="top" narrow />
        </div>
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${level.columns}, auto)` }}>
          {cards.map((c, i) => {
            const up = open.includes(c.key) || found.has(c.pic)
            const isFound = found.has(c.pic)
            return (
              <motion.button
                key={c.key}
                type="button"
                aria-label={up ? pl.pictures[c.pic as keyof typeof pl.pictures] ?? 'karta' : 'Zakryta karta'}
                onClick={(e) => flip(c, e)}
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: i * 0.04, type: 'spring', stiffness: 300, damping: 24 }}
                whileHover={up ? undefined : { y: -4 }}
                whileTap={up ? undefined : { scale: 0.96 }}
                className="relative cursor-pointer [perspective:900px]"
                style={{ height: h, aspectRatio: '5 / 6' }}
              >
                <motion.span
                  className="absolute inset-0 [transform-style:preserve-3d]"
                  initial={false}
                  animate={{ rotateY: up ? 180 : 0 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                >
                  {/* Back */}
                  <span className="absolute inset-0 grid place-items-center overflow-hidden rounded-[24px] bg-accent-pastel shadow-card ring-1 ring-ink-900/5 [backface-visibility:hidden]">
                    <span className="absolute inset-0 bg-[radial-gradient(rgb(255_255_255/0.55)_2px,transparent_2px)] [background-size:18px_18px]" />
                    <span className="relative grid size-16 place-items-center rounded-full bg-white/80 shadow-button">
                      <DomekLogo size={36} />
                    </span>
                  </span>
                  {/* Front */}
                  <span
                    className={`absolute inset-0 grid place-items-center rounded-[24px] bg-surface shadow-card [backface-visibility:hidden] [transform:rotateY(180deg)] ${isFound ? 'ring-4 ring-mint-400' : 'ring-1 ring-ink-900/5'}`}
                  >
                    <Picture id={c.pic} size="62%" />
                  </span>
                </motion.span>
              </motion.button>
            )
          })}
        </div>
        <div className="w-[300px] shrink-0" aria-hidden />
      </div>
    </div>
  )
}
