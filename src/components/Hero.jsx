import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

export default function Hero() {
  const { t } = useTranslation()

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-20">
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1920&q=80"
          alt="Paisagem africana moderna"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-[#3A0D0D]/85" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center">
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-[#FFFFFF] mb-6 leading-tight">
          {t('home.heroTitle')}
          <br />
          <span className="text-[#C58A2B]">{t('home.heroHighlight')}</span>
        </h1>
        <p className="text-lg md:text-xl text-[#F4E8D8]/90 mb-10 max-w-2xl mx-auto">
          {t('home.heroSubtitle')}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/categoria/estadia"
            className="inline-flex items-center justify-center px-10 py-4 bg-[#C58A2B] hover:bg-[#E0B15C] text-[#3A0D0D] font-bold text-lg rounded-2xl transition-all duration-300 hover:scale-105 shadow-xl hover:shadow-[#C58A2B]/40"
          >
            {t('home.explore')}
          </Link>
          <a
            href="#como-funciona"
            className="inline-flex items-center justify-center px-10 py-4 bg-transparent border-2 border-[#FFFFFF]/50 hover:border-[#C58A2B] text-[#FFFFFF] font-semibold text-lg rounded-2xl transition-all duration-300 hover:scale-105"
          >
            {t('home.howItWorks')}
          </a>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#3A0D0D] to-transparent" />
    </section>
  )
}
