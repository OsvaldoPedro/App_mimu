import { useState, useRef, useEffect } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../config/supabaseClient'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { toast } from 'react-hot-toast'

export default function VerifyOTPPage() {
  const { verifySignupOtp, user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const email = location.state?.email || ''

  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendMessage, setResendMessage] = useState('')

  const inputRefs = useRef([])

  useEffect(() => {
    // If arriving here without an email, redirect to login
    if (!email) {
      navigate('/entrar', { replace: true })
    }
  }, [email, navigate])

  // Process completed login when user state is updated after successful OTP
  useEffect(() => {
    if (user) {
      const target = user.role === 'company'
        ? '/empresa'
        : user.role === 'provider'
          ? '/prestador'
          : user.role === 'admin'
            ? '/admin'
            : '/painel'

      navigate(target, { replace: true })
    }
  }, [user, navigate])

  const handleChange = (index, value) => {
    // Apenas permitir números
    if (!/^\d*$/.test(value)) return;

    // Pegar o último dígito inserido para casos de copy/paste
    const char = value.slice(-1)

    const newOtp = [...otp]
    newOtp[index] = char
    setOtp(newOtp)

    // Se inseriu número e não é o último, saltar para o próximo input
    if (char && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        // Se este input está limpo, apaga o anterior e volta um passo
        const newOtp = [...otp]
        newOtp[index - 1] = ''
        setOtp(newOtp)
        inputRefs.current[index - 1]?.focus()
      } else {
        // Apenas limpa o atual
        const newOtp = [...otp]
        newOtp[index] = ''
        setOtp(newOtp)
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text/plain').replace(/\D/g, '').slice(0, 6);

    if (pastedData) {
      const newOtp = [...otp];
      for (let i = 0; i < pastedData.length; i++) {
        newOtp[i] = pastedData[i];
      }
      setOtp(newOtp);
      const focusIndex = pastedData.length < 6 ? pastedData.length : 5;
      inputRefs.current[focusIndex]?.focus();
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const token = otp.join('')
    if (token.length < 6) {
      setError('Por favor, insira o código completo de 6 dígitos.')
      return
    }

    setLoading(true)

    const result = await verifySignupOtp(email, token)

    setLoading(false)

    if (result.success) {
      toast.success('Conta verificada com sucesso! A iniciar sessão...')
      // useEffect fará o redirect quando as subs do AuthContext atualizarem o user
    } else {
      setError('Código inválido ou expirado. Verifique os números e tente de novo.')
    }
  }

  const handleResend = async () => {
    setResendLoading(true)
    setError('')
    setResendMessage('')

    try {
      // supabase resend function para o Email/SMS Confirm
      const isPhone = !email.includes('@');
      const payload = {};
      if (isPhone) {
        payload.type = 'sms';
        const clean = email.replace(/\D/g, '');
        payload.phone = clean.startsWith('244') ? '+' + clean : (clean.length === 9 ? '+244' + clean : '+' + clean);
      } else {
        payload.type = 'signup';
        payload.email = email;
      }
      const { error } = await supabase.auth.resend(payload);

      if (error) throw error

      setResendMessage(
        isPhone 
          ? 'O código foi enviado novamente por SMS para o seu telemóvel.' 
          : 'O código foi enviado novamente para o seu e-mail.'
      )
    } catch {
      setError('Não foi possível enviar um novo código. Tente novamente mais tarde.')
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-mimu-cream dark:bg-[#121212]">
      <Navbar />
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-md mx-auto bg-mimu-white dark:bg-[#1E1E1E] rounded-2xl shadow-xl p-4 md:p-8 text-center">
          <h1 className="text-xl md:text-2xl font-bold text-mimu-wine-text dark:text-white mb-2">Verificar Conta</h1>
          <p className="text-mimu-wine-light-text dark:text-gray-300 mb-6">
            {!email.includes('@') 
              ? 'Enviámos um código de 6 dígitos por SMS para o telemóvel:' 
              : 'Enviámos um código de 6 dígitos para o e-mail:'} <br />
            <span className="font-semibold text-mimu-text-dark dark:text-white">{email}</span>
          </p>

          {error && (
            <div className="p-3 mb-6 bg-red-100 text-red-700 rounded-xl text-sm text-left">{error}</div>
          )}

          {resendMessage && (
            <div className="p-3 mb-6 bg-green-100 text-green-700 rounded-xl text-sm text-left">{resendMessage}</div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="flex justify-center gap-2 mb-8">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  pattern="\d*"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  className="w-12 h-14 md:w-14 md:h-16 text-center text-2xl font-bold rounded-xl border-2 border-mimu-cream-border dark:border-[#2A2A2A] focus:border-mimu-gold focus:outline-none transition-colors"
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={loading || otp.join('').length < 6}
              className="w-full py-4 bg-mimu-gold hover:bg-mimu-gold-hover text-mimu-wine-text dark:text-white font-bold rounded-xl disabled:opacity-50 transition-all duration-300 hover:shadow-md active:scale-95"
            >
              {loading ? 'A verificar...' : 'Confirmar Conta'}
            </button>
          </form>

          <p className="mt-8 text-sm text-mimu-wine-light-text dark:text-gray-300">
            Não recebeu o código?{' '}
            <button
              onClick={handleResend}
              disabled={resendLoading}
              className="text-mimu-gold font-semibold hover:underline disabled:opacity-50"
            >
              {resendLoading ? 'A reenviar...' : 'Reenviar código'}
            </button>
          </p>

          <div className="mt-4">
            <Link to="/entrar" className="text-xs text-mimu-wine-light-text dark:text-gray-300/60 hover:text-mimu-wine-text dark:text-white transition-colors">
              Voltar ao Login
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
