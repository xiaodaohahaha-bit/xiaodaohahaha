import { useEffect, useState } from 'react'
import HeroLoopVideo from './HeroLoopVideo.jsx'
import GridDistortion from './GridDistortion.jsx'
import BorderGlow from './BorderGlow.jsx'

const TOTAL_PAGES = 56
const HIDDEN_DIRECTORY_PAGES = new Set([33, 49])
const SOURCE_PAGES = Array.from({ length: TOTAL_PAGES }, (_, index) => index + 1).filter(
  (page) => !HIDDEN_DIRECTORY_PAGES.has(page),
)
const DISPLAY_PAGES = [1, 2, 3, 56, ...SOURCE_PAGES.filter((page) => page >= 4 && page !== 56)]
const ASSET_VERSION = 'directory-border-glow-20261008'

const projectSections = [
  { id: 'damai', directoryId: 'projects', endId: 'cainiao' },
  { id: 'cainiao', directoryId: 'projects', endId: 'wanxing' },
  { id: 'wanxing', directoryId: 'projects', endId: null },
]

const pageHeights = {
  7: 1660,
  12: 2042,
  13: 2042,
  14: 2731,
  21: 1174,
  22: 2322,
  23: 2469,
  27: 1362,
  39: 3193,
  40: 4944,
  46: 3114,
  53: 2212,
  54: 3364,
}

const pageLabels = {
  1: 'JC 2026 设计作品集首页',
  2: '关于 JC 与个人经历',
  3: '项目目录',
  4: '大麦 AI 助理麦宝项目',
  34: '菜鸟超级奇件日项目',
  50: '万兴科技 AI-image 模型生成测评项目',
  56: '联系 JC',
}

const sectionIds = {
  1: 'home',
  2: 'about',
  3: 'projects',
  4: 'damai',
  34: 'cainiao',
  50: 'wanxing',
  56: 'contact',
}

const directoryLinks = [
  {
    href: '#damai',
    label: '查看大麦 AI 助理麦宝项目',
    style: { left: '5.4167%', top: '34.7222%', width: '27.3438%', height: '42.5%' },
  },
  {
    href: '#cainiao',
    label: '查看菜鸟超级奇件日项目',
    style: { left: '36.3542%', top: '34.7222%', width: '27.3958%', height: '42.5926%' },
  },
  {
    href: '#wanxing',
    label: '查看万兴科技 AI-image 模型测评项目',
    style: { left: '67.2396%', top: '34.7222%', width: '27.3958%', height: '42.6852%' },
  },
]

function DirectoryHotspots() {
  return (
    <nav aria-label="作品目录快捷跳转" className="absolute inset-0">
      {directoryLinks.map((link) => (
        <a
          key={link.href}
          href={link.href}
          aria-label={link.label}
          className="directory-card-link absolute block cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-white/90 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          style={{ ...link.style, borderRadius: '6.86% / 7.84%' }}
        >
          <BorderGlow
            className="directory-border-glow size-full"
            edgeSensitivity={30}
            glowColor="40 80 80"
            backgroundColor="transparent"
            borderRadius={36}
            glowRadius={40}
            glowIntensity={1}
            coneSpread={25}
            animated={false}
            colors={['#c084fc', '#f472b6', '#38bdf8']}
            fillOpacity={0}
            style={{ borderRadius: '6.86% / 7.84%' }}
          >
            <span className="sr-only">{link.label}</span>
          </BorderGlow>
        </a>
      ))}
    </nav>
  )
}

function PortfolioPage({ page }) {
  const filename = String(page).padStart(2, '0')
  const isDirectory = page === 3
  const isContact = page === 56
  const imageWidth = 1920
  const imageHeight = pageHeights[page] ?? 1080
  const imageSource = page === 1
    ? `/pages/home-2027.png?v=${ASSET_VERSION}`
    : isDirectory
      ? `/pages/project-directory-331.png?v=${ASSET_VERSION}`
      : `/pages/clear-page-${filename}.png?v=${ASSET_VERSION}`

  return (
    <section
      id={sectionIds[page]}
      aria-label={pageLabels[page] ?? `作品集第 ${page} 页`}
      className="portfolio-page relative isolate mx-auto w-full max-w-[1920px] overflow-hidden bg-white"
    >
      {page === 1 ? (
        <HeroLoopVideo
          src={`/pages/hero-motion-20261005.mp4?v=${ASSET_VERSION}`}
          poster={`/pages/home-2027.png?v=${ASSET_VERSION}`}
          alt={pageLabels[page]}
          width={imageWidth}
          height={imageHeight}
        />
      ) : isContact ? (
        <div
          className="relative w-full"
          style={{ aspectRatio: `${imageWidth} / ${imageHeight}` }}
        >
          <img
            src={imageSource}
            alt={pageLabels[page]}
            width={imageWidth}
            height={imageHeight}
            loading="eager"
            decoding="async"
            className="absolute inset-0 block size-full object-cover"
          />
          <GridDistortion
            imageSrc={imageSource}
            grid={10}
            mouse={0.1}
            strength={0.15}
            relaxation={0.9}
            className="absolute inset-0 z-[1]"
          />
        </div>
      ) : (
        <img
          src={imageSource}
          alt={pageLabels[page] ?? `JC 设计作品集第 ${page} 页`}
          width={imageWidth}
          height={imageHeight}
          loading={page <= 4 ? 'eager' : 'lazy'}
          decoding="async"
          className="block h-auto w-full"
        />
      )}
      {isDirectory && <DirectoryHotspots />}
    </section>
  )
}

function ArrowLeftIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ArrowUpIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M6 10l6-6 6 6M12 4v16" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ProjectControls() {
  const [activeProject, setActiveProject] = useState(null)
  const [showBackToTop, setShowBackToTop] = useState(false)

  useEffect(() => {
    let animationFrame = 0

    const updateControls = () => {
      const scrollPosition = window.scrollY + 2
      const currentProject = projectSections.find((project) => {
        const start = document.getElementById(project.id)
        const end = project.endId ? document.getElementById(project.endId) : null
        const endOffset = end?.offsetTop ?? document.documentElement.scrollHeight + 1
        return start && scrollPosition >= start.offsetTop && scrollPosition < endOffset
      })

      setActiveProject(currentProject ?? null)

      if (!currentProject) {
        setShowBackToTop(false)
        return
      }

      const projectStart = document.getElementById(currentProject.id)
      const revealDistance = Math.max(480, window.innerHeight * 0.65)
      setShowBackToTop(scrollPosition - projectStart.offsetTop > revealDistance)
    }

    const handleScroll = () => {
      cancelAnimationFrame(animationFrame)
      animationFrame = requestAnimationFrame(updateControls)
    }

    const initialHash = window.location.hash.slice(1)
    const initialTarget = initialHash ? document.getElementById(initialHash) : null
    if (initialTarget) initialTarget.scrollIntoView({ behavior: 'auto', block: 'start' })

    updateControls()
    animationFrame = requestAnimationFrame(updateControls)
    const initialTimer = window.setTimeout(updateControls, 250)
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll)
    window.addEventListener('hashchange', handleScroll)

    return () => {
      cancelAnimationFrame(animationFrame)
      window.clearTimeout(initialTimer)
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
      window.removeEventListener('hashchange', handleScroll)
    }
  }, [])

  const scrollToSection = (sectionId) => {
    const target = document.getElementById(sectionId)
    if (!target) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
  }

  if (!activeProject) return null

  return (
    <div className="pointer-events-none fixed inset-0 z-50 mx-auto max-w-[1920px]" aria-label="项目页面快捷操作">
      <button
        type="button"
        onClick={() => scrollToSection(activeProject.directoryId)}
        className="project-glass-control pointer-events-auto absolute left-3 top-3 flex h-10 items-center gap-1.5 rounded-full px-4 text-sm font-medium text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:left-6 sm:top-6"
        aria-label="返回项目目录"
      >
        <ArrowLeftIcon />
        <span>返回项目目录</span>
      </button>

      {showBackToTop && (
        <button
          type="button"
          onClick={() => scrollToSection(activeProject.id)}
          className="project-glass-control pointer-events-auto absolute bottom-4 right-3 flex size-11 items-center justify-center rounded-full text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:bottom-7 sm:right-6 sm:size-12"
          aria-label="返回当前项目顶部"
          title="返回顶部"
        >
          <ArrowUpIcon />
        </button>
      )}
    </div>
  )
}

export default function App() {
  return (
    <main className="min-h-screen bg-[#050505]">
      <h1 className="sr-only">JC 贺裕涵 UX/UI、交互设计与 AI 创意作品集</h1>
      <ProjectControls />
      {DISPLAY_PAGES.map((page) => (
        <PortfolioPage key={page} page={page} />
      ))}
    </main>
  )
}
