import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import BackButton from './common/BackButton'
import OptimizedImage from './common/OptimizedImage'
import { useNotifications } from '../hooks/useNotifications'

const languages = [
  { code: 'pt', label: 'Português' },
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'zh', label: '中文' }
]

export default function Navbar() {
  const [langOpen, setLangOpen] = useState(false)
  const { t, i18n } = useTranslation()
  const { user, isClient, isCompany, isProvider, isAdmin, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { notifications } = useNotifications(user?.id)
  const unreadCount = notifications ? notifications.filter(n => !n.read).length : 0

  const changeLanguage = (code) => {
    i18n.changeLanguage(code)
    localStorage.setItem('mimu_lang', code)
    setLangOpen(false)
  }

  const userPhoto = user?.avatar_url || user?.logo_url || user?.photo || user?.logo;
  const userAvatar = user ? (
    userPhoto ? (
      <OptimizedImage src={userPhoto} alt="Avatar" className="w-9 h-9 md:w-11 md:h-11 rounded-full border border-mimu-gold" objectFit="cover" />
    ) : null
  ) : null;

  const dashboardPath = isAdmin ? '/admin' : (isCompany ? "/empresa" : isProvider ? "/prestador" : "/painel");

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-mimu-wine/75 dark:bg-[#121212]/75 backdrop-blur-xl shadow-lg border-b border-mimu-wine-light/10 dark:border-white/5 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          <div className="flex items-center gap-2 md:gap-3">
            <BackButton variant="light" />
            <Link to="/" className="flex items-center group">
              <img src="/mimu-logo.png" alt="Mimu Logo" className="h-[58px] md:h-[68px] w-auto object-contain transition-transform group-hover:scale-105" />
            </Link>
          </div>

          <div className="hidden lg:flex items-center gap-6">
            {!isAdmin && (
              <>
                <Link to="/servicos" className="text-mimu-white-text/90 hover:text-mimu-gold transition-colors font-medium">
                  Reservas
                </Link>
                <Link to="/eventos" className="text-mimu-white-text/90 hover:text-mimu-gold transition-colors font-medium">
                  Eventos MKT360
                </Link>
                {user && (
                  <Link to="/meus-tickets" className="text-mimu-white-text/90 hover:text-mimu-gold transition-colors font-medium">
                    Meus Tickets
                  </Link>
                )}
                <Link to="/sobre-mimu" className="text-mimu-white-text/90 hover:text-mimu-gold transition-colors font-medium">
                  Sobre
                </Link>
                <Link to="/suporte" className="text-mimu-white-text/90 hover:text-mimu-gold transition-colors font-medium">
                  Ajuda
                </Link>
              </>
            )}

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-300 border ${theme === 'dark' ? 'bg-[#1E1E1E] border-[#2A2A2A]' : 'bg-white dark:bg-[#1E1E1E]/10 border-white/20 hover:bg-white dark:bg-[#1E1E1E]/20'}`}
              title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            >
              {theme === 'dark' ? (
                <svg className="w-6 h-6 text-mimu-gold fill-current" viewBox="0 0 24 24">
                  <path d="M21.4,14.2c-0.2,0-0.4-0.1-0.5-0.2c-2-1.9-4.8-2.6-7.5-1.9c-2.4,0.6-4.4,2.3-5.5,4.6c-0.1,0.2-0.3,0.3-0.5,0.3c-0.2,0-0.4-0.1-0.5-0.3c-1-1.8-1.5-3.8-1.5-5.9c0-5.8,4.7-10.5,10.5-10.5c1.8,0,3.6,0.5,5.2,1.3c0.2,0.1,0.3,0.3,0.3,0.5c0,0.2-0.1,0.4-0.3,0.5c-2.4,1.4-3.9,3.9-3.9,6.7C17.2,11.8,18.8,14,21.4,14.2C21.6,14.2,21.8,14.3,21.8,14.5C21.8,14.7,21.6,14.9,21.4,14.2z M10.8,4.2c-4.2,1.2-7.1,5-7.1,9.4c0,1.5,0.3,3,1,4.3c1.4-2.4,3.7-4.2,6.5-4.8c3.2-0.7,6.4,0.1,8.8,2.3c-0.6-2.1-2-3.9-3.9-5C13.8,9,12,6.1,12.7,3.1C12,3.4,11.4,3.8,10.8,4.2z"/>
                </svg>
              ) : (
                <svg className="w-6 h-6 text-mimu-gold fill-current" viewBox="0 0 24 24">
                  <path d="M12,2c0.6,0,1,0.4,1,1v2c0,0.6-0.4,1-1,1s-1-0.4-1-1V3C11,2.4,11.4,2,12,2z M12,18c0.6,0,1,0.4,1,1v2c0,0.6-0.4,1-1,1s-1-0.4-1-1v-2C11,18.4,11.4,18,12,18z M4.2,4.2c0.4-0.4,1-0.4,1.4,0l1.4,1.4C7.4,6,7.4,6.6,7,7S6,7.4,5.6,7L4.2,5.6C3.8,5.2,3.8,4.6,4.2,4.2z M17,17c0.4-0.4,1-0.4,1.4,0l1.4,1.4c0.4,0.4,0.4,1,0,1.4s-1,0.4-1.4,0l-1.4-1.4C16.6,18,16.6,17.4,17,17z M2,12c0-0.6,0.4-1,1-1h2c0.6,0,1,0.4,1,1s-0.4,1-1,1H3C2.4,13,2,12.6,2,12z M18,12c0-0.6,0.4-1,1-1h2c0.6,0,1,0.4,1,1s-0.4,1-1,1h-2C18.4,13,18,12.6,18,12z M5.6,17c0.4,0.4,0.4,1,0,1.4l-1.4,1.4c-0.4,0.4-1,0.4-1.4,0s-0.4-1,0-1.4l1.4-1.4C4.6,16.6,5.2,16.6,5.6,17z M18.4,5.6l1.4-1.4c0.4-0.4,0.4-1,0-1.4s-1-0.4-1.4,0l-1.4,1.4C16.6,4.6,16.6,5.2,17,5.6S18,6,18.4,5.6z M12,7c-2.8,0-5,2.2-5,5s2.2,5,5,5s5-2.2,5-5S14.8,7,12,7z M12,15c-1.7,0-3-1.3-3-3s1.3-3,3-3s3,1.3,3,3S13.7,15,12,15z"/>
                </svg>
              )}
            </button>

            {/* Language Dropdown */}
            {/* Language Dropdown */}
            <div className="relative">
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-mimu-white-text/90 hover:bg-mimu-wine-light dark:hover:bg-[#1A1A1A] transition-colors"
              >
                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm6.93 6h-2.95a15.65 15.65 0 00-1.38-3.56A8.03 8.03 0 0118.93 8zM12 4.04c.83 1.2 1.48 2.53 1.91 3.96h-3.82c.43-1.43 1.08-2.76 1.91-3.96zM4.26 14C4.1 13.36 4 12.69 4 12s.1-1.36.26-2h3.38c-.08.66-.14 1.32-.14 2 0 .68.06 1.34.14 2H4.26zm.81 2h2.95c.32 1.25.78 2.45 1.38 3.56A8.03 8.03 0 015.07 16zm2.95-8H5.07a8.03 8.03 0 013.88-3.56c-.6 1.11-1.06 2.31-1.38 3.56zM12 19.96c-.83-1.2-1.48-2.53-1.91-3.96h3.82c-.43 1.43-1.08 2.76-1.91 3.96zM14.34 14H9.66c-.09-.66-.16-1.32-.16-2 0-.68.07-1.34.16-2h4.68c.09.66.16 1.32.16 2 0 .68-.07 1.34-.16 2zm1.21 5.56c.6-1.11 1.06-2.31 1.38-3.56h2.95a8.03 8.03 0 01-3.88 3.56zm1.38-7.56c.08-.66.14-1.32.14-2 0-.68-.06-1.34-.14-2h3.38c.16.64.26 1.31.26 2s-.1 1.36-.26 2h-3.38z"/>
                </svg>
                <span className="text-sm font-bold">{t('nav.language')}</span>
                <svg className="w-4 h-4 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {langOpen && (
                <div className="absolute right-0 top-full mt-1 py-2 w-40 bg-mimu-wine-light dark:bg-[#1E1E1E] rounded-xl shadow-xl border border-mimu-wine dark:border-[#2A2A2A]">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => changeLanguage(lang.code)}
                      className={`block w-full text-left px-4 py-2 text-sm transition-colors ${
                        i18n.language === lang.code ? 'text-mimu-gold font-medium' : 'text-mimu-white-text/90 hover:text-mimu-gold'
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {user ? (
              <>
                {isClient && <Link to="/painel" className="px-4 py-2.5 text-mimu-white-text/90 hover:text-mimu-gold font-medium">{t('nav.dashboard')}</Link>}
                {isCompany && <Link to="/empresa" className="px-4 py-2.5 text-mimu-white-text/90 hover:text-mimu-gold font-medium">{t('nav.company')}</Link>}
                {isProvider && <Link to="/prestador" className="px-4 py-2.5 text-mimu-white-text/90 hover:text-mimu-gold font-medium">{t('nav.provider')}</Link>}
                <div className="flex items-center gap-3 ml-2 pl-4 border-l border-[#5C1A1A]">
                  <Link 
                    to={`${dashboardPath}?tab=notificacoes`}
                    className="relative p-2 text-mimu-white-text/90 hover:text-mimu-gold transition-colors focus:outline-none shrink-0"
                    title="Notificações"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    {unreadCount > 0 && (
                      <span className="absolute top-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-mimu-wine dark:ring-[#121212] animate-pulse">
                        {unreadCount}
                      </span>
                    )}
                  </Link>
                  <Link to={dashboardPath} className="flex items-center gap-2 transition-transform hover:scale-105">
                     {userAvatar}
                  </Link>
                  <button onClick={logout} className="px-5 py-3.5 text-mimu-white-text/90 hover:text-mimu-gold font-bold min-h-[44px] text-lg">
                    {t('auth.logout')}
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link to="/entrar" className="px-6 py-3.5 text-mimu-white-text/90 hover:text-mimu-gold font-bold text-lg">
                  {t('auth.login')}
                </Link>
                <Link
                  to="/registar"
                  className="px-8 py-3.5 bg-mimu-gold hover:bg-mimu-gold-hover text-mimu-wine-text dark:text-white font-extrabold rounded-xl transition-all duration-300 hover:scale-105 shadow-lg text-lg"
                >
                  {t('nav.book')}
                </Link>
              </>
            )}
          </div>
          <div className="lg:hidden flex items-center gap-1.5 sm:gap-3">
            {user && (
              <>
                <Link 
                  to={`${dashboardPath}?tab=notificacoes`}
                  className="relative p-2 text-mimu-white-text/90 hover:text-mimu-gold transition-colors focus:outline-none shrink-0"
                  title="Notificações"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute top-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-mimu-gold text-[9px] font-black text-black ring-2 ring-mimu-wine dark:ring-[#121212]">
                      {unreadCount}
                    </span>
                  )}
                </Link>
                <Link to={dashboardPath} className="transition-transform hover:scale-105 shrink-0 p-0.5">
                  {userAvatar}
                </Link>
              </>
            )}

            <button
              onClick={toggleTheme}
              className="w-12 h-12 flex items-center justify-center rounded-full text-mimu-white-text hover:text-mimu-gold hover:bg-white/10 dark:hover:bg-white/5 transition-all duration-300"
              title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            >
              {theme === 'dark' ? (
                <svg className="w-8 h-8 text-mimu-gold fill-current" viewBox="0 0 24 24">
                  <path d="M21.4,14.2c-0.2,0-0.4-0.1-0.5-0.2c-2-1.9-4.8-2.6-7.5-1.9c-2.4,0.6-4.4,2.3-5.5,4.6c-0.1,0.2-0.3,0.3-0.5,0.3c-0.2,0-0.4-0.1-0.5-0.3c-1-1.8-1.5-3.8-1.5-5.9c0-5.8,4.7-10.5,10.5-10.5c1.8,0,3.6,0.5,5.2,1.3c0.2,0.1,0.3,0.3,0.3,0.5c0,0.2-0.1,0.4-0.3,0.5c-2.4,1.4-3.9,3.9-3.9,6.7C17.2,11.8,18.8,14,21.4,14.2C21.6,14.2,21.8,14.3,21.8,14.5C21.8,14.7,21.6,14.9,21.4,14.2z M10.8,4.2c-4.2,1.2-7.1,5-7.1,9.4c0,1.5,0.3,3,1,4.3c1.4-2.4,3.7-4.2,6.5-4.8c3.2-0.7,6.4,0.1,8.8,2.3c-0.6-2.1-2-3.9-3.9-5C13.8,9,12,6.1,12.7,3.1C12,3.4,11.4,3.8,10.8,4.2z"/>
                </svg>
              ) : (
                <svg className="w-8 h-8 text-mimu-gold fill-current" viewBox="0 0 24 24">
                  <path d="M12,2c0.6,0,1,0.4,1,1v2c0,0.6-0.4,1-1,1s-1-0.4-1-1V3C11,2.4,11.4,2,12,2z M12,18c0.6,0,1,0.4,1,1v2c0,0.6-0.4,1-1,1s-1-0.4-1-1v-2C11,18.4,11.4,18,12,18z M4.2,4.2c0.4-0.4,1-0.4,1.4,0l1.4,1.4C7.4,6,7.4,6.6,7,7S6,7.4,5.6,7L4.2,5.6C3.8,5.2,3.8,4.6,4.2,4.2z M17,17c0.4-0.4,1-0.4,1.4,0l1.4,1.4c0.4,0.4,0.4,1,0,1.4s-1,0.4-1.4,0l-1.4-1.4C16.6,18,16.6,17.4,17,17z M2,12c0-0.6,0.4-1,1-1h2c0.6,0,1,0.4,1,1s-0.4,1-1,1H3C2.4,13,2,12.6,2,12z M18,12c0-0.6,0.4-1,1-1h2c0.6,0,1,0.4,1,1s-0.4,1-1,1h-2C18.4,13,18,12.6,18,12z M5.6,17c0.4,0.4,0.4,1,0,1.4l-1.4,1.4c-0.4,0.4-1,0.4-1.4,0s-0.4-1,0-1.4l1.4-1.4C4.6,16.6,5.2,16.6,5.6,17z M18.4,5.6l1.4-1.4c0.4-0.4,0.4-1,0-1.4s-1-0.4-1.4,0l-1.4,1.4C16.6,4.6,16.6,5.2,17,5.6S18,6,18.4,5.6z M12,7c-2.8,0-5,2.2-5,5s2.2,5,5,5s5-2.2,5-5S14.8,7,12,7z M12,15c-1.7,0-3-1.3-3-3s1.3-3,3-3s3,1.3,3,3S13.7,15,12,15z"/>
                </svg>
              )}
            </button>

            {/* Language Selector (Mobile) */}
            <div className="relative">
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="w-12 h-12 flex items-center justify-center rounded-full text-mimu-white-text hover:text-mimu-gold hover:bg-white/10 dark:hover:bg-white/5 transition-all duration-300"
              >
                <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm6.93 6h-2.95a15.65 15.65 0 00-1.38-3.56A8.03 8.03 0 0118.93 8zM12 4.04c.83 1.2 1.48 2.53 1.91 3.96h-3.82c.43-1.43 1.08-2.76 1.91-3.96zM4.26 14C4.1 13.36 4 12.69 4 12s.1-1.36.26-2h3.38c-.08.66-.14 1.32-.14 2 0 .68.06 1.34.14 2H4.26zm.81 2h2.95c.32 1.25.78 2.45 1.38 3.56A8.03 8.03 0 015.07 16zm2.95-8H5.07a8.03 8.03 0 013.88-3.56c-.6 1.11-1.06 2.31-1.38 3.56zM12 19.96c-.83-1.2-1.48-2.53-1.91-3.96h3.82c-.43 1.43-1.08 2.76-1.91 3.96zM14.34 14H9.66c-.09-.66-.16-1.32-.16-2 0-.68.07-1.34.16-2h4.68c.09.66.16 1.32.16 2 0 .68-.07 1.34-.16 2zm1.21 5.56c.6-1.11 1.06-2.31 1.38-3.56h2.95a8.03 8.03 0 01-3.88 3.56zm1.38-7.56c.08-.66.14-1.32.14-2 0-.68-.06-1.34-.14-2h3.38c.16.64.26 1.31.26 2s-.1 1.36-.26 2h-3.38z"/>
                </svg>
              </button>
              {langOpen && (
                <div className="absolute right-0 top-full mt-2 py-2 w-40 bg-mimu-wine-light dark:bg-[#1E1E1E] rounded-2xl shadow-xl z-50 border border-[#2A2A2A]/40">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => changeLanguage(lang.code)}
                      className={`block w-full text-left px-4 py-2.5 text-sm transition-colors ${
                        i18n.language === lang.code ? 'text-mimu-gold font-bold bg-white/5' : 'text-mimu-white-text/90 hover:text-mimu-gold'
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
