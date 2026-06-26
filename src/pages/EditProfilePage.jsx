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
    <div className="min-h-screen bg-mimu-cream dark:bg-[#121212]">
      <Navbar />
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-2xl mx-auto bg-mimu-white dark:bg-[#1E1E1E] rounded-2xl shadow-xl p-4 md:p-8">
          <Link to="/" className="text-mimu-gold text-sm font-medium mb-4 inline-block">
            ← Voltar
          </Link>
          <h1 className="text-xl md:text-2xl font-bold text-mimu-wine-text dark:text-white mb-2">Editar perfil</h1>
          <p className="text-mimu-wine-light-text dark:text-gray-300/80 mb-6">
            Actualiza os teus dados e foto. As alterações são guardadas no teu perfil.
          </p>
          <EditProfile />
        </div>
      </main>
      <Footer />
    </div>
  )
}
