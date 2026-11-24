import type { Wallpaper as W } from '../store/useOkienko'

/** Sky wallpaper with soft clouds and hills. Flat shapes, token colours only. */
export function Wallpaper({ kind = 'day' }: { kind?: W }) {
  const sunset = kind === 'sunset'
  return (
    <div className={`absolute inset-0 overflow-hidden ${sunset ? 'sky-sunset' : 'sky-day'}`} aria-hidden>
      <svg className="absolute inset-0 size-full" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMax slice">
        {/* sun */}
        <circle cx={sunset ? 1130 : 1180} cy={sunset ? 560 : 170} r={sunset ? 110 : 70} fill={sunset ? 'var(--color-peach-300)' : 'var(--color-butter-200)'} opacity={sunset ? 0.9 : 1} />
        {/* clouds */}
        <g fill="#fff" opacity={sunset ? 0.7 : 0.95} className="clouds">
          <g className="cloud-a">
            <ellipse cx="260" cy="190" rx="110" ry="40" />
            <ellipse cx="220" cy="165" rx="55" ry="45" />
            <ellipse cx="300" cy="160" rx="65" ry="55" />
          </g>
          <g className="cloud-b">
            <ellipse cx="900" cy="120" rx="90" ry="32" />
            <ellipse cx="870" cy="100" rx="45" ry="36" />
            <ellipse cx="930" cy="95" rx="55" ry="45" />
          </g>
          <g className="cloud-c">
            <ellipse cx="620" cy="300" rx="70" ry="24" />
            <ellipse cx="600" cy="285" rx="34" ry="28" />
            <ellipse cx="645" cy="280" rx="40" ry="32" />
          </g>
        </g>
        {/* hills */}
        <path d="M0 760 Q 260 640 540 720 T 1060 700 T 1440 690 V 900 H 0 Z" fill={sunset ? 'var(--color-lavender-200)' : 'var(--color-mint-200)'} />
        <path d="M0 820 Q 360 720 760 800 T 1440 780 V 900 H 0 Z" fill={sunset ? 'var(--color-lavender-300)' : 'var(--color-mint-300)'} />
      </svg>
    </div>
  )
}
