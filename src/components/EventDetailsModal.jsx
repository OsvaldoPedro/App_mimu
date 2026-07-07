import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { useTheme } from '../context/ThemeContext'
import { useMKT360EventDetails, purchaseMKT360Tickets } from '../hooks/useMKT360'
import { supabase } from '../config/supabaseClient'
import { createAppyPayment, getAppyPaymentStatus, cancelAppyPayment } from '../hooks/useAppyPay'

export default function EventDetailsModal({ event, onClose }) {
  const { user } = useAuth()
  const { theme } = useTheme()
  // Use mkt360_event_id for GoTicket lookup; local events without it skip the external call
  const mktEventId = event?.mkt360_event_id || null
  const { event: detailedEvent, loading: loadingDetails, error: errorDetails } = useMKT360EventDetails(mktEventId)

  const [localImageUrl, setLocalImageUrl] = useState(null)

  // Fetch local image fallback if none provided
  useEffect(() => {
    async function fetchLocalImage() {
      const targetId = event?.mkt360_event_id || event?.id
      if (!targetId) return
      try {
        const { data, error } = await supabase
          .from('events')
          .select('image_url')
          .eq('mkt360_event_id', targetId)
          .not('image_url', 'is', null)
          .maybeSingle()
        if (!error && data?.image_url) {
          setLocalImageUrl(data.image_url)
        }
      } catch (err) {
        console.error('Error fetching local fallback image in modal:', err)
      }
    }
    if (event && !event.image_url && !event.banner) {
      fetchLocalImage()
    }
  }, [event])

  // Estados do formulário de compra
  const [buyerName, setBuyerName] = useState('')
  const [buyerEmail, setBuyerEmail] = useState('')
  const [buyerPhone, setBuyerPhone] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [quantity, setQuantity] = useState(1)
  
  const [buying, setBuying] = useState(false)
  const [purchaseSuccess, setPurchaseSuccess] = useState(false)
  const [orderResult, setOrderResult] = useState(null)
  const [activePayment, setActivePayment] = useState(null)
  const [checkingPayment, setCheckingPayment] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('multicaixa_express')

  useEffect(() => {
    if (user) {
      setBuyerName(user.user_metadata?.name || user.name || '')
      setBuyerEmail(user.email || '')
      setBuyerPhone(user.phone || user.user_metadata?.phone || '')
    }
  }, [user])

  useEffect(() => {
    if (!activePayment?.id) return

    const channel = supabase
      .channel(`payment-events-${activePayment.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'payments',
          filter: `id=eq.${activePayment.id}`
        },
        (payload) => {
          console.log('[EventDetailsModal] Payment updated in real-time:', payload.new)
          const updatedPayment = payload.new
          if (updatedPayment.status === 'paid') {
            toast.success('Pagamento confirmado em tempo real!')
            const ticketOrder = updatedPayment.metadata?.ticket_order || null
            setOrderResult(ticketOrder)
            setPurchaseSuccess(true)
            setActivePayment(null)
          } else if (updatedPayment.status === 'cancelled' || updatedPayment.status === 'failed' || updatedPayment.status === 'expired') {
            toast.error(`O pagamento falhou ou foi cancelado (Estado: ${updatedPayment.status})`)
            setActivePayment(null)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [activePayment?.id])

  // Extrair lotes de tickets
  // Priority: GoTicket detailed data > local event ticket_types/batches > default fallback
  const rawTicketTypes = detailedEvent?.ticket_types || detailedEvent?.tickets || detailedEvent?.batches
    || event?.ticket_types || event?.batches || []
  
  // Garantir que temos pelo menos um tipo de bilhete
  const ticketTypes = !event ? [] : (rawTicketTypes.length > 0 ? rawTicketTypes : [
    {
      id: 'default',
      name: 'Geral',
      price: detailedEvent?.price || event?.price || 0,
      description: 'Ingresso de Acesso Geral'
    }
  ])

  // Definir lote inicial selecionado
  useEffect(() => {
    if (ticketTypes.length > 0 && !selectedType) {
      setSelectedType(ticketTypes[0].id)
    }
  }, [ticketTypes, selectedType])

  if (!event) return null

  const handlePurchase = async (e) => {
    e.preventDefault()
    if (!user) {
      toast.error('Inicie sessão para poder comprar bilhetes.')
      return
    }

    if (!buyerName || !buyerEmail) {
      toast.error('Por favor, preencha o Nome e o Email.')
      return
    }

    const selectedBatch = ticketTypes.find(t => t.id === selectedType)
    const priceVal = selectedBatch ? parseFloat(selectedBatch.price) : 0
    const totalAmount = isNaN(priceVal) ? 0 : priceVal * quantity

    setBuying(true)
    const toastId = toast.loading('A inicializar o pagamento com Appy Pay...')
    
    try {
      const paymentData = {
        user_id: user.id,
        event_id: event.id,
        amount: totalAmount,
        currency: 'AOA',
        payment_method: selectedPaymentMethod,
        metadata: {
          purchase_details: {
            eventId: event.id,
            ticketTypeId: selectedType,
            qty: quantity,
            buyerName,
            buyerEmail,
            buyerPhone
          }
        }
      }

      const result = await createAppyPayment(paymentData)

      if (result.success) {
        toast.success('Pagamento iniciado! Conclua na Appy Pay.', { id: toastId })
        setActivePayment(result.data)
      } else {
        toast.error(`Falha ao iniciar pagamento: ${result.error}`, { id: toastId })
      }
    } catch (err) {
      console.error(err)
      toast.error('Ocorreu um erro inesperado ao inicializar o pagamento.', { id: toastId })
    } finally {
      setBuying(false)
    }
  }

  const handleVerifyPayment = async () => {
    if (!activePayment) return
    setCheckingPayment(true)
    const toastId = toast.loading('A verificar o estado do seu pagamento...')
    try {
      const result = await getAppyPaymentStatus(activePayment.id, activePayment.transaction_id)
      if (result.success) {
        const { status, ticket_order } = result.data
        if (status === 'paid') {
          toast.success('Pagamento confirmado e bilhete emitido com sucesso!', { id: toastId })
          setOrderResult(ticket_order)
          setPurchaseSuccess(true)
          setActivePayment(null)
        } else if (status === 'pending') {
          toast.error('O pagamento ainda está pendente. Por favor, conclua o pagamento no site da Appy Pay.', { id: toastId })
        } else {
          toast.error(`O pagamento foi ${status}. Compra cancelada ou mal sucedida.`, { id: toastId })
          setActivePayment(null)
        }
      } else {
        toast.error(`Falha ao verificar status: ${result.error}`, { id: toastId })
      }
    } catch (err) {
      console.error(err)
      toast.error('Erro ao verificar o pagamento.', { id: toastId })
    } finally {
      setCheckingPayment(false)
    }
  }

  const handleCancelPayment = async () => {
    if (!activePayment) return
    const confirmCancel = window.confirm('Deseja realmente cancelar esta compra de bilhete?')
    if (!confirmCancel) return

    setBuying(true)
    const toastId = toast.loading('A cancelar o pagamento...')
    try {
      const result = await cancelAppyPayment(activePayment.id, activePayment.transaction_id)
      if (result.success) {
        toast.success('Compra cancelada com sucesso.', { id: toastId })
        setActivePayment(null)
      } else {
        toast.error(`Falha ao cancelar: ${result.error}`, { id: toastId })
      }
    } catch (err) {
      console.error(err)
      toast.error('Erro ao cancelar a compra.', { id: toastId })
    } finally {
      setBuying(false)
    }
  }

  const dateVal = detailedEvent?.date || detailedEvent?.start_date || event?.date || event?.start_date
  const dateObj = dateVal ? new Date(dateVal) : new Date()
  const formattedDate = dateObj.toLocaleDateString('pt-PT', { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
  })

  const location = detailedEvent?.location || detailedEvent?.venue || event?.location || 'Consultar Detalhes'
  const title = detailedEvent?.title || detailedEvent?.name || event?.title || 'Evento MKT360'
  let rawImageUrl = detailedEvent?.image_url || detailedEvent?.banner || event?.image_url || event?.banner || localImageUrl
  if (rawImageUrl && !rawImageUrl.startsWith('http') && !rawImageUrl.startsWith('data:')) {
    rawImageUrl = `https://goticket.ao${rawImageUrl.startsWith('/') ? '' : '/'}${rawImageUrl}`
  }
  const imageUrl = rawImageUrl
  const category = detailedEvent?.category || detailedEvent?.activity_type || detailedEvent?.type || event?.category || event?.type

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className={`w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh] transition-colors duration-300 border ${
        theme === 'dark' ? 'bg-[#1E1E1E] border-[#2A2A2A] text-white' : 'bg-white border-mimu-cream-border text-mimu-text-dark'
      }`}>
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center bg-black/40 hover:bg-black/60 text-white rounded-full transition-all duration-200 active:scale-95 shadow"
        >
          ✕
        </button>

        {/* Banner Image */}
        <div className="h-48 md:h-56 w-full bg-mimu-gray-200 relative shrink-0 overflow-hidden">
          {imageUrl ? (
            <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-mimu-gold/20 flex items-center justify-center">
              <span className="text-5xl">📅</span>
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent p-6 pt-12">
            {category && (
              <span className="inline-block px-2.5 py-1 bg-mimu-gold text-mimu-text-dark text-[10px] font-extrabold rounded-md mb-2 uppercase tracking-wider">
                {category}
              </span>
            )}
            <h2 className="text-xl md:text-2xl font-black text-white leading-tight">
              {title}
            </h2>
          </div>
        </div>

        {/* Content Area (Scrollable) */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {purchaseSuccess ? (
            /* Tela de Sucesso após Compra */
            <div className="text-center py-8 px-4 space-y-5 animate-fade-in">
              <div className="w-16 h-16 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto text-3xl">
                ✓
              </div>
              <h3 className="text-2xl font-bold text-green-500">Compra Confirmada!</h3>
              <p className={`text-sm max-w-md mx-auto ${theme === 'dark' ? 'text-gray-300' : 'text-mimu-wine-light-text'}`}>
                Parabéns! O seu pedido para o evento foi processado com sucesso pela MKT360.
              </p>
              
              <div className={`p-4 rounded-2xl max-w-sm mx-auto text-left space-y-2 border text-sm ${
                theme === 'dark' ? 'bg-[#121212] border-[#2A2A2A]' : 'bg-mimu-cream/40 border-mimu-cream-border'
              }`}>
                <p><strong className="text-mimu-gold">Referência da Ordem:</strong> {orderResult?.order_ref || 'N/D'}</p>
                {orderResult?.tickets && orderResult.tickets.map((t, idx) => (
                  <p key={idx} className="border-t border-dashed border-gray-700/30 pt-2 mt-2">
                    <strong className="text-mimu-gold">Código do Ticket {idx + 1}:</strong> {t.ticket_code}
                  </p>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                <a 
                  href="/meus-tickets" 
                  className="px-6 py-3 rounded-xl bg-mimu-gold hover:bg-mimu-gold/90 text-mimu-text-dark font-extrabold text-sm transition-all text-center shadow"
                >
                  Ver Meus Tickets 🎟️
                </a>
                <button 
                  onClick={onClose}
                  className={`px-6 py-3 rounded-xl text-sm font-extrabold transition-all border ${
                    theme === 'dark' 
                      ? 'bg-[#2A2A2A] hover:bg-[#3A3A3A] border-transparent text-white' 
                      : 'bg-white hover:bg-gray-100 border-mimu-cream-border text-mimu-wine'
                  }`}
                >
                  Fechar Janela
                </button>
              </div>
            </div>
          ) : activePayment ? (
            /* Tela de Pagamento Pendente */
            <div className="text-center py-8 px-4 space-y-5 animate-fade-in">
              <div className="w-16 h-16 bg-mimu-gold/20 text-mimu-gold rounded-full flex items-center justify-center mx-auto text-3xl animate-pulse">
                💳
              </div>
              <h3 className="text-2xl font-bold text-mimu-gold">Pagamento Pendente</h3>
              <p className={`text-sm max-w-md mx-auto ${theme === 'dark' ? 'text-gray-300' : 'text-mimu-wine-light-text'}`}>
                Para concluir a aquisição do seu bilhete, por favor realize o pagamento de <strong>{activePayment.amount?.toLocaleString('pt-AO')} AOA</strong> através da Appy Pay.
              </p>

              <div className="flex flex-col gap-4 max-w-sm mx-auto pt-2">
                <a 
                  href={activePayment.payment_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3.5 rounded-xl bg-mimu-gold hover:bg-mimu-gold/90 text-mimu-text-dark font-black uppercase tracking-wider text-sm shadow transition duration-200 text-center block"
                >
                  Pagar com Appy Pay ↗
                </a>

                <div className="flex gap-3 justify-center pt-2">
                  <button 
                    onClick={handleVerifyPayment}
                    disabled={checkingPayment}
                    className="flex-1 px-5 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-extrabold text-sm transition-all text-center shadow disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {checkingPayment ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        A verificar...
                      </>
                    ) : (
                      'Confirmar Pagamento ✓'
                    )}
                  </button>
                  <button 
                    onClick={handleCancelPayment}
                    disabled={buying}
                    className={`flex-1 px-5 py-3 rounded-xl text-sm font-extrabold transition-all border ${
                      theme === 'dark' 
                        ? 'bg-red-950/20 hover:bg-red-950/40 border-red-500/30 text-red-400' 
                        : 'bg-red-50 hover:bg-red-100 border-red-200 text-red-600'
                    }`}
                  >
                    Cancelar Compra
                  </button>
                </div>
              </div>

              <p className="text-xs text-gray-500 italic mt-4">
                Ref: {activePayment.reference}
              </p>
            </div>
          ) : (
            <>
              {/* Informações Básicas do Evento */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-2 text-sm">
                    <span className="text-base mt-0.5">📍</span>
                    <div>
                      <h4 className="font-bold text-xs uppercase tracking-wider text-mimu-gold">Localização</h4>
                      <p className={theme === 'dark' ? 'text-gray-300' : 'text-mimu-wine-light-text'}>{location}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <span className="text-base mt-0.5">📅</span>
                    <div>
                      <h4 className="font-bold text-xs uppercase tracking-wider text-mimu-gold">Data e Hora</h4>
                      <p className={theme === 'dark' ? 'text-gray-300' : 'text-mimu-wine-light-text'}>{formattedDate}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-2 text-sm">
                    <span className="text-base mt-0.5">🛡️</span>
                    <div>
                      <h4 className="font-bold text-xs uppercase tracking-wider text-mimu-gold">Garantia MKT360</h4>
                      <p className={theme === 'dark' ? 'text-gray-300' : 'text-mimu-wine-light-text'}>Validação digital de ingressos e check-in seguro.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Descrição do Evento */}
              <div className={`p-4 rounded-2xl border ${
                theme === 'dark' ? 'bg-[#121212]/50 border-[#2A2A2A]' : 'bg-mimu-cream/30 border-mimu-cream-border'
              }`}>
                <h4 className="font-bold text-sm mb-1.5 text-mimu-gold">Sobre o Evento</h4>
                <p className={`text-sm leading-relaxed whitespace-pre-wrap ${theme === 'dark' ? 'text-gray-300' : 'text-mimu-wine-light-text'}`}>
                  {detailedEvent?.description || event.description}
                </p>
              </div>

              {/* Formulário de Compra Integrado MKT360 */}
              <div className={`p-5 rounded-2xl border ${
                theme === 'dark' ? 'bg-[#121212] border-[#2A2A2A]' : 'bg-mimu-cream/40 border-mimu-cream-border'
              }`}>
                <h4 className="font-bold text-lg mb-4 text-mimu-wine dark:text-mimu-gold border-b pb-2 border-gray-700/20">
                  Adquirir Bilhetes
                </h4>

                {loadingDetails ? (
                  <div className="flex flex-col items-center justify-center py-6 gap-2">
                    <div className="w-8 h-8 border-4 border-mimu-gold border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-xs text-gray-400">A carregar lotes de ingressos...</span>
                  </div>
                ) : errorDetails ? (
                  <div className="p-3 text-xs bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg">
                    ⚠️ Falha ao carregar lotes do evento: {errorDetails}
                  </div>
                ) : !user ? (
                  /* Utilizador não autenticado */
                  <div className="text-center py-4 space-y-3">
                    <p className="text-sm text-gray-400">
                      Inicie sessão na sua conta Mimu para poder comprar ingressos de forma segura.
                    </p>
                    <a 
                      href="/login" 
                      className="inline-block px-5 py-2.5 bg-mimu-wine hover:bg-mimu-wine-light text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow transition-all duration-200"
                    >
                      Iniciar Sessão
                    </a>
                  </div>
                ) : (
                  /* Formulário de Compra */
                  <form onSubmit={handlePurchase} className="space-y-4">
                    
                    {/* Seleção do Lote/Tipo de Bilhete */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-gray-400">
                        Tipo de Bilhete
                      </label>
                      <div className="grid grid-cols-1 gap-2.5">
                        {ticketTypes.map((tType) => {
                          const isSelected = selectedType === tType.id
                          const priceVal = parseFloat(tType.price)
                          const isFree = isNaN(priceVal) || priceVal === 0
                          const priceText = isFree ? 'Grátis' : `${priceVal.toLocaleString('pt-AO')} AOA`

                          return (
                            <div
                              key={tType.id}
                              onClick={() => setSelectedType(tType.id)}
                              className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                                isSelected
                                  ? 'border-mimu-gold bg-mimu-gold/5'
                                  : theme === 'dark'
                                  ? 'border-[#2A2A2A] hover:bg-[#1E1E1E]'
                                  : 'border-mimu-cream-border hover:bg-white'
                              }`}
                            >
                              <div>
                                <h5 className="font-extrabold text-sm uppercase">{tType.name}</h5>
                                {tType.description && (
                                  <p className="text-xs text-gray-400 mt-0.5">{tType.description}</p>
                                )}
                              </div>
                              <span className="font-black text-sm text-mimu-gold">{priceText}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Quantidade */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-gray-400">
                        Quantidade
                      </label>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          disabled={quantity <= 1}
                          onClick={() => setQuantity(prev => prev - 1)}
                          className="w-10 h-10 rounded-xl bg-mimu-wine/10 dark:bg-white/10 hover:bg-mimu-wine/20 text-mimu-wine dark:text-white flex items-center justify-center font-bold text-lg disabled:opacity-30 disabled:pointer-events-none transition"
                        >
                          -
                        </button>
                        <span className="w-12 text-center font-extrabold text-lg">{quantity}</span>
                        <button
                          type="button"
                          disabled={quantity >= 10}
                          onClick={() => setQuantity(prev => prev + 1)}
                          className="w-10 h-10 rounded-xl bg-mimu-wine/10 dark:bg-white/10 hover:bg-mimu-wine/20 text-mimu-wine dark:text-white flex items-center justify-center font-bold text-lg disabled:opacity-30 disabled:pointer-events-none transition"
                        >
                          +
                        </button>
                        <span className="text-xs text-gray-400">(Máximo 10 por compra)</span>
                      </div>
                    </div>

                    {/* Dados do Comprador */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-gray-400">
                          Nome do Comprador
                        </label>
                        <input
                          type="text"
                          required
                          value={buyerName}
                          onChange={(e) => setBuyerName(e.target.value)}
                          className={`w-full p-2.5 rounded-xl border focus:outline-none transition text-sm ${
                            theme === 'dark' ? 'bg-[#1E1E1E] border-[#2A2A2A] text-white focus:border-mimu-gold' : 'bg-white border-mimu-cream-border focus:border-mimu-wine'
                          }`}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-gray-400">
                          Email para Receção
                        </label>
                        <input
                          type="email"
                          required
                          value={buyerEmail}
                          onChange={(e) => setBuyerEmail(e.target.value)}
                          className={`w-full p-2.5 rounded-xl border focus:outline-none transition text-sm ${
                            theme === 'dark' ? 'bg-[#1E1E1E] border-[#2A2A2A] text-white focus:border-mimu-gold' : 'bg-white border-mimu-cream-border focus:border-mimu-wine'
                          }`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-gray-400">
                        Telefone (Opcional)
                      </label>
                      <input
                        type="tel"
                        value={buyerPhone}
                        onChange={(e) => setBuyerPhone(e.target.value)}
                        placeholder="+244..."
                        className={`w-full p-2.5 rounded-xl border focus:outline-none transition text-sm ${
                          theme === 'dark' ? 'bg-[#1E1E1E] border-[#2A2A2A] text-white focus:border-mimu-gold' : 'bg-white border-mimu-cream-border focus:border-mimu-wine'
                        }`}
                      />
                    </div>

                    {/* Método de Pagamento */}
                    <div className="space-y-2 pt-2">
                      <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-gray-400">
                        Método de Pagamento
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {/* Opção Multicaixa Express */}
                        <div
                          onClick={() => setSelectedPaymentMethod('multicaixa_express')}
                          className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-2.5 ${
                            selectedPaymentMethod === 'multicaixa_express'
                              ? 'border-mimu-gold bg-mimu-gold/5'
                              : theme === 'dark'
                              ? 'border-[#2A2A2A] hover:bg-[#1E1E1E]'
                              : 'border-mimu-cream-border hover:bg-white'
                          }`}
                        >
                          <span className="text-lg">📱</span>
                          <div className="text-left">
                            <h5 className="font-extrabold text-xs uppercase">Multicaixa Express</h5>
                          </div>
                        </div>

                        {/* Opção Pagamento por Referência */}
                        <div
                          onClick={() => setSelectedPaymentMethod('reference')}
                          className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-2.5 ${
                            selectedPaymentMethod === 'reference'
                              ? 'border-mimu-gold bg-mimu-gold/5'
                              : theme === 'dark'
                              ? 'border-[#2A2A2A] hover:bg-[#1E1E1E]'
                              : 'border-mimu-cream-border hover:bg-white'
                          }`}
                        >
                          <span className="text-lg">🔢</span>
                          <div className="text-left">
                            <h5 className="font-extrabold text-xs uppercase">Por Referência</h5>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Botão de Compra */}
                    <button
                      type="submit"
                      disabled={buying}
                      className="w-full mt-4 py-3 rounded-xl bg-mimu-gold hover:bg-mimu-gold/90 text-mimu-text-dark font-black uppercase tracking-wider text-sm shadow transition duration-200 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
                    >
                      {buying ? (
                        <>
                          <div className="w-4 h-4 border-2 border-mimu-text-dark border-t-transparent rounded-full animate-spin"></div>
                          A processar compra...
                        </>
                      ) : (
                        'Confirmar e Adquirir Bilhete 🎟️'
                      )}
                    </button>

                  </form>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
