import type { CSSProperties } from 'react'
import type { CompanionColor } from '../store/useOkienko'

export type Pose = 'idle' | 'happy' | 'cheer' | 'thinking'

/** body, belly, spikes, outline. Outline is each hue's darkest step, so the line reads on any pastel. */
export const COMPANION_COLORS: Record<CompanionColor, [string, string, string, string]> = {
  mint: ['#5ED19A', '#D3F9E3', '#91E7B9', '#1F4D3A'],
  sky: ['#5DC4FB', '#DEF2FF', '#9EDAFE', '#04374F'],
  lavender: ['#B6AAFE', '#EEECFF', '#D0CAFE', '#332C54'],
  peach: ['#FB9D66', '#FEEADF', '#FEC2A0', '#4E270D'],
  pink: ['#FE8FBC', '#FEE8EF', '#FFBAD4', '#4F2035'],
}

interface Props {
  pose?: Pose
  color?: CompanionColor
  talking?: boolean
  size?: number | string
  className?: string
  label?: string
  /** Re-trigger a one-shot pose animation by changing this key. */
  beat?: number
}

export function Smoczek({ pose = 'idle', color = 'mint', talking = false, size = 240, className = '', label = 'Smoczek', beat }: Props) {
  const [body, belly, spike, line] = COMPANION_COLORS[color]
  const style = { '--body': body, '--belly': belly, '--spike': spike, '--line': line, width: size, height: 'auto' } as CSSProperties
  return (
    <svg key={beat} className={`smok ${pose} ${talking ? 'talking' : ''} ${className}`} viewBox="0 0 240 260" role="img" aria-label={label} style={style}>
      <ellipse cx="120" cy="248" rx="70" ry="8" fill="#1B2240" opacity=".08" />
      <g className="whole">
        <g className="spark" fill="#F7DEAB" stroke="#9A7405" strokeWidth="2.5" strokeLinejoin="round">
          <path d="M30 70l5 11 11 5-11 5-5 11-5-11-11-5 11-5z" />
          <path d="M206 92l4 8 8 4-8 4-4 8-4-8-8-4 8-4z" />
          <path d="M196 26l3 6 6 3-6 3-3 6-3-6-6-3 6-3z" />
        </g>
        <g className="dots" fill="#fff" stroke="#5B6377" strokeWidth="3">
          <circle cx="186" cy="62" r="6" />
          <circle cx="202" cy="42" r="9" />
          <circle cx="222" cy="18" r="12" />
        </g>
        <g className="tail">
          <path d="M160 214C192 230 216 214 214 184" fill="none" stroke="var(--line)" strokeWidth="22" strokeLinecap="round" />
          <path d="M160 214C192 230 216 214 214 184" fill="none" stroke="var(--body)" strokeWidth="14" strokeLinecap="round" />
          <path className="ln" d="M214 160l12 16-12 14-12-14z" fill="var(--spike)" />
        </g>
        <path className="wingL ln" d="M84 158C60 122 34 128 36 156c10-4 18 2 20 10 8-4 18 0 24 8z" fill="var(--spike)" />
        <path className="wingR ln" d="M156 158c24-36 50-30 48-2-10-4-18 2-20 10-8-4-18 0-24 8z" fill="var(--spike)" />
        <g className="body">
          <ellipse className="ln" cx="96" cy="236" rx="20" ry="11" fill="var(--body)" />
          <ellipse className="ln" cx="144" cy="236" rx="20" ry="11" fill="var(--body)" />
          <ellipse className="ln" cx="120" cy="186" rx="56" ry="52" fill="var(--body)" />
          <ellipse cx="120" cy="196" rx="35" ry="36" fill="var(--belly)" />
          <path d="M98 184q22 8 44 0M96 200q24 8 48 0M100 216q20 7 40 0" fill="none" stroke="var(--line)" strokeWidth="3" strokeLinecap="round" opacity=".35" />
        </g>
        <rect className="armL ln" x="63" y="168" width="18" height="34" rx="9" fill="var(--body)" transform="rotate(18)" />
        <rect className="armR ln" x="159" y="168" width="18" height="34" rx="9" fill="var(--body)" transform="rotate(-18)" />
        <g className="head">
          <path className="ln" d="M104 52l6-16 8 14zM116 48l7-18 8 16zM128 50l8-15 6 16z" fill="var(--spike)" />
          <path className="ln" d="M82 66C70 36 76 26 94 40c2 8 2 14 0 22zM158 66c12-30 6-40-12-26-2 8-2 14 0 22z" fill="var(--horn)" />
          <ellipse className="ln" cx="120" cy="104" rx="70" ry="57" fill="var(--body)" />
          <ellipse cx="120" cy="130" rx="36" ry="21" fill="var(--belly)" />
          <circle cx="111" cy="121" r="2.6" fill="var(--line)" />
          <circle cx="129" cy="121" r="2.6" fill="var(--line)" />
          <ellipse cx="70" cy="122" rx="11" ry="7" fill="var(--cheek)" opacity=".9" />
          <ellipse cx="170" cy="122" rx="11" ry="7" fill="var(--cheek)" opacity=".9" />
          <g className="eyes">
            <g className="lid">
              <ellipse className="ln" cx="92" cy="94" rx="16" ry="19" fill="#fff" />
              <ellipse className="ln" cx="148" cy="94" rx="16" ry="19" fill="#fff" />
              <g className="pupils">
                <circle cx="94" cy="98" r="9.5" fill="#1B2240" />
                <circle cx="150" cy="98" r="9.5" fill="#1B2240" />
                <circle cx="98" cy="93" r="3.6" fill="#fff" />
                <circle cx="154" cy="93" r="3.6" fill="#fff" />
              </g>
            </g>
          </g>
          <g className="eyesHappy" fill="none" stroke="var(--line)" strokeWidth="5" strokeLinecap="round">
            <path d="M78 100q14-16 28 0" />
            <path d="M134 100q14-16 28 0" />
          </g>
          <path className="m m-idle" d="M110 137q10 8 20 0" fill="none" stroke="var(--line)" strokeWidth="4" strokeLinecap="round" />
          <g className="m m-happy">
            <path className="ln" d="M104 134q16 22 32 0z" fill="var(--mouth)" />
            <path d="M112 143q8-5 16 0q-8 7-16 0z" fill="var(--tongue)" />
          </g>
          <g className="m m-cheer">
            <path className="ln" d="M100 132q20 30 40 0z" fill="var(--mouth)" />
            <path d="M110 145q10-7 20 0q-10 9-20 0z" fill="var(--tongue)" />
          </g>
          <path className="m m-think" d="M108 139q6-4 12 0t12-1" fill="none" stroke="var(--line)" strokeWidth="4" strokeLinecap="round" />
        </g>
      </g>
    </svg>
  )
}
