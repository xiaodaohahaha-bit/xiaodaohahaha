import fs from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { chromium } from 'file:///C:/Users/HYH/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'

const [inputArg, outputArg, sampleCountArg = '12'] = process.argv.slice(2)
if (!inputArg || !outputArg) {
  throw new Error('Usage: node extract_video_frames.mjs <video> <output-dir> [sample-count]')
}

const input = path.resolve(inputArg)
const output = path.resolve(outputArg)
const sampleCount = Math.max(2, Number.parseInt(sampleCountArg, 10) || 12)
await fs.mkdir(output, { recursive: true })

const htmlPath = path.join(output, 'reader.html')
const videoUrl = pathToFileURL(input).href
await fs.writeFile(
  htmlPath,
  `<!doctype html><meta charset="utf-8"><video id="video" muted playsinline preload="auto" src="${videoUrl}"></video><canvas id="canvas"></canvas>`,
)

const browser = await chromium.launch({
  headless: true,
  executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  args: ['--allow-file-access-from-files'],
})
const page = await browser.newPage()
await page.goto(pathToFileURL(htmlPath).href)
const metadata = await page.evaluate(async () => {
  const video = document.querySelector('#video')
  if (video.readyState < 1) {
    await new Promise((resolve, reject) => {
      video.addEventListener('loadedmetadata', resolve, { once: true })
      video.addEventListener('error', () => reject(video.error), { once: true })
    })
  }
  return { duration: video.duration, width: video.videoWidth, height: video.videoHeight }
})

for (let index = 0; index < sampleCount; index += 1) {
  const time = metadata.duration * (index / (sampleCount - 1))
  const dataUrl = await page.evaluate(async ({ time }) => {
    const video = document.querySelector('#video')
    const canvas = document.querySelector('#canvas')
    const context = canvas.getContext('2d')
    const seekTime = Math.min(time, Math.max(0, video.duration - 0.001))
    if (Math.abs(video.currentTime - seekTime) > 0.0001) {
      await new Promise((resolve, reject) => {
        video.addEventListener('seeked', resolve, { once: true })
        video.addEventListener('error', () => reject(video.error), { once: true })
        video.currentTime = seekTime
      })
    }
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    context.drawImage(video, 0, 0)
    return canvas.toDataURL('image/png')
  }, { time })
  const fileName = `frame-${String(index).padStart(2, '0')}-${time.toFixed(3)}s.png`
  await fs.writeFile(path.join(output, fileName), Buffer.from(dataUrl.split(',')[1], 'base64'))
}

await fs.writeFile(path.join(output, 'metadata.json'), JSON.stringify(metadata, null, 2))
await browser.close()
console.log(JSON.stringify(metadata))
