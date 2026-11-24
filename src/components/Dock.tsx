import { motion } from 'motion/react'
import type { CSSProperties } from 'react'
import { apps } from '../apps/registry'
import { pl } from '../i18n/pl'
import { play } from '../lib/sound'
import { useOkienko } from '../store/useOkienko'
import { Picture } from './Picture'

export function Dock() {
  const launch = useOkienko((s) => s.launch)
  return (
    <nav aria-label="Dok" className="flex items-end gap-4 rounded-xl bg-surface/85 px-5 pt-4 pb-3 shadow-float backdrop-blur">
      {apps.map((app, i) => (
        <motion.button
          key={app.id}
          type="button"
          data-app={app.accent}
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 + i * 0.08, type: 'spring', stiffness: 300, damping: 22 }}
          whileHover={{ y: -6 }}
          onClick={() => {
            play('pop')
            launch(app.id)
          }}
          aria-label={pl.home.open(app.name)}
          className="group flex w-36 flex-col items-center gap-2 rounded-lg focus-visible:outline-offset-8"
        >
          <span
            className="pressable grid place-items-center rounded-lg bg-accent-pastel"
            style={{ width: 'var(--dock-icon)', height: 'var(--dock-icon)', '--edge': 'var(--accent-edge)' } as CSSProperties}
          >
            <Picture id={app.icon} size={52} />
          </span>
          <span className="font-display text-lg font-semibold text-ink">{app.name}</span>
        </motion.button>
      ))}
    </nav>
  )
}
