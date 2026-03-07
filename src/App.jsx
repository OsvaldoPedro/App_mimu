import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import SplashScreen from './components/SplashScreen'
import PageLoader from './components/PageLoader'
import { useNetwork } from './context/NetworkContext'
import ProtectedRoute from './components/ProtectedRoute' // per‑route authorization
// ProtectedRoleRoute removed – logic handled by ProtectedRoute and individual route guards
import HomePage from './pages/HomePage'
import CategoryPage from './pages/CategoryPage'
import AllServicesPage from './pages/AllServicesPage'
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
import AdminCategories from './pages/admin/AdminCategories'
import AdminProviders from './pages/admin/AdminProviders'
import AdminCompanies from './pages/admin/AdminCompanies'
import AdminOrders from './pages/admin/AdminOrders'
import AdminDocuments from './pages/admin/AdminDocuments'
import AdminUsersPage from './pages/admin/AdminUsersPage'
import AdminSettingsPage from './pages/admin/AdminSettingsPage'

function AppRoutes() {
  const location = useLocation()

  return (
    <div className="min-h-screen bg-gray-100">
      <Routes>
        {/* ===== ROTAS PÚBLICAS ===== */}
        {/* Rota inicial - Abre a página principal */}
        <Route path="/" element={<HomePage />} />
        
        {/* Navegação de serviços e produtos */}
        <Route path="/servicos" element={<AllServicesPage />} />
        <Route path="/categoria/:categoryId" element={<CategoryPage />} />
        <Route path="/servico/:serviceId" element={<ServiceDetailPage />} />
        <Route path="/servico/:serviceId/reservar" element={<ProtectedRoute><BookingPage /></ProtectedRoute>} />

        {/* Autenticação */}
        <Route path="/entrar" element={<LoginPage />} />
        <Route path="/registar" element={<RegisterPage />} />
        <Route path="/registar/client" element={<RegisterClientPage />} />
        <Route path="/registar/company" element={<RegisterCompanyPage />} />
        <Route path="/registar/provider" element={<RegisterProviderPage />} />
        <Route path="/recover-password" element={<RecoverPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* ===== ROTAS PROTEGIDAS - CLIENTE ===== */}
        <Route path="/painel" element={<ProtectedRoute allowedRoles={['client']}><ClientDashboard /></ProtectedRoute>} />
        <Route path="/perfil" element={<ProtectedRoute><EditProfilePage /></ProtectedRoute>} />

        {/* ===== ROTAS PROTEGIDAS - EMPRESA ===== */}
        <Route path="/empresa" element={<ProtectedRoute allowedRoles={['company']}><CompanyDashboard /></ProtectedRoute>} />
        <Route path="/empresa/servicos" element={<ProtectedRoute allowedRoles={['company']}><MyServicesPage /></ProtectedRoute>} />
        <Route path="/empresa/servicos/criar" element={<ProtectedRoute allowedRoles={['company']}><CreateServicePage /></ProtectedRoute>} />
        <Route path="/empresa/servicos/:serviceId/editar" element={<ProtectedRoute allowedRoles={['company']}><EditServicePage /></ProtectedRoute>} />

        {/* ===== ROTAS PROTEGIDAS - PRESTADOR ===== */}
        <Route path="/prestador" element={<ProtectedRoute allowedRoles={['provider']}><ProviderDashboard /></ProtectedRoute>} />
        <Route path="/prestador/servicos" element={<ProtectedRoute allowedRoles={['provider']}><MyProviderServicesPage /></ProtectedRoute>} />
        <Route path="/prestador/servicos/criar" element={<ProtectedRoute allowedRoles={['provider']}><CreateProviderServicePage /></ProtectedRoute>} />
        <Route path="/prestador/servicos/:serviceId/editar" element={<ProtectedRoute allowedRoles={['provider']}><EditProviderServicePage /></ProtectedRoute>} />

        {/* ===== ROTAS PROTEGIDAS - ADMIN ===== */}
        <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/categorias" element={<ProtectedRoute allowedRoles={['admin']}><AdminCategories /></ProtectedRoute>} />
        <Route path="/admin/prestadores" element={<ProtectedRoute allowedRoles={['admin']}><AdminProviders /></ProtectedRoute>} />
        <Route path="/admin/empresas" element={<ProtectedRoute allowedRoles={['admin']}><AdminCompanies /></ProtectedRoute>} />
        <Route path="/admin/utilizadores" element={<ProtectedRoute allowedRoles={['admin']}><AdminUsersPage /></ProtectedRoute>} />
        <Route path="/admin/configuracoes" element={<ProtectedRoute allowedRoles={['admin']}><AdminSettingsPage /></ProtectedRoute>} />
        <Route path="/admin/pedidos" element={<ProtectedRoute allowedRoles={['admin']}><AdminOrders /></ProtectedRoute>} />
        <Route path="/admin/documentos" element={<ProtectedRoute allowedRoles={['admin']}><AdminDocuments /></ProtectedRoute>} />

        {/* ===== ROTA CORINGA - REDIRECIONA PARA HOME ===== */}
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
