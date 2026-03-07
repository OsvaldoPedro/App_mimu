import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoleRoute({ children }) {
  const { user } = useAuth()
  const location = useLocation()

  // if nobody is logged in we don't enforce role-based panel restrictions
  if (!user) {
    return children
  }

  const path = location.pathname.toLowerCase()

  // bonus: when provider/company/admin are on public landing or login route, send them to panel
  if ((path === '/' || path === '/entrar' || path === '/login') && (user.role === 'provider' || user.role === 'company' || user.role === 'admin')) {
    const panel = user.role === 'provider' ? '/prestador' : user.role === 'company' ? '/empresa' : '/admin'
    return <Navigate to={panel} replace />
  }

  if (user.role === 'provider') {
    // allow anything under /prestador
    if (!path.startsWith('/prestador')) {
      return <Navigate to="/prestador" replace />
    }
  }

  if (user.role === 'company') {
    if (!path.startsWith('/empresa')) {
      return <Navigate to="/empresa" replace />
    }
  }

  if (user.role === 'admin') {
    if (!path.startsWith('/admin')) {
      return <Navigate to="/admin" replace />
    }
  }

  return children
}
