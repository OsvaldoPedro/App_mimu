import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import EditProfile from '../components/EditProfile'

/**
 * Página de edição de perfil – exemplo de uso do componente EditProfile.
 * O mesmo componente é usado nos dashboards (aba Perfil) de cliente, empresa e prestador.
 */
export default function EditProfilePage() {
  return (
    <div className="min-h-screen bg-[#F4E8D8]">
      <Navbar />
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-8">
          <Link to="/" className="text-[#C58A2B] text-sm font-medium mb-4 inline-block">
            ← Voltar
          </Link>
          <h1 className="text-2xl font-bold text-[#3A0D0D] mb-2">Editar perfil</h1>
          <p className="text-[#5C1A1A]/80 mb-6">
            Actualiza os teus dados e foto. As alterações são guardadas no teu perfil.
          </p>
          <EditProfile />
        </div>
      </main>
      <Footer />
    </div>
  )
}
