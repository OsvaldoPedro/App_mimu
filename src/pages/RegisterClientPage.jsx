import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTranslation } from 'react-i18next'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

import { enforceNumeric, enforceAlphaText, isValidEmail } from '../utils/validation'
import { toast } from 'react-hot-toast'
import { usePhoneVerification } from '../hooks/usePhoneVerification'
import PhoneOTPVerification from '../components/PhoneOTPVerification'

export default function RegisterClientPage() {
  const { t } = useTranslation()
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', confirmPassword: ''
  })
  
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  const { registerClient, user } = useAuth()
  const navigate = useNavigate()
  const phoneVerification = usePhoneVerification()

  const [showOtp, setShowOtp] = useState(false)
  const [phoneToVerify, setPhoneToVerify] = useState('')

  useEffect(() => {
    if (user) {
      const target = user.role === 'company' ? '/empresa' : user.role === 'provider' ? '/prestador' : user.role === 'admin' ? '/admin' : '/painel'
      navigate(target, { replace: true })
    }
  }, [user, navigate])

  const handleChange = (e) => {
    let { name, value } = e.target
    
    if (name === 'phone') {
      value = enforceNumeric(value).substring(0, 9)
    }
    if (name === 'name') {
      value = enforceAlphaText(value)
    }
    
    setForm(f => ({ ...f, [name]: value }))
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    
    if (form.name.trim().length < 2) {
      setError(t('register.invalidName', 'Por favor, insira um nome válido (apenas letras).'))
      return
    }

    const cleanPhone = form.email.replace(/\D/g, '');
    const isPhone = !form.email.includes('@') && cleanPhone.length === 9;
    const isEmail = isValidEmail(form.email);
    
    if (!isEmail && !isPhone) {
      setError(t('register.invalidEmailPhone', 'Por favor, insira um e-mail válido ou um número de telefone com 9 dígitos.'))
      return
    }



    if (form.password.length < 6) {
      setError(t('auth.passwordLengthError', 'A palavra-passe deve ter pelo menos 6 caracteres.'))
      return
    }

    if (form.password !== form.confirmPassword) {
      setError(t('auth.passwordMismatchError', 'As palavras-passe não coincidem.'))
      return
    }

    const phoneVal = isPhone ? cleanPhone : form.phone
    
    // Se for registo por telefone, verificar primeiro por SMS OTP
    if (isPhone && !showOtp) {
      setPhoneToVerify(cleanPhone)
      setLoading(true)
      const res = await phoneVerification.sendCode(cleanPhone)
      setLoading(false)
      if (res.success) {
        setShowOtp(true)
      }
      return
    }

    setLoading(true)
    
    const result = await registerClient({
      name: form.name,
      email: form.email,
      phone: phoneVal,
      password: form.password
    })
    
    setLoading(false)

    if (result.success) {
      if (result.requireEmailConfirmation) {
        toast.success(t('register.emailConfirmationSent', 'Envio de email de confirmação! Verifique a sua caixa de entrada.'))
        navigate('/verificar-otp', { state: { email: form.email } });
      } else {
        // Fallback: Se o Supabase por algum motivo retornar que o email não precisa de confirmação
        // Vamos forçar a navegação para que o utilizador não fique preso!
        toast.success(t('register.accountCreatedSuccess', 'Conta criada com sucesso! Bem-vindo(a).'))
        navigate('/painel', { replace: true })
      }
    } else {
      setError(result.error)
    }
  }



  return (
    <div className="min-h-screen bg-mimu-cream dark:bg-[#121212]">
      <Navbar />
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-md mx-auto bg-mimu-white dark:bg-[#1E1E1E] rounded-2xl shadow-xl p-4 md:p-8">
          <h1 className="text-xl md:text-2xl font-bold text-mimu-wine-text dark:text-white mb-2">{t('register.clientAccount', 'Conta Cliente')}</h1>
          <p className="text-mimu-wine-light-text dark:text-gray-300/80 mb-6">
            {t('register.clientSubtitle', 'Crie a sua conta para começar a reservar.')}
          </p>

          {error && <div className="p-3 mb-4 bg-red-100 text-red-700 rounded-xl text-sm">{error}</div>}

          {showOtp ? (
            <PhoneOTPVerification
              phone={phoneToVerify}
              sendCodeHook={phoneVerification}
              onCancel={() => setShowOtp(false)}
              onVerifySuccess={async () => {
                // Proceder com a criação da conta após OTP verificado
                setLoading(true)
                const result = await registerClient({
                  name: form.name,
                  email: form.email,
                  phone: phoneToVerify,
                  password: form.password
                })
                setLoading(false)
                if (result.success) {
                  toast.success(t('register.accountCreatedSuccess', 'Conta criada com sucesso! Bem-vindo(a).'))
                  navigate('/painel', { replace: true })
                } else {
                  setError(result.error)
                  setShowOtp(false)
                }
              }}
            />
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-mimu-wine-text dark:text-white mb-2">{t('register.name', 'Nome Completo')}</label>
                <input name="name" value={form.name} onChange={handleChange} required
                  className="w-full px-4 py-3 rounded-xl border-2 border-mimu-cream-border dark:border-[#2A2A2A] focus:border-mimu-gold focus:outline-none focus:ring-2 focus:ring-mimu-gold focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-mimu-wine-text dark:text-white mb-2">{t('auth.emailPhoneLabel', 'E-mail / Telefone')}</label>
                <input name="email" type="text" value={form.email} onChange={handleChange} required placeholder={t('auth.emailPhonePlaceholder', 'Digite seu e-mail ou telefone')}
                  className="w-full px-4 py-3 rounded-xl border-2 border-mimu-cream-border dark:border-[#2A2A2A] focus:border-mimu-gold focus:outline-none focus:ring-2 focus:ring-mimu-gold focus:border-transparent" />
              </div>

              <div>
                <label className="block text-sm font-medium text-mimu-wine-text dark:text-white mb-2">{t('auth.passwordLabel', 'Palavra-passe')}</label>
                <input name="password" type="password" placeholder={t('auth.passwordPlaceholder', '••••••••')} value={form.password} onChange={handleChange} required
                  className="w-full px-4 py-3 rounded-xl border-2 border-mimu-cream-border dark:border-[#2A2A2A] focus:border-mimu-gold focus:outline-none focus:ring-2 focus:ring-mimu-gold focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-mimu-wine-text dark:text-white mb-2">{t('register.confirmPassword', 'Confirmar palavra-passe')}</label>
                <input name="confirmPassword" type="password" placeholder={t('auth.passwordPlaceholder', '••••••••')} value={form.confirmPassword} onChange={handleChange} required
                  className="w-full px-4 py-3 rounded-xl border-2 border-mimu-cream-border dark:border-[#2A2A2A] focus:border-mimu-gold focus:outline-none focus:ring-2 focus:ring-mimu-gold focus:border-transparent" />
              </div>

              <p className="text-xs text-mimu-wine-light-text dark:text-gray-300/80 mt-4 mb-4">
                {t('register.termsConsent', 'Ao criar a sua conta, está a consentir com os nossos')}{' '}
                <Link to="/termos-de-uso" className="text-mimu-gold hover:underline font-semibold" target="_blank">{t('register.termsOfUse', 'Termos de Uso')}</Link> {t('register.and', 'e')}{' '}
                <Link to="/politica-privacidade" className="text-mimu-gold hover:underline font-semibold" target="_blank">{t('register.privacyPolicy', 'Política de Privacidade')}</Link>.
              </p>

              <button type="submit" disabled={loading}
                className="w-full py-4 bg-mimu-gold hover:bg-mimu-gold-hover text-mimu-wine-text dark:text-white font-bold rounded-xl transition-colors disabled:opacity-50 transition-all duration-300 hover:shadow-md active:scale-95">
                {loading ? t('register.creatingAccount', 'A criar conta...') : t('register.createAccountBtn', 'Criar Conta')}
              </button>
            </form>
          )}

        </div>
      </main>
      <Footer />
    </div>
  )
}
