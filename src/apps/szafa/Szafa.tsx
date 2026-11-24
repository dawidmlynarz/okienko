import { Check, Star } from '@phosphor-icons/react'
import { AnimatePresence, motion } from 'motion/react'
import { useMemo, useState } from 'react'
import { ChatBubble } from '../../components/ChatBubble'
import { ParentHint } from '../../components/ParentHint'
import { Smoczek, type Pose } from '../../components/Smoczek'
import { useTalk } from '../../components/Companion'
import { pl } from '../../i18n/pl'
import { celebrate } from '../../lib/confetti'
import { play } from '../../lib/sound'
import { useDomek } from '../../store/useDomek'
import { GadgetPicture } from '../../wardrobe/GadgetArt'
import { GADGETS, SLOTS, balanceOf, gadgetById, type Outfit, type Slot } from '../../wardrobe/items'
import type { AppProps } from '../registry'

/** The gadget that stands for each shelf on its tab. */
const TAB_ICON: Record<Slot, string> = { head: 'czapka', eyes: 'okulary', neck: 'muszka', extra: 'balonik' }

interface Line {
  text: string
  say?: string
  pose: Pose
  key: number
}

/**
 * Smoczek's changing room. Tap a gadget to try it on, buy it with stars,
 * then put it on or take it off as often as she likes.
 */
export default function Szafa(_: AppProps) {
  const { profile, progress, wardrobe, buyGadget, toggleGadget } = useDomek()
  const wallet = balanceOf(progress)
  const [tab, setTab] = useState<Slot>('head')
  const [picked, setPicked] = useState<string | null>(null)
  const [line, setLine] = useState<Line>({ text: pl.wardrobe.lead, say: pl.wardrobe.hello, pose: 'happy', key: 0 })
  const say = (text: string, pose: Pose = 'happy', spoken?: string) => setLine((l) => ({ text, say: spoken, pose, key: l.key + 1 }))
  const { talking, repeat } = useTalk(line.say ?? line.text, line.key)

  const item = gadgetById(picked)
  const owned = !!item && wardrobe.owned.includes(item.id)
  const worn = !!item && wardrobe.worn[item.slot] === item.id
  const short = item && !owned ? Math.max(0, item.price - wallet) : 0

  // Try-on: whatever is picked goes on top of what he already wears.
  const preview: Outfit = useMemo(() => (item ? { ...wardrobe.worn, [item.slot]: item.id } : wardrobe.worn), [item, wardrobe.worn])

  const pick = (id: string) => {
    const g = gadgetById(id)!
    play('pop')
    setPicked(id)
    const have = wardrobe.owned.includes(id)
    if (!have && g.price > wallet) say(g.name, 'thinking', pl.wardrobe.tooExpensive(g.name, g.price - wallet))
    else say(g.name, 'happy', pl.wardrobe.tryOn(g.name))
  }

  const act = () => {
    if (!item) return
    if (!owned) {
      const r = buyGadget(item.id)
      if (r.ok) {
        play('fanfare')
        celebrate()
        say(pl.wardrobe.bought(item.name).split('!')[0] + '!', 'cheer', pl.wardrobe.bought(item.name))
      }
      return
    }
    play('click')
    toggleGadget(item.id)
    if (worn) {
      setPicked(null)
      say(pl.wardrobe.offSay, 'idle')
    } else say(pl.wardrobe.wearSay[Math.floor(Math.random() * pl.wardrobe.wearSay.length)], 'happy')
  }

  const shelf = GADGETS.filter((g) => g.slot === tab)

  return (
    <div className="grid h-full min-h-0 grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] gap-5 p-5">
      {/* Stage */}
      <section className="tile relative flex min-h-0 flex-col items-center justify-between overflow-hidden rounded-[32px] px-6 pt-5 pb-6">
        <div className="dots-bg pointer-events-none absolute inset-0 opacity-60" aria-hidden />
        <div className="pointer-events-none absolute inset-x-10 bottom-16 h-28 rounded-[50%] bg-white/70 blur-xl" aria-hidden />
        <div className="relative flex w-full items-start justify-between">
          <Wallet n={wallet} />
          <ParentHint text={pl.parentHint.wardrobe} />
        </div>

        <div className="relative flex min-h-0 flex-1 flex-col items-center justify-end gap-2">
          <div className="min-h-[60px]">
            <AnimatePresence mode="popLayout">
              <ChatBubble key={line.key} text={line.text} onRepeat={repeat} tail="bottom" />
            </AnimatePresence>
          </div>
          <Smoczek pose={line.pose} beat={line.key} talking={talking && line.pose !== 'thinking'} color={profile?.companionColor} outfit={preview} size="min(300px, 40vh)" />
        </div>

        <div className="relative flex h-16 items-center">
          {item && (
            <motion.button
              key={`${item.id}-${owned}-${worn}`}
              type="button"
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={short ? () => say(item.name, 'thinking', pl.wardrobe.tooExpensive(item.name, short)) : act}
              aria-disabled={short > 0}
              className={`pressable flex h-16 items-center gap-2.5 rounded-full px-8 font-display text-2xl font-bold shadow-button ${
                short ? 'bg-ink-100 text-ink-700' : owned && worn ? 'bg-white text-accent-deep' : 'bg-accent-strong text-white'
              }`}
            >
              {!owned && <Star size={28} weight="fill" className={short ? 'text-ink-400' : 'text-butter-300'} />}
              {short ? pl.wardrobe.missing(short) : !owned ? `${pl.wardrobe.buy} · ${item.price}` : worn ? pl.wardrobe.takeOff : pl.wardrobe.wear}
            </motion.button>
          )}
        </div>
      </section>

      {/* Shelves */}
      <section className="card flex min-h-0 flex-col gap-4 rounded-[32px] p-5">
        <div className="grid grid-cols-4 gap-2" role="tablist" aria-label={pl.apps.wardrobe}>
          {SLOTS.map((s) => {
            const on = s === tab
            return (
              <button
                key={s}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => {
                  play('click')
                  setTab(s)
                }}
                className={`pressable flex h-[min(76px,10vh)] items-center justify-center gap-2 rounded-[22px] px-2 font-display text-lg font-bold ${
                  on ? 'bg-accent-soft text-accent-deep shadow-[inset_0_0_0_3px_var(--accent-edge)]' : 'bg-ink-50 text-ink-700 hover:bg-ink-100'
                }`}
              >
                <GadgetPicture id={TAB_ICON[s]} size="min(44px, 6vh)" />
                <span className="truncate">{pl.wardrobe.tabs[s]}</span>
              </button>
            )
          })}
        </div>

        <div className="grid min-h-0 flex-1 auto-rows-fr grid-cols-2 gap-4 overflow-y-auto p-1" role="tabpanel">
          {shelf.map((g, i) => {
            const have = wardrobe.owned.includes(g.id)
            const on = wardrobe.worn[g.slot] === g.id
            const afford = !have && g.price <= wallet
            const sel = picked === g.id
            return (
              <motion.button
                key={g.id}
                type="button"
                initial={{ y: 16, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: i * 0.04, type: 'spring', stiffness: 320, damping: 26 }}
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => pick(g.id)}
                aria-label={g.name}
                aria-pressed={sel}
                className={`relative flex min-h-[150px] flex-col items-center justify-between gap-2 rounded-[26px] p-4 transition-shadow ${
                  sel ? 'bg-accent-soft shadow-[inset_0_0_0_4px_var(--accent-edge)]' : 'bg-surface shadow-[inset_0_0_0_1.5px_var(--color-ink-100),0_2px_6px_rgb(27_34_64/0.06)]'
                }`}
              >
                <span className="grid min-h-0 flex-1 place-items-center">
                  <GadgetPicture id={g.id} size="min(130px, 16vh)" />
                </span>
                {have ? (
                  <span className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 font-display text-lg font-bold ${on ? 'bg-mint-700 text-white' : 'bg-mint-100 text-mint-900'}`}>
                    <Check size={20} weight="bold" />
                    {on ? pl.wardrobe.worn : pl.wardrobe.owned}
                  </span>
                ) : (
                  <span
                    className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 font-display text-xl font-extrabold tabular-nums ${afford ? 'bg-butter-100 text-butter-900' : 'bg-ink-50 text-ink-700'}`}
                  >
                    <Star size={22} weight="fill" className={afford ? 'text-butter-500' : 'text-ink-300'} />
                    {g.price}
                  </span>
                )}
              </motion.button>
            )
          })}
        </div>
      </section>
    </div>
  )
}

function Wallet({ n }: { n: number }) {
  return (
    <span className="flex items-center gap-2 rounded-[22px] bg-white/85 py-2 pr-5 pl-3 shadow-button" aria-label={pl.os.wallet(n)} title={pl.os.wallet(n)}>
      <Star size={34} weight="fill" className="text-butter-500 drop-shadow-[0_1px_0_var(--color-butter-700)]" />
      <motion.span key={n} initial={{ scale: 1.4 }} animate={{ scale: 1 }} className="font-display text-4xl leading-none font-extrabold text-butter-900 tabular-nums">
        {n}
      </motion.span>
    </span>
  )
}
