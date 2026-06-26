import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import OptimizedImage from './common/OptimizedImage'

function formatPrice(price, currency = 'AOA') {
  if (price === undefined || price === null) return '0 AOA'
  const formatted = new Intl.NumberFormat('pt-AO', { minimumFractionDigits: 0 }).format(price)
  return `${formatted} ${currency}`
}

export default function CompactServiceCard({ service }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  
  const provider = service.providerData || {}
  const getProviderName = () => provider.name || t('nav.provider', 'Prestador')

  // Role Badges
  const isCompany = provider.role === 'company'
  const providerRoleLabel = isCompany ? t('nav.company', 'Empresa').toUpperCase() : t('nav.provider', 'Prestador').toUpperCase()
  const roleBadgeColor = isCompany 
    ? 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800' 
    : 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800'

  // Rating Display
  const ratingValue = service.rating > 0 ? Number(service.rating).toFixed(1) : t('common.new', 'Novo')
  const reviewCount = service.reviewCount > 0 ? `(${service.reviewCount})` : ''

  // Price Suffix Mapping
  const getPriceSuffix = () => {
    if (!service.priceType) return ''
    const mapping = {
      perNight: ' ' + t('service.perNight', '/noite'),
      perPerson: ' ' + t('service.perPerson', '/pessoa'),
      perDay: ' /dia',
      session: ' /sessão',
      consultation: ' /consulta',
      event: ' /evento',
      service: ''
    }
    return mapping[service.priceType] || ''
  }

  const hasPromo = service.promocao_activa
  const isNew = service.novo_servico || service.novidade
  const discount = service.desconto || 0
  const oldPrice = service.price || 0
  const promoPrice = service.preco_promocional || (discount > 0 ? (oldPrice * (1 - discount / 100)) : oldPrice)
  const promoEnd = service.data_fim_promocao || service.data_promocao_fim
  const priceSuffix = getPriceSuffix()

  // Border highlight class depending on state
  const borderHighlightClass = hasPromo
    ? 'border-red-500/30 dark:border-red-500/20 shadow-[0_0_8px_rgba(239,68,68,0.04)] bg-gradient-to-br from-red-500/5 to-transparent'
    : isNew
      ? 'border-blue-500/30 dark:border-blue-500/20 shadow-[0_0_8px_rgba(59,130,246,0.04)] bg-gradient-to-br from-blue-500/5 to-transparent'
      : 'border-mimu-cream-border dark:border-[#2A2A2A]'

  return (
    <article className={`group bg-mimu-white dark:bg-[#1E1E1E] rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 border overflow-hidden ${borderHighlightClass}`}>
      <div 
        className="flex flex-row p-3 sm:p-4 gap-4 cursor-pointer"
        onClick={() => navigate(`/servico/${service.id}`)}
      >
        {/* Left Side: Image */}
        <div className="shrink-0 w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden relative shadow-inner">
          <OptimizedImage
            src={service.images && service.images.length > 0 ? service.images[0] : 'https://via.placeholder.com/150'}
            alt={service.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          {hasPromo && (
            <span className="absolute top-1.5 left-1.5 px-2 py-0.5 text-[8px] sm:text-[9px] font-extrabold uppercase bg-red-600 text-white rounded-md shadow-md tracking-wider">
              Promoção
            </span>
          )}
          {isNew && (
            <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 text-[8px] sm:text-[9px] font-extrabold uppercase bg-blue-600 text-white rounded-md shadow-md tracking-wider">
              Novo
            </span>
          )}
        </div>

        {/* Right Side: Content */}
        <div className="flex flex-col flex-grow min-w-0 justify-between">
          
          {/* Top Row: Title & Badge */}
          <div className="flex justify-between items-start gap-2 mb-1">
            <h3 className="text-base sm:text-lg font-bold text-mimu-wine-text dark:text-white leading-tight line-clamp-1 group-hover:text-mimu-gold transition-colors">
              {service.name}
            </h3>
            <span className={`shrink-0 px-2 py-0.5 text-[9px] sm:text-[10px] font-bold tracking-wider rounded-full border ${roleBadgeColor}`}>
              {providerRoleLabel}
            </span>
          </div>

          {/* Row 2: Provider Name */}
          <p className="text-sm text-mimu-wine-light-text dark:text-gray-400 line-clamp-1 mb-1">
            {getProviderName()}
          </p>

          {/* Row 3: Category & Location */}
          <p className="text-xs text-mimu-wine-light-text/80 dark:text-gray-500 line-clamp-1 mb-1">
            {service.categoryId || t('common.general', 'Geral')} • {service.location || t('common.noLocation', 'Localização não definida')}
          </p>
          
          {/* Row 3.5: Date */}
          {service.created_at && (
            <p className="text-[10px] text-mimu-wine-light-text/60 dark:text-gray-600 line-clamp-1 mb-1 sm:mb-0">
              {t('common.addedOn', 'Adicionado em:')} {new Date(service.created_at).toLocaleDateString('pt-AO', { day: '2-digit', month: 'short', year: 'numeric' })}
            </p>
          )}

          {/* Row 3.8: Price Display */}
          <div className="mt-1 mb-2">
            {hasPromo ? (
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] line-through text-red-500/80 dark:text-red-400/60 font-medium">
                    {formatPrice(oldPrice, service.currency)}
                  </span>
                  <span className="text-sm font-extrabold text-mimu-gold">
                    {formatPrice(promoPrice, service.currency)}{priceSuffix}
                  </span>
                  <span className="px-1.5 py-0.2 text-[9px] font-black bg-red-600 text-white rounded">
                    -{discount}%
                  </span>
                </div>
                {promoEnd && (
                  <span className="text-[9px] text-red-500/80 dark:text-red-400/80 mt-0.5 flex items-center gap-1">
                    <span className="inline-block animate-pulse w-1.5 h-1.5 rounded-full bg-red-500"></span>
                    {t('common.endsOn', 'Termina em:')} {new Date(promoEnd).toLocaleDateString('pt-AO')}
                  </span>
                )}
              </div>
            ) : (
              <div>
                <span className="text-sm font-bold text-mimu-gold dark:text-[#FFD166]">
                  {formatPrice(oldPrice, service.currency)}{priceSuffix}
                </span>
              </div>
            )}
          </div>

          {/* Row 4: Rating & Action Button */}
          <div className="flex items-center justify-between mt-auto pt-1 border-t border-mimu-cream-border/10 dark:border-[#2A2A2A]/50">
            <div className="flex items-center gap-1.5 text-sm">
              <span className="text-mimu-gold text-base">★</span>
              <span className="font-bold text-mimu-wine-text dark:text-white">{ratingValue}</span>
              <span className="text-mimu-wine-light-text dark:text-gray-500 text-xs">{reviewCount}</span>
            </div>
            
            <button 
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/servico/${service.id}`);
              }}
              className="px-4 py-1.5 bg-mimu-gold hover:bg-mimu-gold-hover text-mimu-wine-text dark:text-white text-sm font-bold rounded-lg transition-colors shadow-sm cursor-pointer"
            >
              {t('service.details', 'Detalhes')}
            </button>
          </div>

        </div>
      </div>
    </article>
  )
}
