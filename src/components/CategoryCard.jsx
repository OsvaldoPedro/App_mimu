import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import OptimizedImage from './common/OptimizedImage'
import DynamicIcon from './common/DynamicIcon'

export default function CategoryCard({ category, index }) {
  const { t } = useTranslation()
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

  const colorMap = {
    estadia: { border: 'border-mimu-wine/30', badge: 'bg-mimu-wine/90' },
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

  // Usar as classes da DB se existirem, senão usar as do mapa legado
  const badgeClass = category.bgClass || colors.badge;
  
  // Para a borda, tentamos usar o HEX da BD para criar uma cor inline transparente, senão cai na classe border do tailwind
  const customBorderStyle = category.color ? { borderColor: `${category.color}4D` } : {};
  const borderClass = category.color ? 'border' : `border ${colors.border}`;

  return (
    <article
      className={`group w-full max-w-full flex flex-col bg-mimu-white dark:bg-[#1E1E1E] rounded-3xl shadow-md hover:shadow-xl overflow-hidden transition-all duration-300 hover:-translate-y-1.5 ${borderClass}`}
      style={{ animationDelay: `${index * 100}ms`, ...customBorderStyle }}
    >
      <Link to={`/categoria/${category.id}`} className="block w-full">
        <div className="relative w-full aspect-[4/3] sm:aspect-video overflow-hidden">
          <OptimizedImage
            src={image}
            alt={category.name}
            className="w-full h-full"
            imgClassName="group-hover:scale-105 transition-transform duration-500 ease-out"
            objectFit="cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 flex pointer-events-none">
            <span className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl ${badgeClass} text-mimu-white-text text-xs sm:text-sm font-bold shadow-md tracking-wide whitespace-normal break-words max-w-full pointer-events-auto leading-tight border border-white/10`}>
              <span className="shrink-0 flex items-center justify-center">
                <DynamicIcon name={category.icon} className="w-4.5 h-4.5 text-current" />
              </span>
              {t(`category.${category.id}`)}
            </span>
          </div>
        </div>
      </Link>

      <div className="p-5 sm:p-6 flex-grow flex flex-col justify-between">
        <div>
          <p className="text-mimu-wine-light-text dark:text-gray-400 text-xs sm:text-sm mb-3 font-semibold uppercase tracking-wider">Inclui:</p>
          <ul className="flex flex-wrap gap-1.5">
            {category.services.map((service, i) => (
              <li
                key={i}
                className="px-2.5 py-1 bg-mimu-cream/40 dark:bg-[#121212]/80 text-mimu-wine-text dark:text-gray-300 text-xs font-medium rounded-lg border border-mimu-cream-border dark:border-white/5"
              >
                {service}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </article>
  )
}
