import { motion } from 'motion/react'
import { useState } from 'react'
import { COMPANION_COLORS, Smoczek } from '../components/Smoczek'
import { Button } from '../components/Button'
import { pl } from '../i18n/pl'
import { unlockAudio } from '../lib/sound'
import { requestPersistentStorage } from '../store/storage'
import { COMPANION_NAME, useDomek, type CompanionColor } from '../store/useDomek'
import { BackupButtons } from './Parent'

export function ColorPicker({ value, onChange }: { value: CompanionColor; onChange: (c: CompanionColor) => void }) {
  return (
    <div role="radiogroup" aria-label={pl.setup.companionColor} className="flex gap-4">
      {(Object.keys(COMPANION_COLORS) as CompanionColor[]).map((c) => (
        <button
          key={c}
          type="button"
          role="radio"
          aria-checked={value === c}
          aria-label={pl.setup.colors[c]}
          title={pl.setup.colors[c]}
          onClick={() => onChange(c)}
          className={`size-14 rounded-full border-4 border-white transition-shadow ${value === c ? 'shadow-[0_0_0_4px_var(--color-ink-900)]' : 'shadow-[0_0_0_2px_var(--color-ink-300)]'}`}
          style={{ background: COMPANION_COLORS[c][0] }}
        />
      ))}
    </div>
  )
}

export function Field({ label, hint, value, onChange, id }: { label: string; hint?: string; value: string; onChange: (v: string) => void; id: string }) {
  return (
    <label htmlFor={id} className="flex flex-col gap-2">
      <span className="font-display text-lg font-semibold">{label}</span>
      <input
        id={id}
        value={value}
        maxLength={12}
        onChange={(e) => onChange(e.target.value)}
        className="h-14 rounded-[14px] border-2 border-ink-200 bg-surface px-4 text-2xl outline-none transition-shadow focus:border-sky-600 focus:shadow-[0_0_0_4px_var(--color-sky-100)]"
        autoComplete="off"
        spellCheck={false}
      />
      {hint && <span className="text-base text-muted">{hint}</span>}
    </label>
  )
}

export function Setup() {
  const completeSetup = useDomek((s) => s.completeSetup)
  const [childName, setChildName] = useState('')
  const [color, setColor] = useState<CompanionColor>('mint')
  // Names are typed letter by letter on login, so keep letters only.
  const clean = (s: string) => s.replace(/[^\p{L}]/gu, '')
  const ok = clean(childName).length >= 2

  return (
    <div className="relative z-10 flex flex-1 items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-strong flex w-full max-w-4xl gap-10 rounded-[32px] p-10"
      >
        <div className="flex w-64 flex-col items-center justify-center">
          <Smoczek pose="happy" color={color} size={240} />
          <p className="mt-3 font-display text-2xl font-extrabold text-ink">{pl.setup.meet}</p>
        </div>
        <form
          className="flex min-w-0 flex-1 flex-col gap-6"
          onSubmit={(e) => {
            e.preventDefault()
            if (!ok) return
            unlockAudio()
            void requestPersistentStorage()
            const n = clean(childName)
            completeSetup({ childName: n[0].toLocaleUpperCase('pl') + n.slice(1), companionName: COMPANION_NAME, companionColor: color })
          }}
        >
          <div>
            <h1 className="font-display text-4xl font-bold">{pl.setup.title}</h1>
            <p className="mt-2 text-xl text-muted">{pl.setup.lead}</p>
          </div>
          <Field id="child" label={pl.setup.childName} hint={pl.setup.childNameHint} value={childName} onChange={setChildName} />
          <div className="flex flex-col gap-3">
            <span className="font-display text-lg font-semibold">{pl.setup.companionColor}</span>
            <ColorPicker value={color} onChange={setColor} />
          </div>
          <div className="mt-2 flex flex-col gap-3">
            <Button type="submit" variant="strong" size="lg" disabled={!ok} className="w-full">
              {pl.setup.start}
            </Button>
            <div className="flex justify-center">
              <BackupButtons importOnly />
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
