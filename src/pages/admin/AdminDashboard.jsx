import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import { storage, KEYS } from '../../utils/storage'
import { updateOrderStatus } from '../../hooks/useOrders'
import { useAuth } from '../../context/AuthContext'

const roleLabels = { client: 'Utilizador', company: 'Empresa', provider: 'Prestador', admin: 'Admin' }
const statusLabels = {
  pending_approval: 'Pendente de Aprovação',
  active: 'Ativo',
  suspended: 'Suspenso',
  rejected: 'Rejeitado'
}

const serviceStatusLabels = {
  pending_validation: 'Pendente de Validação',
  approved: 'Aprovado',
  suspended: 'Suspenso',
  rejected: 'Rejeitado'
}

function badgeClassForStatus(status) {
  if (status === 'active' || status === 'approved') return 'bg-green-100 text-green-800'
  if (status === 'pending_approval' || status === 'pending_validation') return 'bg-amber-100 text-amber-800'
  if (status === 'suspended') return 'bg-red-100 text-red-800'
  if (status === 'rejected') return 'bg-gray-100 text-gray-800'
  return 'bg-gray-100 text-gray-800'
}

function getUsers() {
  return storage.get(KEYS.USERS, [])
}

function setUsers(users) {
  storage.set(KEYS.USERS, users)
}

function getCompanyServices() {
  return storage.get(KEYS.COMPANY_SERVICES, [])
}

function setCompanyServices(list) {
  storage.set(KEYS.COMPANY_SERVICES, list)
}

function getProviderServices() {
  return storage.get(KEYS.PROVIDER_SERVICES, [])
}

function setProviderServices(list) {
  storage.set(KEYS.PROVIDER_SERVICES, list)
}

function getOrders() {
  return storage.get(KEYS.ORDERS, [])
}

export default function AdminDashboard() {
  const { user } = useAuth()
  const [tab, setTab] = useState('contas')
  const [users, setUsersState] = useState([])
  const [companyServices, setCompanyServicesState] = useState([])
  const [providerServices, setProviderServicesState] = useState([])
  const [orders, setOrdersState] = useState([])
  const [busyId, setBusyId] = useState(null)

  const loadAll = () => {
    setUsersState(getUsers())
    setCompanyServicesState(getCompanyServices())
    setProviderServicesState(getProviderServices())
    setOrdersState(getOrders().slice().sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')))
  }

  useEffect(() => {
    loadAll()
    const onStorage = (e) => {
      if (!e.key) return
      if (e.key.startsWith('mimu_')) loadAll()
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const usersById = useMemo(() => {
    const map = new Map()
    users.forEach((u) => map.set(u.id, u))
    return map
  }, [users])

  const clients = users.filter((u) => u.role === 'client')
  const companies = users.filter((u) => u.role === 'company')
  const providers = users.filter((u) => u.role === 'provider')

  const allDynamicServices = useMemo(() => {
    const normalize = (s, ownerType) => ({
      ...s,
      ownerType,
      status: s.status || 'approved'
    })
    return [
      ...companyServices.map((s) => normalize(s, 'company')),
      ...providerServices.map((s) => normalize(s, 'provider'))
    ].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
  }, [companyServices, providerServices])

  const updateAccountStatus = async (userId, nextStatus) => {
    setBusyId(userId)
    try {
      const list = getUsers()
      const idx = list.findIndex((u) => u.id === userId)
      if (idx === -1) return
      list[idx] = { ...list[idx], status: nextStatus, updatedAt: new Date().toISOString() }
      setUsers(list)
      loadAll()
    } finally {
      setBusyId(null)
    }
  }

  const updateServiceStatus = async (serviceId, ownerType, nextStatus) => {
    setBusyId(serviceId)
    try {
      if (ownerType === 'company') {
        const list = getCompanyServices()
        const idx = list.findIndex((s) => s.id === serviceId)
        if (idx === -1) return
        list[idx] = { ...list[idx], status: nextStatus, validatedAt: new Date().toISOString() }
        setCompanyServices(list)
      } else {
        const list = getProviderServices()
        const idx = list.findIndex((s) => s.id === serviceId)
        if (idx === -1) return
        list[idx] = { ...list[idx], status: nextStatus, validatedAt: new Date().toISOString() }
        setProviderServices(list)
      }
      loadAll()
    } finally {
      setBusyId(null)
    }
  }

  const removeService = async (serviceId, ownerType) => {
    setBusyId(serviceId)
    try {
      if (ownerType === 'company') {
        const list = getCompanyServices().filter((s) => s.id !== serviceId)
        setCompanyServices(list)
      } else {
        const list = getProviderServices().filter((s) => s.id !== serviceId)
        setProviderServices(list)
      }
      loadAll()
    } finally {
      setBusyId(null)
    }
  }

  const changeOrderStatus = async (orderId, status) => {
    setBusyId(orderId)
    try {
      updateOrderStatus(orderId, status)
      loadAll()
    } finally {
      setBusyId(null)
    }
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-[#F4E8D8] flex items-center justify-center">
        <p className="text-[#5C1A1A]">Acesso restrito.</p>
        <Link to="/" className="ml-4 text-[#C58A2B]">Voltar</Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F4E8D8]">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold text-[#3A0D0D]">Painel do Administrador</h1>
              <p className="text-[#5C1A1A]/80">Super Admin – gestão geral da plataforma.</p>
            </div>
            <button
              type="button"
              onClick={loadAll}
              className="px-4 py-2 border-2 border-[#C58A2B] text-[#C58A2B] rounded-xl font-medium hover:bg-[#C58A2B]/10"
            >
              Atualizar
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="flex flex-wrap border-b border-[#F4E8D8]">
              {[
                { id: 'contas', label: 'Contas' },
                { id: 'servicos', label: 'Serviços' },
                { id: 'pedidos', label: 'Pedidos' }
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`px-6 py-4 font-medium ${
                    tab === t.id ? 'text-[#C58A2B] border-b-2 border-[#C58A2B]' : 'text-[#5C1A1A]/80'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="p-6">
              {tab === 'contas' && (
                <div className="space-y-8">
                  {[
                    { title: 'Utilizadores', list: clients },
                    { title: 'Empresas', list: companies },
                    { title: 'Prestadores', list: providers }
                  ].map((section) => (
                    <div key={section.title}>
                      <h2 className="text-lg font-bold text-[#3A0D0D] mb-3">{section.title}</h2>
                      {section.list.length === 0 ? (
                        <p className="text-[#5C1A1A]/80">Sem registos.</p>
                      ) : (
                        <div className="space-y-2">
                          {section.list.map((u) => (
                            <div key={u.id} className="p-4 bg-[#F4E8D8]/50 rounded-xl flex flex-wrap items-center justify-between gap-4">
                              <div>
                                <p className="font-medium text-[#3A0D0D]">
                                  {u.role === 'company' ? u.companyName : u.name} <span className="text-xs text-[#5C1A1A]/70">({roleLabels[u.role]})</span>
                                </p>
                                <p className="text-sm text-[#5C1A1A]/80">{u.email || '—'} • {u.phone || '—'}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`px-3 py-1 rounded-lg text-sm font-medium ${badgeClassForStatus(u.status || 'active')}`}>
                                  {statusLabels[u.status || 'active'] || (u.status || 'active')}
                                </span>

                                {(u.role === 'company' || u.role === 'provider') && (u.status === 'pending_approval') && (
                                  <button
                                    type="button"
                                    onClick={() => updateAccountStatus(u.id, 'active')}
                                    disabled={busyId === u.id}
                                    className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-60"
                                  >
                                    Aprovar
                                  </button>
                                )}

                                {(u.status || 'active') === 'active' ? (
                                  <button
                                    type="button"
                                    onClick={() => updateAccountStatus(u.id, 'suspended')}
                                    disabled={busyId === u.id}
                                    className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-60"
                                  >
                                    Suspender
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => updateAccountStatus(u.id, 'active')}
                                    disabled={busyId === u.id}
                                    className="px-3 py-1.5 text-sm border border-[#C58A2B] text-[#C58A2B] rounded-lg hover:bg-[#C58A2B]/10 disabled:opacity-60"
                                  >
                                    Reativar
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {tab === 'servicos' && (
                <div>
                  <h2 className="text-lg font-bold text-[#3A0D0D] mb-3">Serviços (empresas e prestadores)</h2>
                  {allDynamicServices.length === 0 ? (
                    <p className="text-[#5C1A1A]/80">Sem serviços dinâmicos.</p>
                  ) : (
                    <div className="space-y-2">
                      {allDynamicServices.map((s) => {
                        const owner = s.ownerType === 'company'
                          ? usersById.get(s.companyId)
                          : usersById.get(s.providerId)
                        const ownerName = s.ownerType === 'company' ? (owner?.companyName || s.companyId) : (owner?.name || s.providerId)
                        return (
                          <div key={s.id} className="p-4 bg-[#F4E8D8]/50 rounded-xl flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <div className="w-14 h-14 rounded-lg overflow-hidden bg-[#F4E8D8] flex-shrink-0">
                                {s.images?.[0] ? <img src={s.images[0]} alt="" className="w-full h-full object-cover" /> : null}
                              </div>
                              <div>
                                <p className="font-medium text-[#3A0D0D]">{s.name}</p>
                                <p className="text-sm text-[#5C1A1A]/80">
                                  {s.ownerType === 'company' ? 'Empresa' : 'Prestador'}: {ownerName} • {s.location || '—'}
                                </p>
                                <p className="text-xs text-[#5C1A1A]/60">ID: {s.id}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`px-3 py-1 rounded-lg text-sm font-medium ${badgeClassForStatus(s.status)}`}>
                                {serviceStatusLabels[s.status] || s.status}
                              </span>
                              {s.status === 'pending_validation' && (
                                <button
                                  type="button"
                                  onClick={() => updateServiceStatus(s.id, s.ownerType, 'approved')}
                                  disabled={busyId === s.id}
                                  className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-60"
                                >
                                  Validar
                                </button>
                              )}
                              {s.status === 'approved' ? (
                                <button
                                  type="button"
                                  onClick={() => updateServiceStatus(s.id, s.ownerType, 'suspended')}
                                  disabled={busyId === s.id}
                                  className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-60"
                                >
                                  Suspender
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => updateServiceStatus(s.id, s.ownerType, 'approved')}
                                  disabled={busyId === s.id}
                                  className="px-3 py-1.5 text-sm border border-[#C58A2B] text-[#C58A2B] rounded-lg hover:bg-[#C58A2B]/10 disabled:opacity-60"
                                >
                                  Aprovar
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => removeService(s.id, s.ownerType)}
                                disabled={busyId === s.id}
                                className="px-3 py-1.5 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-60"
                              >
                                Remover
                              </button>
                              <Link to={`/servico/${s.id}`} className="px-3 py-1.5 text-sm text-[#C58A2B] font-medium hover:underline">
                                Ver
                              </Link>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {tab === 'pedidos' && (
                <div>
                  <h2 className="text-lg font-bold text-[#3A0D0D] mb-3">Pedidos</h2>
                  {orders.length === 0 ? (
                    <p className="text-[#5C1A1A]/80">Sem pedidos.</p>
                  ) : (
                    <div className="space-y-2">
                      {orders.map((o) => (
                        <div key={o.id} className="p-4 bg-[#F4E8D8]/50 rounded-xl flex flex-wrap items-center justify-between gap-4">
                          <div>
                            <p className="font-medium text-[#3A0D0D]">{o.serviceName}</p>
                            <p className="text-sm text-[#5C1A1A]/80">
                              Cliente: {o.clientName} • Data: {o.date} • Estado: {o.status}
                            </p>
                            <p className="text-xs text-[#5C1A1A]/60">ID: {o.id}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {['pendente', 'aceite', 'em_curso', 'concluido', 'cancelado'].map((st) => (
                              <button
                                key={st}
                                type="button"
                                disabled={busyId === o.id}
                                onClick={() => changeOrderStatus(o.id, st)}
                                className={`px-3 py-1.5 text-sm rounded-lg border ${
                                  o.status === st ? 'border-[#C58A2B] bg-[#C58A2B]/10 text-[#3A0D0D]' : 'border-[#F4E8D8] text-[#5C1A1A]/80 hover:border-[#C58A2B]/40'
                                }`}
                              >
                                {st}
                              </button>
                            ))}
                          </div>
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

