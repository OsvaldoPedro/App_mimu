import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useOrders, useNotifications, updateOrderStatus } from '../../hooks/useOrders'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import EditProfile from '../../components/EditProfile'

const statusLabels = { pendente: 'Pendente', aceite: 'Aceite', em_curso: 'Em curso', concluido: 'Concluído', cancelado: 'Cancelado' }
const statusColors = { pendente: 'bg-amber-100 text-amber-800', aceite: 'bg-blue-100 text-blue-800', em_curso: 'bg-purple-100 text-purple-800', concluido: 'bg-green-100 text-green-800', cancelado: 'bg-red-100 text-red-800' }

export default function ClientDashboard() {
  const { user, logout } = useAuth()
  const { orders, reload } = useOrders(user?.id)
  const { notifications } = useNotifications(user?.id)
  const [tab, setTab] = useState('pedidos')

  const handleCancel = (orderId, status) => {
    if (!['pendente', 'aceite'].includes(status)) return
    // Opcional: confirmação simples para evitar toques acidentais
    const ok = window.confirm('Tens a certeza que queres cancelar este pedido?')
    if (!ok) return
    updateOrderStatus(orderId, 'cancelado')
    reload()
  }

  return (
    <div className="min-h-screen bg-[#F4E8D8]">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-[#C58A2B] flex items-center justify-center text-2xl font-bold text-[#3A0D0D] overflow-hidden">
                {user?.photo ? <img src={user.photo} alt="" className="w-full h-full object-cover" /> : (user?.name?.[0] || '?')}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#3A0D0D]">{user?.name}</h1>
                <p className="text-[#5C1A1A]/80">Painel do Cliente</p>
              </div>
            </div>
            <div className="flex gap-4">
              <Link to="/" className="px-4 py-2 border-2 border-[#C58A2B] text-[#C58A2B] rounded-xl font-medium hover:bg-[#C58A2B]/10">
                Explorar serviços
              </Link>
              <button onClick={logout} className="px-4 py-2 text-[#5C1A1A]/80 hover:text-[#3A0D0D]">
                Sair
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="flex border-b border-[#F4E8D8]">
              {[
                { id: 'pedidos', label: 'Pedidos', count: orders.length },
                { id: 'perfil', label: 'Perfil' },
                { id: 'notificacoes', label: 'Notificações', count: notifications.filter(n => !n.read).length }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`px-6 py-4 font-medium ${tab === t.id ? 'text-[#C58A2B] border-b-2 border-[#C58A2B]' : 'text-[#5C1A1A]/80'}`}
                >
                  {t.label} {t.count > 0 && <span className="ml-1 text-sm">({t.count})</span>}
                </button>
              ))}
            </div>

            <div className="p-6">
              {tab === 'pedidos' && (
                <div>
                  <h2 className="text-lg font-bold text-[#3A0D0D] mb-4">Histórico de pedidos</h2>
                  {orders.length === 0 ? (
                    <div>
                      <p className="text-[#5C1A1A]/80">Ainda não fizeste nenhum pedido.</p>
                      <Link to="/categoria/estadia" className="text-[#C58A2B] font-medium mt-2 inline-block">Explorar serviços →</Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.map(o => (
                        <div key={o.id} className="p-4 bg-[#F4E8D8]/50 rounded-xl flex flex-wrap justify-between items-center gap-4">
                          <div>
                            <p className="font-medium text-[#3A0D0D]">{o.serviceName}</p>
                            <p className="text-sm text-[#5C1A1A]/80">{o.date} • {o.time || ''}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 rounded-lg text-sm font-medium ${statusColors[o.status] || 'bg-gray-100'}`}>
                              {statusLabels[o.status] || o.status}
                            </span>
                            {['pendente', 'aceite'].includes(o.status) && (
                              <button
                                type="button"
                                onClick={() => handleCancel(o.id, o.status)}
                                className="px-3 py-1 rounded-lg text-sm font-medium border-2 border-red-200 text-red-700 hover:bg-red-50"
                              >
                                Cancelar pedido
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {tab === 'perfil' && (
                <div className="space-y-4">
                  <h2 className="text-lg font-bold text-[#3A0D0D]">Editar perfil</h2>
                  <EditProfile />
                </div>
              )}

              {tab === 'notificacoes' && (
                <div>
                  <h2 className="text-lg font-bold text-[#3A0D0D] mb-4">Notificações</h2>
                  {notifications.length === 0 ? (
                    <p className="text-[#5C1A1A]/80">Sem notificações.</p>
                  ) : (
                    <div className="space-y-2">
                      {notifications.map(n => (
                        <div key={n.id} className={`p-4 rounded-xl ${n.read ? 'bg-gray-50' : 'bg-[#F4E8D8]/50'}`}>
                          <p className="text-sm text-[#5C1A1A]/80">
                            {n.type === 'estado_reserva' && `Reserva ${n.data?.status}`}
                            {n.type === 'reserva_enviada' && 'Reserva enviada com sucesso'}
                          </p>
                          <p className="text-xs text-[#5C1A1A]/60">{new Date(n.createdAt).toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  )}
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
