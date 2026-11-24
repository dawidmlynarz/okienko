import { SignOut, SpeakerHigh, SpeakerSlash, Star, Sun, SunHorizon } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { pl } from '../i18n/pl'
import { play } from '../lib/sound'
import { stopSpeaking } from '../lib/speak'
import { starsToday, useDomek } from '../store/useDomek'
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
  const { profile, progress, os, settings, toggleSound, logout, setSettings } = useDomek()
  const today = starsToday(progress)

  return (
    <header className="glass relative z-10 mx-4 mt-4 flex items-center gap-2 rounded-full pr-2 pl-3" style={{ height: 'var(--topbar-height)' }}>
      <div className="flex items-center gap-2.5 pl-1">
        <DomekLogo size={34} />
        <span className="font-display text-xl font-extrabold tracking-tight">{pl.os.name}</span>
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-1.5 rounded-full bg-butter-100 py-1 pr-3.5 pl-2 font-display text-lg font-bold text-butter-900 tabular-nums" title={pl.os.starsToday(today)}>
        <Star size={22} weight="fill" className="text-butter-600" />
        {progress.stars}
      </div>

      {profile && (
        <div className="flex items-center gap-2 rounded-full py-1 pr-3 pl-1">
          <span className="grid size-9 place-items-center rounded-full font-display text-base font-bold ring-2 ring-white" style={{ background: COMPANION_COLORS[profile.companionColor][1], color: COMPANION_COLORS[profile.companionColor][3] }}>
            {profile.childName.slice(0, 1)}
          </span>
          <span className="font-display text-lg font-semibold">{profile.childName}</span>
        </div>
      )}

      <span className="px-2 font-display text-lg font-semibold tabular-nums">{clock}</span>

      <div className="flex items-center">
        {os.version !== '1.0' && (
          <IconButton label={settings.wallpaper === 'day' ? 'Zachód słońca' : 'Dzień'} onClick={() => setSettings({ wallpaper: settings.wallpaper === 'day' ? 'sunset' : 'day' })}>
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

/** The Smoczy Domek mark: a little house whose window keeps the four soft panes. */
export function DomekLogo({ size = 32 }: { size?: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden>
      <path d="M5 14.5 16 5l11 9.5V25a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3z" fill="var(--color-sky-400)" />
      <path d="M3 15.5 16 4.5l13 11" fill="none" stroke="var(--color-peach-500)" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="10" y="13" width="5.4" height="5.4" rx="1.6" fill="var(--color-mint-200)" />
      <rect x="16.6" y="13" width="5.4" height="5.4" rx="1.6" fill="var(--color-pink-200)" />
      <rect x="10" y="19.6" width="5.4" height="5.4" rx="1.6" fill="var(--color-butter-200)" />
      <rect x="16.6" y="19.6" width="5.4" height="5.4" rx="1.6" fill="var(--color-lavender-100)" />
    </svg>
  )
}
