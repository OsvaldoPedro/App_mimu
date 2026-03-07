import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { useState } from 'react'

export default function AdminSidebar() {
  const { t } = useTranslation()
  const { logout } = useAuth()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const menuItems = [
    { path: '/admin', label: t('admin.dashboard'), icon: '📊' },
    { path: '/admin/categorias', label: t('admin.categories'), icon: '📂' },
    { path: '/admin/prestadores', label: t('admin.providers'), icon: '👥' },
    { path: '/admin/empresas', label: t('admin.companies'), icon: '🏢' },
    { path: '/admin/pedidos', label: t('admin.orders'), icon: '📋' },
    { path: '/admin/utilizadores', label: t('admin.users'), icon: '👤' },
    { path: '/admin/documentos', label: t('admin.documents'), icon: '📄' },
    { path: '/admin/configuracoes', label: t('admin.settings'), icon: '⚙️' },
  ]

  const handleMenuClick = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  const handleLinkClick = () => {
    setMobileMenuOpen(false)
  }

  return (
    <>
      {/* Sidebar para desktop (md e acima) */}
      <div className="hidden md:flex md:w-64 md:flex-col bg-[#3A0D0D] text-white min-h-screen">
        <div className="p-4 md:p-6 border-b border-[#C58A2B]">
          <h2 className="text-lg md:text-xl font-bold text-[#C58A2B]">Mimu Admin</h2>
        </div>
        <nav className="flex-1 p-3 md:p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center px-3 md:px-4 py-2 rounded-lg transition-colors text-sm md:text-base ${
                    location.pathname === item.path
                      ? 'bg-[#C58A2B] text-[#3A0D0D]'
                      : 'hover:bg-[#5C1A1A]'
                  }`}
                >
                  <span className="mr-2 md:mr-3 text-lg">{item.icon}</span>
                  <span className="hidden lg:inline">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="p-3 md:p-4 border-t border-[#C58A2B]">
          <button
            onClick={logout}
            className="w-full flex items-center justify-center md:justify-start px-3 md:px-4 py-2 rounded-lg bg-[#C58A2B] text-[#3A0D0D] hover:bg-[#b87d26] transition-colors text-sm md:text-base"
          >
            <span className="mr-0 md:mr-3 text-lg">🚪</span>
            <span className="hidden md:inline">{t('auth.logout')}</span>
          </button>
        </div>
      </div>

      {/* Menu hambúrguer para mobile */}
      <div className="md:hidden bg-[#3A0D0D] text-white sticky top-0 z-50">
        <div className="flex items-center justify-between p-4">
          <h2 className="text-lg font-bold text-[#C58A2B]">Mimu Admin</h2>
          <button
            onClick={handleMenuClick}
            className="p-2 rounded-lg hover:bg-[#5C1A1A] transition-colors"
            aria-label="Menu"
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>

        {/* Menu dropdown em mobile */}
        {mobileMenuOpen && (
          <nav className="border-t border-[#C58A2B] p-2 bg-[#3A0D0D]">
            <ul className="space-y-1">
              {menuItems.map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    onClick={handleLinkClick}
                    className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                      location.pathname === item.path
                        ? 'bg-[#C58A2B] text-[#3A0D0D]'
                        : 'hover:bg-[#5C1A1A]'
                    }`}
                  >
                    <span className="mr-3">{item.icon}</span>
                    {item.label}
                  </Link>
                </li>
              ))}
              <li className="py-2">
                <button
                  onClick={() => {
                    logout()
                    handleLinkClick()
                  }}
                  className="w-full flex items-center px-4 py-3 rounded-lg bg-[#C58A2B] text-[#3A0D0D] hover:bg-[#b87d26] transition-colors font-medium"
                >
                  <span className="mr-3">🚪</span>
                  {t('auth.logout')}
                </button>
              </li>
            </ul>
          </nav>
        )}
      </div>
    </>
  )

}