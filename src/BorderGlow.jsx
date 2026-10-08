import { useCallback, useEffect, useRef } from 'react'
import './BorderGlow.css'

function parseHSL(hslString) {
  const match = hslString.match(/([\d.]+)\s*([\d.]+)%?\s*([\d.]+)%?/)
  if (!match) return { h: 40, s: 80, l: 80 }
  return { h: Number(match[1]), s: Number(match[2]), l: Number(match[3]) }
}

function buildGlowVars(glowColor, intensity) {
  const { h, s, l } = parseHSL(glowColor)
  const base = `${h}deg ${s}% ${l}%`
  const opacities = [100, 60, 50, 40, 30, 20, 10]
  const keys = ['', '-60', '-50', '-40', '-30', '-20', '-10']

  return Object.fromEntries(
    opacities.map((opacity, index) => [
      `--glow-color${keys[index]}`,
      `hsl(${base} / ${Math.min(opacity * intensity, 100)}%)`,
    ]),
  )
}

const gradientPositions = ['80% 55%', '69% 34%', '8% 6%', '41% 38%', '86% 85%', '82% 18%', '51% 4%']
const gradientKeys = ['--gradient-one', '--gradient-two', '--gradient-three', '--gradient-four', '--gradient-five', '--gradient-six', '--gradient-seven']
const colorMap = [0, 1, 2, 0, 1, 2, 1]

function buildGradientVars(colors) {
  const vars = {}
  for (let index = 0; index < gradientKeys.length; index += 1) {
    const color = colors[Math.min(colorMap[index], colors.length - 1)]
    vars[gradientKeys[index]] = `radial-gradient(at ${gradientPositions[index]}, ${color} 0px, transparent 50%)`
  }
  vars['--gradient-base'] = `linear-gradient(${colors[0]} 0 100%)`
  return vars
}

function isLightColor(color) {
  const value = color.trim().replace('#', '')
  if (!/^[\da-f]{3}([\da-f]{3})?$/i.test(value)) return false
  const hex = value.length === 3 ? value.split('').map((character) => character + character).join('') : value
  const red = Number.parseInt(hex.slice(0, 2), 16)
  const green = Number.parseInt(hex.slice(2, 4), 16)
  const blue = Number.parseInt(hex.slice(4, 6), 16)
  return red * 0.2126 + green * 0.7152 + blue * 0.0722 > 180
}

function animateValue({ start = 0, end = 100, duration = 1000, delay = 0, ease, onUpdate, onEnd }) {
  const startTime = performance.now() + delay
  const easing = ease ?? ((value) => 1 - (1 - value) ** 3)

  function tick() {
    const elapsed = performance.now() - startTime
    const progress = Math.min(Math.max(elapsed / duration, 0), 1)
    onUpdate(start + (end - start) * easing(progress))
    if (progress < 1) requestAnimationFrame(tick)
    else onEnd?.()
  }

  window.setTimeout(() => requestAnimationFrame(tick), delay)
}

export default function BorderGlow({
  children,
  className = '',
  style: customStyle = {},
  edgeSensitivity = 30,
  glowColor = '40 80 80',
  backgroundColor = '#120F17',
  borderRadius = 28,
  glowRadius = 40,
  glowIntensity = 1,
  coneSpread = 25,
  animated = false,
  colors = ['#c084fc', '#f472b6', '#38bdf8'],
  fillOpacity = 0.5,
}) {
  const cardRef = useRef(null)

  const handlePointerMove = useCallback((event) => {
    const card = cardRef.current
    if (!card) return

    const rect = card.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    const deltaX = x - centerX
    const deltaY = y - centerY
    const scaleX = deltaX === 0 ? Number.POSITIVE_INFINITY : centerX / Math.abs(deltaX)
    const scaleY = deltaY === 0 ? Number.POSITIVE_INFINITY : centerY / Math.abs(deltaY)
    const edge = Math.min(Math.max(1 / Math.min(scaleX, scaleY), 0), 1)
    const angle = (Math.atan2(deltaY, deltaX) * 180) / Math.PI + 90

    card.style.setProperty('--edge-proximity', (edge * 100).toFixed(3))
    card.style.setProperty('--cursor-angle', `${angle < 0 ? angle + 360 : angle}deg`)
  }, [])

  useEffect(() => {
    if (!animated || !cardRef.current) return undefined
    const card = cardRef.current
    card.classList.add('sweep-active')

    animateValue({ duration: 500, onUpdate: (value) => card.style.setProperty('--edge-proximity', value) })
    animateValue({
      duration: 1500,
      ease: (value) => value ** 3,
      end: 50,
      onUpdate: (value) => card.style.setProperty('--cursor-angle', `${110 + 355 * (value / 100)}deg`),
    })
    animateValue({
      delay: 1500,
      duration: 2250,
      start: 50,
      end: 100,
      onUpdate: (value) => card.style.setProperty('--cursor-angle', `${110 + 355 * (value / 100)}deg`),
    })
    animateValue({
      delay: 2500,
      duration: 1500,
      start: 100,
      end: 0,
      ease: (value) => value ** 3,
      onUpdate: (value) => card.style.setProperty('--edge-proximity', value),
      onEnd: () => card.classList.remove('sweep-active'),
    })

    return () => card.classList.remove('sweep-active')
  }, [animated])

  return (
    <div
      ref={cardRef}
      onPointerMove={handlePointerMove}
      className={`border-glow-card${isLightColor(backgroundColor) ? ' border-glow-card--light' : ''} ${className}`}
      style={{
        ...customStyle,
        '--card-bg': backgroundColor,
        '--edge-sensitivity': edgeSensitivity,
        '--border-radius': `${borderRadius}px`,
        '--glow-padding': `${glowRadius}px`,
        '--cone-spread': coneSpread,
        '--fill-opacity': fillOpacity,
        ...buildGlowVars(glowColor, glowIntensity),
        ...buildGradientVars(colors),
      }}
    >
      <span className="edge-light" />
      <div className="border-glow-inner">{children}</div>
    </div>
  )
}
