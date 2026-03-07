import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'

const languages = [
  { code: 'pt', label: 'Português' },
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'zh', label: '中文' }
]

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const { t, i18n } = useTranslation()
  const { user, isClient, isCompany, isProvider, logout } = useAuth()

  const changeLanguage = (code) => {
    i18n.changeLanguage(code)
    localStorage.setItem('mimu_lang', code)
    setLangOpen(false)
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#3A0D0D] shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          <Link to="/" className="flex items-center gap-2 group">
            <span className="text-2xl md:text-3xl font-bold text-[#FFFFFF] tracking-tight">
              {t('brand.name')}
            </span>
            <span className="hidden lg:inline text-[#C58A2B] text-sm font-medium">
              — {t('brand.tagline')}
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link to="/categoria/estadia" className="text-[#FFFFFF]/90 hover:text-[#C58A2B] transition-colors font-medium">
              {t('nav.categories')}
            </Link>
            <a href="/#como-funciona" className="text-[#FFFFFF]/90 hover:text-[#C58A2B] transition-colors font-medium">
              {t('nav.howItWorks')}
            </a>
            <a href="/#contacto" className="text-[#FFFFFF]/90 hover:text-[#C58A2B] transition-colors font-medium">
              {t('nav.contact')}
            </a>

            {/* Language Dropdown */}
            <div className="relative">
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-[#FFFFFF]/90 hover:bg-[#5C1A1A] transition-colors"
              >
                <span className="text-sm">{t('nav.language')}</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {langOpen && (
                <div className="absolute right-0 top-full mt-1 py-2 w-40 bg-[#5C1A1A] rounded-xl shadow-xl border border-[#3A0D0D]">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => changeLanguage(lang.code)}
                      className={`block w-full text-left px-4 py-2 text-sm transition-colors ${
                        i18n.language === lang.code ? 'text-[#C58A2B] font-medium' : 'text-[#FFFFFF]/90 hover:text-[#C58A2B]'
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
                {isClient && <Link to="/painel" className="px-4 py-2.5 text-[#FFFFFF]/90 hover:text-[#C58A2B] font-medium">{t('nav.dashboard')}</Link>}
                {isCompany && <Link to="/empresa" className="px-4 py-2.5 text-[#FFFFFF]/90 hover:text-[#C58A2B] font-medium">{t('nav.company')}</Link>}
                {isProvider && <Link to="/prestador" className="px-4 py-2.5 text-[#FFFFFF]/90 hover:text-[#C58A2B] font-medium">{t('nav.provider')}</Link>}
                <button onClick={logout} className="px-4 py-2.5 text-[#FFFFFF]/90 hover:text-[#C58A2B] font-medium">
                  {t('auth.logout')}
                </button>
              </>
            ) : (
              <>
                <Link to="/entrar" className="px-4 py-2.5 text-[#FFFFFF]/90 hover:text-[#C58A2B] font-medium">
                  {t('auth.login')}
                </Link>
                <Link
                  to="/registar"
                  className="px-6 py-2.5 bg-[#C58A2B] hover:bg-[#E0B15C] text-[#3A0D0D] font-semibold rounded-xl transition-all duration-300 hover:scale-105 shadow-lg"
                >
                  {t('nav.book')}
                </Link>
              </>
            )}
          </div>

          <div className="md:hidden flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="p-2 text-[#FFFFFF] hover:text-[#C58A2B]"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
              </button>
              {langOpen && (
                <div className="absolute right-0 top-full mt-1 py-2 w-40 bg-[#5C1A1A] rounded-xl shadow-xl z-50">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => changeLanguage(lang.code)}
                      className={`block w-full text-left px-4 py-2 text-sm ${
                        i18n.language === lang.code ? 'text-[#C58A2B] font-medium' : 'text-white/90'
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 text-[#FFFFFF] hover:text-[#C58A2B]"
              aria-label="Menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {menuOpen ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
              </svg>
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden py-4 border-t border-[#5C1A1A]">
            <div className="flex flex-col gap-4">
              <Link to="/categoria/estadia" onClick={() => setMenuOpen(false)} className="text-[#FFFFFF]/90 hover:text-[#C58A2B] py-2">
                {t('nav.categories')}
              </Link>
              <a href="/#como-funciona" onClick={() => setMenuOpen(false)} className="text-[#FFFFFF]/90 hover:text-[#C58A2B] py-2">
                {t('nav.howItWorks')}
              </a>
              <a href="/#contacto" onClick={() => setMenuOpen(false)} className="text-[#FFFFFF]/90 hover:text-[#C58A2B] py-2">
                {t('nav.contact')}
              </a>
              {user ? (
                <>
                  {isClient && <Link to="/painel" onClick={() => setMenuOpen(false)} className="py-2 text-[#FFFFFF]/90">{t('nav.dashboard')}</Link>}
                  {isCompany && <Link to="/empresa" onClick={() => setMenuOpen(false)} className="py-2 text-[#FFFFFF]/90">{t('nav.company')}</Link>}
                  {isProvider && <Link to="/prestador" onClick={() => setMenuOpen(false)} className="py-2 text-[#FFFFFF]/90">{t('nav.provider')}</Link>}
                  <button onClick={() => { logout(); setMenuOpen(false); }} className="py-2 text-[#FFFFFF]/90">{t('auth.logout')}</button>
                </>
              ) : (
                <>
                  <Link to="/entrar" onClick={() => setMenuOpen(false)} className="py-2 text-[#FFFFFF]/90">{t('auth.login')}</Link>
                  <Link to="/registar" onClick={() => setMenuOpen(false)} className="inline-flex justify-center px-6 py-3 bg-[#C58A2B] hover:bg-[#E0B15C] text-[#3A0D0D] font-semibold rounded-xl">
                    {t('nav.book')}
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
