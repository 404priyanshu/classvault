'use client'

import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface ShinyButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  children: ReactNode
}

export function ShinyButton({
  children,
  className = '',
  type = 'button',
  ...props
}: ShinyButtonProps) {
  return (
    <>
      <style jsx>{`
        @property --gradient-angle {
          syntax: '<angle>';
          initial-value: 0deg;
          inherits: false;
        }

        @property --gradient-angle-offset {
          syntax: '<angle>';
          initial-value: 0deg;
          inherits: false;
        }

        @property --gradient-percent {
          syntax: '<percentage>';
          initial-value: 5%;
          inherits: false;
        }

        @property --gradient-shine {
          syntax: '<color>';
          initial-value: white;
          inherits: false;
        }

        .shiny-cta {
          --shiny-cta-bg: #171512;
          --shiny-cta-bg-subtle: #312d29;
          --shiny-cta-fg: #f6f1e5;
          --shiny-cta-highlight: #f0a202;
          --shiny-cta-highlight-subtle: #ffe0a0;
          --animation: gradient-angle linear infinite;
          --duration: 3s;
          --shadow-size: 2px;
          --transition: 800ms cubic-bezier(0.25, 1, 0.5, 1);

          isolation: isolate;
          position: relative;
          overflow: hidden;
          cursor: pointer;
          outline-offset: 4px;
          padding: 1.1rem 2rem;
          font-family: var(--font-inter), system-ui, sans-serif;
          font-size: 1rem;
          line-height: 1.2;
          font-weight: 700;
          border: 1.5px solid transparent;
          border-radius: 9999px;
          color: var(--shiny-cta-fg);
          background:
            linear-gradient(var(--shiny-cta-bg), var(--shiny-cta-bg)) padding-box,
            conic-gradient(
                from calc(var(--gradient-angle) - var(--gradient-angle-offset)),
                transparent,
                var(--shiny-cta-highlight) var(--gradient-percent),
                var(--gradient-shine) calc(var(--gradient-percent) * 2),
                var(--shiny-cta-highlight) calc(var(--gradient-percent) * 3),
                transparent calc(var(--gradient-percent) * 4)
              )
              border-box;
          box-shadow:
            inset 0 0 0 1px var(--shiny-cta-bg-subtle),
            4px 4px 0 rgba(23, 21, 18, 0.25);
          transition: var(--transition);
          transition-property: --gradient-angle-offset, --gradient-percent, --gradient-shine, opacity;
        }

        .shiny-cta::before,
        .shiny-cta::after {
          content: '';
          pointer-events: none;
          position: absolute;
          inset-inline-start: 50%;
          inset-block-start: 50%;
          translate: -50% -50%;
          z-index: -1;
        }

        .shiny-cta:active:not(:disabled) {
          translate: 0 1px;
        }

        .shiny-cta::before {
          --size: calc(100% - var(--shadow-size) * 3);
          --position: 2px;
          --space: calc(var(--position) * 2);
          width: var(--size);
          height: var(--size);
          background: radial-gradient(
              circle at var(--position) var(--position),
              white calc(var(--position) / 4),
              transparent 0
            )
            padding-box;
          background-size: var(--space) var(--space);
          background-repeat: space;
          mask-image: conic-gradient(
            from calc(var(--gradient-angle) + 45deg),
            black,
            transparent 10% 90%,
            black
          );
          border-radius: inherit;
          opacity: 0.4;
          z-index: -1;
        }

        .shiny-cta::after {
          --animation: shiny-button-shimmer linear infinite;
          width: 100%;
          aspect-ratio: 1;
          background: linear-gradient(
            -50deg,
            transparent,
            var(--shiny-cta-highlight),
            transparent
          );
          mask-image: radial-gradient(circle at bottom, transparent 40%, black);
          opacity: 0.6;
        }

        .shiny-cta span {
          position: relative;
          z-index: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .shiny-cta,
        .shiny-cta::before,
        .shiny-cta::after {
          animation:
            var(--animation) var(--duration),
            var(--animation) calc(var(--duration) / 0.4) reverse paused;
          animation-composition: add;
        }

        .shiny-cta:not(:disabled):is(:hover, :focus-visible) {
          --gradient-percent: 20%;
          --gradient-angle-offset: 95deg;
          --gradient-shine: var(--shiny-cta-highlight-subtle);
        }

        .shiny-cta:not(:disabled):is(:hover, :focus-visible),
        .shiny-cta:not(:disabled):is(:hover, :focus-visible)::before,
        .shiny-cta:not(:disabled):is(:hover, :focus-visible)::after {
          animation-play-state: running;
        }

        .shiny-cta:disabled {
          cursor: wait;
          opacity: 0.6;
        }

        .shiny-cta:disabled,
        .shiny-cta:disabled::before,
        .shiny-cta:disabled::after {
          animation-play-state: paused;
        }

        @keyframes gradient-angle {
          to {
            --gradient-angle: 360deg;
          }
        }

        @keyframes shiny-button-shimmer {
          to {
            rotate: 360deg;
          }
        }

        @media (max-width: 480px) {
          .shiny-cta {
            padding: 1rem 1.25rem;
            font-size: 0.9375rem;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .shiny-cta,
          .shiny-cta::before,
          .shiny-cta::after {
            animation: none;
          }
        }
      `}</style>

      <button type={type} className={`shiny-cta ${className}`} {...props}>
        <span>{children}</span>
      </button>
    </>
  )
}
