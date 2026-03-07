import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

const types = [
  { id: 'client', labelKey: 'register.client', descKey: 'register.clientDesc', icon: '👤' },
  { id: 'company', labelKey: 'register.company', descKey: 'register.companyDesc', icon: '🏢' },
  { id: 'provider', labelKey: 'register.provider', descKey: 'register.providerDesc', icon: '💼' }
]


export default function RegisterPage() {
  const { t } = useTranslation()
  const [selected, setSelected] = useState(null)

  return (
    <div className="min-h-screen bg-[#F4E8D8]">
      <Navbar />
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-[#3A0D0D] text-center mb-4">{t('register.title')}</h1>
          <p className="text-[#5C1A1A]/80 text-center mb-10">{t('register.subtitle')}</p>

          <div className="space-y-4">
            {types.map((type) => (
              <Link
                key={type.id}
                to={`/registar/${type.id}`}
                className="block p-6 bg-white rounded-2xl shadow-md hover:shadow-lg border-2 border-transparent hover:border-[#C58A2B] transition-all"
              >
                <div className="flex items-center gap-4">
                  <span className="text-4xl">{type.icon}</span>
                  <div>
                    <h2 className="text-xl font-bold text-[#3A0D0D]">{t(type.labelKey)}</h2>
                    <p className="text-[#5C1A1A]/80">{t(type.descKey)}</p>
                  </div>
                  <span className="ml-auto text-[#C58A2B]">→</span>
                </div>
              </Link>
            ))}
          </div>

          <p className="mt-8 text-center text-[#5C1A1A]/80 text-sm">
            {t('register.haveAccount')}{' '}
            <Link to="/entrar" className="text-[#C58A2B] font-semibold hover:underline">
              {t('auth.login')}
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  )
}
