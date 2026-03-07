import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useServices } from '../context/ServicesContext'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import ServiceForm from '../components/ServiceForm'

export default function CreateServicePage() {
  const navigate = useNavigate()
  const { user, isCompany } = useAuth()
  const isApproved = user?.status === 'active'
  const { createService } = useServices()

  if (!user || !isCompany) {
    return (
      <div className="min-h-screen bg-[#F4E8D8] flex items-center justify-center">
        <p className="text-[#5C1A1A]">Apenas empresas podem criar serviços.</p>
        <Link to="/" className="ml-4 text-[#C58A2B]">Voltar</Link>
      </div>
    )
  }

  if (!isApproved) {
    return (
      <div className="min-h-screen bg-[#F4E8D8] flex items-center justify-center">
        <p className="text-[#5C1A1A]">Conta pendente de aprovação. Não é possível criar serviços ainda.</p>
        <Link to="/" className="ml-4 text-[#C58A2B]">Voltar</Link>
      </div>
    )
  }

  const handleSubmit = async (payload) => {
    const result = await createService({
      ...payload,
      companyId: user.id
    })
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
          <h1 className="text-2xl font-bold text-[#3A0D0D] mb-2">Criar novo serviço</h1>
          <p className="text-[#5C1A1A]/80 mb-6">
            O serviço ficará visível na categoria escolhida e poderá ser reservado pelos utilizadores.
          </p>
          <ServiceForm onSubmit={handleSubmit} submitLabel="Criar serviço" onCancel={() => navigate('/empresa/servicos')} />
        </div>
      </main>
      <Footer />
    </div>
  )
}
