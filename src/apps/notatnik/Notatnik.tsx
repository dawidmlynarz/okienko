import { FloppyDisk, Plus, SpeakerHigh, Trash } from '@phosphor-icons/react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { Button } from '../../components/Button'
import { Companion } from '../../components/Companion'
import { pl } from '../../i18n/pl'
import { readKey } from '../../keyboard/polish'
import { play } from '../../lib/sound'
import { speak, stopSpeaking } from '../../lib/speak'
import { useDomek, type Note } from '../../store/useDomek'
import { useCloseGuard } from '../AppFrame'
import type { AppProps } from '../registry'

const titleOf = (n: Pick<Note, 'body'>) => n.body.split('\n').find((l) => l.trim())?.trim().slice(0, 40) || pl.notes.untitled
const when = (t: number) => new Date(t).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long' })

export default function Notatnik(_: AppProps) {
  const { notes, saveNote, deleteNote, os } = useDomek()
  const [currentId, setCurrentId] = useState<string | null>(notes[0]?.id ?? null)
  const current = notes.find((n) => n.id === currentId) ?? null
  const [draft, setDraft] = useState(current?.body ?? '')
  const [toast, setToast] = useState(0)
  const [ask, setAsk] = useState<null | (() => void)>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const area = useRef<HTMLTextAreaElement>(null)
  const dirty = draft !== (current?.body ?? '') && draft.trim() !== ''
  const canRead = os.version !== '1.0'

  const setGuard = useCloseGuard()
  useEffect(() => {
    setGuard((proceed) => {
      if (!dirty) return false
      setAsk(() => proceed)
      return true
    })
    return () => setGuard(null)
  }, [dirty, setGuard])

  useEffect(() => {
    area.current?.focus()
  }, [currentId])

  useEffect(() => () => stopSpeaking(), [])

  const save = () => {
    if (!draft.trim()) return
    const id = saveNote(current?.id ?? null, draft)
    setCurrentId(id)
    play('save')
    setToast((t) => t + 1)
    speak(pl.notes.savedSay)
  }

  /** Switch notes, asking first if there is unsaved work. */
  const guarded = (fn: () => void) => {
    if (dirty) setAsk(() => fn)
    else fn()
  }
  const open = (n: Note | null) => {
    stopSpeaking()
    setConfirmDelete(false)
    setCurrentId(n?.id ?? null)
    setDraft(n?.body ?? '')
  }

  return (
    <div className="absolute inset-0 flex bg-surface">
      {/* Note list */}
      <aside className="flex w-80 shrink-0 flex-col gap-2 overflow-y-auto border-r border-ink-100 bg-ink-50/60 p-4">
        <Button variant="pastel" icon={<Plus size={24} weight="bold" />} onClick={() => guarded(() => open(null))}>
          {pl.notes.newNote}
        </Button>
        {notes.length === 0 && <p className="p-3 text-lg text-muted">{pl.notes.empty}</p>}
        {notes.map((n) => (
          <button
            key={n.id}
            type="button"
            onClick={() => n.id !== currentId && guarded(() => open(n))}
            className={`rounded-[16px] px-4 py-3 text-left transition-colors ${n.id === currentId ? 'bg-butter-100 text-butter-900 shadow-[inset_0_0_0_2px_var(--color-butter-300)]' : 'hover:bg-white'}`}
          >
            <span className="block truncate text-xl">{titleOf(n)}</span>
            <span className="text-base text-muted">{when(n.updatedAt)}</span>
          </button>
        ))}
      </aside>

      {/* Editor */}
      <div className="relative flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-3 border-b border-ink-100 bg-surface px-5 py-3">
          <Button variant="strong" icon={<FloppyDisk size={24} weight="bold" />} onClick={save} disabled={!dirty}>
            {pl.notes.save}
          </Button>
          {canRead && (
            <Button variant="pastel" icon={<SpeakerHigh size={24} weight="bold" />} onClick={() => speak(draft || pl.notes.empty, { force: true })} disabled={!draft.trim()}>
              {pl.notes.readAloud}
              <span className="ml-1 rounded-full bg-white px-2 py-0.5 text-sm text-butter-900">{pl.notes.newFeature}</span>
            </Button>
          )}
          <div className="flex-1" />
          <AnimatePresence>
            {toast > 0 && (
              <motion.span
                key={toast}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                onAnimationComplete={() => window.setTimeout(() => setToast(0), 1600)}
                className="rounded-full bg-mint-100 px-4 py-2 font-display text-lg font-semibold text-mint-900"
                role="status"
              >
                {pl.notes.saved}
              </motion.span>
            )}
          </AnimatePresence>
          {current && (
            <div data-app="error">
              <Button
                variant={confirmDelete ? 'strong' : 'plain'}
                icon={<Trash size={24} weight="bold" />}
                onClick={() => {
                  if (!confirmDelete) return setConfirmDelete(true)
                  deleteNote(current.id)
                  open(notes.find((n) => n.id !== current.id) ?? null)
                }}
              >
                {confirmDelete ? pl.notes.deleteConfirm : pl.notes.delete}
              </Button>
            </div>
          )}
        </div>
        <textarea
          ref={area}
          value={draft}
          placeholder={pl.notes.placeholder}
          spellCheck={false}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
              e.preventDefault()
              return save()
            }
            const k = readKey({ key: e.key, code: e.code, altKey: e.altKey, ctrlKey: e.ctrlKey, metaKey: e.metaKey, shiftKey: e.shiftKey, altGraph: e.getModifierState('AltGraph') })
            if (k?.kind === 'char') play('key')
            // A Mac on the wrong layout gives "å" for Option + A; put the Polish letter in instead.
            if (k?.kind === 'char' && k.char !== e.key && e.key.length === 1) {
              e.preventDefault()
              const el = e.currentTarget
              el.setRangeText(k.char, el.selectionStart, el.selectionEnd, 'end')
              setDraft(el.value)
            }
          }}
          className="min-h-0 flex-1 resize-none bg-transparent p-8 focus-visible:outline-none font-body text-4xl leading-[1.5] text-ink outline-none placeholder:text-ink-600"
          style={{ backgroundImage: 'repeating-linear-gradient(transparent 0 calc(1.5em - 2px), var(--color-ink-100) calc(1.5em - 2px) 1.5em)', backgroundPositionY: '2rem', backgroundAttachment: 'local' }}
        />

        {/* Unsaved work dialog */}
        <AnimatePresence>
          {ask && (
            <motion.div className="absolute inset-0 z-20 grid place-items-center bg-ink-900/30" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="flex flex-col items-center gap-5 rounded-[32px] bg-surface p-8 shadow-float" role="alertdialog" aria-label={pl.notes.unsavedTitle}>
                <Companion say={pl.notes.unsavedSay} pose="thinking" size={150} />
                <h2 className="font-display text-3xl font-bold">{pl.notes.unsavedTitle}</h2>
                <div className="flex gap-4">
                  <Button
                    variant="plain"
                    size="lg"
                    onClick={() => {
                      const next = ask
                      setAsk(null)
                      setDraft(current?.body ?? '')
                      next()
                    }}
                  >
                    {pl.notes.noDiscard}
                  </Button>
                  <Button
                    variant="strong"
                    size="lg"
                    onClick={() => {
                      const next = ask
                      saveNote(current?.id ?? null, draft)
                      play('save')
                      setAsk(null)
                      next()
                    }}
                  >
                    {pl.notes.yesSave}
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
