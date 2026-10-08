import BorderGlow from './BorderGlow.jsx'

export default function HeroLoopVideo({ src, poster, alt, width, height }) {
  const scrollToAbout = () => {
    const about = document.getElementById('about')
    if (!about) return
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    about.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
  }

  return (
    <div className="hero-loop-video relative overflow-hidden" data-loop-mode="native-source-loop">
      <video
        src={src}
        poster={poster}
        width={width}
        height={height}
        muted
        autoPlay
        loop
        playsInline
        preload="auto"
        aria-label={alt}
        className="hero-loop-layer block h-auto w-full"
      />
      <img
        src={poster}
        alt=""
        width={width}
        height={height}
        aria-hidden="true"
        className="hero-bottom-info-clean hero-bottom-info-left pointer-events-none absolute inset-0 z-10 size-full object-cover"
      />
      <img
        src={poster}
        alt=""
        width={width}
        height={height}
        aria-hidden="true"
        className="hero-bottom-info-clean hero-bottom-info-right pointer-events-none absolute inset-0 z-10 size-full object-cover"
      />

      <div className="hero-arrow-position absolute z-20">
        <BorderGlow
          edgeSensitivity={30}
          glowColor="40 80 80"
          backgroundColor="transparent"
          borderRadius={999}
          glowRadius={40}
          glowIntensity={1}
          coneSpread={25}
          animated={false}
          colors={['#c084fc', '#f472b6', '#38bdf8']}
          fillOpacity={0}
          className="hero-arrow-glow size-full"
        >
          <button
            type="button"
            onClick={scrollToAbout}
            aria-label="向下查看个人介绍"
            className="hero-arrow-button flex size-full items-center justify-center rounded-full text-white outline-none focus-visible:ring-2 focus-visible:ring-white/90"
          >
            <span className="sr-only">向下查看个人介绍</span>
          </button>
        </BorderGlow>
      </div>
    </div>
  )
}
