import { SignOut, SpeakerHigh, SpeakerSlash, Star, Sun, SunHorizon } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { pl } from '../i18n/pl'
import { play } from '../lib/sound'
import { stopSpeaking } from '../lib/speak'
import { starsToday, useOkienko } from '../store/useOkienko'
import { IconButton } from './Button'
import { COMPANION_COLORS } from './Smoczek'

export function useNow() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 10_000)
    return () => window.clearInterval(t)
  }, [])
  return now
}
export const timeText = (d: Date) => d.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })

export function TopBar() {
  const clock = timeText(useNow())
  const { profile, progress, os, settings, toggleSound, logout, setSettings } = useOkienko()
  const today = starsToday(progress)

  return (
    <header className="glass relative z-10 mx-4 mt-4 flex items-center gap-2 rounded-xl px-3" style={{ height: 'var(--topbar-height)' }}>
      <div className="flex items-center gap-3 pl-1">
        <OkienkoLogo />
        <span className="font-display text-lg font-bold tracking-tight">Okienko</span>
        <span className="rounded-full bg-sky-100 px-2.5 py-0.5 font-display text-sm font-semibold text-sky-800">{os.version}</span>
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-1.5 rounded-full bg-butter-100 py-1 pr-3.5 pl-2 font-display text-lg font-semibold text-butter-900" title={pl.os.starsToday(today)}>
        <Star size={22} weight="fill" className="text-butter-600" />
        {progress.stars}
      </div>

      {profile && (
        <div className="flex items-center gap-2 rounded-full py-1 pr-3 pl-1">
          <span className="size-8 rounded-full ring-2 ring-white" style={{ background: COMPANION_COLORS[profile.companionColor][0] }} />
          <span className="font-display text-lg font-semibold">{profile.childName}</span>
        </div>
      )}

      <span className="px-2 font-display text-lg font-semibold tabular-nums">{clock}</span>

      <div className="flex items-center">
        {os.version !== '1.0' && (
          <IconButton
            label={settings.wallpaper === 'day' ? 'Zachód słońca' : 'Dzień'}
            onClick={() => setSettings({ wallpaper: settings.wallpaper === 'day' ? 'sunset' : 'day' })}
          >
            {settings.wallpaper === 'day' ? <SunHorizon size={26} weight="bold" /> : <Sun size={26} weight="bold" />}
          </IconButton>
        )}
        <IconButton
          label={settings.sound ? pl.os.soundOn : pl.os.soundOff}
          onClick={() => {
            if (settings.sound) stopSpeaking()
            toggleSound()
          }}
        >
          {settings.sound ? <SpeakerHigh size={26} weight="bold" /> : <SpeakerSlash size={26} weight="bold" />}
        </IconButton>
        <IconButton
          label={pl.os.logout}
          onClick={() => {
            stopSpeaking()
            play('whoosh')
            logout()
          }}
        >
          <SignOut size={26} weight="bold" />
        </IconButton>
      </div>
    </header>
  )
}

/** Four soft panes: the Okienko mark. */
export function OkienkoLogo({ size = 32 }: { size?: number }) {
  const c = ['var(--color-sky-400)', 'var(--color-mint-400)', 'var(--color-pink-400)', 'var(--color-butter-400)']
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden>
      <rect x="2" y="2" width="9.5" height="9.5" rx="3" fill={c[0]} />
      <rect x="12.5" y="2" width="9.5" height="9.5" rx="3" fill={c[1]} />
      <rect x="2" y="12.5" width="9.5" height="9.5" rx="3" fill={c[2]} />
      <rect x="12.5" y="12.5" width="9.5" height="9.5" rx="3" fill={c[3]} />
    </svg>
  )
}
