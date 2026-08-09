"use client"

import { useEffect, useRef, type ElementType, type ReactNode } from "react"
import { animate, stagger } from "animejs"

type StaggerProps = {
  children: ReactNode
  className?: string
  as?: ElementType
  /** Delay before the first child animates, in ms. */
  delay?: number
  /** Gap between consecutive children, in ms. */
  gap?: number
  /** Wait until the group scrolls into view instead of animating on mount. */
  inView?: boolean
}

const REDUCED = "(prefers-reduced-motion: reduce)"

/**
 * Animates any `[data-anim]` descendants in as a staggered group.
 *
 * The staged-hidden state lives in CSS (`[data-anim] { opacity: 0 }`) so there
 * is no flash of finished layout before the timeline starts; this component
 * only ever moves elements *towards* visible, and bails to visible on reduced
 * motion. Nothing here affects layout — opacity and transform only — so a
 * group animating in never reflows the page around it.
 */
export function Stagger({
  children,
  className,
  as,
  delay = 0,
  gap = 55,
  inView = false,
}: StaggerProps) {
  const Tag = (as ?? "div") as ElementType
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const root = ref.current
    if (!root) return

    const rise = root.querySelectorAll<HTMLElement>('[data-anim="rise"]')
    const fade = root.querySelectorAll<HTMLElement>('[data-anim="fade"]')
    if (!rise.length && !fade.length) return

    const reveal = () => {
      for (const el of [...rise, ...fade]) {
        el.style.opacity = "1"
        el.style.transform = "none"
      }
    }

    if (window.matchMedia(REDUCED).matches) {
      reveal()
      return
    }

    const play = () => {
      if (rise.length) {
        animate(rise, {
          opacity: [0, 1],
          translateY: [12, 0],
          duration: 620,
          delay: stagger(gap, { start: delay }),
          ease: "outExpo",
        })
      }
      if (fade.length) {
        animate(fade, {
          opacity: [0, 1],
          duration: 520,
          delay: stagger(gap, { start: delay }),
          ease: "outQuad",
        })
      }
    }

    if (!inView) {
      play()
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            play()
            observer.disconnect()
          }
        }
      },
      { threshold: 0.15 }
    )
    observer.observe(root)
    return () => observer.disconnect()
  }, [delay, gap, inView])

  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  )
}
