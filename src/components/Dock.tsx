import { motion } from 'motion/react'
import { apps } from '../apps/registry'
import { pl } from '../i18n/pl'
import { play } from '../lib/sound'
import { useOkienko } from '../store/useOkienko'
import { Picture } from './Picture'

/** App tile: a soft squircle in the app's own accent, used in the dock and on cards. */
export function AppIcon({ icon, size = 72 }: { icon: Parameters<typeof Picture>[0]['id']; size?: number }) {
  return (
    <span
      className="grid shrink-0 place-items-center rounded-[28%] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.7),0_2px_8px_rgb(27_34_64/0.10)]"
      style={{ width: size, height: size, background: 'linear-gradient(160deg, var(--accent-soft), var(--accent-pastel))' }}
    >
      <Picture id={icon} size={size * 0.62} />
    </span>
  )
}

export function Dock() {
  const launch = useOkienko((s) => s.launch)
  return (
    <nav aria-label="Dok" className="glass flex items-end gap-2 rounded-[30px] p-2.5">
      {apps.map((app, i) => (
        <motion.button
          key={app.id}
          type="button"
          data-app={app.accent}
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 + i * 0.06, type: 'spring', stiffness: 320, damping: 26 }}
          whileHover={{ y: -4 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            play('pop')
            launch(app.id)
          }}
          aria-label={pl.home.open(app.name)}
          className="flex w-32 flex-col items-center gap-1.5 rounded-[22px] px-2 pt-2 pb-1.5 transition-colors hover:bg-white/60"
        >
          <AppIcon icon={app.icon} size={64} />
          <span className="font-display text-base font-semibold text-ink">{app.name}</span>
        </motion.button>
      ))}
    </nav>
  )
}
