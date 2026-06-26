import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useServices } from '../context/ServicesContext'
import { getServiceById } from '../data/services'
import ServiceForm from '../components/ServiceForm'

export default function EditProviderServicePage() {
  const { serviceId } = useParams()
  const navigate = useNavigate()
  const { user, isProvider } = useAuth()
  const { updateProviderService } = useServices()

  const [service, setService] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const data = await getServiceById(serviceId, { publicOnly: false })
      setService(data)
      setLoading(false)
    }
    load()
  }, [serviceId])

  if (loading) {
    return (
      <div className="min-h-screen bg-mimu-cream dark:bg-[#121212] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-mimu-gold"></div>
      </div>
    )
  }

  const isOwnService = service && service.providerId === user?.id

  if (!user || !isProvider) {
    return (
      <div className="min-h-screen bg-mimu-cream dark:bg-[#121212] flex items-center justify-center">
        <p className="text-mimu-wine-light-text dark:text-gray-300">Apenas prestadores podem editar serviços.</p>
        <Link to="/" className="ml-4 text-mimu-gold">Voltar</Link>
      </div>
    )
  }

  if (!service || !isOwnService) {
    return (
      <div className="min-h-screen bg-mimu-cream dark:bg-[#121212] flex items-center justify-center">
        <p className="text-mimu-wine-light-text dark:text-gray-300">Serviço não encontrado ou não tem permissão para editar.</p>
        <Link to="/prestador/servicos" className="ml-4 text-mimu-gold">Meus serviços</Link>
      </div>
    )
  }

  const handleSubmit = async (payload) => {
    const result = await updateProviderService(serviceId, payload)
    if (result.success) {
      navigate('/prestador/servicos')
    } else {
      throw new Error(result.error)
    }
  }

  return (
        <div className="max-w-2xl mx-auto bg-mimu-white dark:bg-[#1E1E1E] rounded-2xl shadow-xl p-4 md:p-8 w-full">
          <Link to="/prestador/servicos" className="text-mimu-gold text-sm font-medium mb-4 inline-block">
            ← Meus serviços
          </Link>
          <h1 className="text-xl md:text-2xl font-bold text-mimu-wine-text dark:text-white mb-2">Editar serviço</h1>
          <p className="text-mimu-wine-light-text dark:text-gray-300/80 mb-6">{service.name}</p>
          <ServiceForm
            initialService={service}
            onSubmit={handleSubmit}
            submitLabel="Guardar alterações"
            onCancel={() => navigate('/prestador/servicos')}
          />
        </div>
  )
}
