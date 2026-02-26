import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import SplashScreen from './components/SplashScreen'
import PageLoader from './components/PageLoader'
import { useNetwork } from './context/NetworkContext'
import ProtectedRoute from './components/ProtectedRoute'
import HomePage from './pages/HomePage'
import CategoryPage from './pages/CategoryPage'
import ServiceDetailPage from './pages/ServiceDetailPage'
import BookingPage from './pages/BookingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import RegisterClientPage from './pages/RegisterClientPage'
import RegisterCompanyPage from './pages/RegisterCompanyPage'
import RegisterProviderPage from './pages/RegisterProviderPage'
import ClientDashboard from './pages/dashboard/ClientDashboard'
import CompanyDashboard from './pages/dashboard/CompanyDashboard'
import ProviderDashboard from './pages/dashboard/ProviderDashboard'
import EditProfilePage from './pages/EditProfilePage'
import CreateServicePage from './pages/CreateServicePage'
import MyServicesPage from './pages/MyServicesPage'
import EditServicePage from './pages/EditServicePage'
import RecoverPassword from './pages/RecoverPassword'
import ResetPassword from './pages/ResetPassword'
import AdminDashboard from './pages/admin/AdminDashboard'
import CreateProviderServicePage from './pages/CreateProviderServicePage'
import MyProviderServicesPage from './pages/MyProviderServicesPage'
import EditProviderServicePage from './pages/EditProviderServicePage'

function AppRoutes() {
  const location = useLocation()


  const loading = false

/*
  const [loading, setLoading] = useState(false)
  const [prevPath, setPrevPath] = useState(location.pathname)

  useEffect(() => {
    if (location.pathname !== prevPath) {
      setPrevPath(location.pathname)
      setLoading(true)
      const timer = setTimeout(() => setLoading(false), 10000)
      return () => clearTimeout(timer)
    }
  }, [location.pathname, prevPath])
*/

  return (
    <div className="relative">
      <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/categoria/:categoryId" element={<CategoryPage />} />
      <Route path="/servico/:serviceId" element={<ServiceDetailPage />} />
      <Route path="/servico/:serviceId/reservar" element={<ProtectedRoute><BookingPage /></ProtectedRoute>} />

      <Route path="/entrar" element={<LoginPage />} />
      <Route path="/recover-password" element={<RecoverPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/registar" element={<RegisterPage />} />
      <Route path="/registar/client" element={<RegisterClientPage />} />
      <Route path="/registar/company" element={<RegisterCompanyPage />} />
      <Route path="/registar/provider" element={<RegisterProviderPage />} />

      <Route path="/painel" element={<ProtectedRoute allowedRoles={['client']}><ClientDashboard /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/empresa/servicos/criar" element={<ProtectedRoute allowedRoles={['company']}><CreateServicePage /></ProtectedRoute>} />
      <Route path="/empresa/servicos/:serviceId/editar" element={<ProtectedRoute allowedRoles={['company']}><EditServicePage /></ProtectedRoute>} />
      <Route path="/empresa/servicos" element={<ProtectedRoute allowedRoles={['company']}><MyServicesPage /></ProtectedRoute>} />
      <Route path="/empresa" element={<ProtectedRoute allowedRoles={['company']}><CompanyDashboard /></ProtectedRoute>} />
      <Route path="/prestador/servicos/criar" element={<ProtectedRoute allowedRoles={['provider']}><CreateProviderServicePage /></ProtectedRoute>} />
      <Route path="/prestador/servicos/:serviceId/editar" element={<ProtectedRoute allowedRoles={['provider']}><EditProviderServicePage /></ProtectedRoute>} />
      <Route path="/prestador/servicos" element={<ProtectedRoute allowedRoles={['provider']}><MyProviderServicesPage /></ProtectedRoute>} />
      <Route path="/prestador" element={<ProtectedRoute allowedRoles={['provider']}><ProviderDashboard /></ProtectedRoute>} />

      {/* Exemplo de uso: página única de edição de perfil para qualquer tipo de conta */}
      <Route path="/perfil" element={<ProtectedRoute><EditProfilePage /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}
function App() {
  const { online } = useNetwork()

  if (!online) {
    return <SplashScreen />
  }

  return <AppRoutes />
}


export default App
