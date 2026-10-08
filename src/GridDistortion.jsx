import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import './GridDistortion.css'

const vertexShader = `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`

const fragmentShader = `
uniform sampler2D uDataTexture;
uniform sampler2D uTexture;
varying vec2 vUv;

void main() {
  vec4 offset = texture2D(uDataTexture, vUv);
  gl_FragColor = texture2D(uTexture, vUv - 0.02 * offset.rg);
  #include <colorspace_fragment>
}`

export default function GridDistortion({
  grid = 15,
  mouse = 0.1,
  strength = 0.15,
  relaxation = 0.9,
  imageSrc,
  className = '',
}) {
  const containerRef = useRef(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return undefined

    const scene = new THREE.Scene()
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.NoToneMapping
    renderer.domElement.style.opacity = '0'
    container.replaceChildren(renderer.domElement)

    const camera = new THREE.OrthographicCamera(0, 0, 0, 0, -1000, 1000)
    camera.position.z = 2

    const uniforms = {
      uTexture: { value: null },
      uDataTexture: { value: null },
    }

    const size = grid
    const textureData = new Float32Array(4 * size * size)
    const dataTexture = new THREE.DataTexture(
      textureData,
      size,
      size,
      THREE.RGBAFormat,
      THREE.FloatType,
    )
    dataTexture.needsUpdate = true
    uniforms.uDataTexture.value = dataTexture

    const material = new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      uniforms,
      vertexShader,
      fragmentShader,
      transparent: true,
    })
    const geometry = new THREE.PlaneGeometry(1, 1, size - 1, size - 1)
    const plane = new THREE.Mesh(geometry, material)
    scene.add(plane)

    const handleResize = () => {
      const { width, height } = container.getBoundingClientRect()
      if (!width || !height) return

      const containerAspect = width / height
      renderer.setSize(width, height, false)
      plane.scale.set(containerAspect, 1, 1)
      camera.left = -containerAspect / 2
      camera.right = containerAspect / 2
      camera.top = 0.5
      camera.bottom = -0.5
      camera.updateProjectionMatrix()
    }

    const loadedTexture = new THREE.TextureLoader().load(
      imageSrc,
      (texture) => {
        texture.minFilter = THREE.LinearFilter
        texture.magFilter = THREE.LinearFilter
        texture.wrapS = THREE.ClampToEdgeWrapping
        texture.wrapT = THREE.ClampToEdgeWrapping
        texture.colorSpace = THREE.SRGBColorSpace
        uniforms.uTexture.value = texture
        renderer.domElement.style.opacity = '1'
        handleResize()
      },
    )

    const resizeObserver = new ResizeObserver(handleResize)
    resizeObserver.observe(container)

    const pointer = {
      x: 0,
      y: 0,
      prevX: 0,
      prevY: 0,
      velocityX: 0,
      velocityY: 0,
    }

    const updatePointer = (clientX, clientY) => {
      const rect = container.getBoundingClientRect()
      const x = (clientX - rect.left) / rect.width
      const y = 1 - (clientY - rect.top) / rect.height
      pointer.velocityX = x - pointer.prevX
      pointer.velocityY = y - pointer.prevY
      pointer.x = x
      pointer.y = y
      pointer.prevX = x
      pointer.prevY = y
    }

    const handlePointerMove = (event) => {
      if (event.pointerType === 'touch') return
      updatePointer(event.clientX, event.clientY)
    }

    const handleTouchMove = (event) => {
      const touch = event.touches[0]
      if (touch) updatePointer(touch.clientX, touch.clientY)
    }

    const handlePointerLeave = () => {
      pointer.x = 0
      pointer.y = 0
      pointer.prevX = 0
      pointer.prevY = 0
      pointer.velocityX = 0
      pointer.velocityY = 0
    }

    container.addEventListener('pointermove', handlePointerMove)
    container.addEventListener('pointerleave', handlePointerLeave)
    container.addEventListener('touchmove', handleTouchMove, { passive: true })
    container.addEventListener('touchend', handlePointerLeave, { passive: true })
    handleResize()

    let animationFrame = 0
    const animate = () => {
      animationFrame = requestAnimationFrame(animate)

      for (let index = 0; index < size * size; index += 1) {
        textureData[index * 4] *= relaxation
        textureData[index * 4 + 1] *= relaxation
      }

      const gridPointerX = size * pointer.x
      const gridPointerY = size * pointer.y
      const maxDistance = size * mouse

      for (let x = 0; x < size; x += 1) {
        for (let y = 0; y < size; y += 1) {
          const distanceSquared = (gridPointerX - x) ** 2 + (gridPointerY - y) ** 2
          if (distanceSquared < maxDistance ** 2) {
            const dataIndex = 4 * (x + size * y)
            const power = Math.min(maxDistance / Math.max(Math.sqrt(distanceSquared), 0.01), 10)
            textureData[dataIndex] += strength * 100 * pointer.velocityX * power
            textureData[dataIndex + 1] -= strength * 100 * pointer.velocityY * power
          }
        }
      }

      dataTexture.needsUpdate = true
      renderer.render(scene, camera)
      pointer.velocityX *= 0.85
      pointer.velocityY *= 0.85
    }
    animate()

    return () => {
      cancelAnimationFrame(animationFrame)
      resizeObserver.disconnect()
      container.removeEventListener('pointermove', handlePointerMove)
      container.removeEventListener('pointerleave', handlePointerLeave)
      container.removeEventListener('touchmove', handleTouchMove)
      container.removeEventListener('touchend', handlePointerLeave)
      geometry.dispose()
      material.dispose()
      dataTexture.dispose()
      loadedTexture.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
      if (container.contains(renderer.domElement)) renderer.domElement.remove()
    }
  }, [grid, imageSrc, mouse, relaxation, strength])

  return (
    <div
      ref={containerRef}
      className={`distortion-container ${className}`}
      aria-hidden="true"
    />
  )
}
