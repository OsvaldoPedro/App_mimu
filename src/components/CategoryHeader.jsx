import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { categories } from '../data/categories'

const categoryStyles = {
  estadia: 'from-blue-900/90 to-blue-800/80',
  comer: 'from-orange-600/90 to-amber-600/80',
  festas: 'from-yellow-500/90 to-yellow-400/80',
  transporte: 'from-green-600/90 to-green-500/80',
  beleza: 'from-violet-600/90 to-purple-600/80',
  casa: 'from-gray-700/90 to-gray-800/80',
  automovel: 'from-slate-300/90 to-slate-200/80',
  entregas: 'from-amber-400/90 to-amber-300/80',
  profissionais: 'from-red-400/90 to-red-300/80',
  formacao: 'from-sky-200/90 to-sky-100/80'
}

const categoryImages = {
  estadia: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1920&q=80',
  comer: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1920&q=80',
  festas: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1920&q=80',
  transporte: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=1920&q=80',
  mobilidade: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1920&q=80',
  beleza: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=1920&q=80',
  casa: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=1920&q=80',
  automovel: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=1920&q=80',
  entregas: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920&q=80',
  profissionais: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1920&q=80',
  formacao: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1920&q=80'
}

export default function CategoryHeader({ categoryId, title, showSearch = true, search = '', onSearch }) {
  const { t } = useTranslation()
  const category = categories.find(c => c.id === categoryId) || categories[0]
  const styleClass = categoryStyles[categoryId] || categoryStyles.estadia
  const image = categoryImages[categoryId] || categoryImages.estadia

  return (
    <header className="relative pt-20">
      <div className="absolute inset-0">
        <img
          src={image}
          alt={title}
          className="w-full h-64 md:h-80 object-cover"
        />
        <div className={`absolute inset-0 bg-gradient-to-r ${styleClass}`} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <nav className="flex items-center gap-2 text-sm text-white/80 mb-4">
          <Link to="/" className="hover:text-white transition-colors">
            Mimu
          </Link>
          <span>/</span>
          <span className="text-white font-medium">{title}</span>
        </nav>

        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2">
          {category.icon} {title}
        </h1>
        <p className="text-white/90 max-w-2xl">
          {category.services.slice(0, 4).join(' • ')}
        </p>

        {showSearch && (
          <div className="mt-6 max-w-2xl">
            <div className="relative">
              <input
                type="search"
                value={search}
                placeholder={t('nav.search')}
                onChange={(e) => onSearch?.(e.target.value)}
                className="w-full px-6 py-4 rounded-2xl bg-white/95 text-[#3A0D0D] placeholder-[#5C1A1A]/60 focus:outline-none focus:ring-2 focus:ring-[#C58A2B] shadow-lg"
              />
              <svg className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#5C1A1A]/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

/*
import { Link } from 'react-router-dom'
import { categories } from '../data/categories'

const categoryStyles = {
  estadia: 'from-blue-900/90 to-blue-800/80',
  comer: 'from-orange-600/90 to-amber-600/80',
  mobilidade: 'from-emerald-700/90 to-teal-700/80',
  beleza: 'from-violet-600/90 to-purple-600/80',
  casa: 'from-slate-700/90 to-slate-800/80',
  eventos: 'from-yellow-500/90 to-yellow-400/80',
  auto: 'from-gray-400/90 to-gray-300/80',
  entregas: 'from-amber-400/90 to-amber-300/80',
  profissionais: 'from-red-400/90 to-red-300/80',
  formacao: 'from-blue-200/90 to-blue-100/80'
}

const categoryImages = {
  estadia: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1920&q=80',
  comer: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1920&q=80',
  mobilidade: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1920&q=80',
  beleza: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=1920&q=80',
  casa: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=1920&q=80',
  eventos: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1920&q=80',
  auto: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1920&q=80',
  entregas: 'https://images.unsplash.com/photo-1600185367073-d9305ec18a62?w=1920&q=80',
  profissionais: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1920&q=80',
  formacao: 'https://images.unsplash.com/photo-1581091012184-5c3a8f6f4482?w=1920&q=80'
}

export default function CategoryHeader({ categoryId, showSearch = true, search = '', onSearch }) {
  const category = categories.find(c => c.id === categoryId) || categories[0]
  const styleClass = categoryStyles[categoryId] || categoryStyles.estadia
  //const image = categoryImages[categoryId] || categoryImages.estadia

  return (
    <header className="relative pt-20">
      <div className="absolute inset-0">
        <img
          src={image}
          alt={category.name}
          className="w-full h-64 md:h-80 object-cover"
        />
        <div className={`absolute inset-0 bg-gradient-to-r ${styleClass}`} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <nav className="flex items-center gap-2 text-sm text-white/80 mb-4">
          <Link to="/" className="hover:text-white transition-colors">
            Mimu
          </Link>
          <span>/</span>
          <span className="text-white font-medium">{category.name}</span>
        </nav>

        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2">
          {category.icon} {category.name}
        </h1>
        <p className="text-white/90 max-w-2xl">
          {category.services.slice(0, 4).join(' • ')}
        </p>

        {showSearch && (
          <div className="mt-6 max-w-2xl">
            <div className="relative">
              <input
                type="search"
                value={search}
                placeholder="Pesquisar..."
                onChange={(e) => onSearch?.(e.target.value)}
                className="w-full px-6 py-4 rounded-2xl bg-white/95 text-[#3A0D0D] placeholder-[#5C1A1A]/60 focus:outline-none focus:ring-2 focus:ring-[#C58A2B] shadow-lg"
              />
              <svg className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#5C1A1A]/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}*/