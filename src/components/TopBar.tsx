import { SignOut, SpeakerHigh, SpeakerSlash, Star, Sun, SunHorizon } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { pl } from '../i18n/pl'
import { play } from '../lib/sound'
import { stopSpeaking } from '../lib/speak'
import { starsToday, useOkienko } from '../store/useOkienko'
import { IconButton } from './Button'
import { COMPANION_COLORS } from './Smoczek'

function useClock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 10_000)
    return () => window.clearInterval(t)
  }, [])
  return now.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })
}

export function TopBar() {
  const clock = useClock()
  const { profile, progress, os, settings, toggleSound, logout, setSettings } = useOkienko()
  const today = starsToday(progress)

  return (
    <header
      className="relative z-10 mx-3 mt-3 flex items-center gap-3 rounded-lg bg-surface/90 px-3 shadow-card backdrop-blur"
      style={{ height: 'var(--topbar-height)' }}
    >
      <div className="flex items-center gap-3 pl-2">
        <span className="grid size-10 place-items-center rounded-md bg-sky-300">
          <svg viewBox="0 0 24 24" className="size-6" aria-hidden>
            <rect x="3" y="3" width="8" height="8" rx="2" fill="var(--color-sky-800)" />
            <rect x="13" y="3" width="8" height="8" rx="2" fill="var(--color-sky-800)" />
            <rect x="3" y="13" width="8" height="8" rx="2" fill="var(--color-sky-800)" />
            <rect x="13" y="13" width="8" height="8" rx="2" fill="var(--color-sky-800)" />
          </svg>
        </span>
        <span className="rounded-full bg-sky-100 px-4 py-1.5 font-display text-lg font-semibold text-sky-900">{pl.os.version(os.version)}</span>
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-2 rounded-full bg-butter-100 px-4 py-1.5 font-display text-lg font-semibold text-butter-900" title={pl.os.starsToday(today)}>
        <Star size={24} weight="fill" className="text-butter-600" />
        {progress.stars}
      </div>

      {profile && (
        <div className="flex items-center gap-2 pr-1">
          <span className="size-8 rounded-full border-4 border-white shadow-[0_0_0_2px_var(--color-ink-300)]" style={{ background: COMPANION_COLORS[profile.companionColor][0] }} />
          <span className="font-display text-xl font-semibold">{profile.childName}</span>
        </div>
      )}

      <span className="min-w-20 text-center font-display text-2xl font-semibold tabular-nums">{clock}</span>

      {os.version !== '1.0' && (
        <IconButton
          label={settings.wallpaper === 'day' ? 'Zachód słońca' : 'Dzień'}
          onClick={() => setSettings({ wallpaper: settings.wallpaper === 'day' ? 'sunset' : 'day' })}
        >
          {settings.wallpaper === 'day' ? <SunHorizon size={28} weight="bold" /> : <Sun size={28} weight="bold" />}
        </IconButton>
      )}
      <IconButton
        label={settings.sound ? pl.os.soundOn : pl.os.soundOff}
        onClick={() => {
          if (settings.sound) stopSpeaking()
          toggleSound()
        }}
      >
        {settings.sound ? <SpeakerHigh size={28} weight="bold" /> : <SpeakerSlash size={28} weight="bold" />}
      </IconButton>
      <IconButton
        label={pl.os.logout}
        onClick={() => {
          stopSpeaking()
          play('whoosh')
          logout()
        }}
      >
        <SignOut size={28} weight="bold" />
      </IconButton>
    </header>
  )
}
