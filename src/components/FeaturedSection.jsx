import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { categories } from '../data/categories'

export default function FeaturedSection() {
  const { t } = useTranslation()

  const imageMap = {
    estadia: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600&q=80',
    comer: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=80',
    festas: 'https://images.unsplash.com/photo-1508921912186-1d1a45ebb3c1?w=600&q=80',
    transporte: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=600&q=80',
    mobilidade: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&q=80',
    beleza: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600&q=80',
    casa: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=600&q=80',
    automovel: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=600&q=80',
    entregas: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
    profissionais: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=600&q=80',
    formacao: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&q=80'
  }

  const features = categories.slice(0, 3).map(c => ({
    image: imageMap[c.id] || imageMap.estadia,
    title: t(`category.${c.id}`),
    subtitle: c.name,
    category: c.id
  }))

  return (
    <section className="py-16 md:py-24 bg-[#3A0D0D]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-bold text-[#FFFFFF] text-center mb-4">
          {t('home.featuredTitle')}
        </h2>
        <p className="text-[#F4E8D8]/80 text-center max-w-2xl mx-auto mb-12">
          {t('home.featuredSubtitle')}
        </p>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {features.map((item, i) => (
            <Link
              key={i}
              to={`/categoria/${item.category}`}
              className="group relative rounded-2xl overflow-hidden h-64 md:h-80 block"
            >
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#3A0D0D] via-[#3A0D0D]/50 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <h3 className="text-xl font-bold text-[#FFFFFF] mb-2 group-hover:text-[#C58A2B] transition-colors">
                  {item.title}
                </h3>
                <p className="text-[#F4E8D8]/90 text-sm">{item.subtitle}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
