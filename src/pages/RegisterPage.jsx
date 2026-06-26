import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

const types = [
  { id: 'client', labelKey: 'register.client', descKey: 'register.clientDesc', icon: '👤', borderColor: 'border-mimu-gold hover:border-mimu-gold/80 hover:bg-mimu-gold/5' },
  { id: 'company', labelKey: 'register.company', descKey: 'register.companyDesc', icon: '🏢', borderColor: 'border-[#3B82F6] hover:border-[#3B82F6]/80 hover:bg-[#3B82F6]/5' },
  { id: 'provider', labelKey: 'register.provider', descKey: 'register.providerDesc', icon: '💼', borderColor: 'border-[#10B981] hover:border-[#10B981]/80 hover:bg-[#10B981]/5' }
]


export default function RegisterPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) {
      const target = user.role === 'company' ? '/empresa' : user.role === 'provider' ? '/prestador' : user.role === 'admin' ? '/admin' : '/painel'
      navigate(target, { replace: true })
    }
  }, [user, navigate])

  return (
    <div className="min-h-screen bg-mimu-cream dark:bg-[#121212]">
      <Navbar />
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-mimu-wine-text dark:text-white text-center mb-6">{t('register.title')}</h1>
          <p className="text-lg md:text-xl text-mimu-wine-light-text dark:text-gray-300/80 text-center mb-14">{t('register.subtitle')}</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 justify-items-center">
            {types.map((type) => (
              <Link
                key={type.id}
                to={`/registar/${type.id}`}
                className={`w-full max-w-[260px] md:max-w-[320px] flex flex-col items-center justify-center text-center p-4 md:p-6 bg-mimu-white dark:bg-[#1E1E1E] rounded-3xl shadow-lg hover:shadow-xl border-4 ${type.borderColor} transition-all duration-300 hover:-translate-y-2 aspect-square group`}
              >
                <div className="text-5xl md:text-6xl mb-3 md:mb-5 group-hover:scale-110 transition-transform duration-300">
                  {type.icon}
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-mimu-wine-text dark:text-white mb-2">{t(type.labelKey)}</h2>
                <p className="text-mimu-wine-light-text dark:text-gray-300/80 text-sm md:text-base leading-snug px-1">{t(type.descKey)}</p>
              </Link>
            ))}
          </div>

          <p className="mt-16 text-center text-mimu-wine-light-text dark:text-gray-300/80 text-base md:text-lg">
            {t('register.haveAccount')}{' '}
            <Link to="/entrar" className="text-mimu-gold font-bold hover:underline">
              {t('auth.login')}
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  )
}
