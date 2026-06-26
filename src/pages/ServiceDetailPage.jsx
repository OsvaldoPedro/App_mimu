import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import ServiceProviderCard from '../components/ServiceProviderCard'
import { getServiceById } from '../data/services'
import { useAuth } from '../context/AuthContext'
import { useReviews } from '../hooks/useReviews'
import Button from '../components/common/Button'
import { toast } from 'react-hot-toast'

function formatPrice(price, currency) {
  return new Intl.NumberFormat('pt-AO', { minimumFractionDigits: 0 }).format(price || 0) + ' ' + (currency || 'AOA')
}

export default function ServiceDetailPage() {
  const { serviceId } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { user } = useAuth()
  
  const [selectedImage, setSelectedImage] = useState(0)
  const [service, setService] = useState(null)
  const [isPublic, setIsPublic] = useState(false)
  const [loading, setLoading] = useState(true)
  const { reviews, fetchReviews, loading: reviewsLoading } = useReviews(serviceId, 'service')

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        const publicSrv = await getServiceById(serviceId)
        const privateSrv = await getServiceById(serviceId, { publicOnly: false })
        
        const canViewPrivate = Boolean(
          privateSrv && (
            user?.role === 'admin' ||
            privateSrv.companyId === user?.id ||
            privateSrv.providerId === user?.id
          )
        )

        const foundService = publicSrv || (canViewPrivate ? privateSrv : null)
        setService(foundService)
        setIsPublic(Boolean(publicSrv))
      } catch (error) {
        console.error('Error loading service:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
    fetchReviews()
  }, [serviceId, user, fetchReviews])

  if (loading) {
     return (
        <div className="min-h-screen bg-mimu-cream dark:bg-[#121212] flex items-center justify-center">
             <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-mimu-gold"></div>
        </div>
     )
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-mimu-cream dark:bg-[#121212] flex items-center justify-center">
        <p className="text-xl text-mimu-wine-light-text dark:text-gray-300">{t('common.error')}</p>
        <Link to="/" className="ml-4 text-mimu-gold">{t('common.back')}</Link>
      </div>
    )
  }

  const provider = service.providerData
  const phone = provider?.phone || "Não especificado"

  return (
    <div className="min-h-screen bg-mimu-cream dark:bg-[#121212]">
      <Navbar />

      <main className="pt-28 sm:pt-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <nav className="flex items-center gap-2 text-sm text-mimu-wine-light-text dark:text-gray-300/80 mb-6">
            <Link to="/" className="hover:text-mimu-gold">Mimu</Link>
            <span>/</span>
            <Link to={`/categoria/${service.categoryId}`} className="hover:text-mimu-gold">
              {t(`category.${service.categoryId}`)}
            </Link>
            <span>/</span>
            <span className="text-mimu-wine-text dark:text-white font-medium">{service.name}</span>
          </nav>

          {/* Galeria */}
          <div className="grid lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2">
              <div className="relative rounded-2xl overflow-hidden aspect-[16/10] bg-mimu-wine-light/10">
                <img
                  src={service.images?.[selectedImage] || 'https://via.placeholder.com/1200x800?text=Service'}
                  alt={service.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
                {service.images?.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-colors ${
                      selectedImage === i ? 'border-mimu-gold' : 'border-transparent'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Card de reserva */}
            <div>
              <div className="bg-mimu-white dark:bg-[#1E1E1E] rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300 p-4 md:p-6 sticky top-24">
                <h1 className="text-xl md:text-2xl font-bold text-mimu-wine-text dark:text-white mb-4">{service.name}</h1>
                {!isPublic && (
                  <div className="p-3 mb-4 bg-amber-100 text-amber-800 rounded-xl text-sm">
                    {t('service.pendingValidation')}
                  </div>
                )}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-amber-500 font-bold">
                    ★ {service.rating > 0 ? Number(service.rating).toFixed(1) : 'Novo'}
                  </span>
                  <span className="text-mimu-wine-light-text dark:text-gray-300/70 text-sm">
                    {service.reviewCount || service.review_count || 0} avaliações
                  </span>
                </div>
                <div className="flex items-center gap-2 text-mimu-wine-light-text dark:text-gray-300/80 mb-4">
                  <svg className="w-4 h-4 text-mimu-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                  {service.location}
                </div>
                <p className="text-xl md:text-2xl font-bold text-mimu-gold mb-6">
                  {t('service.from')} {formatPrice(service.price, service.currency)}
                  {service.priceType === 'perNight' && t('service.perNight')}
                  {service.priceType === 'perPerson' && t('service.perPerson')}
                  {service.priceType === 'perDay' && t('service.perDay')}
                  {service.priceType === 'session' && t('service.perSession')}
                </p>
                {isPublic ? (
                  <Button
                    onClick={() => navigate(`/servico/${service.id}/reservar`)}
                    className="w-full py-4 text-mimu-wine-text dark:text-white text-lg"
                  >
                    {t('service.book')}
                  </Button>
                ) : (
                  <Button
                    disabled
                    variant="secondary"
                    className="w-full py-4 text-mimu-text-muted text-lg cursor-not-allowed"
                  >
                    {t('service.bookingUnavailable')}
                  </Button>
                )}

                {/* Info do Prestador com botões de chamada na Sidebar */}
                <div className="mt-6 pt-6 border-t border-mimu-cream-border dark:border-[#2A2A2A]">
                  <p className="text-sm text-mimu-wine-light-text dark:text-gray-300 font-medium mb-3 relative">
                    Contato direto: <span className="font-bold text-mimu-wine-text dark:text-white block mt-1 text-lg">{phone}</span>
                  </p>
                  <div className="flex gap-2">
                    {phone !== "Não especificado" ? (
                      <Button
                        variant="blue"
                        className="flex-1 py-3"
                        onClick={() => {
                          toast.success('A iniciar chamada...')
                          window.location.href = `tel:${phone}`
                        }}
                        icon={
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                        }
                      >
                        Ligar
                      </Button>
                    ) : (
                      <Button
                        variant="secondary"
                        disabled
                        className="flex-1 py-3 text-mimu-text-muted cursor-not-allowed"
                        icon={
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                        }
                      >
                        Ligar
                      </Button>
                    )}
                    <Button
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(phone)
                          toast.success('Número copiado com sucesso!')
                        } catch (err) {
                          console.error('Erro ao copiar:', err)
                          toast.error('Erro ao copiar número')
                        }
                      }}
                      variant="secondary"
                      className="flex-1 py-3"
                      icon={
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                        </svg>
                      }
                    >
                      Copiar
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Descrição e comodidades */}
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <section className="bg-mimu-white dark:bg-[#1E1E1E] rounded-2xl p-4 md:p-6 shadow-md">
                <h2 className="text-xl font-bold text-mimu-wine-text dark:text-white mb-4">{t('service.description')}</h2>
                <p className="text-mimu-wine-light-text dark:text-gray-300/90 leading-relaxed">{service.description}</p>
              </section>

              <section className="bg-mimu-white dark:bg-[#1E1E1E] rounded-2xl p-4 md:p-6 shadow-md">
                <h2 className="text-xl font-bold text-mimu-wine-text dark:text-white mb-4">{t('service.amenities')}</h2>
                <div className="flex flex-wrap gap-2">
                  {service.amenities?.map((a, i) => (
                    <span key={i} className="px-4 py-2 bg-mimu-cream dark:bg-[#121212] text-mimu-wine-text dark:text-white rounded-xl">
                      {a}
                    </span>
                  ))}
                </div>
              </section>

              {/* Informações do Prestador */}
              {provider && (
                <section className="bg-mimu-white dark:bg-[#1E1E1E] rounded-2xl p-4 md:p-6 shadow-md">
                  <h2 className="text-xl font-bold text-mimu-wine-text dark:text-white mb-4">{t('service.provider')}</h2>
                  <ServiceProviderCard provider={provider} />
                </section>
              )}

              {/* Seção de Avaliações */}
              <section className="bg-mimu-white dark:bg-[#1E1E1E] rounded-2xl p-4 md:p-6 shadow-md mt-6">
                <h2 className="text-xl font-bold text-mimu-wine-text dark:text-white mb-4">Avaliações e Comentários</h2>
                {reviewsLoading ? (
                  <p className="text-mimu-wine-light-text dark:text-gray-300/80">A carregar avaliações...</p>
                ) : reviews.length === 0 ? (
                  <p className="text-mimu-wine-light-text dark:text-gray-300/80">Este serviço ainda não tem avaliações. Recebe a tua primeira avaliação após a conclusão do primeiro pedido!</p>
                ) : (
                  <div className="space-y-4">
                    {reviews.map(r => (
                      <div key={r.id} className="p-4 bg-mimu-cream dark:bg-[#121212]/50 rounded-xl">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-full bg-mimu-cream dark:bg-[#121212] overflow-hidden shadow-sm">
                            {r.client?.avatar_url ? (
                              <img src={r.client.avatar_url} className="w-full h-full object-cover" alt="" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center font-bold text-mimu-wine-text dark:text-white">{r.client?.name?.[0] || 'C'}</div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-mimu-wine-text dark:text-white">{r.client?.name || 'Cliente'}</p>
                            <p className="text-xs text-mimu-wine-light-text dark:text-gray-300/60">{new Date(r.created_at).toLocaleDateString()}</p>
                          </div>
                          <div className="ml-auto text-mimu-gold flex text-sm">
                            {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                          </div>
                        </div>
                        <p className="text-sm text-mimu-wine-text dark:text-white italic mt-2">"{r.comment}"</p>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
