import React, { useEffect, useState, lazy, Suspense } from 'react'
import { Toaster } from 'react-hot-toast'
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useTheme } from './context/ThemeContext'
import { useAuth } from './context/AuthContext'
import SplashController from './components/SplashController'
import PageLoader from './components/PageLoader'
import ProtectedRoute from './components/ProtectedRoute'
import MobileBottomNav from './components/MobileBottomNav'
import AdminLayout from './components/layouts/AdminLayout'
import DashboardLayout from './components/layouts/DashboardLayout'
import PWAInstallPrompt from './components/PWAInstallPrompt'

// Lazy loaded page components
const HomePage = lazy(() => import('./pages/HomePage'))
const CategoryPage = lazy(() => import('./pages/CategoryPage'))
const AllServicesPage = lazy(() => import('./pages/AllServicesPage'))
const EventsPage = lazy(() => import('./pages/EventsPage'))
const ServiceDetailPage = lazy(() => import('./pages/ServiceDetailPage'))
const BookingPage = lazy(() => import('./pages/BookingPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const RegisterPage = lazy(() => import('./pages/RegisterPage'))
const RegisterClientPage = lazy(() => import('./pages/RegisterClientPage'))
const RegisterCompanyPage = lazy(() => import('./pages/RegisterCompanyPage'))
const RegisterProviderPage = lazy(() => import('./pages/RegisterProviderPage'))
const RecoverPasswordPage = lazy(() => import('./pages/RecoverPasswordPage'))
const ResetPasswordLinkPage = lazy(() => import('./pages/ResetPasswordLinkPage'))
const VerifyOTPPage = lazy(() => import('./pages/VerifyOTPPage'))
const ClientDashboard = lazy(() => import('./pages/dashboard/ClientDashboard'))
const CompanyDashboard = lazy(() => import('./pages/dashboard/CompanyDashboard'))
const ProviderDashboard = lazy(() => import('./pages/dashboard/ProviderDashboard'))
const EditProfilePage = lazy(() => import('./pages/EditProfilePage'))
const MyTicketsPage = lazy(() => import('./pages/MyTicketsPage'))
const WalletPage = lazy(() => import('./pages/WalletPage'))
const CreateServicePage = lazy(() => import('./pages/CreateServicePage'))
const MyServicesPage = lazy(() => import('./pages/MyServicesPage'))
const EditServicePage = lazy(() => import('./pages/EditServicePage'))
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const AdminEvents = lazy(() => import('./pages/admin/AdminEvents'))
const CreateProviderServicePage = lazy(() => import('./pages/CreateProviderServicePage'))
const MyProviderServicesPage = lazy(() => import('./pages/MyProviderServicesPage'))
const EditProviderServicePage = lazy(() => import('./pages/EditProviderServicePage'))
const AdminCategories = lazy(() => import('./pages/admin/AdminCategories'))
const AdminProviders = lazy(() => import('./pages/admin/AdminProviders'))
const AdminCompanies = lazy(() => import('./pages/admin/AdminCompanies'))
const AdminServices = lazy(() => import('./pages/admin/AdminServices'))
const AdminPromotions = lazy(() => import('./pages/admin/AdminPromotions'))
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'))
const AdminDocuments = lazy(() => import('./pages/admin/AdminDocuments'))
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage'))
const AdminSettingsPage = lazy(() => import('./pages/admin/AdminSettingsPage'))
const MapView = lazy(() => import('./components/MapView'))

// Institutional Pages (Lazy Loaded)
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'))
const TermsOfUse = lazy(() => import('./pages/TermsOfUse'))
const AboutMimu = lazy(() => import('./pages/AboutMimu'))
const Support = lazy(() => import('./pages/Support'))
const MorePage = lazy(() => import('./pages/MorePage'))

function AppRoutes() {
  const location = useLocation()
  const navigate = useNavigate()
  const { theme } = useTheme()
  const { user } = useAuth() // Precisamos do user para saber a role

  useEffect(() => {
    // 1. Deteção de Magic Links ou Confirmação de E-mail
    // Quando o utilizador clica no email de confirmação, o Supabase envia o token pela âncora (#) do URL
    const hash = window.location.hash
    if (hash && hash.includes('access_token')) {
      // Guardamos na sessão que o utilizador acabou de confirmar o email e deve ser redirecionado
      sessionStorage.setItem('pendingAuthRedirect', 'true')
    }

    // Assim que a framework do Supabase terminar de ler o token e tiver o 'user' pronto:
    if (user && sessionStorage.getItem('pendingAuthRedirect') === 'true') {
      sessionStorage.removeItem('pendingAuthRedirect')
      const userRole = user.role ? user.role.trim().toLowerCase() : 'client'
      const target = ['company', 'empresa'].includes(userRole)
        ? '/empresa'
        : ['provider', 'prestador'].includes(userRole)
          ? '/prestador'
          : ['admin', 'administrador'].includes(userRole)
            ? '/admin'
            : '/painel'
      navigate(target, { replace: true })
    }
  }, [user, navigate])

  useEffect(() => {
    const handleBackButton = (event) => {
      if (event?.preventDefault) event.preventDefault()

      const canGoBack = window.history.state && window.history.state.idx > 0

      if (canGoBack) {
        navigate(-1)
        return
      }

      if (location.pathname !== '/') {
        navigate('/', { replace: true })
        return
      }

      // Se já estiver na raiz, fecha a app no Android nativo (Capacitor App plugin) ou ignora na web.
      const appPlugin = window.Capacitor?.App || window.Capacitor?.Plugins?.App
      if (appPlugin?.exitApp) {
        appPlugin.exitApp()
      }
    }

    // Listener nativo: se estiver em Web, não quebra (não existe window.Capacitor.addListener). 
    let removeListener = null
    const appPlugin = window.Capacitor?.App || window.Capacitor?.Plugins?.App

    if (appPlugin?.addListener) {
      const listener = appPlugin.addListener('backButton', handleBackButton)
      removeListener = listener?.remove
    }

    return () => {
      if (removeListener) removeListener()
    }
  }, [location.pathname, navigate])

  return (
    <div className={`min-h-screen pb-20 lg:pb-0 transition-colors duration-300 ${theme === 'dark' ? 'bg-[#121212] text-mimu-white-text' : 'bg-mimu-gray-100 dark:bg-[#121212] text-mimu-text-dark dark:text-white'}`}>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* ===== ROTAS PÚBLICAS ===== */}
          {/* Rota mapa - Teste */}
          <Route path="/mapa" element={<MapView />} />

          {/* Rota inicial - Abre a página principal */}
          <Route path="/" element={<HomePage />} />

          {/* Navegação de serviços e produtos */}
          <Route path="/eventos" element={<EventsPage />} />
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
          <Route path="/verificar-otp" element={<VerifyOTPPage />} />
          <Route path="/recuperar-senha" element={<RecoverPasswordPage />} />
          <Route path="/redefinir-senha" element={<ResetPasswordLinkPage />} />

          {/* Políticas e Institucionais */}
          <Route path="/politica-privacidade" element={<PrivacyPolicy />} />
          <Route path="/termos-de-uso" element={<TermsOfUse />} />
          <Route path="/sobre-mimu" element={<AboutMimu />} />
          <Route path="/suporte" element={<Support />} />
          <Route path="/mais" element={<MorePage />} />

          {/* ===== ROTAS PROTEGIDAS - CLIENTE ===== */}
          <Route path="/painel" element={<ProtectedRoute allowedRoles={['client']}><ClientDashboard /></ProtectedRoute>} />
          <Route path="/meus-tickets" element={<ProtectedRoute><MyTicketsPage /></ProtectedRoute>} />
          <Route path="/carteira" element={<ProtectedRoute><WalletPage /></ProtectedRoute>} />
          <Route path="/perfil" element={<ProtectedRoute><EditProfilePage /></ProtectedRoute>} />

          {/* ===== ROTAS PROTEGIDAS - EMPRESA ===== */}
          <Route path="/empresa" element={<ProtectedRoute allowedRoles={['company']}><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<CompanyDashboard />} />
            <Route path="servicos" element={<MyServicesPage />} />
            <Route path="servicos/criar" element={<CreateServicePage />} />
            <Route path="servicos/:serviceId/editar" element={<EditServicePage />} />
          </Route>

          {/* ===== ROTAS PROTEGIDAS - PRESTADOR ===== */}
          <Route path="/prestador" element={<ProtectedRoute allowedRoles={['provider']}><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<ProviderDashboard />} />
            <Route path="servicos" element={<MyProviderServicesPage />} />
            <Route path="servicos/criar" element={<CreateProviderServicePage />} />
            <Route path="servicos/:serviceId/editar" element={<EditProviderServicePage />} />
          </Route>

          {/* ===== ROTAS PROTEGIDAS - ADMIN ===== */}
          <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminLayout /></ProtectedRoute>}>
            <Route index element={<AdminDashboard />} />
            <Route path="eventos" element={<AdminEvents />} />
            <Route path="categorias" element={<AdminCategories />} />
            <Route path="prestadores" element={<AdminProviders />} />
            <Route path="empresas" element={<AdminCompanies />} />
            <Route path="servicos" element={<AdminServices />} />
            <Route path="promocoes" element={<AdminPromotions />} />
            <Route path="utilizadores" element={<AdminUsersPage />} />
            <Route path="configuracoes" element={<AdminSettingsPage />} />
            <Route path="pedidos" element={<AdminOrders />} />
            <Route path="documentos" element={<AdminDocuments />} />
          </Route>

          {/* ===== ROTA CORINGA - REDIRECIONA PARA HOME ===== */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      <MobileBottomNav />
    </div>
  )
}
function App() {
  const [isReady, setIsReady] = useState(false)

  if (!isReady) {
    return <SplashController onReady={() => setIsReady(true)} />
  }

  return (
    <>
      <Toaster position="top-center" toastOptions={{
        duration: 4000,
        style: {
          background: '#FFF8F0',
          color: '#3A0D0D',
          fontWeight: '500',
          borderRadius: '12px',
          border: '1px solid #EBE1D1',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
        },
        success: {
          iconTheme: {
            primary: '#10B981',
            secondary: '#FFF',
          },
        },
      }} />
      <AppRoutes />
      <PWAInstallPrompt />
    </>
  )
}

export default App
