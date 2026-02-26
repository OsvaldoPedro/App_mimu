import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useServices } from '../context/ServicesContext'
import { getServiceById } from '../data/services'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import ServiceForm from '../components/ServiceForm'

export default function EditServicePage() {
  const { serviceId } = useParams()
  const navigate = useNavigate()
  const { user, isCompany } = useAuth()
  const { updateService } = useServices()

  const service = getServiceById(serviceId, { publicOnly: false })
  const isOwnService = service && service.companyId === user?.id

  if (!user || !isCompany) {
    return (
      <div className="min-h-screen bg-[#F4E8D8] flex items-center justify-center">
        <p className="text-[#5C1A1A]">Apenas empresas podem editar serviços.</p>
        <Link to="/" className="ml-4 text-[#C58A2B]">Voltar</Link>
      </div>
    )
  }

  if (!service || !isOwnService) {
    return (
      <div className="min-h-screen bg-[#F4E8D8] flex items-center justify-center">
        <p className="text-[#5C1A1A]">Serviço não encontrado ou não tem permissão para editar.</p>
        <Link to="/empresa/servicos" className="ml-4 text-[#C58A2B]">Meus serviços</Link>
      </div>
    )
  }

  const handleSubmit = async (payload) => {
    const result = await updateService(serviceId, payload)
    if (result.success) {
      navigate('/empresa/servicos')
    } else {
      throw new Error(result.error)
    }
  }

  return (
    <div className="min-h-screen bg-[#F4E8D8]">
      <Navbar />
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-8">
          <Link to="/empresa/servicos" className="text-[#C58A2B] text-sm font-medium mb-4 inline-block">
            ← Meus serviços
          </Link>
          <h1 className="text-2xl font-bold text-[#3A0D0D] mb-2">Editar serviço</h1>
          <p className="text-[#5C1A1A]/80 mb-6">{service.name}</p>
          <ServiceForm
            initialService={service}
            onSubmit={handleSubmit}
            submitLabel="Guardar alterações"
            onCancel={() => navigate('/empresa/servicos')}
          />
        </div>
      </main>
      <Footer />
    </div>
  )
}
