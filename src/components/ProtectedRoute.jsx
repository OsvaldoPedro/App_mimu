import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth()
  const location = useLocation()

  // 1. Unauthenticated -> send to login
  if (!user) {
    return <Navigate to="/entrar" state={{ from: location }} replace />
  }

  // 2. Handle Pending / Rejected status
  // Allow admins to always pass (their status should be approved anyway)
  // Clients always have direct access — only company/provider need approval
  if (user.role !== 'admin' && user.role !== 'client' && user.role !== 'cliente') {
    if (user.status === 'pending_approval' && location.pathname !== '/perfil') {
      return (
        <div className="min-h-screen bg-mimu-cream dark:bg-[#121212] flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-mimu-white dark:bg-[#1E1E1E] rounded-2xl shadow-xl p-4 md:p-8 text-center">
            <h1 className="text-xl font-bold text-mimu-wine-text dark:text-white mb-2">Conta em análise</h1>
            <p className="text-mimu-wine-light-text dark:text-gray-300/80">
              A tua conta está <strong>pendente de aprovação</strong> pelo Administrador.
            </p>
            <p className="text-amber-700 text-sm mt-3">Assim que for aprovada, terás acesso total ao sistema.</p>
            <a href="/" className="inline-block mt-6 px-6 py-3 bg-mimu-gold text-mimu-wine-text dark:text-white font-bold rounded-xl hover:bg-[#b87d26]">
              Voltar à página inicial
            </a>
          </div>
        </div>
      )
    }

    if (user.status === 'rejected') {
      return (
        <div className="min-h-screen bg-mimu-cream dark:bg-[#121212] flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-mimu-white dark:bg-[#1E1E1E] rounded-2xl shadow-xl p-4 md:p-8 text-center">
            <h1 className="text-xl font-bold text-red-600 mb-2">Conta rejeitada</h1>
            <p className="text-mimu-wine-light-text dark:text-gray-300/80">
              Infelizmente, a tua conta <strong>não foi aprovada</strong>.
            </p>
            <p className="text-red-700 text-sm mt-3">Para mais informações, por favor contacta o suporte.</p>
            <a href="/" className="inline-block mt-6 px-6 py-3 bg-red-600 text-mimu-white-text font-bold rounded-xl hover:bg-red-700">
              Sair
            </a>
          </div>
        </div>
      )
    }
  }

  // 3. Enforce Role restrictions (e.g. /admin requires 'admin')
  if (allowedRoles) {
    const userRole = user.role ? user.role.trim().toLowerCase() : '';
    const normalizedAllowedRoles = allowedRoles.map(r => r.trim().toLowerCase());
    
    // Expand allowed roles to include translations so we don't kick out users with localized roles
    const expandedAllowedRoles = new Set(normalizedAllowedRoles);
    if (expandedAllowedRoles.has('provider')) expandedAllowedRoles.add('prestador');
    if (expandedAllowedRoles.has('company')) expandedAllowedRoles.add('empresa');
    if (expandedAllowedRoles.has('client')) expandedAllowedRoles.add('cliente');
    if (expandedAllowedRoles.has('admin')) expandedAllowedRoles.add('administrador');

    if (!expandedAllowedRoles.has(userRole)) {
      return <Navigate to="/" replace />
    }
  }

  // 4. Authorized
  return children
}
