import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { getServiceById } from '../data/services'
import { useAuth } from '../context/AuthContext'
import { createOrder } from '../hooks/useOrders'

function formatPrice(price, currency) {
  return new Intl.NumberFormat('pt-AO', { minimumFractionDigits: 0 }).format(price) + ' ' + currency
}

// Calendário simples
function DatePicker({ value, onChange }) {
  const [month, setMonth] = useState(new Date().getMonth())
  const [year, setYear] = useState(new Date().getFullYear())

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDay = new Date(year, month, 1).getDay()
  const today = new Date()

  const days = []
  for (let i = 0; i < firstDay; i++) days.push(null)
  for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i))

  const isDisabled = (d) => d && d < new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const isSelected = (d) => value && d && d.toDateString() === value.toDateString()

  return (
    <div className="bg-white rounded-2xl p-6 shadow-md">
      <div className="flex justify-between items-center mb-4">
        <button
          type="button"
          onClick={() => {
            if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1);
          }}
          className="p-2 hover:bg-[#F4E8D8] rounded-lg"
        >
          ←
        </button>
        <span className="font-bold text-[#3A0D0D]">
          {['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'][month]} {year}
        </span>
        <button
          type="button"
          onClick={() => {
            if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1);
          }}
          className="p-2 hover:bg-[#F4E8D8] rounded-lg"
        >
          →
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-sm">
        {['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map(d => (
          <div key={d} className="font-medium text-[#5C1A1A]/70 py-1">{d}</div>
        ))}
        {days.map((d, i) => (
          <button
            key={i}
            type="button"
            disabled={d && isDisabled(d)}
            onClick={() => d && !isDisabled(d) && onChange(d)}
            className={`py-2 rounded-lg transition-colors ${
              !d ? 'invisible' :
              isDisabled(d) ? 'text-gray-300 cursor-not-allowed' :
              isSelected(d) ? 'bg-[#C58A2B] text-white' :
              'hover:bg-[#F4E8D8]'
            }`}
          >
            {d?.getDate()}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function BookingPage() {
  const { serviceId } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { user } = useAuth()
  const [step, setStep] = useState(1)
  const [confirmed, setConfirmed] = useState(false)

  const service = getServiceById(serviceId)
  if (!service) {
    return (
      <div className="min-h-screen bg-[#F4E8D8] flex items-center justify-center">
        <Link to="/" className="text-[#C58A2B]">{t('common.back')}</Link>
      </div>
    )
  }

  const isHotel = service.categoryId === 'estadia'
  const isRestaurant = service.categoryId === 'comer'
  const isConsultation = service.categoryId === 'beleza'
  const isEvents = service.categoryId === 'mobilidade'

  // Form state
  const [checkIn, setCheckIn] = useState(null)
  const [checkOut, setCheckOut] = useState(null)
  const [date, setDate] = useState(null)
  const [time, setTime] = useState('')
  const [guests, setGuests] = useState(1)
  const [groupSize, setGroupSize] = useState(2)
  const [room, setRoom] = useState(null)
  const [specialRequests, setSpecialRequests] = useState('')

  const timeSlots = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00']
  const rooms = isHotel ? [
    { id: 'std', name: 'Quarto Standard', price: service.price },
    { id: 'dlx', name: 'Quarto Deluxe', price: service.price * 1.5 },
    { id: 'ste', name: 'Suite', price: service.price * 2 }
  ] : []

  const handleConfirm = () => {
    if (user) {
      const dateStr = (isHotel ? checkIn : date) ? (isHotel ? checkIn : date).toLocaleDateString('pt-AO') : '-'
      createOrder({
        clientId: user.id,
        clientName: user.name || user.companyName,
        serviceId: service.id,
        serviceName: service.name,
        date: dateStr,
        time: time || '-',
        providerId: service.providerId || null,
        companyId: service.companyId || null,
        paymentMethod: 'A definir',
        paymentStatus: 'pendente'
      })
    }
    setConfirmed(true)
  }

  if (confirmed) {
    return (
      <div className="min-h-screen bg-[#F4E8D8]">
        <Navbar />
        <main className="pt-24 pb-16 px-4">
          <div className="max-w-lg mx-auto text-center">
            <div className="w-20 h-20 rounded-full bg-[#C58A2B] text-[#3A0D0D] flex items-center justify-center text-4xl mx-auto mb-6">
              ✓
            </div>
            <h1 className="text-2xl font-bold text-[#3A0D0D] mb-4">{t('booking.confirmation')}</h1>
            <p className="text-[#5C1A1A]/90 mb-8">{t('booking.confirmationMessage')}</p>
            <div className="flex flex-wrap gap-4 justify-center">
              {user && (
                <Link
                  to="/painel"
                  className="inline-block px-8 py-3 bg-[#C58A2B] hover:bg-[#E0B15C] text-[#3A0D0D] font-bold rounded-xl"
                >
                  Ver meus pedidos
                </Link>
              )}
              <Link
                to={`/servico/${service.id}`}
                className="inline-block px-8 py-3 border-2 border-[#C58A2B] text-[#3A0D0D] font-bold rounded-xl hover:bg-[#C58A2B]/10"
              >
                {t('common.back')}
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F4E8D8]">
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4">
          <nav className="flex items-center gap-2 text-sm text-[#5C1A1A]/80 mb-8">
            <Link to="/" className="hover:text-[#C58A2B]">Mimu</Link>
            <span>/</span>
            <Link to={`/categoria/${service.categoryId}`} className="hover:text-[#C58A2B]">{t(`category.${service.categoryId}`)}</Link>
            <span>/</span>
            <Link to={`/servico/${service.id}`} className="hover:text-[#C58A2B]">{service.name}</Link>
            <span>/</span>
            <span className="text-[#3A0D0D] font-medium">{t('service.book')}</span>
          </nav>

          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h1 className="text-2xl font-bold text-[#3A0D0D] mb-2">{service.name}</h1>
              <p className="text-[#5C1A1A]/80 mb-6">{service.location}</p>
              <img src={service.images[0]} alt="" className="rounded-2xl w-full h-48 object-cover" />

              {/* Hotel: Quartos */}
              {isHotel && step === 1 && (
                <div className="mt-6 space-y-3">
                  <h2 className="font-bold text-[#3A0D0D]">{t('hotel.selectRoom')}</h2>
                  {rooms.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setRoom(r.id)}
                      className={`w-full p-4 rounded-xl border-2 text-left transition-colors ${
                        room === r.id ? 'border-[#C58A2B] bg-[#F4E8D8]' : 'border-[#F4E8D8] hover:border-[#C58A2B]/50'
                      }`}
                    >
                      <span className="font-medium text-[#3A0D0D]">{r.name}</span>
                      <span className="block text-[#C58A2B] font-bold">{formatPrice(r.price, service.currency)}/noite</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-6">
              {/* Data e Hora */}
              {(isHotel || isRestaurant || isConsultation) && (
                <>
                  <div>
                    <label className="block font-medium text-[#3A0D0D] mb-2">{t('booking.selectDate')}</label>
                    {isHotel ? (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm text-[#5C1A1A]/70">{t('booking.checkIn')}</label>
                          <DatePicker value={checkIn} onChange={setCheckIn} />
                        </div>
                        <div>
                          <label className="text-sm text-[#5C1A1A]/70">{t('booking.checkOut')}</label>
                          <DatePicker value={checkOut} onChange={setCheckOut} />
                        </div>
                      </div>
                    ) : (
                      <DatePicker value={date} onChange={setDate} />
                    )}
                  </div>

                  <div>
                    <label className="block font-medium text-[#3A0D0D] mb-2">{t('booking.selectTime')}</label>
                    <div className="flex flex-wrap gap-2">
                      {timeSlots.map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setTime(slot)}
                          className={`px-4 py-2 rounded-xl border-2 transition-colors ${
                            time === slot ? 'border-[#C58A2B] bg-[#C58A2B] text-[#3A0D0D]' : 'border-[#F4E8D8] hover:border-[#C58A2B]/50'
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Tamanho do grupo / Hóspedes */}
              {isRestaurant && (
                <div>
                  <label className="block font-medium text-[#3A0D0D] mb-2">{t('restaurant.partySize')}</label>
                  <select
                    value={groupSize}
                    onChange={(e) => setGroupSize(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl border-2 border-[#F4E8D8] focus:border-[#C58A2B] focus:outline-none"
                  >
                    {[1,2,3,4,5,6,7,8,9,10].map(n => (
                      <option key={n} value={n}>{n} {n === 1 ? 'pessoa' : 'pessoas'}</option>
                    ))}
                  </select>
                </div>
              )}
              {isHotel && (
                <div>
                  <label className="block font-medium text-[#3A0D0D] mb-2">{t('booking.guests')}</label>
                  <select
                    value={guests}
                    onChange={(e) => setGuests(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl border-2 border-[#F4E8D8] focus:border-[#C58A2B] focus:outline-none"
                  >
                    {[1,2,3,4,5,6].map(n => (
                      <option key={n} value={n}>{n} {n === 1 ? 'hóspede' : 'hóspedes'}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Pedidos especiais */}
              <div>
                <label className="block font-medium text-[#3A0D0D] mb-2">{t('booking.specialRequests')}</label>
                <textarea
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border-2 border-[#F4E8D8] focus:border-[#C58A2B] focus:outline-none resize-none"
                  placeholder="Ex: Alergias, requisitos especiais..."
                />
              </div>

              <button
                onClick={handleConfirm}
                className="w-full py-4 bg-[#C58A2B] hover:bg-[#E0B15C] text-[#3A0D0D] font-bold rounded-xl transition-all hover:scale-[1.02]"
              >
                {t('booking.confirm')}
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
