import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useServices } from '../../context/ServicesContext'
import { useOrdersByProvider } from '../../hooks/useOrders'
import { categories } from '../../data/categories'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import EditProfile from '../../components/EditProfile'
import { updateOrderStatus } from '../../hooks/useOrders'

const statusLabels = { pendente: 'Pendente', aceite: 'Aceite', em_curso: 'Em curso', concluido: 'Concluído', cancelado: 'Cancelado' }
const paymentLabels = { pendente: 'Pendente', aguardando: 'Aguardando Confirmação', confirmado: 'Confirmado', pago_50: 'Pago 50%' }

export default function ProviderDashboard() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { getProviderServices } = useServices()
  const { orders, reload } = useOrdersByProvider(user?.id)
  const [tab, setTab] = useState('visao')
  const [services, setServices] = useState([])

  useEffect(() => {
    if (user?.id) setServices(getProviderServices(user.id))
  }, [user?.id, getProviderServices, tab])

  const pendentes = orders.filter(o => o.status === 'pendente')
  const confirmadas = orders.filter(o => o.status === 'aceite' || o.status === 'em_curso')
  const concluidas = orders.filter(o => o.status === 'concluido')
  const ganhosSimulados = concluidas.length * (user?.basePrice || 25000) * 0.85
  const dividaSimulada = concluidas.length * (user?.basePrice || 25000) * 0.15

  const handleStatus = (orderId, status) => {
    updateOrderStatus(orderId, status)
    reload()
  }

  return (
    <div className="min-h-screen bg-[#F4E8D8]">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-[#C58A2B] flex items-center justify-center text-2xl font-bold text-[#3A0D0D]">
                {user?.name?.[0] || '?'}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#3A0D0D]">{user?.name}</h1>
                <p className="text-[#5C1A1A]/80">
                  Painel do Prestador
                  {user?.status === 'pending_approval' && (
                    <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-800 rounded text-sm">Pendente de Aprovação</span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <Link to="/" className="px-4 py-2 border-2 border-[#C58A2B] text-[#C58A2B] rounded-xl font-medium hover:bg-[#C58A2B]/10">
                Ver site
              </Link>
              <button onClick={logout} className="px-4 py-2 text-[#5C1A1A]/80 hover:text-[#3A0D0D]">Sair</button>
            </div>
          </div>

          {tab === 'visao' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-2xl p-6 shadow-md">
                <p className="text-[#5C1A1A]/80 text-sm">Serviços ativos</p>
                <p className="text-2xl font-bold text-[#3A0D0D]">{user?.serviceTypes?.length || 0}</p>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-md">
                <p className="text-[#5C1A1A]/80 text-sm">Reservas recebidas</p>
                <p className="text-2xl font-bold text-[#3A0D0D]">{orders.length}</p>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-md">
                <p className="text-[#5C1A1A]/80 text-sm">Ganhos líquidos (simulação)</p>
                <p className="text-2xl font-bold text-green-600">{new Intl.NumberFormat('pt-AO').format(ganhosSimulados)} AOA</p>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-md">
                <p className="text-[#5C1A1A]/80 text-sm">Dívida pendente (simulação)</p>
                <p className="text-2xl font-bold text-amber-600">{new Intl.NumberFormat('pt-AO').format(dividaSimulada)} AOA</p>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="flex flex-wrap border-b border-[#F4E8D8]">
              {[
                { id: 'visao', label: 'Visão Geral' },
                { id: 'reservas', label: 'Gestão de Reservas', count: orders.length },
                { id: 'servicos', label: 'Gestão de Serviços' },
                { id: 'pagamentos', label: 'Pagamentos' },
                { id: 'perfil', label: 'Perfil' }
              ].map(t => (
                <button key={t.id} onClick={() => setTab(t.id)} className={`px-6 py-4 font-medium ${tab === t.id ? 'text-[#C58A2B] border-b-2 border-[#C58A2B]' : 'text-[#5C1A1A]/80'}`}>
                  {t.label} {t.count > 0 && <span className="ml-1 text-sm">({t.count})</span>}
                </button>
              ))}
            </div>

            <div className="p-6">
              {tab === 'visao' && (
                <div className="space-y-4">
                  <h2 className="text-lg font-bold text-[#3A0D0D]">Resumo</h2>
                  <p className="text-[#5C1A1A]/80">Pendentes: {pendentes.length} | Confirmadas: {confirmadas.length} | Concluídas: {concluidas.length}</p>
                  <p className="text-sm text-[#5C1A1A]/60">
                    Lógica de comissão: Pagamento_recebido → dividir comissão | Pagamento_parcial → proporcional | Pagamento_manual → gerar dívida | Dívida_excedida → bloquear | Dívida_liquidada → desbloquear
                  </p>
                </div>
              )}

              {tab === 'reservas' && (
                <div>
                  <h2 className="text-lg font-bold text-[#3A0D0D] mb-4">Todas as reservas</h2>
                  {orders.length === 0 ? (
                    <p className="text-[#5C1A1A]/80">Ainda não recebeste reservas.</p>
                  ) : (
                    <div className="space-y-4">
                      {orders.map(o => (
                        <div key={o.id} className="p-4 bg-[#F4E8D8]/50 rounded-xl">
                          <div className="flex flex-wrap justify-between items-start gap-4">
                            <div>
                              <p className="font-medium text-[#3A0D0D]">{o.serviceName}</p>
                              <p className="text-sm text-[#5C1A1A]/80">Cliente: {o.clientName}</p>
                              <p className="text-sm text-[#5C1A1A]/80">Data: {o.date} • {o.time || ''}</p>
                              <p className="text-xs text-[#5C1A1A]/60">Método pagamento: {o.paymentMethod || 'Não definido'} | Estado: {paymentLabels[o.paymentStatus] || o.paymentStatus || 'Pendente'}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="px-3 py-1 rounded-lg text-sm bg-gray-100">{statusLabels[o.status]}</span>
                              {o.status === 'pendente' && (
                                <>
                                  <button onClick={() => handleStatus(o.id, 'aceite')} className="px-3 py-1 bg-green-100 text-green-800 rounded-lg text-sm font-medium">Aceitar</button>
                                  <button onClick={() => handleStatus(o.id, 'cancelado')} className="px-3 py-1 bg-red-100 text-red-800 rounded-lg text-sm font-medium">Rejeitar</button>
                                </>
                              )}
                              {o.status === 'aceite' && (
                                <button onClick={() => handleStatus(o.id, 'em_curso')} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium">Em curso</button>
                              )}
                              {o.status === 'em_curso' && (
                                <button onClick={() => handleStatus(o.id, 'concluido')} className="px-3 py-1 bg-green-100 text-green-800 rounded-lg text-sm font-medium">Concluir</button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {tab === 'servicos' && (
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                    <h2 className="text-lg font-bold text-[#3A0D0D]">Gestão de Serviços</h2>
                    <div className="flex gap-2">
                      <Link
                        to="/prestador/servicos/criar"
                        className="px-4 py-2 bg-[#C58A2B] text-[#3A0D0D] font-medium rounded-xl hover:bg-[#b87d26]"
                      >
                        Criar novo serviço
                      </Link>
                      <Link
                        to="/prestador/servicos"
                        className="px-4 py-2 border-2 border-[#C58A2B] text-[#C58A2B] font-medium rounded-xl hover:bg-[#C58A2B]/10"
                      >
                        Meus serviços
                      </Link>
                    </div>
                  </div>
                  <p className="text-[#5C1A1A]/80 mb-4">Total: {services.length} serviço(s)</p>
                  {services.length === 0 ? (
                    <p className="text-[#5C1A1A]/80">Ainda não criaste nenhum serviço. Os serviços ficam pendentes de validação do Administrador.</p>
                  ) : (
                    <div className="space-y-3">
                      {services.map((s) => (
                        <div key={s.id} className="p-4 bg-[#F4E8D8]/50 rounded-xl flex flex-wrap items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-14 h-14 rounded-lg overflow-hidden bg-[#F4E8D8] flex-shrink-0">
                              {s.images?.[0] ? <img src={s.images[0]} alt="" className="w-full h-full object-cover" /> : null}
                            </div>
                            <div>
                              <p className="font-medium text-[#3A0D0D]">{s.name}</p>
                              <p className="text-sm text-[#5C1A1A]/80">{categories.find(c => c.id === s.categoryId)?.name || s.categoryId} • {s.location}</p>
                              <p className="text-xs text-[#5C1A1A]/60">Estado: {s.status === 'approved' ? 'Aprovado' : 'Pendente de Validação'}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Link to={`/servico/${s.id}`} className="px-3 py-1.5 text-sm text-[#C58A2B] font-medium hover:underline">Ver</Link>
                            <button type="button" onClick={() => navigate(`/prestador/servicos/${s.id}/editar`)} className="px-3 py-1.5 text-sm border border-[#C58A2B] text-[#C58A2B] rounded-lg hover:bg-[#C58A2B]/10">Editar</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {tab === 'pagamentos' && (
                <div>
                  <h2 className="text-lg font-bold text-[#3A0D0D] mb-4">Pagamentos (Visual / Simulação)</h2>
                  <p className="text-[#5C1A1A]/80">Reservas pagas: {concluidas.length}</p>
                  <p className="text-[#5C1A1A]/80">Reservas pendentes: {orders.filter(o => o.status !== 'concluido').length}</p>
                  <p className="text-sm text-amber-700 mt-4">Integração real de pagamentos em desenvolvimento.</p>
                </div>
              )}

              {tab === 'perfil' && (
                <div className="space-y-4">
                  <h2 className="text-lg font-bold text-[#3A0D0D]">Editar perfil do prestador</h2>
                  <EditProfile />
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
