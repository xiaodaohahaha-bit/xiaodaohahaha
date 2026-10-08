import { useEffect, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import './TargetCursor.css'

export default function TargetCursor({
  targetSelector = '.cursor-target',
  scopeSelector,
  spinDuration = 2,
  hideDefaultCursor = true,
  parallaxOn = true,
  cursorColor = '#ffffff',
  cursorColorOnTarget = '#c084fc',
}) {
  const cursorRef = useRef(null)
  const frameRef = useRef(0)
  const pointerRef = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 })
  const activeTargetRef = useRef(null)

  const isMobile = useMemo(
    () => window.matchMedia('(hover: none), (pointer: coarse)').matches,
    [],
  )

  useEffect(() => {
    if (isMobile || !cursorRef.current) return undefined

    const cursor = cursorRef.current
    const scope = scopeSelector ? document.querySelector(scopeSelector) : document.body
    const originalCursor = scope?.style.cursor ?? ''
    if (hideDefaultCursor && scope) scope.style.cursor = 'none'

    const setTargetCorners = () => {
      const target = activeTargetRef.current
      if (!target) return
      const rect = target.getBoundingClientRect()
      const { x, y } = pointerRef.current
      const driftX = parallaxOn ? Math.max(-5, Math.min(5, (x - (rect.left + rect.width / 2)) * 0.018)) : 0
      const driftY = parallaxOn ? Math.max(-5, Math.min(5, (y - (rect.top + rect.height / 2)) * 0.018)) : 0
      cursor.style.setProperty('--tl-x', `${rect.left - x + driftX}px`)
      cursor.style.setProperty('--tl-y', `${rect.top - y + driftY}px`)
      cursor.style.setProperty('--tr-x', `${rect.right - x - 12 - driftX}px`)
      cursor.style.setProperty('--tr-y', `${rect.top - y + driftY}px`)
      cursor.style.setProperty('--br-x', `${rect.right - x - 12 - driftX}px`)
      cursor.style.setProperty('--br-y', `${rect.bottom - y - 12 - driftY}px`)
      cursor.style.setProperty('--bl-x', `${rect.left - x + driftX}px`)
      cursor.style.setProperty('--bl-y', `${rect.bottom - y - 12 - driftY}px`)
    }

    const renderCursor = () => {
      const { x, y } = pointerRef.current
      cursor.style.transform = `translate3d(${x}px, ${y}px, 0)`
      setTargetCorners()
      frameRef.current = 0
    }

    const scheduleRender = () => {
      if (!frameRef.current) frameRef.current = requestAnimationFrame(renderCursor)
    }

    const handleMove = (event) => {
      pointerRef.current = { x: event.clientX, y: event.clientY }
      const insideScope = !scopeSelector || event.target.closest?.(scopeSelector)
      cursor.classList.toggle('is-visible', Boolean(insideScope))
      if (!insideScope) releaseTarget()
      scheduleRender()
    }

    const releaseTarget = () => {
      activeTargetRef.current = null
      cursor.classList.remove('is-targeting')
    }

    const handleOver = (event) => {
      const target = event.target.closest?.(targetSelector)
      if (!target || target === activeTargetRef.current) return
      activeTargetRef.current = target
      cursor.classList.add('is-targeting')
      scheduleRender()
    }

    const handleOut = (event) => {
      const target = activeTargetRef.current
      if (!target) return
      if (event.relatedTarget && target.contains(event.relatedTarget)) return
      if (event.target === target || target.contains(event.target)) releaseTarget()
    }

    window.addEventListener('pointermove', handleMove, { passive: true })
    window.addEventListener('pointerover', handleOver, { passive: true })
    window.addEventListener('pointerout', handleOut, { passive: true })
    window.addEventListener('scroll', scheduleRender, { passive: true })
    window.addEventListener('resize', scheduleRender)
    scheduleRender()

    return () => {
      cancelAnimationFrame(frameRef.current)
      frameRef.current = 0
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerover', handleOver)
      window.removeEventListener('pointerout', handleOut)
      window.removeEventListener('scroll', scheduleRender)
      window.removeEventListener('resize', scheduleRender)
      if (scope) scope.style.cursor = originalCursor
    }
  }, [hideDefaultCursor, isMobile, parallaxOn, scopeSelector, targetSelector])

  if (isMobile) return null

  return createPortal(
    <div
      ref={cursorRef}
      className="target-cursor-wrapper"
      style={{
        '--spin-duration': `${spinDuration}s`,
        '--cursor-color': cursorColor,
        '--target-color': cursorColorOnTarget,
      }}
      aria-hidden="true"
    >
      <span className="target-cursor-dot" />
      <span className="target-cursor-corner corner-tl" />
      <span className="target-cursor-corner corner-tr" />
      <span className="target-cursor-corner corner-br" />
      <span className="target-cursor-corner corner-bl" />
    </div>,
    document.body,
  )
}
