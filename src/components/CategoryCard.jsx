import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function CategoryCard({ category, index }) {
  const { t } = useTranslation()
  const imageMap = {
    estadia: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80',
    comer: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80',
    festas: 'https://images.unsplash.com/photo-1508921912186-1d1a45ebb3c1?w=800&q=80',
    transporte: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800&q=80',
    automovel: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&q=80',
    entregas: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
    profissionais: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&q=80',
    formacao: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80',
    mobilidade: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=80',
    beleza: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&q=80',
    casa: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&q=80'
  }

  const colorMap = {
    estadia: { border: 'border-blue-900/30', badge: 'bg-blue-900/90' },
    comer: { border: 'border-orange-600/30', badge: 'bg-orange-600/90' },
    festas: { border: 'border-yellow-500/30', badge: 'bg-yellow-500/90' },
    transporte: { border: 'border-green-600/30', badge: 'bg-green-600/90' },
    beleza: { border: 'border-violet-600/30', badge: 'bg-violet-600/90' },
    casa: { border: 'border-gray-700/30', badge: 'bg-gray-700/90' },
    automovel: { border: 'border-slate-300/30', badge: 'bg-slate-300/90' },
    entregas: { border: 'border-amber-400/30', badge: 'bg-amber-400/90' },
    profissionais: { border: 'border-red-400/30', badge: 'bg-red-400/90' },
    formacao: { border: 'border-sky-200/30', badge: 'bg-sky-200/90' }
  }

  const colors = colorMap[category.id] || colorMap.casa
  const image = imageMap[category.id] || imageMap.estadia

  return (
    <article
      className={`group bg-[#FFFFFF] rounded-2xl shadow-lg hover:shadow-xl overflow-hidden transition-all duration-300 hover:-translate-y-1 border ${colors.border}`}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <Link to={`/categoria/${category.id}`} className="block">
        <div className="relative h-48 sm:h-56 overflow-hidden">
          <img
            src={image}
            alt={category.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#3A0D0D]/90 via-[#3A0D0D]/40 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${colors.badge} text-white text-sm font-medium`}>
              <span className="text-xl">{category.icon}</span>
              {t(`category.${category.id}`)}
            </span>
          </div>
        </div>
      </Link>

      <div className="p-5 sm:p-6">
        <p className="text-[#5C1A1A]/80 text-sm mb-3 font-medium">Inclui:</p>
        <ul className="flex flex-wrap gap-2">
          {category.services.map((service, i) => (
            <li
              key={i}
              className="px-3 py-1.5 bg-[#F4E8D8]/60 text-[#3A0D0D] text-xs rounded-lg"
            >
              {service}
            </li>
          ))}
        </ul>
        <Link
          to={`/categoria/${category.id}`}
          className="mt-4 inline-flex items-center gap-2 text-[#C58A2B] font-semibold hover:text-[#E0B15C] transition-colors group/link"
        >
          {t('home.viewOptions')}
          <svg className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </Link>
      </div>
    </article>
  )
}
