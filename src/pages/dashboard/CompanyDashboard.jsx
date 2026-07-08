import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useServices } from '../../context/ServicesContext'
import { useOrdersByCompany } from '../../hooks/useOrders'
import { categories } from '../../data/categories'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import EditProfile from '../../components/EditProfile'
import EventsManager from '../../components/EventsManager'
import OptimizedImage from '../../components/common/OptimizedImage'
import { supabase } from '../../config/supabaseClient'
import toast from 'react-hot-toast'
import { updateOrderStatus } from '../../hooks/useOrders'
import { useWallet } from '../../hooks/useWallet'
import { useCompanyPartners } from '../../hooks/useCompanyPartners'

// statusLabels defined inside component using t()
// paymentLabels defined inside component using t()

const LocalSpinner = () => (
  <div className="flex flex-col items-center justify-center py-10 animate-fade-in">
    <div className="w-8 h-8 border-4 border-mimu-cream-border dark:border-[#2A2A2A] border-t-[#C58A2B] rounded-full animate-spin"></div>
    <p className="mt-3 text-sm font-medium text-mimu-wine-light-text dark:text-gray-300">A carregar conteúdo...</p>
  </div>
);

export default function CompanyDashboard() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get('tab')
  
  // The main content area only toggles between non-modal tabs
  const [activeMainTab, setActiveMainTab] = useState(tabParam && !['perfil'].includes(tabParam) ? tabParam : 'visao')
  const isEditProfileOpen = tabParam === 'perfil'

  const [payments, setPayments] = useState([])
  const [paymentsLoading, setPaymentsLoading] = useState(false)

  // Carteira
  const { wallet, loading: walletLoading, reload: reloadWallet } = useWallet(user?.id)
  const walletBalance = wallet?.balance ?? null

  const fetchPayments = async () => {
    if (!user?.id) return
    setPaymentsLoading(true)
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
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

  useEffect(() => {
    if (activeMainTab === 'pagamentos') fetchPayments()
  }, [user?.id, activeMainTab])

  // Realtime: atualizar saldo da carteira em tempo real
  useEffect(() => {
    if (!user?.id) return
    const channel = supabase
      .channel(`company_wallet_${user.id}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'wallets',
        filter: `user_id=eq.${user.id}`
      }, () => reloadWallet())
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [user?.id])

  const { getCompanyServices } = useServices()
  const { orders, reload } = useOrdersByCompany(user?.id)
  const [companyServices, setCompanyServices] = useState([])
  const [servicesLoading, setServicesLoading] = useState(false)
  const [partnerForm, setPartnerForm] = useState({
    id: null,
    name: '',
    phone: '',
    categoryId: '',
    photo: '',
    status: 'active'
  })
  const [partnerError, setPartnerError] = useState('')

  // Parceiros/Prestadores da empresa guardados na BD
  const { partners, createPartner, updatePartner, deletePartner, loadPartners } = useCompanyPartners(user?.id)

  // Selected order & client profile details
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [clientProfile, setClientProfile] = useState(null)
  const [loadingProfile, setLoadingProfile] = useState(false)

  useEffect(() => {
    if (tabParam && !['perfil'].includes(tabParam)) {
      setActiveMainTab(tabParam)
    }
  }, [tabParam])

  useEffect(() => {
    if (user?.id) {
      setServicesLoading(true)
      getCompanyServices(user.id).then(data => {
        setCompanyServices(data || [])
        setServicesLoading(false)
      })
    }
  }, [user?.id, getCompanyServices, activeMainTab])



  useEffect(() => {
    if (activeMainTab === 'parceiros') {
      loadPartners()
    }
  }, [activeMainTab, user?.id, loadPartners])

  // Fetch client details when selectedOrder changes
  useEffect(() => {
    if (!selectedOrder?.client_id) {
      setClientProfile(null)
      return
    }
    setLoadingProfile(true)
    supabase
      .from('profiles')
      .select('*')
      .eq('id', selectedOrder.client_id)
      .single()
      .then(({ data, error }) => {
        if (!error && data) {
          setClientProfile(data)
        } else {
          console.error('Erro ao buscar perfil do cliente:', error)
        }
        setLoadingProfile(false)
      })
  }, [selectedOrder])

  const pendentes = orders.filter(o => o.status === 'pendente')
  const stats = { total: orders.length, pendentes: pendentes.length, concluidos: orders.filter(o => o.status === 'concluido').length }

  const handleStatus = async (orderId, status) => {
    try {
      const res = await updateOrderStatus(orderId, status)
      if (res) {
        toast.success(`Pedido ${statusLabels[status] || status} com sucesso!`)
      } else {
        toast.error(t('dashboard.orderUpdateError'))
      }
    } catch (err) {
      console.error(err)
      toast.error(t('dashboard.orderUpdateError'))
    }
    reload()
  }

  const resetPartnerForm = () => {
    setPartnerForm({
      id: null,
      name: '',
      phone: '',
      categoryId: '',
      photo: '',
      status: 'active'
    })
    setPartnerError('')
  }

  const handlePartnerChange = (e) => {
    const { name, value } = e.target
    setPartnerForm(f => ({ ...f, [name]: value }))
    setPartnerError('')
  }

  const startEditPartner = (partner) => {
    setPartnerForm({
      id: partner.id,
      name: partner.name || '',
      phone: partner.phone || '',
      categoryId: partner.category_id || '',
      photo: partner.photo || '',
      status: partner.status || 'active'
    })
    setPartnerError('')
  }

  const handlePartnerSubmit = async (e) => {
    e.preventDefault()
    if (!partnerForm.name.trim() || !partnerForm.phone.trim() || !partnerForm.categoryId) {
      setPartnerError(t('dashboard.company.partnerRequired'))
      return
    }
    const payload = {
      name: partnerForm.name.trim(),
      phone: partnerForm.phone.trim(),
      category_id: partnerForm.categoryId,
      photo: partnerForm.photo || null,
      status: partnerForm.status || 'active'
    }
    let result
    if (partnerForm.id) {
      result = await updatePartner(partnerForm.id, payload)
    } else {
      result = await createPartner(payload)
    }
    if (result.success) {
      toast.success(partnerForm.id ? t('dashboard.company.partnerUpdated') : t('dashboard.company.partnerAdded'))
      resetPartnerForm()
    } else {
      setPartnerError(result.error || t('dashboard.company.partnerError'))
    }
  }

  const togglePartnerStatus = async (partnerId, currentStatus) => {
    const nextStatus = currentStatus === 'active' ? 'inactive' : 'active'
    await updatePartner(partnerId, { status: nextStatus })
  }

  if (user?.status === 'pending_approval' || user?.status === 'pending') {
    return (
      <div className="max-w-2xl mx-auto px-4 w-full py-12">
        <div className="bg-mimu-white dark:bg-[#1E1E1E] rounded-2xl p-4 md:p-8 shadow-md hover:shadow-lg transition-shadow duration-300 text-center">
          <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-mimu-wine-text dark:text-white mb-4">{t('dashboard.company.pendingTitle')}</h2>
          <p className="text-mimu-wine-light-text dark:text-gray-300 mb-8">
            Os seus dados de empresa foram recebidos e estão a ser avaliados pela nossa equipa administrativa. Assim que a sua conta for aprovada, terá acesso completo a este painel.
          </p>
          <button
            onClick={logout}
            className="px-6 py-3 bg-mimu-gold text-mimu-white-text font-bold rounded-xl hover:bg-[#b87d26] transition-colors transition-all duration-300 hover:shadow-md active:scale-95"
          >
            Terminar Sessão
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          {(user?.logo_url || user?.avatar_url) ? (
            <div className="relative shrink-0 group">
              <div className="w-16 h-16 rounded-full bg-mimu-gold flex items-center justify-center text-xl md:text-2xl font-bold text-mimu-wine-text dark:text-white overflow-hidden shadow-sm group-hover:shadow transition duration-300">
                <OptimizedImage src={user.logo_url || user.avatar_url} alt="" className="w-full h-full transition-transform duration-300 group-hover:scale-105" objectFit="cover" />
              </div>
              <button 
                onClick={() => setSearchParams({ tab: 'perfil' })}
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-mimu-gold text-mimu-wine-text dark:text-white flex items-center justify-center shadow-md hover:bg-[#b87d26] transition active:scale-90 border-2 border-mimu-cream dark:border-[#121212]"
                title={t('dashboard.editProfile')}
              >
                <svg className="w-3 h-3 text-mimu-wine-text dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full bg-[#C58A2B] flex items-center justify-center overflow-hidden">
              <span className="text-2xl font-bold text-[#3A0D0D]">🏢</span>
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-bold text-mimu-wine-text dark:text-white">{user?.companyName || user?.name}</h1>
              <button 
                onClick={() => setSearchParams({ tab: 'perfil' })}
                className="w-7 h-7 rounded-full bg-mimu-gold/10 hover:bg-mimu-gold/20 text-mimu-gold flex items-center justify-center transition active:scale-90"
                title={t('dashboard.editProfile')}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                </svg>
              </button>
            </div>
            <p className="text-mimu-wine-light-text dark:text-gray-300/80">{t('dashboard.company.title')}</p>
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

      <div className="w-full">
        {activeMainTab === 'visao' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 animate-fade-in">
            <div className="bg-mimu-white dark:bg-[#1E1E1E] rounded-2xl p-4 md:p-6 shadow-sm border border-mimu-cream-border dark:border-[#2A2A2A] hover:shadow-md transition duration-300">
              <p className="text-mimu-wine-light-text dark:text-gray-300/80 text-sm">Serviços ativos</p>
              <p className="text-xl md:text-2xl font-bold text-mimu-wine-text dark:text-white">{companyServices.length}</p>
            </div>
            <div className="bg-mimu-white dark:bg-[#1E1E1E] rounded-2xl p-4 md:p-6 shadow-sm border border-mimu-cream-border dark:border-[#2A2A2A] hover:shadow-md transition duration-300">
              <p className="text-mimu-wine-light-text dark:text-gray-300/80 text-sm">Total de pedidos</p>
              <p className="text-xl md:text-2xl font-bold text-mimu-wine-text dark:text-white">{stats.total}</p>
            </div>
            <div className="bg-mimu-white dark:bg-[#1E1E1E] rounded-2xl p-4 md:p-6 shadow-sm border border-mimu-cream-border dark:border-[#2A2A2A] hover:shadow-md transition duration-300">
              <p className="text-mimu-wine-light-text dark:text-gray-300/80 text-sm">Pedidos pendentes</p>
              <p className="text-xl md:text-2xl font-bold text-amber-600">{stats.pendentes}</p>
            </div>
            <div className="bg-mimu-white dark:bg-[#1E1E1E] rounded-2xl p-4 md:p-6 shadow-sm border border-mimu-cream-border dark:border-[#2A2A2A] hover:shadow-md transition duration-300">
              <p className="text-mimu-wine-light-text dark:text-gray-300/80 text-sm">Pedidos concluídos</p>
              <p className="text-xl md:text-2xl font-bold text-green-600">{stats.concluidos}</p>
            </div>
          </div>
        )}

        {/* Menu em Cubos */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4 mb-6">
          {[
            { id: 'visao', label: 'Visão Geral', icon: '📊', gradient: 'from-[#3B82F6] to-[#1D4ED8]', shadow: 'shadow-blue-500/30' },
            { id: 'reservas', label: 'Reservas', count: stats.pendentes, icon: '📅', gradient: 'from-[#10B981] to-[#047857]', shadow: 'shadow-emerald-500/30' },
            { id: 'servicos', label: 'Serviços', icon: '🛠️', gradient: 'from-[#F59E0B] to-[#B45309]', shadow: 'shadow-amber-500/30' },
            { id: 'parceiros', label: 'Parceiros', icon: '👥', gradient: 'from-[#8B5CF6] to-[#6D28D9]', shadow: 'shadow-purple-500/30' },
            { id: 'pagamentos', label: 'Pagamentos', icon: '💳', gradient: 'from-[#EF4444] to-[#B91C1C]', shadow: 'shadow-red-500/30' },
            { id: 'eventos', label: 'Eventos', icon: '🎉', gradient: 'from-[#6366F1] to-[#4338CA]', shadow: 'shadow-indigo-500/30' },
            { id: 'carteira', label: 'Carteira', icon: '💰', gradient: 'from-[#D4AF37] to-[#92740F]', shadow: 'shadow-yellow-500/30' },
            { id: 'estatisticas', label: 'Estatísticas', icon: '📈', gradient: 'from-[#EC4899] to-[#BE185D]', shadow: 'shadow-pink-500/30' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setSearchParams({ tab: t.id })}
              className={`relative overflow-visible rounded-2xl aspect-[4/3] flex flex-col items-center justify-center gap-1.5 transition-all duration-300 ${activeMainTab === t.id
                ? 'ring-4 ring-mimu-gold scale-95 shadow-inner'
                : `hover:scale-105 shadow-md ${t.shadow} hover:shadow-lg`
                }`}
            >
              <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${t.gradient} opacity-95`}></div>
              <div className="absolute inset-0 rounded-2xl bg-mimu-white dark:bg-[#1E1E1E]/5 backdrop-blur-[1px]"></div>

              <div className="relative z-10 flex flex-col items-center justify-center text-white w-full h-full p-2">
                <span className="text-2xl md:text-3xl mb-1 drop-shadow-md">{t.icon}</span>
                <span className="font-bold text-xs md:text-sm text-center drop-shadow-md leading-tight">{t.label}</span>
              </div>

              {t.count > 0 && (
                <span className="absolute -top-2 -right-2 z-20 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold ring-2 ring-white shadow-md animate-pulse">
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Área de Conteúdo */}
        <div className="bg-mimu-white dark:bg-[#1E1E1E] rounded-3xl shadow-sm border border-mimu-cream-border dark:border-[#2A2A2A] p-4 md:p-6 mb-8 overflow-hidden text-mimu-wine-text dark:text-white">
          {activeMainTab === 'visao' && (
            <div className="space-y-4 animate-fade-in">
              <h2 className="text-lg font-bold text-mimu-wine-text dark:text-white">Resumo Geral</h2>
              <p className="text-mimu-wine-light-text dark:text-gray-300/80">Pendentes: {stats.pendentes} | Concluídos: {stats.concluidos} | Total: {stats.total}</p>
              <p className="text-sm text-mimu-wine-light-text dark:text-gray-300/60">
                Painel administrativo da empresa. Permite visualizar e gerir os serviços publicados, a equipa de prestadores/parceiros e os pedidos efetuados pelos utilizadores da aplicação.
              </p>
            </div>
          )}

          {activeMainTab === 'reservas' && (
            <div>
              <h2 className="text-lg font-bold text-mimu-wine-text dark:text-white mb-4">Pedidos recebidos</h2>
              {orders.length === 0 ? (
                <p className="text-mimu-wine-light-text dark:text-gray-300/80 animate-fade-in">Ainda não recebeste pedidos.</p>
              ) : (
                <div className="space-y-4 animate-fade-in">
                  {orders.map(o => (
                    <div 
                      key={o.id} 
                      onClick={() => setSelectedOrder(o)}
                      className="p-4 bg-mimu-cream dark:bg-[#121212]/50 hover:bg-mimu-cream/70 dark:hover:bg-[#121212]/80 border border-transparent hover:border-mimu-gold/20 rounded-xl cursor-pointer transition-all duration-300 hover:shadow-sm hover:scale-[1.01] active:scale-[0.99]"
                    >
                      <div className="flex flex-wrap justify-between items-start gap-4">
                        <div>
                          <p className="font-medium text-mimu-wine-text dark:text-white">{o.serviceName}</p>
                          <p className="text-sm text-mimu-wine-light-text dark:text-gray-300/80">Cliente: {o.clientName}</p>
                          <p className="text-sm text-mimu-wine-light-text dark:text-gray-300/80">Data: {o.date} • {o.time || ''}</p>
                          <p className="text-xs text-mimu-wine-light-text dark:text-gray-300/60">Método pagamento: {o.paymentMethod || 'Não definido'} | Estado: {paymentLabels[o.paymentStatus] || o.paymentStatus || 'Pendente'}</p>
                        </div>
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <span className="px-3 py-1 rounded-lg text-sm bg-mimu-gray-100 dark:bg-[#121212]">{statusLabels[o.status]}</span>
                          {o.status === 'pendente' && (
                            <>
                              <button onClick={() => handleStatus(o.id, 'aceite')} className="px-3 py-1 bg-green-100 text-green-800 rounded-lg text-sm font-medium hover:bg-green-200 transition">Aceitar</button>
                              <button onClick={() => handleStatus(o.id, 'cancelado')} className="px-3 py-1 bg-red-100 text-red-800 rounded-lg text-sm font-medium hover:bg-red-200 transition">Rejeitar</button>
                            </>
                          )}
                          {o.status === 'aceite' && (
                            <button onClick={() => handleStatus(o.id, 'em_curso')} className="px-3 py-1 bg-mimu-gold/20 text-mimu-gold rounded-lg text-sm font-medium hover:bg-mimu-gold/30 transition">Em curso</button>
                          )}
                          {o.status === 'em_curso' && (
                            <button onClick={() => handleStatus(o.id, 'concluido')} className="px-3 py-1 bg-green-100 text-green-800 rounded-lg text-sm font-medium hover:bg-green-200 transition">Concluir</button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeMainTab === 'servicos' && (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <h2 className="text-lg font-bold text-mimu-wine-text dark:text-white">Gerir serviços</h2>
                <div className="flex gap-2">
                  <Link
                    to="/empresa/servicos/criar"
                    className="px-4 py-2 bg-mimu-gold text-mimu-wine-text dark:text-white font-medium rounded-xl hover:bg-[#b87d26]"
                  >
                    Criar novo serviço
                  </Link>
                  <Link
                    to="/empresa/servicos"
                    className="px-4 py-2 border-2 border-mimu-gold text-mimu-gold font-medium rounded-xl hover:bg-mimu-gold/10"
                  >
                    Meus serviços
                  </Link>
                </div>
              </div>
              <p className="text-mimu-wine-light-text dark:text-gray-300/80 mb-4">Total: {companyServices.length} serviço(s)</p>
              {servicesLoading ? (
                <LocalSpinner />
              ) : companyServices.length === 0 ? (
                <p className="text-mimu-wine-light-text dark:text-gray-300/80 animate-fade-in">Ainda não criou nenhum serviço. Crie o primeiro para aparecer nas categorias do site.</p>
              ) : (
                <div className="space-y-3 animate-fade-in">
                  {companyServices.map((s) => (
                    <div key={s.id} className="p-4 bg-mimu-cream dark:bg-[#121212]/50 rounded-xl flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-lg overflow-hidden bg-mimu-cream dark:bg-[#121212] flex-shrink-0">
                          {s.images?.[0] ? <OptimizedImage src={s.images[0]} alt="" className="w-full h-full" objectFit="cover" /> : <span className="flex items-center justify-center text-2xl">🛎</span>}
                        </div>
                        <div>
                          <p className="font-medium text-mimu-wine-text dark:text-white">{s.name}</p>
                          <p className="text-sm text-mimu-wine-light-text dark:text-gray-300/80">{categories.find(c => c.id === s.categoryId)?.name || s.categoryId} • {s.location}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Link to={`/servico/${s.id}`} className="px-3 py-1.5 text-sm text-mimu-gold font-medium hover:underline">Ver</Link>
                        <button type="button" onClick={() => navigate(`/empresa/servicos/${s.id}/editar`)} className="px-3 py-1.5 text-sm border border-mimu-gold text-mimu-gold rounded-lg hover:bg-mimu-gold/10">Editar</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeMainTab === 'parceiros' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 className="text-lg font-bold text-mimu-wine-text dark:text-white">Prestadores / Parceiros</h2>
                <p className="text-sm text-mimu-wine-light-text dark:text-gray-300/80">
                  Gerir a equipa ligada à tua empresa.
                </p>
              </div>

              <form onSubmit={handlePartnerSubmit} className="bg-mimu-cream/50 dark:bg-[#121212]/50 border border-mimu-cream-border dark:border-[#2A2A2A] rounded-2xl p-4 space-y-3">
                <h3 className="font-semibold text-mimu-wine-text dark:text-white text-sm mb-1">
                  {partnerForm.id ? 'Editar parceiro' : 'Adicionar novo parceiro'}
                </h3>
                {partnerError && (
                  <div className="p-2 bg-red-100 text-red-700 rounded-xl text-xs">{partnerError}</div>
                )}
                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-mimu-wine-text dark:text-white mb-1">Nome completo</label>
                    <input
                      name="name"
                      value={partnerForm.name}
                      onChange={handlePartnerChange}
                      className="w-full px-3 py-2 rounded-xl border-2 border-mimu-cream-border dark:border-[#2A2A2A] bg-transparent text-mimu-wine-text dark:text-white focus:border-mimu-gold focus:outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-mimu-wine-text dark:text-white mb-1">Telefone</label>
                    <input
                      name="phone"
                      value={partnerForm.phone}
                      onChange={handlePartnerChange}
                      className="w-full px-3 py-2 rounded-xl border-2 border-mimu-cream-border dark:border-[#2A2A2A] bg-transparent text-mimu-wine-text dark:text-white focus:border-mimu-gold focus:outline-none text-sm"
                    />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-mimu-wine-text dark:text-white mb-1">Categoria de serviço</label>
                    <select
                      name="categoryId"
                      value={partnerForm.categoryId}
                      onChange={handlePartnerChange}
                      className="w-full px-3 py-2 rounded-xl border-2 border-mimu-cream-border dark:border-[#2A2A2A] bg-mimu-white dark:bg-[#1E1E1E] text-mimu-wine-text dark:text-white focus:border-mimu-gold focus:outline-none text-sm"
                    >
                      <option value="" className="bg-mimu-white dark:bg-[#1E1E1E]">Escolher...</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id} className="bg-mimu-white dark:bg-[#1E1E1E]">
                          {c.icon && c.icon.length <= 3 ? c.icon + ' ' : ''}{c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-mimu-wine-text dark:text-white mb-1">Foto (URL opcional)</label>
                    <input
                      name="photo"
                      value={partnerForm.photo}
                      onChange={handlePartnerChange}
                      className="w-full px-3 py-2 rounded-xl border-2 border-mimu-cream-border dark:border-[#2A2A2A] bg-transparent text-mimu-wine-text dark:text-white focus:border-mimu-gold focus:outline-none text-sm"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div>
                    <label className="block text-xs font-medium text-mimu-wine-text dark:text-white mb-1">Status</label>
                    <select
                      name="status"
                      value={partnerForm.status}
                      onChange={handlePartnerChange}
                      className="px-3 py-2 rounded-xl border-2 border-mimu-cream-border dark:border-[#2A2A2A] bg-mimu-white dark:bg-[#1E1E1E] text-mimu-wine-text dark:text-white focus:border-mimu-gold focus:outline-none text-sm"
                    >
                      <option value="active" className="bg-mimu-white dark:bg-[#1E1E1E]">Ativo</option>
                      <option value="inactive" className="bg-mimu-white dark:bg-[#1E1E1E]">Inativo</option>
                    </select>
                  </div>
                  <div className="flex gap-2 mt-4 md:mt-6">
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-mimu-gold text-mimu-wine-text dark:text-white text-sm font-medium hover:bg-[#b87d26]"
                    >
                      {partnerForm.id ? 'Guardar alterações' : 'Adicionar parceiro'}
                    </button>
                    {partnerForm.id && (
                      <button
                        type="button"
                        onClick={resetPartnerForm}
                        className="px-4 py-2 rounded-xl border-2 border-mimu-cream-border dark:border-[#2A2A2A] text-sm text-mimu-wine-light-text dark:text-gray-300 hover:bg-mimu-cream"
                      >
                        Cancelar edição
                      </button>
                    )}
                  </div>
                </div>
              </form>

              <div>
                <h3 className="text-sm font-semibold text-mimu-wine-text dark:text-white mb-2">Lista de parceiros</h3>
                {partners.length === 0 ? (
                  <p className="text-mimu-wine-light-text dark:text-gray-300/80 text-sm">Ainda não adicionaste nenhum prestador/parceiro.</p>
                ) : (
                  <div className="space-y-2 animate-fade-in">
                    {partners.map(p => (
                      <div
                        key={p.id}
                        className="p-3 bg-mimu-cream/70 dark:bg-[#121212]/50 border border-mimu-cream-border/30 dark:border-[#2A2A2A]/30 rounded-xl flex flex-wrap items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-mimu-gold flex items-center justify-center overflow-hidden text-sm font-bold text-mimu-wine-text dark:text-white">
                            {p.photo ? (
                              <img src={p.photo} alt={p.name} className="w-full h-full object-cover" />
                            ) : (
                              (p.name?.[0] || 'P')
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-mimu-wine-text dark:text-white">{p.name}</p>
                            <p className="text-xs text-mimu-wine-light-text dark:text-gray-300/80">
                              {p.phone} • {categories.find(c => c.id === p.category_id)?.name || p.category_id || 'Sem categoria'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                              p.status === 'active'
                                ? 'bg-green-100 text-green-800 dark:bg-green-950/20 dark:text-green-400'
                                : 'bg-gray-200 text-gray-700 dark:bg-[#2A2A2A] dark:text-gray-400'
                            }`}
                          >
                            {p.status === 'active' ? 'Ativo' : 'Inativo'}
                          </span>
                          <button
                            type="button"
                            onClick={() => togglePartnerStatus(p.id, p.status)}
                            className="px-3 py-1 rounded-lg text-xs font-medium border-2 border-mimu-gold text-mimu-gold hover:bg-mimu-gold/10"
                          >
                            {p.status === 'active' ? 'Desativar' : 'Ativar'}
                          </button>
                          <button
                            type="button"
                            onClick={() => startEditPartner(p)}
                            className="px-3 py-1 rounded-lg text-xs font-medium border-2 border-mimu-cream-border dark:border-[#2A2A2A] text-mimu-wine-light-text dark:text-gray-300 hover:bg-mimu-cream"
                          >
                            Editar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeMainTab === 'pagamentos' && (
            <div className="animate-fade-in">
              <h2 className="text-lg font-bold text-mimu-wine-text dark:text-white mb-4">Pagamentos Recebidos</h2>
              {paymentsLoading ? (
                <LocalSpinner />
              ) : payments.length === 0 ? (
                <p className="text-mimu-wine-light-text dark:text-gray-300/80">Ainda não recebeste nenhum pagamento para os teus serviços.</p>
              ) : (
                <div className="space-y-4 animate-fade-in">
                  {payments.map(p => {
                    const serviceName = p.metadata?.booking_details?.serviceName || 'Serviço Contratado'
                    const clientName = p.metadata?.booking_details?.clientName || 'Cliente'
                    
                    let statusBadge = 'bg-amber-100 text-amber-800'
                    let statusText = 'Pendente'
                    if (p.status === 'paid') {
                      statusBadge = 'bg-green-100 text-green-800'
                      statusText = 'Confirmado'
                    } else if (p.status === 'failed') {
                      statusBadge = 'bg-red-100 text-red-800'
                      statusText = 'Falhou'
                    } else if (p.status === 'cancelled') {
                      statusBadge = 'bg-gray-100 text-gray-800'
                      statusText = 'Cancelado'
                    }

                    return (
                      <div 
                        key={p.id}
                        className="p-4 bg-mimu-cream dark:bg-[#121212]/50 border border-transparent rounded-xl flex flex-wrap justify-between items-center gap-4 transition-all duration-300 hover:shadow-sm"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-lg">💰</span>
                            <p className="font-semibold text-mimu-wine-text dark:text-white">{serviceName}</p>
                          </div>
                          <div className="text-xs text-mimu-wine-light-text dark:text-gray-400 mt-1 space-y-0.5">
                            <p>Cliente: <span className="font-medium text-mimu-wine-text dark:text-white">{clientName}</span></p>
                            <p>Ref: <span className="font-mono">{p.transaction_reference}</span></p>
                            <p>Método: {p.payment_method === 'appy_pay' ? 'Appy Pay' : p.payment_method}</p>
                            <p>Data: {new Date(p.created_at).toLocaleString('pt-AO')}</p>
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end gap-2">
                          <span className="font-bold text-green-600 text-lg">
                            +{new Intl.NumberFormat('pt-AO', { style: 'currency', currency: p.currency || 'AOA' }).format(p.amount)}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-lg text-xs font-semibold ${statusBadge}`}>
                            {statusText}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {activeMainTab === 'estatisticas' && (
            <div className="animate-fade-in">
              <h2 className="text-lg font-bold text-mimu-wine-text dark:text-white mb-4">Estatísticas da Empresa</h2>
              <p className="text-mimu-wine-light-text dark:text-gray-300/80">Total de pedidos recebidos: {stats.total}</p>
              <p className="text-mimu-wine-light-text dark:text-gray-300/80">Taxa de conclusão: {stats.total > 0 ? Math.round((stats.concluidos / stats.total) * 100) : 0}%</p>
            </div>
          )}

          {activeMainTab === 'eventos' && (
            <EventsManager userId={user?.id} role={user?.role} />
          )}

          {activeMainTab === 'carteira' && (
            <div className="animate-fade-in">
              <h2 className="text-lg font-bold text-mimu-wine-text dark:text-white mb-4">💰 Carteira da Empresa</h2>
              {walletLoading ? (
                <LocalSpinner />
              ) : (
                <div className="space-y-4">
                  {/* Saldo Card */}
                  <div className="relative overflow-hidden rounded-2xl p-6" style={{ background: 'linear-gradient(135deg, #7B1D1D 0%, #450A0A 100%)' }}>
                    <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(212,175,55,0.15)' }} />
                    <p className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-2">Saldo Disponível</p>
                    <p className="text-white text-4xl font-extrabold mb-1 relative z-10">
                      {walletBalance !== null
                        ? new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(walletBalance)
                        : '—'}
                    </p>
                    <p className="text-white/50 text-xs mb-4">🇦🇴 Kwanza (AOA)</p>
                    <Link
                      to="/carteira"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 relative z-10"
                      style={{ background: 'rgba(212,175,55,0.9)', color: '#1a0a0a' }}
                    >
                      Gerir Carteira →
                    </Link>
                  </div>

                  {/* Ações Rápidas */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { emoji: '⬇️', label: 'Depositar', path: '/carteira' },
                      { emoji: '⬆️', label: 'Levantar', path: '/carteira' },
                      { emoji: '↔️', label: 'Transferir', path: '/carteira' },
                    ].map(a => (
                      <Link key={a.label} to={a.path}
                        className="flex flex-col items-center justify-center p-4 rounded-xl border border-mimu-cream-border dark:border-[#2A2A2A] bg-mimu-cream/40 dark:bg-[#121212]/30 hover:border-mimu-gold/30 hover:bg-mimu-gold/5 transition text-center group"
                      >
                        <span className="text-2xl mb-1 group-hover:scale-110 transition-transform">{a.emoji}</span>
                        <span className="text-xs font-semibold text-mimu-wine-text dark:text-white">{a.label}</span>
                      </Link>
                    ))}
                  </div>

                  <div className="p-4 rounded-xl bg-mimu-gold/5 border border-mimu-gold/15 text-center">
                    <p className="text-xs text-mimu-wine-light-text dark:text-gray-400">
                      O saldo é atualizado automaticamente após cada pagamento recebido.
                      <Link to="/carteira" className="text-mimu-gold font-semibold hover:underline ml-1">Ver histórico completo →</Link>
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Editar Perfil */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-mimu-white dark:bg-[#1E1E1E] rounded-3xl border border-mimu-cream-border dark:border-[#2A2A2A] p-6 max-w-lg w-full shadow-2xl relative max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between mb-4 border-b border-mimu-cream-border dark:border-[#2A2A2A] pb-3">
              <h3 className="text-lg font-bold text-mimu-wine-text dark:text-white flex items-center gap-2">
                <span>👤</span> Editar Perfil
              </h3>
              <button 
                onClick={() => setSearchParams({ tab: activeMainTab })}
                className="w-8 h-8 flex items-center justify-center bg-mimu-cream dark:bg-[#121212] text-mimu-wine-text dark:text-white rounded-full hover:bg-mimu-gold hover:text-white transition active:scale-90"
              >
                ✕
              </button>
            </div>
            
            <div className="overflow-y-auto flex-1 pr-1">
              <EditProfile onSuccess={() => setTimeout(() => setSearchParams({ tab: activeMainTab }), 1500)} />
            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalhes da Reserva e Informações do Cliente */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in text-mimu-wine-text dark:text-white">
          <div className="bg-mimu-white dark:bg-[#1E1E1E] rounded-3xl border border-mimu-cream-border dark:border-[#2A2A2A] p-6 max-w-2xl w-full shadow-2xl relative max-h-[90vh] flex flex-col">
            
            {/* Cabeçalho */}
            <div className="flex items-center justify-between mb-4 border-b border-mimu-cream-border dark:border-[#2A2A2A] pb-3">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <span>📋</span> Detalhes do Pedido & Cliente
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
              
              {/* Informações da Reserva */}
              <div className="p-5 bg-gradient-to-br from-mimu-cream/80 to-mimu-cream/30 dark:from-[#121212]/50 dark:to-[#121212]/20 border border-mimu-cream-border dark:border-[#2A2A2A] rounded-2xl shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-mimu-gold/5 rounded-full -mr-8 -mt-8"></div>
                <div className="flex justify-between items-start gap-4 mb-4">
                  <div>
                    <h4 className="text-xl font-bold mb-1">{selectedOrder.serviceName}</h4>
                    <p className="text-xs text-mimu-wine-light-text/60 dark:text-gray-400">ID: {selectedOrder.id}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-lg text-sm font-semibold shadow-sm ${
                    selectedOrder.status === 'pendente' ? 'bg-amber-100 text-amber-800' :
                    selectedOrder.status === 'aceite' ? 'bg-mimu-gold/20 text-mimu-gold font-semibold' :
                    selectedOrder.status === 'em_curso' ? 'bg-purple-100 text-purple-800' :
                    selectedOrder.status === 'concluido' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {statusLabels[selectedOrder.status] || selectedOrder.status}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mt-2">
                  <div>
                    <p className="text-xs text-mimu-wine-light-text/60 dark:text-gray-400 font-medium">Data da Reserva</p>
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
                    <p className="font-semibold">{paymentLabels[selectedOrder.paymentStatus] || selectedOrder.paymentStatus || 'Pendente'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-mimu-wine-light-text/60 dark:text-gray-400 font-medium">Total do Pedido</p>
                    <p className="font-bold text-mimu-gold">{new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(selectedOrder.total || 0)}</p>
                  </div>
                </div>

                {selectedOrder.specialRequests && (
                  <div className="mt-4 pt-3 border-t border-mimu-cream-border dark:border-[#2A2A2A]/60">
                    <p className="text-xs text-mimu-wine-light-text/60 dark:text-gray-400 font-medium mb-1">Pedidos Especiais do Cliente</p>
                    <p className="text-sm italic">{selectedOrder.specialRequests}</p>
                  </div>
                )}
              </div>

              {/* Informações do Cliente */}
              <div>
                <h4 className="font-bold text-base mb-3">Informações do Cliente</h4>
                {loadingProfile ? (
                  <LocalSpinner />
                ) : clientProfile ? (
                  <div className="p-5 bg-mimu-cream/30 dark:bg-[#121212]/20 border border-mimu-cream-border/60 dark:border-[#2A2A2A]/40 rounded-2xl flex flex-col md:flex-row gap-4 items-start md:items-center">
                    
                    <div className="w-16 h-16 rounded-full bg-mimu-gold flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm border border-mimu-cream-border dark:border-[#2A2A2A]">
                      {clientProfile.avatar_url ? (
                        <OptimizedImage src={clientProfile.avatar_url} alt="" className="w-full h-full" objectFit="cover" />
                      ) : (
                        <span className="text-2xl font-bold">
                          {(clientProfile.name || selectedOrder.clientName || 'C')[0].toUpperCase()}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex-1 space-y-2">
                      <div>
                        <h5 className="font-bold text-lg">
                          {clientProfile.name}
                        </h5>
                        <p className="text-xs text-mimu-gold font-medium uppercase tracking-wide">
                          Cliente Registado
                        </p>
                      </div>
                      
                      {clientProfile.description && (
                        <p className="text-sm text-mimu-wine-light-text dark:text-gray-300 italic">
                          "{clientProfile.description}"
                        </p>
                      )}
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 pt-2 border-t border-mimu-cream-border/40 dark:border-[#2A2A2A]/30 text-sm">
                        {clientProfile.phone && (
                          <div className="flex items-center gap-2">
                            <span>📞</span>
                            <span>{clientProfile.phone}</span>
                          </div>
                        )}
                        {clientProfile.email && (
                          <div className="flex items-center gap-2 overflow-hidden">
                            <span>✉️</span>
                            <span className="truncate" title={clientProfile.email}>{clientProfile.email}</span>
                          </div>
                        )}
                        {(clientProfile.city || clientProfile.province) && (
                          <div className="flex items-center gap-2 sm:col-span-2">
                            <span>📍</span>
                            <span>
                              {clientProfile.city || ''}
                              {clientProfile.city && clientProfile.province ? ', ' : ''}
                              {clientProfile.province || ''}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-mimu-cream/30 dark:bg-[#121212]/20 border border-mimu-cream-border/60 dark:border-[#2A2A2A]/40 rounded-2xl">
                    <p className="text-sm font-semibold">{selectedOrder.clientName}</p>
                    <p className="text-xs text-mimu-wine-light-text/60 dark:text-gray-400 italic">Não foi possível carregar o perfil completo do cliente.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Ações do Modal */}
            <div className="flex flex-wrap justify-between items-center gap-3 mt-6 pt-4 border-t border-mimu-cream-border dark:border-[#2A2A2A]">
              <div className="flex gap-2">
                {selectedOrder.status === 'pendente' && (
                  <>
                    <button
                      onClick={() => {
                        handleStatus(selectedOrder.id, 'aceite');
                        setSelectedOrder(prev => prev ? { ...prev, status: 'aceite' } : null);
                      }}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-xl transition"
                    >
                      Aceitar
                    </button>
                    <button
                      onClick={() => {
                        handleStatus(selectedOrder.id, 'cancelado');
                        setSelectedOrder(null);
                      }}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-xl transition"
                    >
                      Rejeitar
                    </button>
                  </>
                )}
                {selectedOrder.status === 'aceite' && (
                  <button
                    onClick={() => {
                      handleStatus(selectedOrder.id, 'em_curso');
                      setSelectedOrder(prev => prev ? { ...prev, status: 'em_curso' } : null);
                    }}
                    className="px-4 py-2 bg-mimu-gold hover:bg-[#b87d26] text-white text-sm font-medium rounded-xl transition"
                  >
                    Em curso
                  </button>
                )}
                {selectedOrder.status === 'em_curso' && (
                  <button
                    onClick={() => {
                      handleStatus(selectedOrder.id, 'concluido');
                      setSelectedOrder(null);
                    }}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-xl transition"
                  >
                    Concluir
                  </button>
                )}
              </div>
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
    </div>
  )
}
