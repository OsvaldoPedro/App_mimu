import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { getServiceById } from '../data/services'
import { useAuth } from '../context/AuthContext'
import { createOrder } from '../hooks/useOrders'
import Button from '../components/common/Button'
import { toast } from 'react-hot-toast'
import { createAppyPayment, getAppyPaymentStatus, cancelAppyPayment } from '../hooks/useAppyPay'
import { supabase } from '../config/supabaseClient'

function formatPrice(price, currency) {
  return new Intl.NumberFormat('pt-AO', { minimumFractionDigits: 0 }).format(price || 0) + ' ' + (currency || 'AOA')
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
    <div className="bg-mimu-white dark:bg-[#1E1E1E] rounded-2xl p-4 md:p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
      <div className="flex justify-between items-center mb-4">
        <button
          type="button"
          onClick={() => {
            if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1);
          }}
          className="p-2 hover:bg-mimu-cream dark:bg-[#121212] rounded-lg"
        >
          ←
        </button>
        <span className="font-bold text-mimu-wine-text dark:text-white">
          {['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'][month]} {year}
        </span>
        <button
          type="button"
          onClick={() => {
            if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1);
          }}
          className="p-2 hover:bg-mimu-cream dark:bg-[#121212] rounded-lg"
        >
          →
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs sm:text-sm">
        {['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map(d => (
          <div key={d} className="font-medium text-mimu-wine-light-text dark:text-gray-300/70 py-1 px-0.5 truncate">{d}</div>
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
              isSelected(d) ? 'bg-mimu-gold text-mimu-white-text' :
              'hover:bg-mimu-cream dark:bg-[#121212]'
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
  const { t } = useTranslation()
  const { user } = useAuth()
  const step = 1
  const [confirmed, setConfirmed] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activePayment, setActivePayment] = useState(null)
  const [checkingPayment, setCheckingPayment] = useState(false)
  
  const [service, setService] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const data = await getServiceById(serviceId)
      setService(data)
      setLoading(false)
    }
    load()
  }, [serviceId])

  useEffect(() => {
    if (!activePayment?.id) return

    const channel = supabase
      .channel(`payment-booking-${activePayment.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'payments',
          filter: `id=eq.${activePayment.id}`
        },
        (payload) => {
          console.log('[BookingPage] Payment updated in real-time:', payload.new)
          if (payload.new.status === 'paid') {
            toast.success('Pagamento confirmado em tempo real!')
            setConfirmed(true)
            setActivePayment(null)
          } else if (payload.new.status === 'cancelled' || payload.new.status === 'failed' || payload.new.status === 'expired') {
            toast.error(`O pagamento falhou ou foi cancelado (Estado: ${payload.new.status})`)
            setActivePayment(null)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [activePayment?.id])

  // Form state
  const [checkIn, setCheckIn] = useState(null)
  const [checkOut, setCheckOut] = useState(null)
  const [date, setDate] = useState(null)
  const [time, setTime] = useState('')
  const [guests, setGuests] = useState(1)
  const [groupSize, setGroupSize] = useState(2)
  const [tickets, setTickets] = useState(1)
  const [room, setRoom] = useState(null)
  const [specialRequests, setSpecialRequests] = useState('')
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('multicaixa_express')

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
        <Link to="/" className="text-mimu-gold">{t('common.back')}</Link>
      </div>
    )
  }

  // Flexibilidade com o novo modelo de BookingType
  const bType = service.bookingType || 'standard'
  const isHotel = bType === 'accommodation' || (bType === 'standard' && service.categoryId === 'estadia')
  const isRestaurant = bType === 'table' || (bType === 'standard' && service.categoryId === 'comer')
  const isConsultation = bType === 'appointment' || (bType === 'standard' && service.categoryId === 'beleza')
  const isEvent = bType === 'event'

  const timeSlots = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00']
  const rooms = isHotel ? [
    { id: 'std', name: 'Quarto Standard', price: service.price },
    { id: 'dlx', name: 'Quarto Deluxe', price: service.price * 1.5 },
    { id: 'ste', name: 'Suite', price: service.price * 2 }
  ] : []

  let isFormValid = true;
  if (isHotel) {
    if (!checkIn || !checkOut || !room || !time) isFormValid = false;
  } else if (isRestaurant || isConsultation || isEvent) {
    if (!date || !time) isFormValid = false;
  }

  const handleConfirm = async () => {
    setIsSubmitting(true)
    try {
      if (user) {
        const dateStr = (isHotel ? checkIn : date) ? (isHotel ? checkIn : date).toLocaleDateString('pt-AO') : '-'
        
        const finalGuests = isHotel ? guests : (isRestaurant ? groupSize : (isEvent ? tickets : 1));
        const finalTotal = isHotel && room ? (rooms.find(r => r.id === room)?.price || service.price) * finalGuests : (service.price * finalGuests);
        
        const phoneString = user.phone ? `[Tel. Cliente: ${user.phone}] ` : ''
        const finalRequests = isHotel && room ? `[Quarto: ${rooms.find(r => r.id === room)?.name}] ${phoneString}${specialRequests}` : `${phoneString}${specialRequests}`;

        const methodLabel = selectedPaymentMethod === 'multicaixa_express'
          ? 'Multicaixa Express'
          : 'Pagamento por Referência'

        const statusLabel = 'pendente'

        const bookingDetails = {
          clientId: user.id,
          clientName: user.name || user.companyName || 'Cliente Mimu',
          serviceId: service.id,
          serviceName: service.name,
          date: dateStr,
          time: time || '-',
          providerId: service.providerId || null,
          companyId: service.companyId || null,
          paymentMethod: methodLabel,
          paymentStatus: statusLabel,
          guests: finalGuests,
          total: finalTotal,
          specialRequests: finalRequests
        }

        const paymentRes = await createAppyPayment({
          user_id: user.id,
          service_id: service.id,
          amount: finalTotal,
          currency: service.currency || 'AOA',
          payment_method: selectedPaymentMethod,
          metadata: { booking_details: bookingDetails }
        })

        if (paymentRes.success && paymentRes.data) {
          toast.success('Pagamento iniciado! Por favor, conclua o pagamento para confirmar.')
          setActivePayment(paymentRes.data)
        } else {
          toast.error(paymentRes.error || 'Erro ao iniciar pagamento. Tente novamente.')
        }
      } else {
        toast.error('Precisa de iniciar sessão para contratar um serviço.')
      }
    } catch (e) {
      console.error(e)
      toast.error('Ocorreu um erro. Tenta novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCheckPaymentStatus = async () => {
    if (!activePayment) return
    setCheckingPayment(true)
    try {
      const res = await getAppyPaymentStatus(activePayment.id, activePayment.transaction_id)
      if (res.success && res.data) {
        if (res.data.status === 'paid') {
          toast.success('Pagamento confirmado com sucesso! A contratação foi concluída.')
          setConfirmed(true)
          setActivePayment(null)
        } else if (res.data.status === 'pending') {
          toast.error('O pagamento ainda se encontra pendente. Se acabou de pagar, por favor aguarde alguns segundos e tente novamente.')
        } else {
          toast.error(`O pagamento falhou ou foi cancelado (Estado: ${res.data.status})`)
          setActivePayment(null)
        }
      } else {
        toast.error(res.error || 'Não foi possível verificar o estado do pagamento.')
      }
    } catch (e) {
      console.error(e)
      toast.error('Erro ao verificar pagamento.')
    } finally {
      setCheckingPayment(false)
    }
  }

  const handleCancelPayment = async () => {
    if (!activePayment) return
    if (!window.confirm('Tem a certeza que deseja cancelar este pagamento e o pedido?')) return
    
    setIsSubmitting(true)
    try {
      const res = await cancelAppyPayment(activePayment.id, activePayment.transaction_id)
      if (res.success) {
        toast.success('Pagamento cancelado com sucesso.')
        setActivePayment(null)
      } else {
        toast.error(res.error || 'Erro ao cancelar pagamento.')
      }
    } catch (e) {
      console.error(e)
      toast.error('Erro ao cancelar pagamento.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (activePayment) {
    return (
      <div className="min-h-screen bg-mimu-cream dark:bg-[#121212]">
        <Navbar />
        <main className="pt-24 pb-16 px-4">
          <div className="max-w-xl mx-auto bg-white dark:bg-[#1E1E1E] rounded-3xl p-6 md:p-8 shadow-lg border border-mimu-cream-border dark:border-[#2A2A2A]">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-mimu-gold/10 text-mimu-gold flex items-center justify-center text-3xl mx-auto mb-4 animate-pulse">
                💳
              </div>
              <h1 className="text-2xl font-bold text-mimu-wine-text dark:text-white mb-2">Pagamento Pendente</h1>
              <p className="text-mimu-wine-light-text dark:text-gray-300/80 text-sm">
                Por favor, conclua o pagamento de forma a confirmar a contratação do serviço.
              </p>
            </div>

            {/* Detalhes do Pedido */}
            <div className="bg-mimu-cream/45 dark:bg-[#121212] rounded-2xl p-5 mb-6 space-y-3">
              <div className="flex justify-between border-b border-mimu-cream-border dark:border-[#2A2A2A] pb-2">
                <span className="text-sm text-mimu-wine-light-text dark:text-gray-400 font-medium">Serviço</span>
                <span className="font-semibold text-mimu-wine-text dark:text-white">{service.name}</span>
              </div>
              <div className="flex justify-between border-b border-mimu-cream-border dark:border-[#2A2A2A] pb-2">
                <span className="text-sm text-mimu-wine-light-text dark:text-gray-400 font-medium">Valor a Pagar</span>
                <span className="font-bold text-mimu-gold text-lg">{formatPrice(activePayment.amount, activePayment.currency)}</span>
              </div>
              <div className="flex justify-between pb-1">
                <span className="text-sm text-mimu-wine-light-text dark:text-gray-400 font-medium">Referência Mimu</span>
                <span className="font-mono text-mimu-wine-text dark:text-white text-sm">{activePayment.reference}</span>
              </div>
            </div>

            {/* Ações de Pagamento */}
            <div className="space-y-4">
              {activePayment.payment_url && (
                <a
                  href={activePayment.payment_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full py-4 text-center bg-mimu-gold hover:bg-mimu-gold-hover text-mimu-wine-text dark:text-white font-bold rounded-xl shadow-md transition-colors animate-bounce"
                >
                  Pagar com Appy Pay ↗
                </a>
              )}

              <Button
                onClick={handleCheckPaymentStatus}
                loading={checkingPayment}
                loadingText="A verificar pagamento..."
                variant="primary"
                className="w-full py-4 text-mimu-wine-text dark:text-white text-lg font-bold border-2 border-transparent bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-700"
              >
                Confirmar Pagamento
              </Button>

              <button
                type="button"
                onClick={handleCancelPayment}
                className="w-full py-3 text-center text-sm font-semibold text-red-500 hover:text-red-600 transition-colors"
              >
                Cancelar Pagamento & Pedido
              </button>
            </div>

            {/* Nota Informativa */}
            <p className="text-center text-xs text-mimu-wine-light-text dark:text-gray-500/70 mt-6 leading-relaxed">
              * Nota: Em ambiente de testes, o pagamento será automaticamente confirmado após um clique no botão "Confirmar Pagamento".
            </p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (confirmed) {
    return (
      <div className="min-h-screen bg-mimu-cream dark:bg-[#121212]">
        <Navbar />
        <main className="pt-24 pb-16 px-4">
          <div className="max-w-lg mx-auto text-center">
            <div className="w-20 h-20 rounded-full bg-mimu-gold text-mimu-wine-text dark:text-white flex items-center justify-center text-xl md:text-2xl md:text-3xl md:text-4xl mx-auto mb-6">
              ✓
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-mimu-wine-text dark:text-white mb-4">{t('booking.confirmation')}</h1>
            <p className="text-mimu-wine-light-text dark:text-gray-300/90 mb-8">{t('booking.confirmationMessage')}</p>
            <div className="flex flex-wrap gap-4 justify-center">
              {user && (
                <Link
                  to="/painel"
                  className="inline-block px-8 py-3 bg-mimu-gold hover:bg-mimu-gold-hover text-mimu-wine-text dark:text-white font-bold rounded-xl"
                >
                  Ver meus pedidos
                </Link>
              )}
              <Link
                to={`/servico/${service.id}`}
                className="inline-block px-8 py-3 border-2 border-mimu-gold text-mimu-wine-text dark:text-white font-bold rounded-xl hover:bg-mimu-gold/10"
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
    <div className="min-h-screen bg-mimu-cream dark:bg-[#121212]">
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4">
          <nav className="flex items-center gap-2 text-sm text-mimu-wine-light-text dark:text-gray-300/80 mb-8">
            <Link to="/" className="hover:text-mimu-gold">Mimu</Link>
            <span>/</span>
            <Link to={`/categoria/${service.categoryId}`} className="hover:text-mimu-gold">{t(`category.${service.categoryId}`)}</Link>
            <span>/</span>
            <Link to={`/servico/${service.id}`} className="hover:text-mimu-gold">{service.name}</Link>
            <span>/</span>
            <span className="text-mimu-wine-text dark:text-white font-medium">{t('service.book')}</span>
          </nav>

          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-mimu-wine-text dark:text-white mb-2">{service.name}</h1>
              <p className="text-mimu-wine-light-text dark:text-gray-300/80 mb-6">{service.location}</p>
              <img src={service.images?.[0] || 'https://via.placeholder.com/800x600?text=Service'} alt="" className="rounded-2xl w-full h-48 object-cover" />

              {/* Hotel: Quartos */}
              {isHotel && step === 1 && (
                <div className="mt-6 space-y-3">
                  <h2 className="font-bold text-mimu-wine-text dark:text-white">{t('hotel.selectRoom')}</h2>
                  {rooms.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setRoom(r.id)}
                      className={`w-full p-4 rounded-xl border-2 text-left transition-colors ${
                        room === r.id ? 'border-mimu-gold bg-mimu-cream dark:bg-[#121212]' : 'border-mimu-cream-border dark:border-[#2A2A2A] hover:border-mimu-gold/50'
                      }`}
                    >
                      <span className="font-medium text-mimu-wine-text dark:text-white">{r.name}</span>
                      <span className="block text-mimu-gold font-bold">{formatPrice(r.price, service.currency)}/noite</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-6">
              {/* Data e Hora */}
              {(isHotel || isRestaurant || isConsultation || isEvent) && (
                <>
                  <div>
                    <label className="block font-medium text-mimu-wine-text dark:text-white mb-2">{t('booking.selectDate')}</label>
                    {isHotel ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm text-mimu-wine-light-text dark:text-gray-300/70">{t('booking.checkIn')}</label>
                          <DatePicker value={checkIn} onChange={setCheckIn} />
                        </div>
                        <div>
                          <label className="text-sm text-mimu-wine-light-text dark:text-gray-300/70">{t('booking.checkOut')}</label>
                          <DatePicker value={checkOut} onChange={setCheckOut} />
                        </div>
                      </div>
                    ) : (
                      <DatePicker value={date} onChange={setDate} />
                    )}
                  </div>

                  <div>
                    <label className="block font-medium text-mimu-wine-text dark:text-white mb-2">{t('booking.selectTime')}</label>
                    <div className="flex flex-wrap gap-2">
                      {timeSlots.map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setTime(slot)}
                          className={`px-4 py-2 rounded-xl border-2 transition-colors ${
                            time === slot ? 'border-mimu-gold bg-mimu-gold text-mimu-wine-text dark:text-white' : 'border-mimu-cream-border dark:border-[#2A2A2A] hover:border-mimu-gold/50'
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Tamanho do grupo / Hóspedes / Bilhetes */}
              {isRestaurant && (
                <div>
                  <label className="block font-medium text-mimu-wine-text dark:text-white mb-2">{t('restaurant.partySize')}</label>
                  <select
                    value={groupSize}
                    onChange={(e) => setGroupSize(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl border-2 border-mimu-cream-border dark:border-[#2A2A2A] focus:border-mimu-gold focus:outline-none"
                  >
                    {[1,2,3,4,5,6,7,8,9,10].map(n => (
                      <option key={n} value={n}>{n} {n === 1 ? 'pessoa' : 'pessoas'}</option>
                    ))}
                  </select>
                </div>
              )}
              {isEvent && (
                <div>
                  <label className="block font-medium text-mimu-wine-text dark:text-white mb-2">Número de Bilhetes / Lugares</label>
                  <select
                    value={tickets}
                    onChange={(e) => setTickets(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl border-2 border-mimu-cream-border dark:border-[#2A2A2A] focus:border-mimu-gold focus:outline-none"
                  >
                    {[1,2,3,4,5,6,7,8,9,10].map(n => (
                      <option key={n} value={n}>{n} {n === 1 ? 'bilhete' : 'bilhetes'}</option>
                    ))}
                  </select>
                </div>
              )}
              {isHotel && (
                <div>
                  <label className="block font-medium text-mimu-wine-text dark:text-white mb-2">{t('booking.guests')}</label>
                  <select
                    value={guests}
                    onChange={(e) => setGuests(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl border-2 border-mimu-cream-border dark:border-[#2A2A2A] focus:border-mimu-gold focus:outline-none"
                  >
                    {[1,2,3,4,5,6].map(n => (
                      <option key={n} value={n}>{n} {n === 1 ? 'hóspede' : 'hóspedes'}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Pedidos especiais */}
              <div>
                <label className="block font-medium text-mimu-wine-text dark:text-white mb-2">{t('booking.specialRequests')}</label>
                <textarea
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border-2 border-mimu-cream-border dark:border-[#2A2A2A] focus:border-mimu-gold focus:outline-none resize-none"
                  placeholder="Ex: Alergias, requisitos especiais..."
                />
              </div>

              {/* Método de Pagamento */}
              <div className="space-y-3">
                <label className="block font-semibold text-mimu-wine-text dark:text-white">
                  Método de Pagamento
                </label>
                
                <div className="grid grid-cols-1 gap-3">
                  {/* Opção Multicaixa Express */}
                  <button
                    type="button"
                    onClick={() => setSelectedPaymentMethod('multicaixa_express')}
                    className={`p-4 rounded-xl border-2 text-left transition-all flex items-start gap-3 ${
                      selectedPaymentMethod === 'multicaixa_express'
                        ? 'border-mimu-gold bg-mimu-cream/35 dark:bg-[#121212]/35'
                        : 'border-mimu-cream-border dark:border-[#2A2A2A] hover:border-mimu-gold/50'
                    }`}
                  >
                    <span className="text-xl mt-0.5">📱</span>
                    <div className="flex-1">
                      <p className="font-bold text-mimu-wine-text dark:text-white text-sm">
                        Multicaixa Express
                      </p>
                      <p className="text-xs text-mimu-wine-light-text dark:text-gray-400 mt-0.5">
                        Pague de forma instantânea e segura usando o número de telefone associado ao seu Express.
                      </p>
                    </div>
                  </button>

                  {/* Opção Pagamento por Referência */}
                  <button
                    type="button"
                    onClick={() => setSelectedPaymentMethod('reference')}
                    className={`p-4 rounded-xl border-2 text-left transition-all flex items-start gap-3 ${
                      selectedPaymentMethod === 'reference'
                        ? 'border-mimu-gold bg-mimu-cream/35 dark:bg-[#121212]/35'
                        : 'border-mimu-cream-border dark:border-[#2A2A2A] hover:border-mimu-gold/50'
                    }`}
                  >
                    <span className="text-xl mt-0.5">🔢</span>
                    <div className="flex-1">
                      <p className="font-bold text-mimu-wine-text dark:text-white text-sm">
                        Pagamento por Referência
                      </p>
                      <p className="text-xs text-mimu-wine-light-text dark:text-gray-400 mt-0.5">
                        Gere uma referência e pague em qualquer caixa eletrónica (ATM) ou via Internet Banking.
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              <Button
                onClick={handleConfirm}
                disabled={!isFormValid}
                loading={isSubmitting}
                loadingText="A processar reserva..."
                variant="primary"
                className="w-full py-4 text-mimu-wine-text dark:text-white text-lg"
              >
                {t('booking.confirm')}
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
