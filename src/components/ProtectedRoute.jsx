import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth()
  const location = useLocation()

  if (!user) {
    return <Navigate to="/entrar" state={{ from: location }} replace />
  }

  // Bloqueia acesso a painéis de empresa/prestador até aprovação do admin
  if (allowedRoles?.includes('company') && user.role === 'company' && user.status !== 'active') {
    return (
      <div className="min-h-screen bg-[#F4E8D8] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <h1 className="text-xl font-bold text-[#3A0D0D] mb-2">Conta pendente</h1>
          <p className="text-[#5C1A1A]/80">
            A tua conta empresarial está <strong>pendente de aprovação</strong> pelo Administrador.
          </p>
          <p className="text-amber-700 text-sm mt-3">Assim que for aprovada, terás acesso ao painel.</p>
          <a href="/" className="inline-block mt-6 px-6 py-3 bg-[#C58A2B] text-[#3A0D0D] font-bold rounded-xl hover:bg-[#b87d26]">
            Voltar ao site
          </a>
        </div>
      </div>
    )
  }
  if (allowedRoles?.includes('provider') && user.role === 'provider' && user.status !== 'active') {
    return (
      <div className="min-h-screen bg-[#F4E8D8] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <h1 className="text-xl font-bold text-[#3A0D0D] mb-2">Conta pendente</h1>
          <p className="text-[#5C1A1A]/80">
            A tua conta de prestador está <strong>pendente de aprovação</strong> pelo Administrador.
          </p>
          <p className="text-amber-700 text-sm mt-3">Assim que for aprovada, terás acesso ao painel.</p>
          <a href="/" className="inline-block mt-6 px-6 py-3 bg-[#C58A2B] text-[#3A0D0D] font-bold rounded-xl hover:bg-[#b87d26]">
            Voltar ao site
          </a>
        </div>
      </div>
    )
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'client') return <Navigate to="/painel" replace />
    if (user.role === 'company') return <Navigate to="/empresa" replace />
    if (user.role === 'provider') return <Navigate to="/prestador" replace />
    if (user.role === 'admin') return <Navigate to="/admin" replace />
    return <Navigate to="/" replace />
  }

  return children
}
