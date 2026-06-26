import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useOrders, updateOrderStatus } from '../../hooks/useOrders'
import { useNotifications } from '../../hooks/useNotifications'
import { useReviews } from '../../hooks/useReviews'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import EditProfile from '../../components/EditProfile'
import OptimizedImage from '../../components/common/OptimizedImage'
import toast from 'react-hot-toast'
import { supabase } from '../../config/supabaseClient'
import { getAppyPaymentStatus, cancelAppyPayment } from '../../hooks/useAppyPay'
import { getWallet } from '../../hooks/useWallet'

const statusLabels = { pendente: 'Pendente', aceite: 'Aceite', em_curso: 'Em curso', concluido: 'Concluído', cancelado: 'Cancelado' }
const statusColors = { pendente: 'bg-amber-100 text-amber-800', aceite: 'bg-mimu-gold/20 text-mimu-gold', em_curso: 'bg-purple-100 text-purple-800', concluido: 'bg-green-100 text-green-800', cancelado: 'bg-red-100 text-red-800' }

const LocalSpinner = () => (
  <div className="flex flex-col items-center justify-center py-10 animate-fade-in">
    <div className="w-8 h-8 border-4 border-mimu-cream-border dark:border-[#2A2A2A] border-t-[#C58A2B] rounded-full animate-spin"></div>
    <p className="mt-3 text-sm font-medium text-mimu-wine-light-text dark:text-gray-300">A carregar conteúdo...</p>
  </div>
);

export default function ClientDashboard() {
  const { user, logout } = useAuth()
  const { orders, reload, loading: ordersLoading } = useOrders(user?.id)
  const { notifications, loading: notificationsLoading } = useNotifications(user?.id)
  const { addReview, checkIfOrderReviewed } = useReviews()
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get('tab')
  
  // Modals are open when the query param matches
  const isNotificationsOpen = tabParam === 'notificacoes'
  const isEditProfileOpen = tabParam === 'perfil'

  const [payments, setPayments] = useState([])
  const [paymentsLoading, setPaymentsLoading] = useState(false)
  const [walletBalance, setWalletBalance] = useState(null)
  const [walletLoading, setWalletLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('orders')

  const fetchPayments = async () => {
    if (!user?.id) return
    setPaymentsLoading(true)
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      if (!error && data) {
        setPayments(data)
      } else if (error) {
        console.error('Erro ao carregar pagamentos:', error)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setPaymentsLoading(false)
    }
  }

  const fetchWalletBalance = async () => {
    if (!user?.id) return
    setWalletLoading(true)
    const res = await getWallet()
    if (res.success) setWalletBalance(res.data?.wallet?.balance ?? 0)
    setWalletLoading(false)
  }

  useEffect(() => {
    fetchPayments()
    fetchWalletBalance()
  }, [user?.id])

  // Realtime: actualizar saldo da carteira quando sofrer alterações
  useEffect(() => {
    if (!user?.id) return
    const channel = supabase
      .channel(`wallet-realtime-${user.id}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'wallets',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        if (payload.new?.balance !== undefined) {
          setWalletBalance(payload.new.balance)
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const handleVerifyDashboardPayment = async (payment) => {
    const toastId = toast.loading('A verificar estado do pagamento...')
    try {
      const res = await getAppyPaymentStatus(payment.id, payment.transaction_id)
      if (res.success && res.data) {
        if (res.data.status === 'paid') {
          toast.success('Pagamento confirmado com sucesso! A contratação foi criada.', { id: toastId })
          fetchPayments()
          reload()
        } else if (res.data.status === 'pending') {
          toast.error('O pagamento ainda se encontra pendente no Appy Pay.', { id: toastId })
        } else {
          toast.error(`O pagamento foi atualizado para: ${res.data.status}`, { id: toastId })
          fetchPayments()
        }
      } else {
        toast.error(res.error || 'Erro ao verificar pagamento.', { id: toastId })
      }
    } catch (e) {
      console.error(e)
      toast.error('Erro ao verificar pagamento.', { id: toastId })
    }
  }

  const handleCancelDashboardPayment = async (payment) => {
    if (!window.confirm('Tem a certeza que deseja cancelar este pagamento e o pedido associado?')) return
    const toastId = toast.loading('A cancelar pagamento...')
    try {
      const res = await cancelAppyPayment(payment.id, payment.transaction_id)
      if (res.success) {
        toast.success('Pagamento cancelado com sucesso.', { id: toastId })
        fetchPayments()
        reload()
      } else {
        toast.error(res.error || 'Erro ao cancelar pagamento.', { id: toastId })
      }
    } catch (e) {
      console.error(e)
      toast.error('Erro ao cancelar pagamento.', { id: toastId })
    }
  }
  


  // Review states
  const [reviewOrder, setReviewOrder] = useState(null)
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' })
  const [reviewLoading, setReviewLoading] = useState(false)
  const [reviewError, setReviewError] = useState(null)
  const [reviewedOrdersMap, setReviewedOrdersMap] = useState({})

  // Detailed order selection & Profile state
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [ownerProfile, setOwnerProfile] = useState(null)
  const [loadingProfile, setLoadingProfile] = useState(false)

  // Fetch the company/provider profile when an order is selected
  useEffect(() => {
    if (!selectedOrder?.owner_id) {
      setOwnerProfile(null)
      return
    }
    setLoadingProfile(true)
    supabase
      .from('profiles')
      .select('*')
      .eq('id', selectedOrder.owner_id)
      .single()
      .then(({ data, error }) => {
        if (!error && data) {
          setOwnerProfile(data)
        } else {
          console.error('Erro ao carregar perfil do parceiro:', error)
        }
        setLoadingProfile(false)
      })
  }, [selectedOrder])

  // Find which completed orders were already reviewed
  useEffect(() => {
    const fetchReviewedStatus = async () => {
      const completed = orders.filter(o => o.status === 'concluido')
      const statuses = {}
      for (const order of completed) {
        if (reviewedOrdersMap[order.id] === undefined) {
          statuses[order.id] = await checkIfOrderReviewed(order.id)
        }
      }
      if (Object.keys(statuses).length > 0) {
        setReviewedOrdersMap(prev => ({ ...prev, ...statuses }))
      }
    }
    if (orders.length > 0) fetchReviewedStatus()
  }, [orders, checkIfOrderReviewed])

  const submitReview = async (e) => {
    e.preventDefault()
    setReviewLoading(true)
    setReviewError(null)
    const res = await addReview({
      orderId: reviewOrder.id,
      serviceId: reviewOrder.service_id,
      providerId: reviewOrder.owner_id,
      clientId: user?.id,
      rating: reviewForm.rating,
      comment: reviewForm.comment
    })
    setReviewLoading(false)
    if (res.success) {
      toast.success('Avaliação enviada com sucesso! Muito obrigado.')
      setReviewedOrdersMap(prev => ({ ...prev, [reviewOrder.id]: true }))
      setReviewOrder(null)
      setReviewForm({ rating: 5, comment: '' })
    } else {
      setReviewError(res.error || 'Ocorreu um erro ao enviar a avaliação.')
    }
  }

  const handleCancel = (orderId, status) => {
    if (!['pendente', 'aceite'].includes(status)) return
    const ok = window.confirm('Tens a certeza que queres cancelar este pedido?')
    if (!ok) return
    updateOrderStatus(orderId, 'cancelado')
    reload()
  }

  return (
    <div className="min-h-screen bg-mimu-cream dark:bg-[#121212]">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              {(user?.avatar_url || user?.logo_url) && (
                <div className="relative shrink-0 group">
                  <div className="w-16 h-16 rounded-full bg-mimu-gold flex items-center justify-center text-xl md:text-2xl font-bold text-mimu-wine-text dark:text-white overflow-hidden shadow-sm group-hover:shadow transition duration-300">
                    <OptimizedImage src={user.avatar_url || user.logo_url} alt="" className="w-full h-full transition-transform duration-300 group-hover:scale-105" objectFit="cover" />
                  </div>
                  <button 
                    onClick={() => setSearchParams({ tab: 'perfil' })}
                    className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-mimu-gold text-mimu-wine-text dark:text-white flex items-center justify-center shadow-md hover:bg-[#b87d26] transition active:scale-90 border-2 border-mimu-cream dark:border-[#121212]"
                    title="Editar Perfil"
                  >
                    <svg className="w-3 h-3 text-mimu-wine-text dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                    </svg>
                  </button>
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl md:text-2xl font-bold text-mimu-wine-text dark:text-white">{user?.name}</h1>
                  <button 
                    onClick={() => setSearchParams({ tab: 'perfil' })}
                    className="w-7 h-7 rounded-full bg-mimu-gold/10 hover:bg-mimu-gold/20 text-mimu-gold flex items-center justify-center transition active:scale-90"
                    title="Editar Perfil"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                    </svg>
                  </button>
                </div>
                <p className="text-mimu-wine-light-text dark:text-gray-300/80">Painel do Cliente</p>
              </div>
            </div>
            <div className="flex gap-4">
              <Link to="/" className="px-4 py-2 border-2 border-mimu-gold text-mimu-gold rounded-xl font-medium hover:bg-mimu-gold/10">
                Explorar App
              </Link>
              <button onClick={logout} className="px-4 py-2 text-mimu-wine-light-text dark:text-gray-300/80 hover:text-mimu-wine-text dark:text-white min-h-[44px]">
                Sair
              </button>
            </div>
          </div>



          {/* Área de Conteúdo */}
          <div className="bg-mimu-white dark:bg-[#1E1E1E] rounded-3xl shadow-sm border border-mimu-cream-border dark:border-[#2A2A2A] p-4 md:p-6 min-h-[300px] mb-8 overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-mimu-cream-border dark:border-[#2A2A2A] mb-6 overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveTab('orders')}
                className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all duration-300 whitespace-nowrap ${
                  activeTab === 'orders'
                    ? 'border-mimu-gold text-mimu-wine-text dark:text-white'
                    : 'border-transparent text-mimu-wine-light-text dark:text-gray-400 hover:text-mimu-wine-text dark:hover:text-white'
                }`}
              >
                Contratações & Reservas
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('payments')}
                className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all duration-300 whitespace-nowrap ${
                  activeTab === 'payments'
                    ? 'border-mimu-gold text-mimu-wine-text dark:text-white'
                    : 'border-transparent text-mimu-wine-light-text dark:text-gray-400 hover:text-mimu-wine-text dark:hover:text-white'
                }`}
              >
                Histórico de Pagamentos
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('wallet')}
                className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all duration-300 whitespace-nowrap ${
                  activeTab === 'wallet'
                    ? 'border-mimu-gold text-mimu-wine-text dark:text-white'
                    : 'border-transparent text-mimu-wine-light-text dark:text-gray-400 hover:text-mimu-wine-text dark:hover:text-white'
                }`}
              >
                💰 Carteira
              </button>
            </div>

            {activeTab === 'orders' && (
              <div>
                <h2 className="text-lg font-bold text-mimu-wine-text dark:text-white mb-4">Minhas Contratações</h2>
                {ordersLoading ? (
                  <LocalSpinner />
                ) : orders.length === 0 ? (
                  <div className="animate-fade-in">
                    <p className="text-mimu-wine-light-text dark:text-gray-300/80">Ainda não fizeste nenhum pedido.</p>
                    <Link to="/categoria/estadia" className="text-mimu-gold font-medium mt-2 inline-block">Explorar serviços →</Link>
                  </div>
                ) : (
                  <div className="space-y-4 animate-fade-in">
                    {orders.map(o => (
                      <div
                        key={o.id}
                        onClick={() => setSelectedOrder(o)}
                        className="p-4 bg-mimu-cream dark:bg-[#121212]/50 hover:bg-mimu-cream/70 dark:hover:bg-[#121212]/80 border border-transparent hover:border-mimu-gold/20 rounded-xl flex flex-wrap justify-between items-center gap-4 cursor-pointer transition-all duration-300 hover:shadow-sm hover:scale-[1.01] active:scale-[0.99]"
                      >
                        <div>
                          <p className="font-medium text-mimu-wine-text dark:text-white">{o.serviceName}</p>
                          <p className="text-sm text-mimu-wine-light-text dark:text-gray-300/80">{o.date} • {o.time || ''}</p>
                        </div>
                        <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                          <span className={`px-3 py-1 rounded-lg text-sm font-medium ${statusColors[o.status] || 'bg-mimu-gray-100 dark:bg-[#121212]'}`}>
                            {statusLabels[o.status] || o.status}
                          </span>
                          {['pendente', 'aceite'].includes(o.status) && (
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handleCancel(o.id, o.status); }}
                              className="px-3 py-1 rounded-lg text-sm font-medium border-2 border-red-200 text-red-700 hover:bg-red-50"
                            >
                              Cancelar pedido
                            </button>
                          )}
                          {o.status === 'concluido' && (
                            reviewedOrdersMap[o.id] ? (
                              <span className="px-3 py-1 text-sm font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/20 rounded-lg">
                                Avaliado
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setReviewOrder(o); }}
                                className="px-3 py-1 rounded-lg text-sm font-medium bg-mimu-gold text-white hover:bg-[#b87d26] transition active:scale-95"
                              >
                                Avaliar serviço
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'payments' && (
              <div>
                <h2 className="text-lg font-bold text-mimu-wine-text dark:text-white mb-4">Histórico de Transações</h2>
                {paymentsLoading ? (
                  <LocalSpinner />
                ) : payments.length === 0 ? (
                  <div className="animate-fade-in">
                    <p className="text-mimu-wine-light-text dark:text-gray-300/80">Ainda não tens nenhum pagamento registado.</p>
                  </div>
                ) : (
                  <div className="space-y-4 animate-fade-in">
                    {payments.map(p => {
                      const serviceName = p.metadata?.booking_details?.serviceName || p.metadata?.type === 'wallet_deposit' ? '💰 Depósito de Carteira' : 'Contratação de Serviço'
                      const paymentUrl = p.metadata?.payment_url
                      let statusBadge = 'bg-amber-100 text-amber-800'
                      let statusText = 'Pendente'
                      if (p.status === 'paid') { statusBadge = 'bg-green-100 text-green-800'; statusText = 'Pago' }
                      else if (p.status === 'failed') { statusBadge = 'bg-red-100 text-red-800'; statusText = 'Falhou' }
                      else if (p.status === 'cancelled') { statusBadge = 'bg-gray-100 text-gray-800'; statusText = 'Cancelado' }
                      else if (p.status === 'refunded') { statusBadge = 'bg-blue-100 text-blue-800'; statusText = 'Reembolsado' }
                      return (
                        <div key={p.id} className="p-4 bg-mimu-cream dark:bg-[#121212]/50 border border-transparent rounded-xl flex flex-wrap justify-between items-center gap-4 transition-all duration-300 hover:shadow-sm">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-lg">💳</span>
                              <p className="font-semibold text-mimu-wine-text dark:text-white">{serviceName}</p>
                            </div>
                            <div className="text-xs text-mimu-wine-light-text dark:text-gray-400 mt-1 space-y-0.5">
                              <p>Ref: <span className="font-mono">{p.transaction_reference}</span></p>
                              <p>Método: {p.payment_method === 'wallet' ? '💰 Carteira' : p.payment_method}</p>
                              <p>Data: {new Date(p.created_at).toLocaleString('pt-AO')}</p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <span className="font-bold text-mimu-gold text-lg">
                              {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: p.currency || 'AOA' }).format(p.amount)}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className={`px-2.5 py-0.5 rounded-lg text-xs font-semibold ${statusBadge}`}>{statusText}</span>
                              {p.status === 'pending' && (
                                <div className="flex items-center gap-1.5">
                                  {paymentUrl && (
                                    <a href={paymentUrl} target="_blank" rel="noopener noreferrer"
                                      className="px-2.5 py-1 bg-mimu-gold hover:bg-[#b87d26] text-white text-xs font-bold rounded-lg transition active:scale-95">
                                      Pagar ↗
                                    </a>
                                  )}
                                  <button type="button" onClick={() => handleVerifyDashboardPayment(p)}
                                    className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg transition active:scale-95">
                                    Verificar
                                  </button>
                                  <button type="button" onClick={() => handleCancelDashboardPayment(p)}
                                    className="px-2.5 py-1 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-bold rounded-lg transition">
                                    ✕
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'wallet' && (
              <div>
                <h2 className="text-lg font-bold text-mimu-wine-text dark:text-white mb-4">💰 A Minha Carteira</h2>
                {walletLoading ? (
                  <LocalSpinner />
                ) : (
                  <div className="space-y-4 animate-fade-in">
                    <div className="relative overflow-hidden rounded-2xl p-6" style={{ background: 'linear-gradient(135deg, #7B1D1D 0%, #450A0A 100%)' }}>
                      <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(212,175,55,0.15)' }} />
                      <p className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-2">Saldo Disponível</p>
                      <p className="text-white text-4xl font-extrabold mb-1 relative z-10">
                        {walletBalance !== null
                          ? new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(walletBalance)
                          : '—'}
                      </p>
                      <p className="text-white/50 text-xs mb-4">🇦🇴 Kwanza (AOA)</p>
                      <Link to="/carteira"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 relative z-10"
                        style={{ background: 'rgba(212,175,55,0.9)', color: '#1a0a0a' }}>
                        Gerir Carteira →
                      </Link>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { emoji: '⬇️', label: 'Depositar', path: '/carteira' },
                        { emoji: '⬆️', label: 'Levantar', path: '/carteira' },
                        { emoji: '↔️', label: 'Transferir', path: '/carteira' },
                      ].map(a => (
                        <Link key={a.label} to={a.path}
                          className="flex flex-col items-center justify-center p-4 rounded-xl border border-mimu-cream-border dark:border-[#2A2A2A] bg-mimu-cream/40 dark:bg-[#121212]/30 hover:border-mimu-gold/30 hover:bg-mimu-gold/5 transition text-center group">
                          <span className="text-2xl mb-1 group-hover:scale-110 transition-transform">{a.emoji}</span>
                          <span className="text-xs font-semibold text-mimu-wine-text dark:text-white">{a.label}</span>
                        </Link>
                      ))}
                    </div>
                    <div className="p-4 rounded-xl bg-mimu-gold/5 border border-mimu-gold/15 text-center">
                      <p className="text-xs text-mimu-wine-light-text dark:text-gray-400">
                        O saldo é atualizado automaticamente após cada operação.
                        <Link to="/carteira" className="text-mimu-gold font-semibold hover:underline ml-1">Ver histórico completo →</Link>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal de Notificações */}
      {isNotificationsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-mimu-white dark:bg-[#1E1E1E] rounded-3xl border border-mimu-cream-border dark:border-[#2A2A2A] p-6 max-w-lg w-full shadow-2xl relative max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between mb-4 border-b border-mimu-cream-border dark:border-[#2A2A2A] pb-3">
              <h3 className="text-lg font-bold text-mimu-wine-text dark:text-white flex items-center gap-2">
                <span>🔔</span> Notificações
              </h3>
              <button 
                onClick={() => setSearchParams({})}
                className="w-8 h-8 flex items-center justify-center bg-mimu-cream dark:bg-[#121212] text-mimu-wine-text dark:text-white rounded-full hover:bg-mimu-gold hover:text-white transition active:scale-90"
              >
                ✕
              </button>
            </div>
            
            <div className="overflow-y-auto flex-1 pr-1">
              {notificationsLoading ? (
                <LocalSpinner />
              ) : notifications.length === 0 ? (
                <p className="text-mimu-wine-light-text dark:text-gray-300/80 text-center py-8">Sem notificações.</p>
              ) : (
                <div className="space-y-2.5">
                  {notifications.map(n => (
                    <div key={n.id} className={`p-4 rounded-2xl border transition duration-300 ${n.read ? 'bg-mimu-cream/30 dark:bg-[#121212]/30 border-mimu-cream-border dark:border-[#2A2A2A]' : 'bg-mimu-cream/60 dark:bg-[#1E1E1E] border-mimu-gold/25'}`}>
                      <p className="text-sm font-bold text-mimu-wine-text dark:text-white">
                        {n.title || (n.type === 'estado_reserva' ? `Reserva ${n.data?.status}` : 'Notificação')}
                      </p>
                      <p className="text-xs text-mimu-wine-light-text dark:text-gray-300/80 mt-1">
                        {n.message || (n.type === 'reserva_enviada' ? 'Reserva enviada com sucesso' : '')}
                      </p>
                      <p className="text-[10px] text-mimu-wine-light-text/60 dark:text-gray-400 mt-2">{new Date(n.created_at || n.createdAt).toLocaleString('pt-PT')}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Editar Perfil */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-mimu-white dark:bg-[#1E1E1E] rounded-3xl border border-mimu-cream-border dark:border-[#2A2A2A] p-6 max-w-lg w-full shadow-2xl relative max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between mb-4 border-b border-mimu-cream-border dark:border-[#2A2A2A] pb-3">
              <h3 className="text-lg font-bold text-mimu-wine-text dark:text-white flex items-center gap-2">
                <span>👤</span> Editar Perfil
              </h3>
              <button 
                onClick={() => setSearchParams({})}
                className="w-8 h-8 flex items-center justify-center bg-mimu-cream dark:bg-[#121212] text-mimu-wine-text dark:text-white rounded-full hover:bg-mimu-gold hover:text-white transition active:scale-90"
              >
                ✕
              </button>
            </div>
            
            <div className="overflow-y-auto flex-1 pr-1">
              <EditProfile onSuccess={() => setTimeout(() => setSearchParams({}), 1500)} />
            </div>
          </div>
        </div>
      )}

      {/* Modal de Avaliação de Serviço */}
      {reviewOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-mimu-white dark:bg-[#1E1E1E] rounded-3xl border border-mimu-cream-border dark:border-[#2A2A2A] p-6 max-w-md w-full shadow-2xl relative">
            <h3 className="text-lg font-bold text-mimu-wine-text dark:text-white mb-4">Avaliar {reviewOrder.serviceName}</h3>
            
            {reviewError && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-xl text-sm">{reviewError}</div>}
            
            <form onSubmit={submitReview}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-mimu-wine-text dark:text-white mb-2">Classificação</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewForm(prev => ({ ...prev, rating: star }))}
                      className={`text-3xl transition-transform hover:scale-110 focus:outline-none ${reviewForm.rating >= star ? 'text-mimu-gold' : 'text-gray-300'}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-mimu-wine-text dark:text-white mb-2">Comentário (opcional)</label>
                <textarea
                  value={reviewForm.comment}
                  onChange={e => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border-2 border-mimu-cream-border dark:border-[#2A2A2A] bg-transparent text-mimu-wine-text dark:text-white focus:border-mimu-gold focus:outline-none resize-none h-24"
                  placeholder="Escreve aqui o teu feedback..."
                ></textarea>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setReviewOrder(null)}
                  className="px-4 py-2 font-medium text-mimu-wine-light-text dark:text-gray-300 hover:bg-mimu-cream dark:hover:bg-[#121212] rounded-xl"
                  disabled={reviewLoading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={reviewLoading}
                  className="px-6 py-2 bg-mimu-gold text-white font-bold rounded-xl hover:bg-[#b87d26] disabled:opacity-50"
                >
                  {reviewLoading ? 'A enviar...' : 'Submeter Avaliação'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Detalhes da Reserva e Informações da Empresa */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in text-mimu-wine-text dark:text-white">
          <div className="bg-mimu-white dark:bg-[#1E1E1E] rounded-3xl border border-mimu-cream-border dark:border-[#2A2A2A] p-6 max-w-2xl w-full shadow-2xl relative max-h-[90vh] flex flex-col">
            
            {/* Cabeçalho */}
            <div className="flex items-center justify-between mb-4 border-b border-mimu-cream-border dark:border-[#2A2A2A] pb-3">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <span>📋</span> Detalhes da Reserva
              </h3>
              <button 
                onClick={() => setSelectedOrder(null)}
                className="w-8 h-8 flex items-center justify-center bg-mimu-cream dark:bg-[#121212] text-mimu-wine-text dark:text-white rounded-full hover:bg-mimu-gold hover:text-white transition active:scale-90"
              >
                ✕
              </button>
            </div>
            
            {/* Conteúdo */}
            <div className="overflow-y-auto flex-1 pr-1 space-y-6">
              
              {/* Cartão de Reserva (Estilo Voucher) */}
              <div className="p-5 bg-gradient-to-br from-mimu-cream/80 to-mimu-cream/30 dark:from-[#121212]/50 dark:to-[#121212]/20 border border-mimu-cream-border dark:border-[#2A2A2A] rounded-2xl shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-mimu-gold/5 rounded-full -mr-8 -mt-8"></div>
                <div className="flex justify-between items-start gap-4 mb-4">
                  <div>
                    <h4 className="text-xl font-bold mb-1">{selectedOrder.serviceName}</h4>
                    <p className="text-xs text-mimu-wine-light-text/60 dark:text-gray-400">ID: {selectedOrder.id}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-lg text-sm font-semibold shadow-sm ${statusColors[selectedOrder.status] || 'bg-mimu-gray-100 dark:bg-[#121212]'}`}>
                    {statusLabels[selectedOrder.status] || selectedOrder.status}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mt-2">
                  <div>
                    <p className="text-xs text-mimu-wine-light-text/60 dark:text-gray-400 font-medium">Data</p>
                    <p className="font-semibold">{selectedOrder.date}</p>
                  </div>
                  {selectedOrder.time && (
                    <div>
                      <p className="text-xs text-mimu-wine-light-text/60 dark:text-gray-400 font-medium">Hora</p>
                      <p className="font-semibold">{selectedOrder.time}</p>
                    </div>
                  )}
                  {selectedOrder.guests && (
                    <div>
                      <p className="text-xs text-mimu-wine-light-text/60 dark:text-gray-400 font-medium">Convidados / Pessoas</p>
                      <p className="font-semibold">{selectedOrder.guests}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-mimu-wine-light-text/60 dark:text-gray-400 font-medium">Método de Pagamento</p>
                    <p className="font-semibold">{selectedOrder.paymentMethod || 'A definir'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-mimu-wine-light-text/60 dark:text-gray-400 font-medium">Estado do Pagamento</p>
                    <p className="font-semibold">{statusLabels[selectedOrder.paymentStatus] || selectedOrder.paymentStatus || 'Pendente'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-mimu-wine-light-text/60 dark:text-gray-400 font-medium">Total</p>
                    <p className="font-bold text-mimu-gold">{new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(selectedOrder.total || 0)}</p>
                  </div>
                </div>

                {selectedOrder.specialRequests && (
                  <div className="mt-4 pt-3 border-t border-mimu-cream-border dark:border-[#2A2A2A]/60">
                    <p className="text-xs text-mimu-wine-light-text/60 dark:text-gray-400 font-medium mb-1">Pedidos Especiais / Observações</p>
                    <p className="text-sm italic">{selectedOrder.specialRequests}</p>
                  </div>
                )}
              </div>

              {/* Informações do Prestador / Empresa */}
              <div>
                <h4 className="font-bold text-base mb-3">Sobre a Empresa / Prestador</h4>
                {loadingProfile ? (
                  <LocalSpinner />
                ) : ownerProfile ? (
                  <div className="p-5 bg-mimu-cream/30 dark:bg-[#121212]/20 border border-mimu-cream-border/60 dark:border-[#2A2A2A]/40 rounded-2xl flex flex-col md:flex-row gap-4 items-start md:items-center">
                    
                    <div className="w-16 h-16 rounded-full bg-mimu-gold flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm border border-mimu-cream-border dark:border-[#2A2A2A]">
                      {ownerProfile.logo_url || ownerProfile.avatar_url ? (
                        <OptimizedImage src={ownerProfile.logo_url || ownerProfile.avatar_url} alt="" className="w-full h-full" objectFit="cover" />
                      ) : (
                        <span className="text-2xl font-bold">
                          {(ownerProfile.company_name || ownerProfile.name || '?')[0].toUpperCase()}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex-1 space-y-2">
                      <div>
                        <h5 className="font-bold text-lg">
                          {ownerProfile.company_name || ownerProfile.name}
                        </h5>
                        <p className="text-xs text-mimu-gold font-medium uppercase tracking-wide">
                          {ownerProfile.role === 'company' ? 'Empresa Parceira' : 'Prestador Independente'}
                        </p>
                      </div>
                      
                      {ownerProfile.description && (
                        <p className="text-sm text-mimu-wine-light-text dark:text-gray-300 italic">
                          "{ownerProfile.description}"
                        </p>
                      )}
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 pt-2 border-t border-mimu-cream-border/40 dark:border-[#2A2A2A]/30 text-sm">
                        {ownerProfile.phone && (
                          <div className="flex items-center gap-2">
                            <span>📞</span>
                            <span>{ownerProfile.phone}</span>
                          </div>
                        )}
                        {ownerProfile.email && (
                          <div className="flex items-center gap-2 overflow-hidden">
                            <span>✉️</span>
                            <span className="truncate" title={ownerProfile.email}>{ownerProfile.email}</span>
                          </div>
                        )}
                        {(ownerProfile.city || ownerProfile.province) && (
                          <div className="flex items-center gap-2 sm:col-span-2">
                            <span>📍</span>
                            <span>
                              {ownerProfile.city || ''}
                              {ownerProfile.city && ownerProfile.province ? ', ' : ''}
                              {ownerProfile.province || ''}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-mimu-wine-light-text/60 dark:text-gray-400 italic">Não foi possível obter informações de contacto sobre o prestador.</p>
                )}
              </div>
            </div>

            {/* Ações do Modal */}
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-mimu-cream-border dark:border-[#2A2A2A]">
              {['pendente', 'aceite'].includes(selectedOrder.status) && (
                <button
                  type="button"
                  onClick={() => {
                    handleCancel(selectedOrder.id, selectedOrder.status);
                    setSelectedOrder(null);
                  }}
                  className="px-4 py-2 text-sm font-medium border-2 border-red-200 text-red-700 hover:bg-red-50 rounded-xl"
                >
                  Cancelar pedido
                </button>
              )}
              {selectedOrder.status === 'concluido' && !reviewedOrdersMap[selectedOrder.id] && (
                <button
                  type="button"
                  onClick={() => {
                    setReviewOrder(selectedOrder);
                    setSelectedOrder(null);
                  }}
                  className="px-4 py-2 bg-mimu-gold hover:bg-[#b87d26] text-white text-sm font-bold rounded-xl"
                >
                  Avaliar serviço
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="px-5 py-2 bg-mimu-cream dark:bg-[#121212] text-mimu-wine-text dark:text-white text-sm font-medium hover:bg-mimu-gold hover:text-white rounded-xl transition"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}
