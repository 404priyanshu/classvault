'use client'

import { useId } from 'react'
import styles from './Journey.module.css'

export type PencilMood =
  'welcome' | 'thinking' | 'acknowledge' | 'help' | 'celebrate'

/** One original vector character, sharing the loader's golden barrel and graphite. */
export function PencilGuide({ mood = 'welcome' }: { mood?: PencilMood }) {
  const id = useId().replaceAll(':', '')
  return (
    <svg
      aria-hidden="true"
      className={styles.pencil}
      data-mood={mood}
      viewBox="0 0 300 400"
      fill="none"
    >
      <defs>
        <linearGradient
          id={`${id}-gold`}
          x1="100"
          y1="0"
          x2="210"
          y2="20"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#ffec9a" />
          <stop offset=".36" stopColor="#ffda61" />
          <stop offset=".7" stopColor="#ffc03d" />
          <stop offset="1" stopColor="#dd921c" />
        </linearGradient>
        <linearGradient
          id={`${id}-eraser`}
          x1="109"
          y1="25"
          x2="193"
          y2="90"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#e9cbff" />
          <stop offset=".48" stopColor="#b782ed" />
          <stop offset="1" stopColor="#8050bc" />
        </linearGradient>
        <linearGradient
          id={`${id}-metal`}
          x1="105"
          y1="80"
          x2="195"
          y2="100"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#e9e4f6" />
          <stop offset=".3" stopColor="#fff" />
          <stop offset=".6" stopColor="#cbc3df" />
          <stop offset="1" stopColor="#9184ad" />
        </linearGradient>
        <linearGradient
          id={`${id}-wood`}
          x1="110"
          y1="290"
          x2="180"
          y2="350"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#fff0d2" />
          <stop offset="1" stopColor="#dba972" />
        </linearGradient>
        <linearGradient
          id={`${id}-lead`}
          x1="140"
          y1="344"
          x2="165"
          y2="370"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#68617b" />
          <stop offset="1" stopColor="#202044" />
        </linearGradient>
      </defs>
      <g className={styles.pencilBody}>
        <path
          className={styles.leftArm}
          d="M110 219C78 229 70 209 72 189"
          stroke="#332950"
          strokeWidth="10"
          strokeLinecap="round"
        />
        <path
          className={styles.rightArm}
          d="M190 224C222 236 235 218 236 202"
          stroke="#332950"
          strokeWidth="10"
          strokeLinecap="round"
        />
        <path
          d="M107 91V57Q107 32 132 32H168Q193 32 193 57V91Z"
          fill={`url(#${id}-eraser)`}
          stroke="#ead2ff"
          strokeWidth="1.5"
        />
        <path
          d="M115 60Q115 42 133 42H164"
          stroke="white"
          strokeOpacity=".4"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path d="M107 107H193V292L150 368L107 292Z" fill={`url(#${id}-wood)`} />
        <path
          d="M119 294L148 353M132 299L151 349M175 296L157 347"
          stroke="#b98350"
          strokeOpacity=".25"
          strokeWidth="1.5"
        />
        <path
          d="M107 111H193V289Q186 299 179 291L164 286L150 293L135 284L120 293Q112 296 107 287Z"
          fill={`url(#${id}-gold)`}
        />
        <path
          d="M118 113H136V284L120 293L118 291Z"
          fill="#fff0a0"
          fillOpacity=".48"
        />
        <path
          d="M176 112H192V288Q184 299 179 291L174 289Z"
          fill="#c48012"
          fillOpacity=".18"
        />
        <rect
          x="103"
          y="79"
          width="94"
          height="37"
          rx="7"
          fill={`url(#${id}-metal)`}
          stroke="#ede7f7"
          strokeWidth="1.5"
        />
        <path
          d="M105 90H195M105 105H195"
          stroke="#9184ad"
          strokeOpacity=".55"
          strokeWidth="2"
        />
        <path
          d="M139 348L150 370Q152 374 155 369L167 346Q153 342 139 348Z"
          fill={`url(#${id}-lead)`}
        />
        <g className={styles.face}>
          <ellipse cx="132" cy="185" rx="5.5" ry="9" fill="#29243e" />
          <ellipse cx="173" cy="185" rx="5.5" ry="9" fill="#29243e" />
          <ellipse cx="130.5" cy="182" rx="1.5" ry="2.3" fill="white" />
          <ellipse cx="171.5" cy="182" rx="1.5" ry="2.3" fill="white" />
          {mood === 'help' ? (
            <path
              d="M143 209Q153 202 163 209M124 167L137 171"
              stroke="#29243e"
              strokeWidth="4"
              strokeLinecap="round"
            />
          ) : mood === 'thinking' ? (
            <path
              d="M147 211H158M166 167L179 164"
              stroke="#29243e"
              strokeWidth="4"
              strokeLinecap="round"
            />
          ) : (
            <path
              d="M141 204Q152 223 164 204"
              stroke="#29243e"
              strokeWidth="5"
              strokeLinecap="round"
            />
          )}
          <ellipse
            cx="122"
            cy="201"
            rx="7"
            ry="4"
            fill="#ef946d"
            fillOpacity=".5"
          />
          <ellipse
            cx="183"
            cy="201"
            rx="7"
            ry="4"
            fill="#ef946d"
            fillOpacity=".5"
          />
        </g>
        <g
          className={styles.sparkles}
          stroke="#fff4b3"
          strokeWidth="4"
          strokeLinecap="round"
        >
          <path d="M58 130V144M51 137H65M238 100V120M228 110H248M225 295V309M218 302H232" />
        </g>
      </g>
    </svg>
  )
}
