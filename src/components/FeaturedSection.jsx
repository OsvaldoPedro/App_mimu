import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useCategories } from '../hooks/useCategories'
import OptimizedImage from './common/OptimizedImage'

export default function FeaturedSection() {
  const { t } = useTranslation()
  const { categories } = useCategories()

  const imageMap = {
    estadia: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&q=80',
    comer: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&q=80',
    festas: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&q=80',
    transporte: 'https://images.unsplash.com/photo-1549488344-1f9b8d2bd1f3?w=800&q=80',
    automovel: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=80',
    entregas: 'https://images.unsplash.com/photo-1580915411954-282cb1b0d780?w=800&q=80',
    profissionais: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80',
    formacao: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&q=80',
    mobilidade: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&q=80',
    beleza: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80',
    casa: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80'
  }

  const features = categories.slice(0, 3).map(c => ({
    image: imageMap[c.id] || imageMap.estadia,
    title: t(`category.${c.id}`),
    subtitle: c.name,
    category: c.id
  }))

  return (
    <section className="py-16 md:py-24 bg-mimu-wine dark:bg-[#000000] transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-xl md:text-2xl md:text-3xl md:text-4xl font-bold text-mimu-white-text text-center mb-4">
          {t('home.featuredTitle')}
        </h2>
        <p className="text-mimu-cream-text/80 text-center max-w-2xl mx-auto mb-12">
          {t('home.featuredSubtitle')}
        </p>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {features.map((item, i) => (
            <Link
              key={i}
              to={`/categoria/${item.category}`}
              className="group relative rounded-2xl overflow-hidden w-full aspect-[4/3] sm:aspect-[4/5] block"
            >
              <OptimizedImage
                src={item.image}
                alt={item.title}
                className="w-full h-full"
                imgClassName="group-hover:scale-110"
                objectFit="cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#3A0D0D] via-[#3A0D0D]/50 dark:from-[#121212] dark:via-[#121212]/50 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 pointer-events-none flex flex-col items-start">
                <h3 className="text-xl font-bold text-mimu-white-text mb-2 group-hover:text-mimu-gold transition-colors whitespace-normal break-words max-w-full pointer-events-auto leading-tight line-clamp-2">
                  {item.title}
                </h3>
                <p className="text-mimu-cream-text/90 text-sm break-words line-clamp-2">{item.subtitle}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
