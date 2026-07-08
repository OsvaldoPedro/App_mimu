import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'

const slides = [
  "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1200&q=80",
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80",
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=80",
  "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=1200&q=80"
]

export default function Hero() {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [currentSlide, setCurrentSlide] = useState(0)
  const [searchVal, setSearchVal] = useState("")

  // Automatic slide interval
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [])

  // Time-aware greeting
  const getGreeting = () => {
    const hour = new Date().getHours()
    let greet = "Olá, seja bem-vindo"
    if (hour >= 5 && hour < 12) greet = "Bom dia"
    else if (hour >= 12 && hour < 18) greet = "Boa tarde"
    else greet = "Boa noite"

    if (user) {
      const name = user.name || user.company_name || user.email?.split('@')[0]
      return `${greet}, ${name}!`
    }
    return `${greet}!`
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (searchVal.trim()) {
      navigate(`/servicos?search=${encodeURIComponent(searchVal)}`)
    }
  }

  return (
    <section className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 md:pt-24 lg:pt-28 pb-8">
      {/* Banner Card Container */}
      <div className="relative overflow-hidden rounded-3xl aspect-[4/3] xs:aspect-[16/10] sm:aspect-[21/9] min-h-[260px] xs:min-h-[300px] sm:min-h-[440px] shadow-2xl border border-mimu-cream-border/10 dark:border-[#2A2A2A]">
        {/* Background Image Carousel with smooth fade transitions */}
        <div className="absolute inset-0 z-0">
          {slides.map((slide, idx) => (
            <div
              key={idx}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                idx === currentSlide ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <img
                src={slide}
                alt={`Slide ${idx + 1}`}
                className="w-full h-full object-cover transform scale-100 duration-[6000ms] ease-out"
                style={{
                  transform: idx === currentSlide ? 'scale(1.05)' : 'scale(1.00)'
                }}
              />
            </div>
          ))}
          {/* Multi-layered premium overlay gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-transparent to-transparent" />
        </div>

        {/* Content Overlay */}
        <div className="absolute inset-0 z-10 flex flex-col justify-between p-4 xs:p-6 sm:p-10 lg:p-12">
          {/* Top Badge & Greeting */}
          <div className="flex flex-col items-start gap-1 sm:gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-black/40 backdrop-blur-md text-mimu-gold font-bold text-[9px] sm:text-xs tracking-wider uppercase rounded-full border border-white/10">
              ✨ Experiências únicas
            </span>
            <p className="text-white/80 font-semibold text-[10px] xs:text-xs sm:text-sm tracking-wide mt-1">
              {getGreeting()}
            </p>
          </div>

          {/* Title & Search Panel */}
          <div className="max-w-2xl mt-auto">
            <h1 className="text-lg xs:text-xl sm:text-3xl lg:text-4xl font-extrabold text-white leading-tight mb-2 sm:mb-3">
              Onde a vida encontra
              <br />
              <span className="text-mimu-gold drop-shadow-md">
                os seus melhores serviços
              </span>
            </h1>
            <p className="text-white/70 text-xs sm:text-sm mb-4 sm:mb-6 max-w-lg hidden sm:block">
              {t('home.heroSubtitle', 'Reserve hotéis, restaurantes, experiências, viagens e muito mais com a facilidade que você merece.')}
            </p>

            {/* Search Input Container */}
            <form onSubmit={handleSearchSubmit} className="relative w-full max-w-xl">
              <div className="flex items-center bg-white/95 dark:bg-[#1E1E1E]/95 backdrop-blur-md rounded-2xl shadow-xl p-1 sm:p-1.5 border border-white/20 dark:border-white/10 transition-all focus-within:ring-2 focus-within:ring-mimu-gold/50">
                <div className="flex-1 flex items-center pl-2 sm:pl-3">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    value={searchVal}
                    onChange={(e) => setSearchVal(e.target.value)}
                    placeholder="O que você procura?"
                    className="w-full bg-transparent pl-2 sm:pl-3 pr-2 py-1.5 sm:py-2.5 text-xs sm:text-sm font-medium text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none border-none outline-none"
                    style={{ border: 'none', background: 'transparent' }}
                  />
                </div>
                <button
                  type="submit"
                  className="bg-mimu-gold hover:bg-mimu-gold-hover text-black w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-105 shrink-0"
                >
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Slider dots pagination & Quick suggestions row */}
      <div className="flex flex-col items-center gap-2 sm:gap-4 mt-2 sm:mt-4">
        {/* Pagination Dots */}
        <div className="flex gap-2">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === currentSlide ? 'w-5 bg-mimu-gold' : 'w-1.5 bg-gray-600/40 dark:bg-gray-700/50'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>

        {/* Quick Suggestions below search */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-mimu-text-muted dark:text-gray-400">
          <span className="font-semibold">{t('common.quickSuggestions', 'Sugestões rápidas:')}</span>
          {['Hotéis', 'Festas', 'Restaurantes', 'Transportes'].map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => {
                setSearchVal(suggestion)
                navigate(`/servicos?search=${encodeURIComponent(suggestion)}`)
              }}
              className="px-2.5 py-0.5 sm:px-3 sm:py-1 bg-mimu-cream/50 dark:bg-[#1E1E1E]/40 border border-mimu-cream-border dark:border-[#2A2A2A] rounded-full hover:border-mimu-gold hover:text-mimu-gold transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}

