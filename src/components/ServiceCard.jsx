import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import OptimizedImage from './common/OptimizedImage'
import Button from './common/Button'
import { toast } from 'react-hot-toast'

function formatPrice(price, currency) {
  const formatted = new Intl.NumberFormat('pt-AO', { minimumFractionDigits: 0 }).format(price)
  return `${formatted} ${currency}`
}

export default function ServiceCard({ service }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [copied, setCopied] = useState(false)
  const provider = service.providerData || {}
  const phone = provider.phone || "Não especificado"
  const getProviderName = () => provider.name || "Prestador"
  const handleCopyPhone = async (e) => {
    e.preventDefault() // Impede a navegação do Link superior
    try {
      await navigator.clipboard.writeText(phone)
      setCopied(true)
      toast.success("Número copiado com sucesso!")
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Erro ao copiar:', err)
      toast.error("Erro ao copiar número")
    }
  }

  const userPhoto = provider?.avatar || provider?.avatar_url || provider?.logo_url || provider?.photo || provider?.logo;
  const userAvatar = userPhoto ? (
    <img src={userPhoto} alt="Avatar do prestador" className="w-10 h-10 rounded-full object-cover border-2 border-mimu-gold shadow-sm transform transition-transform hover:scale-110" />
  ) : (
    <div className="w-10 h-10 rounded-full bg-mimu-cream dark:bg-[#121212] flex items-center justify-center border-2 border-mimu-gold shadow-sm transform transition-transform hover:scale-110">
      <span className="text-mimu-wine-text dark:text-white font-bold text-sm">
        {getProviderName().charAt(0)?.toUpperCase()}
      </span>
    </div>
  );

  const priceLabel = {
    perNight: t('service.perNight'),
    perPerson: t('service.perPerson'),
    perDay: '/dia',
    session: '/sessão',
    consultation: '/consulta',
    event: '/evento',
    service: ''
  }[service.priceType] || ''

  const providerRoleLabel = provider.role === 'company' ? 'Empresa' : provider.role === 'provider' ? 'Prestador' : 'Profissional'
  const roleBadgeColor = provider.role === 'company' ? 'bg-indigo-100 text-indigo-800 border-indigo-200' : 'bg-emerald-100 text-emerald-800 border-emerald-200'

  return (
    <article className="group bg-mimu-white dark:bg-[#1E1E1E] rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-mimu-cream-border dark:border-[#2A2A2A]">
      <Link to={`/servico/${service.id}`} className="block">
        <div className="relative w-full aspect-[4/3] sm:aspect-video overflow-hidden">
          <OptimizedImage
            src={service.images[0]}
            alt={service.name}
            className="w-full h-full"
            imgClassName="group-hover:scale-110"
          />
          <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/60 text-mimu-white-text text-sm font-semibold pointer-events-none">
            <span>★</span>
            <span>{service.rating > 0 ? Number(service.rating).toFixed(1) : 'Novo'}</span>
          </div>
          <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end pointer-events-none">
            <span className="text-mimu-gold font-bold text-sm sm:text-base md:text-lg bg-black/60 px-2.5 py-1 rounded-lg inline-block whitespace-normal break-words max-w-full leading-tight pointer-events-auto">
              {t('service.from')} {formatPrice(service.price, service.currency)}{priceLabel}
            </span>
          </div>
        </div>

        <div className="p-5 relative">
          <div className="absolute -top-6 right-5 flex flex-col items-center cursor-help" title={getProviderName()}>
             {userAvatar}
             <span className={`mt-1 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-full border shadow-sm ${roleBadgeColor}`}>
               {providerRoleLabel}
             </span>
          </div>
          <h3 className="text-lg font-bold text-mimu-wine-text dark:text-white mb-2 pr-20 group-hover:text-mimu-gold transition-colors line-clamp-2">
            {service.name}
          </h3>
          <div className="flex items-start gap-2 text-sm text-mimu-wine-light-text dark:text-gray-300/70 mb-3 min-w-0">
            <svg className="w-4 h-4 mt-0.5 shrink-0 text-mimu-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="break-words line-clamp-1">{service.location}</span>
          </div>
          <p className="text-sm text-mimu-wine-light-text dark:text-gray-300/80 line-clamp-2 mb-4">
            {service.description}
          </p>
          <span className="text-mimu-wine-light-text dark:text-gray-300/60 text-xs">
            {t('service.rating', { value: service.reviewCount })}
          </span>
        </div>
      </Link>

      <div className="px-5 pb-5">
        <div className="mb-4 pt-3 border-t border-mimu-cream-border dark:border-[#2A2A2A]">
          <p className="text-sm text-mimu-wine-light-text dark:text-gray-300 font-medium mb-2 break-all sm:break-words">
            Contato: <span className="font-bold">{phone}</span>
          </p>
          <div className="flex gap-2">
            <Button
              variant="blue"
              className="flex-1 py-2 text-sm gap-1"
              disabled={phone === "Não especificado"}
              onClick={(e) => {
                e.stopPropagation()
                e.preventDefault()
                if (phone !== "Não especificado") {
                  toast.success('A iniciar chamada...')
                  window.location.href = `tel:${phone}`
                }
              }}
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              }
            >
              Ligar
            </Button>
            <Button
              onClick={(e) => {
                e.stopPropagation()
                handleCopyPhone(e)
              }}
              variant="secondary"
              className="flex-1 py-2 text-sm gap-1"
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
              }
            >
              {copied ? "Copiado!" : "Copiar"}
            </Button>
          </div>
        </div>
        <Button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            navigate(`/servico/${service.id}/reservar`)
          }}
          className="w-full py-3 mt-4 text-mimu-wine-text dark:text-white text-base"
        >
          {t('service.book')}
        </Button>
      </div>
    </article>
  )
}
