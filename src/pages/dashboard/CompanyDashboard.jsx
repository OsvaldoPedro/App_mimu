import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useServices } from '../../context/ServicesContext'
import { useOrdersByCompany } from '../../hooks/useOrders'
import { storage, KEYS } from '../../utils/storage'
import { categories } from '../../data/categories'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import EditProfile from '../../components/EditProfile'
import { updateOrderStatus } from '../../hooks/useOrders'

const statusLabels = { pendente: 'Pendente', aceite: 'Aceite', em_curso: 'Em curso', concluido: 'Concluído', cancelado: 'Cancelado' }

export default function CompanyDashboard() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { getCompanyServices } = useServices()
  const { orders, reload } = useOrdersByCompany(user?.id)
  const [tab, setTab] = useState('pedidos')
  const [companyServices, setCompanyServices] = useState([])
  const [partners, setPartners] = useState([])
  const [partnerForm, setPartnerForm] = useState({
    id: null,
    name: '',
    phone: '',
    categoryId: '',
    photo: '',
    status: 'active'
  })
  const [partnerError, setPartnerError] = useState('')

  useEffect(() => {
    if (user?.id) setCompanyServices(getCompanyServices(user.id))
  }, [user?.id, getCompanyServices, tab])

  const loadPartners = () => {
    if (!user?.id) {
      setPartners([])
      return
    }
    const all = storage.get(KEYS.USERS, [])
    setPartners(all.filter(u => u.role === 'provider' && u.companyId === user.id))
  }

  useEffect(() => {
    if (tab === 'parceiros') {
      loadPartners()
    }
  }, [tab, user?.id])

  const pendentes = orders.filter(o => o.status === 'pendente')
  const stats = { total: orders.length, pendentes: pendentes.length, concluidos: orders.filter(o => o.status === 'concluido').length }

  const handleStatus = (orderId, status) => {
    updateOrderStatus(orderId, status)
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
      categoryId: partner.categoryId || '',
      photo: partner.photo || '',
      status: partner.status || 'active'
    })
    setPartnerError('')
  }

  const handlePartnerSubmit = (e) => {
    e.preventDefault()
    if (!partnerForm.name.trim() || !partnerForm.phone.trim() || !partnerForm.categoryId) {
      setPartnerError('Nome, telefone e categoria são obrigatórios.')
      return
    }
    const users = storage.get(KEYS.USERS, [])
    if (partnerForm.id) {
      const idx = users.findIndex(u => u.id === partnerForm.id && u.companyId === user.id)
      if (idx === -1) {
        setPartnerError('Parceiro não encontrado.')
        return
      }
      users[idx] = {
        ...users[idx],
        name: partnerForm.name.trim(),
        phone: partnerForm.phone.trim(),
        categoryId: partnerForm.categoryId,
        photo: partnerForm.photo || null,
        status: partnerForm.status || 'active'
      }
    } else {
      const id = 'prv_' + Date.now()
      const newPartner = {
        id,
        role: 'provider',
        companyId: user.id,
        name: partnerForm.name.trim(),
        phone: partnerForm.phone.trim(),
        categoryId: partnerForm.categoryId,
        photo: partnerForm.photo || null,
        status: partnerForm.status || 'active'
      }
      users.push(newPartner)
    }
    storage.set(KEYS.USERS, users)
    loadPartners()
    resetPartnerForm()
  }

  const togglePartnerStatus = (partnerId) => {
    const users = storage.get(KEYS.USERS, [])
    const idx = users.findIndex(u => u.id === partnerId && u.companyId === user?.id)
    if (idx === -1) return
    const current = users[idx]
    const nextStatus = current.status === 'active' ? 'inactive' : 'active'
    users[idx] = { ...current, status: nextStatus }
    storage.set(KEYS.USERS, users)
    loadPartners()
  }

  return (
    <div className="min-h-screen bg-[#F4E8D8]">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-[#C58A2B] flex items-center justify-center overflow-hidden">
                {user?.logo ? <img src={user.logo} alt="" className="w-full h-full object-cover" /> : <span className="text-2xl font-bold text-[#3A0D0D]">🏢</span>}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#3A0D0D]">{user?.companyName}</h1>
                <p className="text-[#5C1A1A]/80">Painel da Empresa</p>
              </div>
            </div>
            <div className="flex gap-4">
              <Link to="/" className="px-4 py-2 border-2 border-[#C58A2B] text-[#C58A2B] rounded-xl font-medium hover:bg-[#C58A2B]/10">
                Ver site
              </Link>
              <button onClick={logout} className="px-4 py-2 text-[#5C1A1A]/80 hover:text-[#3A0D0D]">Sair</button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-2xl p-6 shadow-md">
              <p className="text-[#5C1A1A]/80 text-sm">Total de pedidos</p>
              <p className="text-2xl font-bold text-[#3A0D0D]">{stats.total}</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-md">
              <p className="text-[#5C1A1A]/80 text-sm">Pendentes</p>
              <p className="text-2xl font-bold text-amber-600">{stats.pendentes}</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-md">
              <p className="text-[#5C1A1A]/80 text-sm">Concluídos</p>
              <p className="text-2xl font-bold text-green-600">{stats.concluidos}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="flex border-b border-[#F4E8D8]">
              {['pedidos', 'servicos', 'parceiros', 'perfil', 'estatisticas'].map(t => (
                <button key={t} onClick={() => setTab(t)} className={`px-6 py-4 font-medium capitalize ${tab === t ? 'text-[#C58A2B] border-b-2 border-[#C58A2B]' : 'text-[#5C1A1A]/80'}`}>
                  {t}
                </button>
              ))}
            </div>

            <div className="p-6">
              {tab === 'pedidos' && (
                <div>
                  <h2 className="text-lg font-bold text-[#3A0D0D] mb-4">Pedidos recebidos</h2>
                  {orders.length === 0 ? (
                    <p className="text-[#5C1A1A]/80">Ainda não recebeste pedidos.</p>
                  ) : (
                    <div className="space-y-4">
                      {orders.map(o => (
                        <div key={o.id} className="p-4 bg-[#F4E8D8]/50 rounded-xl flex flex-wrap justify-between items-center gap-4">
                          <div>
                            <p className="font-medium text-[#3A0D0D]">{o.serviceName}</p>
                            <p className="text-sm text-[#5C1A1A]/80">Cliente: {o.clientName} • {o.date}</p>
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
                      ))}
                    </div>
                  )}
                </div>
              )}

              {tab === 'servicos' && (
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                    <h2 className="text-lg font-bold text-[#3A0D0D]">Gerir serviços</h2>
                    <div className="flex gap-2">
                      <Link
                        to="/empresa/servicos/criar"
                        className="px-4 py-2 bg-[#C58A2B] text-[#3A0D0D] font-medium rounded-xl hover:bg-[#b87d26]"
                      >
                        Criar novo serviço
                      </Link>
                      <Link
                        to="/empresa/servicos"
                        className="px-4 py-2 border-2 border-[#C58A2B] text-[#C58A2B] font-medium rounded-xl hover:bg-[#C58A2B]/10"
                      >
                        Meus serviços
                      </Link>
                    </div>
                  </div>
                  <p className="text-[#5C1A1A]/80 mb-4">Total: {companyServices.length} serviço(s)</p>
                  {companyServices.length === 0 ? (
                    <p className="text-[#5C1A1A]/80">Ainda não criou nenhum serviço. Crie o primeiro para aparecer nas categorias do site.</p>
                  ) : (
                    <div className="space-y-3">
                      {companyServices.map((s) => (
                        <div key={s.id} className="p-4 bg-[#F4E8D8]/50 rounded-xl flex flex-wrap items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-14 h-14 rounded-lg overflow-hidden bg-[#F4E8D8] flex-shrink-0">
                              {s.images?.[0] ? <img src={s.images[0]} alt="" className="w-full h-full object-cover" /> : <span className="flex items-center justify-center text-2xl">🛎</span>}
                            </div>
                            <div>
                              <p className="font-medium text-[#3A0D0D]">{s.name}</p>
                              <p className="text-sm text-[#5C1A1A]/80">{categories.find(c => c.id === s.categoryId)?.name || s.categoryId} • {s.location}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Link to={`/servico/${s.id}`} className="px-3 py-1.5 text-sm text-[#C58A2B] font-medium hover:underline">Ver</Link>
                            <button type="button" onClick={() => navigate(`/empresa/servicos/${s.id}/editar`)} className="px-3 py-1.5 text-sm border border-[#C58A2B] text-[#C58A2B] rounded-lg hover:bg-[#C58A2B]/10">Editar</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {tab === 'parceiros' && (
                <div className="space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <h2 className="text-lg font-bold text-[#3A0D0D]">Prestadores / Parceiros</h2>
                    <p className="text-sm text-[#5C1A1A]/70">
                      Gerir a equipa ligada à tua empresa.
                    </p>
                  </div>

                  <form onSubmit={handlePartnerSubmit} className="bg-[#F4E8D8]/60 rounded-2xl p-4 space-y-3">
                    <h3 className="font-semibold text-[#3A0D0D] text-sm mb-1">
                      {partnerForm.id ? 'Editar parceiro' : 'Adicionar novo parceiro'}
                    </h3>
                    {partnerError && (
                      <div className="p-2 bg-red-100 text-red-700 rounded-xl text-xs">{partnerError}</div>
                    )}
                    <div className="grid md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-[#3A0D0D] mb-1">Nome completo</label>
                        <input
                          name="name"
                          value={partnerForm.name}
                          onChange={handlePartnerChange}
                          className="w-full px-3 py-2 rounded-xl border-2 border-[#F4E8D8] focus:border-[#C58A2B] focus:outline-none text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#3A0D0D] mb-1">Telefone</label>
                        <input
                          name="phone"
                          value={partnerForm.phone}
                          onChange={handlePartnerChange}
                          className="w-full px-3 py-2 rounded-xl border-2 border-[#F4E8D8] focus:border-[#C58A2B] focus:outline-none text-sm"
                        />
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-[#3A0D0D] mb-1">Categoria de serviço</label>
                        <select
                          name="categoryId"
                          value={partnerForm.categoryId}
                          onChange={handlePartnerChange}
                          className="w-full px-3 py-2 rounded-xl border-2 border-[#F4E8D8] focus:border-[#C58A2B] focus:outline-none text-sm"
                        >
                          <option value="">Escolher...</option>
                          {categories.map(c => (
                            <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#3A0D0D] mb-1">Foto (URL opcional)</label>
                        <input
                          name="photo"
                          value={partnerForm.photo}
                          onChange={handlePartnerChange}
                          className="w-full px-3 py-2 rounded-xl border-2 border-[#F4E8D8] focus:border-[#C58A2B] focus:outline-none text-sm"
                        />
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <div>
                        <label className="block text-xs font-medium text-[#3A0D0D] mb-1">Status</label>
                        <select
                          name="status"
                          value={partnerForm.status}
                          onChange={handlePartnerChange}
                          className="px-3 py-2 rounded-xl border-2 border-[#F4E8D8] focus:border-[#C58A2B] focus:outline-none text-sm"
                        >
                          <option value="active">Ativo</option>
                          <option value="inactive">Inativo</option>
                        </select>
                      </div>
                      <div className="flex gap-2 mt-4 md:mt-6">
                        <button
                          type="submit"
                          className="px-4 py-2 rounded-xl bg-[#C58A2B] text-[#3A0D0D] text-sm font-medium hover:bg-[#b87d26]"
                        >
                          {partnerForm.id ? 'Guardar alterações' : 'Adicionar parceiro'}
                        </button>
                        {partnerForm.id && (
                          <button
                            type="button"
                            onClick={resetPartnerForm}
                            className="px-4 py-2 rounded-xl border-2 border-[#F4E8D8] text-sm text-[#5C1A1A]/80 hover:bg-[#F4E8D8]"
                          >
                            Cancelar edição
                          </button>
                        )}
                      </div>
                    </div>
                  </form>

                  <div>
                    <h3 className="text-sm font-semibold text-[#3A0D0D] mb-2">Lista de parceiros</h3>
                    {partners.length === 0 ? (
                      <p className="text-[#5C1A1A]/80 text-sm">Ainda não adicionaste nenhum prestador/parceiro.</p>
                    ) : (
                      <div className="space-y-2">
                        {partners.map(p => (
                          <div
                            key={p.id}
                            className="p-3 bg-[#F4E8D8]/70 rounded-xl flex flex-wrap items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-[#C58A2B] flex items-center justify-center overflow-hidden text-sm font-bold text-[#3A0D0D]">
                                {p.photo ? (
                                  <img src={p.photo} alt={p.name} className="w-full h-full object-cover" />
                                ) : (
                                  (p.name?.[0] || 'P')
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-[#3A0D0D]">{p.name}</p>
                                <p className="text-xs text-[#5C1A1A]/80">
                                  {p.phone} • {categories.find(c => c.id === p.categoryId)?.name || p.categoryId || 'Sem categoria'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                                  p.status === 'active'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-200 text-gray-700'
                                }`}
                              >
                                {p.status === 'active' ? 'Ativo' : 'Inativo'}
                              </span>
                              <button
                                type="button"
                                onClick={() => togglePartnerStatus(p.id)}
                                className="px-3 py-1 rounded-lg text-xs font-medium border-2 border-[#C58A2B] text-[#C58A2B] hover:bg-[#C58A2B]/10"
                              >
                                {p.status === 'active' ? 'Desativar' : 'Ativar'}
                              </button>
                              <button
                                type="button"
                                onClick={() => startEditPartner(p)}
                                className="px-3 py-1 rounded-lg text-xs font-medium border-2 border-[#F4E8D8] text-[#5C1A1A]/80 hover:bg-[#F4E8D8]"
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

              {tab === 'perfil' && (
                <div className="space-y-4">
                  <h2 className="text-lg font-bold text-[#3A0D0D]">Editar perfil da empresa</h2>
                  <EditProfile />
                </div>
              )}

              {tab === 'estatisticas' && (
                <div>
                  <h2 className="text-lg font-bold text-[#3A0D0D] mb-4">Estatísticas</h2>
                  <p className="text-[#5C1A1A]/80">Total de pedidos: {stats.total}</p>
                  <p className="text-[#5C1A1A]/80">Taxa de conclusão: {stats.total > 0 ? Math.round((stats.concluidos / stats.total) * 100) : 0}%</p>
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
