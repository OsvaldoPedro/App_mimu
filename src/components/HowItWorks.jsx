import { useTranslation } from 'react-i18next'

export default function HowItWorks() {
  const { t } = useTranslation()

  const steps = [
    { number: '1', title: t('home.howSteps.1title'), description: t('home.howSteps.1desc') },
    { number: '2', title: t('home.howSteps.2title'), description: t('home.howSteps.2desc') },
    { number: '3', title: t('home.howSteps.3title'), description: t('home.howSteps.3desc') }
  ]

  return (
    <section id="como-funciona" className="py-16 md:py-24 bg-mimu-cream dark:bg-[#121212]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-xl md:text-2xl md:text-3xl md:text-4xl font-bold text-mimu-wine-text dark:text-white text-center mb-4">
          {t('home.howItWorks')}
        </h2>
        <p className="text-mimu-wine-light-text dark:text-gray-300/80 text-center max-w-2xl mx-auto mb-16">
          {t('brand.tagline')}
        </p>

        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((step, i) => (
            <div key={i} className="relative text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-mimu-gold text-mimu-wine-text dark:text-white font-bold text-xl md:text-2xl mb-6 shadow-md hover:shadow-lg transition-shadow duration-300">
                {step.number}
              </div>
              <h3 className="text-xl font-bold text-mimu-wine-text dark:text-white mb-3">{step.title}</h3>
              <p className="text-mimu-wine-light-text dark:text-gray-300/80">{step.description}</p>
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-mimu-gold/30" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
