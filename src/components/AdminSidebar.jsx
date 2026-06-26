import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'

export default function AdminSidebar() {
  const { t } = useTranslation()
  const { logout } = useAuth()
  const location = useLocation()

  const menuItems = [
    { path: '/admin', label: t('admin.dashboard'), icon: '📊' },
    { path: '/admin/categorias', label: t('admin.categories'), icon: '📂' },
    { path: '/admin/prestadores', label: t('admin.providers'), icon: '👥' },
    { path: '/admin/empresas', label: t('admin.companies'), icon: '🏢' },
    { path: '/admin/servicos', label: 'Serviços', icon: '🛠️' },
    { path: '/admin/promocoes', label: t('admin.promotions', 'Promoções'), icon: '🏷️' },
    { path: '/admin/pedidos', label: t('admin.orders'), icon: '📋' },
    { path: '/admin/eventos', label: 'Novidades/Eventos', icon: '📢' },
    { path: '/admin/utilizadores', label: t('admin.users'), icon: '👤' },
    { path: '/admin/documentos', label: t('admin.documents'), icon: '📄' },
    { path: '/admin/configuracoes', label: t('admin.settings'), icon: '⚙️' },
  ]

  return (
    <>
      {/* Sidebar para desktop (md e acima) */}
      <div className="hidden md:flex md:w-64 md:flex-col bg-mimu-wine dark:bg-[#121212] text-mimu-white-text min-h-screen border-r border-transparent dark:border-[#2A2A2A] transition-colors duration-300">
        <div className="p-4 md:p-6 border-b border-mimu-gold shrink-0">
          <img src="/mimu-logo.png" alt="Mimu Admin Logo" className="h-[80px] w-auto object-contain" />
        </div>
        <nav className="flex-1 p-3 md:p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center px-3 md:px-4 py-2 rounded-lg transition-colors text-sm md:text-base ${
                    location.pathname === item.path
                      ? 'bg-mimu-gold text-mimu-wine-text dark:text-white'
                      : 'hover:bg-mimu-wine-light'
                  }`}
                >
                  <span className="mr-2 md:mr-3 text-lg">{item.icon}</span>
                  <span className="hidden lg:inline">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="p-3 md:p-4 border-t border-mimu-gold">
          <button
            onClick={logout}
            className="w-full flex items-center justify-center md:justify-start px-3 md:px-4 py-2 rounded-xl bg-mimu-gold text-mimu-wine-text dark:text-white hover:bg-[#b87d26] transition-colors text-sm md:text-base transition-all duration-300 hover:shadow-md active:scale-95 min-h-[44px]"
          >
            <span className="mr-0 md:mr-3 text-lg">🚪</span>
            <span className="hidden md:inline">{t('auth.logout')}</span>
          </button>
        </div>
      </div>

      {/* Menu scrollável horizontal para mobile (App-like) em vez de menu hambúrguer */}
      <div className="md:hidden bg-mimu-wine dark:bg-[#121212] text-mimu-white-text sticky top-0 z-40 shadow-sm hover:shadow-md transition-all duration-300 border-b border-transparent dark:border-[#2A2A2A]">
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <h2 className="text-lg font-bold text-mimu-gold">Painel de Administração</h2>
        </div>
        <nav className="overflow-x-auto px-4 pb-3 scrollbar-hide">
          <ul className="flex space-x-2 w-max">
            {menuItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${
                    location.pathname === item.path
                      ? 'bg-mimu-gold text-mimu-wine-text dark:text-white'
                      : 'bg-mimu-wine-light text-mimu-white-text hover:bg-mimu-white dark:bg-[#1E1E1E]/10'
                  }`}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <button
                onClick={logout}
                className="flex items-center px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors bg-red-600/20 text-red-200 hover:bg-red-600/40 transition-all duration-300 hover:shadow-md active:scale-95 min-h-[44px]"
              >
                <span className="mr-2">🚪</span>
                {t('auth.logout')}
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </>
  )

}