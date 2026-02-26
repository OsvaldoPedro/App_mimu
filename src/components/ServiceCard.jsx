import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

function formatPrice(price, currency, priceType) {
  const formatted = new Intl.NumberFormat('pt-AO', { minimumFractionDigits: 0 }).format(price)
  return `${formatted} ${currency}`
}

export default function ServiceCard({ service }) {
  const { t } = useTranslation()

  const priceLabel = {
    perNight: t('service.perNight'),
    perPerson: t('service.perPerson'),
    perDay: '/dia',
    session: '/sessão',
    consultation: '/consulta',
    event: '/evento',
    service: ''
  }[service.priceType] || ''

  return (
    <article className="group bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-[#F4E8D8]">
      <Link to={`/servico/${service.id}`} className="block">
        <div className="relative h-48 sm:h-56 overflow-hidden">
          <img
            src={service.images[0]}
            alt={service.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/60 text-white text-sm font-semibold">
            <span>★</span>
            <span>{service.rating}</span>
          </div>
          <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
            <span className="text-[#C58A2B] font-bold text-lg">
              {t('service.from')} {formatPrice(service.price, service.currency)}{priceLabel}
            </span>
          </div>
        </div>

        <div className="p-5">
          <h3 className="text-lg font-bold text-[#3A0D0D] mb-2 group-hover:text-[#C58A2B] transition-colors line-clamp-2">
            {service.name}
          </h3>
          <div className="flex items-center gap-2 text-sm text-[#5C1A1A]/70 mb-3">
            <svg className="w-4 h-4 text-[#C58A2B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {service.location}
          </div>
          <p className="text-sm text-[#5C1A1A]/80 line-clamp-2 mb-4">
            {service.description}
          </p>
          <span className="text-[#5C1A1A]/60 text-xs">
            {t('service.rating', { value: service.reviewCount })}
          </span>
        </div>
      </Link>

      <div className="px-5 pb-5">
        <Link
          to={`/servico/${service.id}/reservar`}
          className="flex items-center justify-center gap-2 w-full py-3 bg-[#C58A2B] hover:bg-[#E0B15C] text-[#3A0D0D] font-bold rounded-xl transition-all duration-300 hover:scale-[1.02]"
        >
          {t('service.book')}
        </Link>
      </div>
    </article>
  )
}
