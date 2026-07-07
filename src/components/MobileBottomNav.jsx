import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

export default function MobileBottomNav() {
  const { t } = useTranslation()
  const location = useLocation()
  const { user, isCompany, isProvider, isAdmin } = useAuth()
  const { theme } = useTheme()

  // Determine Dashboard link based on role
  let dashboardPath = '/entrar'
  if (user) {
    if (user.role === 'admin') dashboardPath = '/admin'
    else if (isCompany) dashboardPath = '/empresa'
    else if (isProvider) dashboardPath = '/prestador'
    else dashboardPath = '/painel'
  }

  const navItems = [
    {
      label: t('nav.home', 'Home'),
      icon: (
        <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      path: '/'
    },
    {
      label: t('nav.events', 'Eventos'),
      icon: (
        <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      path: '/eventos'
    },
    {
      label: t('nav.discover', 'Descobrir'),
      icon: (
        <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7l6-3 5.447 2.724A1 1 0 0121 7.618v10.764a1 1 0 01-1.447.894L15 17l-6 3z" />
        </svg>
      ),
      path: '/servicos'
    },
    {
      label: user ? t('nav.profile', 'Perfil') : t('auth.login', 'Entrar'),
      icon: (
        <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      path: dashboardPath
    },
    {
      label: t('nav.more', 'Mais'),
      icon: (
        <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
        </svg>
      ),
      path: '/mais'
    }
  ]

  // Check if current path matches to highlight icon
  const isActive = (itemPath) => {
    if (itemPath === '/' && location.pathname !== '/') return false
    return location.pathname.startsWith(itemPath)
  }

  // Admin usa apenas o painel próprio — esconder nav de cliente
  if (isAdmin) return null

  return (
    <div className={`lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t shadow-[0_-8px_30px_rgba(0,0,0,0.12)] pb-safe transition-colors duration-300 backdrop-blur-xl ${theme === 'dark' ? 'bg-[#0F0F0F]/80 border-white/5' : 'bg-mimu-white/80 border-mimu-cream-border/50'}`}>
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const active = isActive(item.path)
          return (
            <Link
              key={item.label}
              to={item.path}
              className={`relative flex flex-col items-center justify-center w-full h-full transition-all duration-300 ${
                active 
                  ? 'text-mimu-gold font-bold scale-105' 
                  : (theme === 'dark' ? 'text-gray-500 hover:text-gray-300' : 'text-mimu-wine-light-text/60 hover:text-mimu-wine-light-text')
              }`}
            >
              {active && (
                <span className="absolute top-0 w-8 h-[3px] bg-mimu-gold rounded-full shadow-[0_2px_10px_rgba(207,146,46,0.5)] animate-fade-in-slow" />
              )}
              <div className={`transition-transform duration-300 ${active ? 'scale-110 -translate-y-0.5' : ''}`}>
                {item.icon}
              </div>
              <span className={`text-[10px] font-semibold tracking-wide leading-none mt-1 transition-all duration-300 ${active ? 'text-mimu-gold' : ''}`}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
