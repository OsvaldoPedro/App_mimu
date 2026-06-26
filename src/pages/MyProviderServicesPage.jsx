import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useServices } from '../context/ServicesContext'
import { categories } from '../data/categories'

function formatPrice(price, currency) {
  return new Intl.NumberFormat('pt-AO', { minimumFractionDigits: 0 }).format(price) + ' ' + currency
}

export default function MyProviderServicesPage() {
  const navigate = useNavigate()
  const { user, isProvider } = useAuth()
  const { getProviderServices, deleteProviderService } = useServices()
  const [services, setServices] = useState([])
  const [categoryFilter, setCategoryFilter] = useState('')
  const [deletingId, setDeletingId] = useState(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  const loadServices = () => {
    if (user?.id) getProviderServices(user.id).then(setServices)
  }

  useEffect(() => {
    loadServices()
  }, [user?.id, getProviderServices])

  if (!user || !isProvider) {
    return (
      <div className="min-h-screen bg-mimu-cream dark:bg-[#121212] flex items-center justify-center">
        <p className="text-mimu-wine-light-text dark:text-gray-300">Apenas prestadores podem aceder a esta página.</p>
        <Link to="/" className="ml-4 text-mimu-gold">Voltar</Link>
      </div>
    )
  }

  const filtered = categoryFilter
    ? services.filter((s) => s.categoryId === categoryFilter)
    : services

  const handleDelete = async (id) => {
    setDeletingId(id)
    const result = await deleteProviderService(id)
    setDeletingId(null)
    setConfirmDeleteId(null)
    if (result.success) loadServices()
  }

  return (
        <div className="max-w-6xl mx-auto w-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-mimu-wine-text dark:text-white">Meus serviços</h1>
              <p className="text-mimu-wine-light-text dark:text-gray-300/80">Gerir os seus serviços como prestador.</p>
            </div>
            <Link
              to="/prestador/servicos/criar"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-mimu-gold hover:bg-[#b87d26] text-mimu-wine-text dark:text-white font-bold rounded-xl"
            >
              Criar novo serviço
            </Link>
          </div>

          <div className="bg-mimu-white dark:bg-[#1E1E1E] rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300 p-4 md:p-6 mb-6">
            <p className="text-mimu-wine-light-text dark:text-gray-300/80 mb-2">
              Total: <strong className="text-mimu-wine-text dark:text-white">{services.length}</strong> serviço(s)
            </p>
            <div>
              <label className="block text-sm font-medium text-mimu-wine-text dark:text-white mb-2">Filtrar por categoria</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full sm:w-64 px-4 py-2 rounded-xl border-2 border-mimu-cream-border dark:border-[#2A2A2A] focus:border-mimu-gold focus:outline-none"
              >
                <option value="">Todas</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="bg-mimu-white dark:bg-[#1E1E1E] rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300 p-12 text-center">
              <p className="text-mimu-wine-light-text dark:text-gray-300/80 mb-4">
                {services.length === 0 ? 'Ainda não criou nenhum serviço.' : 'Nenhum serviço nesta categoria.'}
              </p>
              {services.length === 0 && (
                <Link
                  to="/prestador/servicos/criar"
                  className="inline-block px-6 py-3 bg-mimu-gold text-mimu-wine-text dark:text-white font-bold rounded-xl hover:bg-[#b87d26]"
                >
                  Criar primeiro serviço
                </Link>
              )}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((service) => (
                <div
                  key={service.id}
                  className="bg-mimu-white dark:bg-[#1E1E1E] rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden border border-mimu-cream-border dark:border-[#2A2A2A]"
                >
                  <Link to={`/servico/${service.id}`} className="block">
                    <div className="relative h-40 overflow-hidden">
                      <img
                        src={service.images?.[0]}
                        alt={service.name}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-2 left-2 px-2 py-1 rounded-lg bg-black/60 text-mimu-white-text text-xs">
                        {categories.find((c) => c.id === service.categoryId)?.name || service.categoryId}
                      </span>
                      <span className={`absolute top-2 right-2 px-2 py-1 rounded-lg text-xs font-bold shadow-sm ${
                        service.status === 'approved' ? 'bg-green-100 text-green-800 border border-green-200' :
                        service.status === 'rejected' ? 'bg-red-100 text-red-800 border border-red-200' :
                        'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}>
                        {service.status === 'approved' ? 'Público' : 
                         service.status === 'rejected' ? 'Rejeitado' : 
                         'Aguardando aprovação'}
                      </span>
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-mimu-wine-text dark:text-white line-clamp-2">{service.name}</h3>
                      <p className="text-sm text-mimu-wine-light-text dark:text-gray-300/80 mt-1">{service.location}</p>
                      <p className="text-mimu-gold font-bold mt-2">{formatPrice(service.price, service.currency)}</p>
                    </div>
                  </Link>
                  <div className="px-4 pb-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => navigate(`/prestador/servicos/${service.id}/editar`)}
                      className="flex-1 py-2 rounded-xl border-2 border-mimu-gold text-mimu-gold font-medium hover:bg-mimu-gold/10"
                    >
                      Editar
                    </button>
                    {confirmDeleteId === service.id ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleDelete(service.id)}
                          disabled={deletingId === service.id}
                          className="flex-1 py-2 rounded-xl bg-red-500 text-mimu-white-text font-medium hover:bg-red-600 disabled:opacity-60"
                        >
                          {deletingId === service.id ? 'A remover...' : 'Confirmar'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="py-2 px-3 rounded-xl border border-mimu-cream-border dark:border-[#2A2A2A] text-mimu-wine-light-text dark:text-gray-300/80 hover:bg-mimu-cream dark:bg-[#121212]"
                        >
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(service.id)}
                        className="flex-1 py-2 rounded-xl border-2 border-red-200 text-red-600 font-medium hover:bg-red-50"
                      >
                        Remover
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6">
            <Link to="/prestador" className="text-mimu-gold font-medium hover:underline">
              ← Voltar ao painel do prestador
            </Link>
          </div>
        </div>
  )
}

