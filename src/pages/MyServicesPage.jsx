import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useServices } from '../context/ServicesContext'
import { categories } from '../data/categories'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

function formatPrice(price, currency) {
  return new Intl.NumberFormat('pt-AO', { minimumFractionDigits: 0 }).format(price) + ' ' + currency
}

export default function MyServicesPage() {
  const navigate = useNavigate()
  const { user, isCompany } = useAuth()
  const { getCompanyServices, deleteService } = useServices()
  const [services, setServices] = useState([])
  const [categoryFilter, setCategoryFilter] = useState('')
  const [deletingId, setDeletingId] = useState(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  const loadServices = () => {
    if (user?.id) setServices(getCompanyServices(user.id))
  }

  useEffect(() => {
    loadServices()
  }, [user?.id, getCompanyServices])

  if (!user || !isCompany) {
    return (
      <div className="min-h-screen bg-[#F4E8D8] flex items-center justify-center">
        <p className="text-[#5C1A1A]">Apenas empresas podem aceder a esta página.</p>
        <Link to="/" className="ml-4 text-[#C58A2B]">Voltar</Link>
      </div>
    )
  }

  const filtered = categoryFilter
    ? services.filter((s) => s.categoryId === categoryFilter)
    : services

  const handleDelete = async (id) => {
    setDeletingId(id)
    const result = await deleteService(id)
    setDeletingId(null)
    setConfirmDeleteId(null)
    if (result.success) loadServices()
  }

  return (
    <div className="min-h-screen bg-[#F4E8D8]">
      <Navbar />
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold text-[#3A0D0D]">Meus serviços</h1>
              <p className="text-[#5C1A1A]/80">Gerir os serviços da sua empresa.</p>
            </div>
            <Link
              to="/empresa/servicos/criar"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#C58A2B] hover:bg-[#b87d26] text-[#3A0D0D] font-bold rounded-xl"
            >
              Criar novo serviço
            </Link>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <p className="text-[#5C1A1A]/80 mb-2">
              Total: <strong className="text-[#3A0D0D]">{services.length}</strong> serviço(s)
            </p>
            <div>
              <label className="block text-sm font-medium text-[#3A0D0D] mb-2">Filtrar por categoria</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full sm:w-64 px-4 py-2 rounded-xl border-2 border-[#F4E8D8] focus:border-[#C58A2B] focus:outline-none"
              >
                <option value="">Todas</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <p className="text-[#5C1A1A]/80 mb-4">
                {services.length === 0
                  ? 'Ainda não criou nenhum serviço.'
                  : 'Nenhum serviço nesta categoria.'}
              </p>
              {services.length === 0 && (
                <Link
                  to="/empresa/servicos/criar"
                  className="inline-block px-6 py-3 bg-[#C58A2B] text-[#3A0D0D] font-bold rounded-xl hover:bg-[#b87d26]"
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
                  className="bg-white rounded-2xl shadow-lg overflow-hidden border border-[#F4E8D8]"
                >
                  <Link to={`/servico/${service.id}`} className="block">
                    <div className="relative h-40 overflow-hidden">
                      <img
                        src={service.images?.[0]}
                        alt={service.name}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-2 left-2 px-2 py-1 rounded-lg bg-black/60 text-white text-xs">
                        {categories.find((c) => c.id === service.categoryId)?.name || service.categoryId}
                      </span>
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-[#3A0D0D] line-clamp-2">{service.name}</h3>
                      <p className="text-sm text-[#5C1A1A]/80 mt-1">{service.location}</p>
                      <p className="text-[#C58A2B] font-bold mt-2">{formatPrice(service.price, service.currency)}</p>
                    </div>
                  </Link>
                  <div className="px-4 pb-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => navigate(`/empresa/servicos/${service.id}/editar`)}
                      className="flex-1 py-2 rounded-xl border-2 border-[#C58A2B] text-[#C58A2B] font-medium hover:bg-[#C58A2B]/10"
                    >
                      Editar
                    </button>
                    {confirmDeleteId === service.id ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleDelete(service.id)}
                          disabled={deletingId === service.id}
                          className="flex-1 py-2 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 disabled:opacity-60"
                        >
                          {deletingId === service.id ? 'A remover...' : 'Confirmar'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="py-2 px-3 rounded-xl border border-[#F4E8D8] text-[#5C1A1A]/80 hover:bg-[#F4E8D8]"
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
            <Link to="/empresa" className="text-[#C58A2B] font-medium hover:underline">
              ← Voltar ao painel da empresa
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
