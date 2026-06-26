import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../config/supabaseClient'
import { useTranslation } from 'react-i18next'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function RecoverPasswordPage() {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setError('')
    setSuccessMsg('')

    if (!email) {
      setError(t('auth.emailMissingError', 'Por favor, insira o seu e-mail ou telefone.'))
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/redefinir-senha`
    })
    setLoading(false)

    if (error) {
      setError(error.message)
    } else {
      setSuccessMsg(t('auth.recoverLinkSent', 'Enviámos um link mágico de recuperação oficial para o seu e-mail. Por favor, verifique a sua caixa de entrada e pasta de correio não solicitado (spam).'))
    }
  }

  return (
    <div className="min-h-screen bg-mimu-cream dark:bg-[#121212]">
      <Navbar />
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-md mx-auto bg-mimu-white dark:bg-[#1E1E1E] rounded-2xl shadow-xl p-4 md:p-8">
          <h1 className="text-xl md:text-2xl font-bold text-mimu-wine-text dark:text-white mb-2">{t('auth.recoverPasswordTitle', 'Recuperar Palavra-passe')}</h1>

          {error && <div className="p-3 mb-4 bg-red-100 text-red-700 rounded-xl text-sm">{error}</div>}
          {successMsg && <div className="p-4 mb-4 bg-green-100 text-green-800 rounded-xl text-sm leading-relaxed font-medium">{successMsg}</div>}

          {!successMsg && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <p className="text-mimu-wine-light-text dark:text-gray-300/80 mb-6 text-sm">{t('auth.recoverPasswordDesc', 'Insira o e-mail ou telefone associado à sua conta. Iremos enviar-lhe um link seguro para redefinir a palavra-passe.')}</p>
              <div>
                <label className="block text-sm font-medium text-mimu-wine-text dark:text-white mb-2">{t('auth.emailPhoneLabel', 'E-mail / Telefone')}</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder={t('auth.emailPhonePlaceholder', 'Digite seu e-mail ou telefone')}
                  className="w-full px-4 py-3 rounded-xl border-2 border-mimu-cream-border dark:border-[#2A2A2A] focus:border-mimu-gold focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-mimu-gold hover:bg-mimu-gold-hover text-mimu-wine-text dark:text-white font-bold rounded-xl transition-colors disabled:opacity-50 transition-all duration-300 hover:shadow-md active:scale-95"
              >
                {loading ? t('auth.contactingServer', 'A contactar servidor...') : t('auth.sendRecoverLink', 'Enviar Link de Recuperação')}
              </button>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
