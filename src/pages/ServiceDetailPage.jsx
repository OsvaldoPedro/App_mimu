import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { getServiceById } from '../data/services'
import { categories } from '../data/categories'
import { useAuth } from '../context/AuthContext'

function formatPrice(price, currency) {
  return new Intl.NumberFormat('pt-AO', { minimumFractionDigits: 0 }).format(price) + ' ' + currency
}

export default function ServiceDetailPage() {
  const { serviceId } = useParams()
  const { t } = useTranslation()
  const { user } = useAuth()
  const [selectedImage, setSelectedImage] = useState(0)

  const publicService = getServiceById(serviceId)
  const privateService = getServiceById(serviceId, { publicOnly: false })
  const canViewPrivate = Boolean(
    privateService && (
      user?.role === 'admin' ||
      privateService.companyId === user?.id ||
      privateService.providerId === user?.id
    )
  )
  const service = publicService || (canViewPrivate ? privateService : null)
  const isPublic = Boolean(publicService)

  if (!service) {
    return (
      <div className="min-h-screen bg-[#F4E8D8] flex items-center justify-center">
        <p className="text-xl text-[#5C1A1A]">{t('common.error')}</p>
        <Link to="/" className="ml-4 text-[#C58A2B]">{t('common.back')}</Link>
      </div>
    )
  }

  const category = categories.find(c => c.id === service.categoryId)

  return (
    <div className="min-h-screen bg-[#F4E8D8]">
      <Navbar />

      <main className="pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <nav className="flex items-center gap-2 text-sm text-[#5C1A1A]/80 mb-6">
            <Link to="/" className="hover:text-[#C58A2B]">Mimu</Link>
            <span>/</span>
            <Link to={`/categoria/${service.categoryId}`} className="hover:text-[#C58A2B]">
              {t(`category.${service.categoryId}`)}
            </Link>
            <span>/</span>
            <span className="text-[#3A0D0D] font-medium">{service.name}</span>
          </nav>

          {/* Galeria */}
          <div className="grid lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2">
              <div className="relative rounded-2xl overflow-hidden aspect-[16/10] bg-[#5C1A1A]/10">
                <img
                  src={service.images[selectedImage]}
                  alt={service.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
                {service.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-colors ${
                      selectedImage === i ? 'border-[#C58A2B]' : 'border-transparent'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Card de reserva */}
            <div>
              <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-24">
                <h1 className="text-2xl font-bold text-[#3A0D0D] mb-4">{service.name}</h1>
                {!isPublic && (
                  <div className="p-3 mb-4 bg-amber-100 text-amber-800 rounded-xl text-sm">
                    Este serviço está <strong>pendente de validação</strong> ou não está público. Apenas o proprietário e o admin o conseguem ver.
                  </div>
                )}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-amber-500 font-bold">★ {service.rating}</span>
                  <span className="text-[#5C1A1A]/70 text-sm">
                    {t('service.rating', { value: service.reviewCount })}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[#5C1A1A]/80 mb-4">
                  <svg className="w-4 h-4 text-[#C58A2B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                  {service.location}
                </div>
                <p className="text-2xl font-bold text-[#C58A2B] mb-6">
                  {t('service.from')} {formatPrice(service.price, service.currency)}
                  {service.priceType === 'perNight' && t('service.perNight')}
                  {service.priceType === 'perPerson' && t('service.perPerson')}
                  {service.priceType === 'perDay' && '/dia'}
                  {service.priceType === 'session' && '/sessão'}
                </p>
                {isPublic ? (
                  <Link
                    to={`/servico/${service.id}/reservar`}
                    className="flex items-center justify-center w-full py-4 bg-[#C58A2B] hover:bg-[#E0B15C] text-[#3A0D0D] font-bold rounded-xl transition-all duration-300 hover:scale-[1.02]"
                  >
                    {t('service.book')}
                  </Link>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="flex items-center justify-center w-full py-4 bg-gray-200 text-gray-500 font-bold rounded-xl cursor-not-allowed"
                  >
                    Reserva indisponível
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Descrição e comodidades */}
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <section className="bg-white rounded-2xl p-6 shadow-md">
                <h2 className="text-xl font-bold text-[#3A0D0D] mb-4">{t('service.description')}</h2>
                <p className="text-[#5C1A1A]/90 leading-relaxed">{service.description}</p>
              </section>

              <section className="bg-white rounded-2xl p-6 shadow-md">
                <h2 className="text-xl font-bold text-[#3A0D0D] mb-4">{t('service.amenities')}</h2>
                <div className="flex flex-wrap gap-2">
                  {service.amenities.map((a, i) => (
                    <span key={i} className="px-4 py-2 bg-[#F4E8D8] text-[#3A0D0D] rounded-xl">
                      {a}
                    </span>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
