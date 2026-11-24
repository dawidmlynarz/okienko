import { DownloadSimple, UploadSimple, X } from '@phosphor-icons/react'
import { AnimatePresence, motion } from 'motion/react'
import { useMemo, useRef, useState } from 'react'
import { Button, IconButton } from '../components/Button'
import { pl } from '../i18n/pl'
import { polishVoices, speak, voiceQuality } from '../lib/speak'
import { backupFile, useDomek } from '../store/useDomek'
import { ColorPicker, Field } from './Setup'

export function BackupButtons({ importOnly = false }: { importOnly?: boolean }) {
  const importData = useDomek((s) => s.importData)
  const input = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState<string | null>(null)
  return (
    <div className="flex flex-wrap items-center gap-3">
      {!importOnly && (
        <Button
          variant="plain"
          icon={<DownloadSimple size={24} weight="bold" />}
          onClick={() => {
            const blob = new Blob([backupFile()], { type: 'application/json' })
            const a = document.createElement('a')
            a.href = URL.createObjectURL(blob)
            a.download = `smoczy-domek-kopia-${new Date().toISOString().slice(0, 10)}.json`
            a.click()
            URL.revokeObjectURL(a.href)
          }}
        >
          {pl.setup.export}
        </Button>
      )}
      <Button variant="plain" icon={<UploadSimple size={24} weight="bold" />} onClick={() => input.current?.click()}>
        {pl.setup.import}
      </Button>
      <input
        ref={input}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0]
          if (!f) return
          try {
            setMsg(importData(JSON.parse(await f.text())) ? pl.setup.importOk : pl.setup.importFail)
          } catch {
            setMsg(pl.setup.importFail)
          }
          e.target.value = ''
        }}
      />
      {msg && <span className="text-base text-muted" role="status">{msg}</span>}
    </div>
  )
}

function Gate({ onPass }: { onPass: () => void }) {
  const [a, b] = useMemo(() => [6 + Math.floor(Math.random() * 4), 6 + Math.floor(Math.random() * 4)], [])
  const [v, setV] = useState('')
  const [bad, setBad] = useState(false)
  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault()
        if (Number(v) === a * b) onPass()
        else {
          setBad(true)
          setV('')
        }
      }}
    >
      <p className="text-xl text-muted">{pl.setup.gateHint}</p>
      <label className="flex flex-col gap-2">
        <span className="font-display text-2xl font-bold">{pl.setup.gateQuestion(a, b)}</span>
        <input
          autoFocus
          inputMode="numeric"
          value={v}
          onChange={(e) => {
            setBad(false)
            setV(e.target.value.replace(/\D/g, ''))
          }}
          className={`h-16 w-40 rounded-md border-2 bg-surface px-4 text-3xl outline-none ${bad ? 'border-coral-600' : 'border-ink-200 focus:border-sky-600'}`}
        />
      </label>
      <Button type="submit" variant="strong" className="self-start">
        {pl.setup.gateGo}
      </Button>
    </form>
  )
}

function Panel() {
  const { profile, settings, updateProfile, setPin, setSettings, resetAll, setParentOpen } = useDomek()
  const [pinMsg, setPinMsg] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const voices = polishVoices()
  if (!profile) return null
  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-2 gap-6">
        <Field id="p-child" label={pl.setup.childName} value={profile.childName} onChange={(v) => updateProfile({ childName: v.replace(/[^\p{L}]/gu, '') })} />
      </div>
      <div className="flex flex-col gap-3">
        <span className="font-display text-lg font-semibold">{pl.setup.companionColor}</span>
        <ColorPicker value={profile.companionColor} onChange={(c) => updateProfile({ companionColor: c })} />
      </div>
      <div className="flex flex-col gap-3">
        <span className="font-display text-lg font-semibold">{pl.setup.voice}</span>
        {voices.length ? (
          <div className="flex items-center gap-3">
            <select
              value={settings.voiceName ?? ''}
              onChange={(e) => setSettings({ voiceName: e.target.value || null })}
              className="h-14 rounded-md border-2 border-ink-200 bg-surface px-3 text-lg"
            >
              <option value="">Automatycznie</option>
              {voices.map((v) => (
                <option key={v.name} value={v.name}>
                  {v.name} · {voiceQuality(v)}
                </option>
              ))}
            </select>
            <Button variant="plain" onClick={() => speak(`Cześć ${profile.childName}! Jestem Smoczek.`, { force: true })}>
              {pl.setup.voiceTest}
            </Button>
            <label className="flex items-center gap-2 text-lg">
              <input type="checkbox" className="size-6 accent-sky-700" checked={settings.voice} onChange={(e) => setSettings({ voice: e.target.checked })} />
              Smoczek mówi na głos
            </label>
          </div>
        ) : (
          <p className="text-lg text-muted">{pl.setup.voiceNone}</p>
        )}
        <p className="max-w-2xl text-base text-muted">{pl.setup.voiceTip}</p>
      </div>
      <div className="flex flex-col gap-3">
        <span className="font-display text-lg font-semibold">{pl.setup.keyboard}</span>
        <div className="flex gap-2" role="radiogroup" aria-label={pl.setup.keyboard}>
          {(['auto', 'mac', 'win'] as const).map((k) => {
            const on = (settings.keyboard ?? 'auto') === k
            return (
              <button
                key={k}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => setSettings({ keyboard: k })}
                className={`pressable h-12 rounded-full px-5 text-lg font-semibold ${on ? 'bg-sky-700 text-white' : 'bg-surface text-ink shadow-[inset_0_0_0_2px_var(--color-ink-200)]'}`}
              >
                {pl.setup.keyboardChoices[k]}
              </button>
            )
          })}
        </div>
        <p className="max-w-2xl text-base text-muted">{pl.setup.keyboardTip}</p>
      </div>
      <div className="flex flex-col gap-3">
        <span className="font-display text-lg font-semibold">{pl.setup.backup}</span>
        <BackupButtons />
      </div>
      <div className="flex flex-wrap items-center gap-3 border-t-2 border-ink-100 pt-6">
        <Button
          variant="plain"
          onClick={() => {
            setPin(null)
            setPinMsg(true)
          }}
        >
          {pl.setup.resetPin}
        </Button>
        <div data-app="error">
          <Button
            variant={confirmReset ? 'strong' : 'pastel'}
            onClick={() => {
              if (!confirmReset) return setConfirmReset(true)
              resetAll()
              setParentOpen(false)
            }}
          >
            {confirmReset ? pl.setup.resetAllConfirm : pl.setup.resetAll}
          </Button>
        </div>
        {pinMsg && <span className="text-base text-muted" role="status">{pl.setup.resetPinDone}</span>}
      </div>
    </div>
  )
}

export function ParentDialog() {
  const { parentOpen, setParentOpen } = useDomek()
  const [passed, setPassed] = useState(false)
  const close = () => {
    setParentOpen(false)
    setPassed(false)
  }
  return (
    <AnimatePresence>
      {parentOpen && (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center bg-ink-900/40 p-6 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onKeyDown={(e) => e.key === 'Escape' && close()}
        >
          <motion.div
            role="dialog"
            aria-modal
            aria-label={pl.setup.parentTitle}
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            className="max-h-full w-full max-w-3xl overflow-auto rounded-[32px] bg-surface p-8 shadow-float"
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-display text-3xl font-bold">{pl.setup.parentTitle}</h2>
              <IconButton label={pl.setup.close} onClick={close}>
                <X size={28} weight="bold" />
              </IconButton>
            </div>
            {passed ? <Panel /> : <Gate onPass={() => setPassed(true)} />}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
