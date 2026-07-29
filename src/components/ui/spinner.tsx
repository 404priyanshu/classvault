'use client'

import { useId, type ComponentProps } from 'react'
import { cn } from '@/lib/utils'

type SpinnerProps = Omit<ComponentProps<'span'>, 'children'> & {
  decorative?: boolean
  label?: string
  size?: number
}

function Spinner({
  className,
  decorative = false,
  label = 'Loading',
  size = 24,
  style,
  ...props
}: SpinnerProps) {
  const clipPathId = `pencil-eraser-${useId().replaceAll(':', '')}`

  return (
    <span
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : label}
      className={cn('pencil-spinner shrink-0', className)}
      role={decorative ? undefined : 'status'}
      style={{ height: size, width: size, ...style }}
      {...props}
    >
      <svg
        aria-hidden
        className="pencil-loader"
        height="200"
        style={{ transform: `scale(${size / 200})` }}
        viewBox="0 0 200 200"
        width="200"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <clipPath id={clipPathId}>
            <rect height="30" rx="5" ry="5" width="30" />
          </clipPath>
        </defs>

        <circle
          className="pencil-loader__stroke"
          fill="none"
          r="70"
          stroke="currentColor"
          strokeDasharray="439.82 439.82"
          strokeDashoffset="439.82"
          strokeLinecap="round"
          strokeWidth="2"
          transform="rotate(-113,100,100)"
        />

        <g className="pencil-loader__rotate" transform="translate(100,100)">
          <g fill="none">
            <circle
              className="pencil-loader__body-1"
              r="64"
              stroke="#f0a202"
              strokeDasharray="402.12 402.12"
              strokeDashoffset="402"
              strokeWidth="30"
              transform="rotate(-90)"
            />
            <circle
              className="pencil-loader__body-2"
              r="74"
              stroke="#f7c65d"
              strokeDasharray="464.96 464.96"
              strokeDashoffset="465"
              strokeWidth="10"
              transform="rotate(-90)"
            />
            <circle
              className="pencil-loader__body-3"
              r="54"
              stroke="#c97900"
              strokeDasharray="339.29 339.29"
              strokeDashoffset="339"
              strokeWidth="10"
              transform="rotate(-90)"
            />
          </g>

          <g
            className="pencil-loader__eraser"
            transform="rotate(-90) translate(49,0)"
          >
            <g className="pencil-loader__eraser-skew">
              <rect fill="#e88373" height="30" rx="5" ry="5" width="30" />
              <rect
                clipPath={`url(#${clipPathId})`}
                fill="#c95142"
                height="30"
                width="5"
              />
              <rect fill="#ebe4d6" height="20" width="30" />
              <rect fill="#a79f90" height="20" width="15" />
              <rect fill="#c9c1b2" height="20" width="5" />
              <rect fill="rgba(23,21,18,0.2)" height="2" width="30" y="6" />
              <rect fill="rgba(23,21,18,0.2)" height="2" width="30" y="13" />
            </g>
          </g>

          <g
            className="pencil-loader__point"
            transform="rotate(-90) translate(49,-30)"
          >
            <polygon fill="#e8ba72" points="15 0,30 30,0 30" />
            <polygon fill="#cb8737" points="15 0,6 30,0 30" />
            <polygon fill="#171512" points="15 0,20 10,10 10" />
          </g>
        </g>
      </svg>
    </span>
  )
}

export { Spinner }
