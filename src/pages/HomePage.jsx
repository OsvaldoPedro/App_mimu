import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import CategoryCard from '../components/CategoryCard'
import FeaturedSection from '../components/FeaturedSection'
import HowItWorks from '../components/HowItWorks'
import Footer from '../components/Footer'
import { categories } from '../data/categories'

export default function HomePage() {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen bg-[#3A0D0D]">
      <Navbar />

      <main>
        <Hero />

        <section id="categorias" className="py-16 md:py-24 bg-[#F4E8D8] scroll-mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-bold text-[#3A0D0D] text-center mb-4">
              {t('home.categoriesTitle')}
            </h2>
            <p className="text-[#5C1A1A]/80 text-center max-w-2xl mx-auto mb-12">
              {t('home.categoriesSubtitle')}
            </p>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 lg:gap-8">
              {categories.map((category, index) => (
                <div key={category.id}>
                  <CategoryCard category={category} index={index} />
                  <div className="mt-4 text-center">
                    <Link
                      to={`/categoria/${category.id}`}
                      className="text-[#C58A2B] font-semibold hover:text-[#E0B15C] transition-colors"
                    >
                      {t('home.viewOptions')} →
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-20 p-8 md:p-12 bg-white rounded-2xl shadow-lg">
              <h3 className="text-xl font-bold text-[#3A0D0D] text-center mb-6">
                🎁 {t('home.benefitsTitle')}
              </h3>
              <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 text-[#5C1A1A]/90">
                <li className="flex items-start gap-2">
                  <span className="text-[#C58A2B]">✔</span>
                  <span>{t('home.benefits.superapp')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#C58A2B]">✔</span>
                  <span>{t('home.benefits.simple')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#C58A2B]">✔</span>
                  <span>{t('home.benefits.marketing')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#C58A2B]">✔</span>
                  <span>{t('home.benefits.sectors')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#C58A2B]">✔</span>
                  <span>{t('home.benefits.expansion')}</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        <FeaturedSection />
        <HowItWorks />

        <section id="reservar" className="py-16 md:py-24 bg-[#5C1A1A]">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-[#FFFFFF] mb-4">
              {t('home.ctaTitle')}
            </h2>
            <p className="text-[#F4E8D8]/90 mb-8">
              {t('home.ctaSubtitle')}
            </p>
            <Link
              to="/categoria/estadia"
              className="inline-flex items-center justify-center px-12 py-4 bg-[#C58A2B] hover:bg-[#E0B15C] text-[#3A0D0D] font-bold text-lg rounded-2xl transition-all duration-300 hover:scale-105 shadow-xl"
            >
              {t('home.ctaButton')}
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
