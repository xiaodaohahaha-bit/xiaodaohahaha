import fs from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'file:///C:/Users/HYH/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'

const root = path.resolve('public/pages')
const clips = [
  { key: 'top-left', source: 'hero-directional-20261006.mp4', start: 0.28, end: 1.56 },
  { key: 'top-right', source: 'hero-motion-20261005.mp4', start: 1.02, end: 2.08 },
  { key: 'bottom-left', source: 'hero-directional-20261006.mp4', start: 2.22, end: 3.08 },
  { key: 'bottom-right', source: 'hero-directional-20261006.mp4', start: 3.2, end: 4.02 },
]

const browser = await chromium.launch({
  headless: true,
  executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
})
const page = await browser.newPage({ viewport: { width: 640, height: 360 } })
await page.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded' })

for (const clip of clips) {
  const base64 = await page.evaluate(async ({ source, start, end }) => {
    const video = document.createElement('video')
    video.src = `/pages/${source}`
    video.muted = true
    video.playsInline = true
    video.preload = 'auto'
    await new Promise((resolve, reject) => {
      video.addEventListener('canplay', resolve, { once: true })
      video.addEventListener('error', reject, { once: true })
      video.load()
    })

    const canvas = document.createElement('canvas')
    canvas.width = 1920
    canvas.height = 1080
    const context = canvas.getContext('2d', { alpha: false })
    let drawing = true
    const draw = () => {
      context.drawImage(video, 0, 0, canvas.width, canvas.height)
      if (drawing) requestAnimationFrame(draw)
    }
    draw()

    await video.play()
    await new Promise((resolve) => {
      const waitForStart = () => {
        if (video.currentTime >= start) resolve()
        else requestAnimationFrame(waitForStart)
      }
      waitForStart()
    })

    const stream = canvas.captureStream(30)
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : 'video/webm;codecs=vp8'
    const recorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: 8_000_000,
    })
    const chunks = []
    recorder.addEventListener('dataavailable', (event) => {
      if (event.data.size) chunks.push(event.data)
    })
    const stopped = new Promise((resolve) => recorder.addEventListener('stop', resolve, { once: true }))
    recorder.start()

    await new Promise((resolve) => {
      const waitForEnd = () => {
        if (video.currentTime >= end || video.ended) resolve()
        else requestAnimationFrame(waitForEnd)
      }
      waitForEnd()
    })
    video.pause()
    drawing = false
    recorder.stop()
    await stopped
    stream.getTracks().forEach((track) => track.stop())

    const buffer = await new Blob(chunks, { type: mimeType }).arrayBuffer()
    const bytes = new Uint8Array(buffer)
    let binary = ''
    const block = 0x8000
    for (let offset = 0; offset < bytes.length; offset += block) {
      binary += String.fromCharCode(...bytes.subarray(offset, offset + block))
    }
    return btoa(binary)
  }, clip)

  const output = path.join(root, `hero-clip-${clip.key}.webm`)
  await fs.writeFile(output, Buffer.from(base64, 'base64'))
  console.log(`${clip.key}: ${Math.round((await fs.stat(output)).size / 1024)} KB`)
}

await browser.close()
