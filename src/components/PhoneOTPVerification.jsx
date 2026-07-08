import { useState, useRef, useEffect } from 'react'

export default function PhoneOTPVerification({
  phone,
  onVerifySuccess,
  onCancel,
  sendCodeHook
}) {
  const {
    verifyCode,
    sendCode,
    sending,
    verifying,
    canResend,
    resendCountdown,
    error: hookError,
    success: hookSuccess
  } = sendCodeHook

  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [error, setError] = useState(null)
  const inputsRef = useRef([])

  useEffect(() => {
    // Focar no primeiro input ao abrir o componente
    if (inputsRef.current[0]) {
      inputsRef.current[0].focus()
    }
  }, [])

  useEffect(() => {
    if (hookError) {
      setError(hookError)
    }
  }, [hookError])

  const handleChange = (index, value) => {
    if (isNaN(value)) return // Apenas aceitar números

    const newOtp = [...otp]
    newOtp[index] = value.substring(value.length - 1) // Apenas o último caractere
    setOtp(newOtp)
    setError(null)

    // Focar no próximo se foi preenchido
    if (value && index < 5 && inputsRef.current[index + 1]) {
      inputsRef.current[index + 1].focus()
    }

    // Se todos preenchidos, submeter automaticamente
    if (newOtp.every(val => val !== '') && newOtp.length === 6) {
      handleVerify(newOtp.join(''))
    }
  }

  const handleKeyDown = (index, e) => {
    // Backspace: focar no anterior se vazio
    if (e.key === 'Backspace' && !otp[index] && index > 0 && inputsRef.current[index - 1]) {
      inputsRef.current[index - 1].focus()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').substring(0, 6)
    if (pastedData.length === 6) {
      const newOtp = pastedData.split('')
      setOtp(newOtp)
      setError(null)
      handleVerify(pastedData)
    }
  }

  const handleVerify = async (codeToVerify) => {
    const fullCode = codeToVerify || otp.join('')
    if (fullCode.length !== 6) {
      setError('Por favor, introduza os 6 dígitos.')
      return
    }

    const res = await verifyCode(phone, fullCode)
    if (res.success) {
      onVerifySuccess()
    }
  }

  const handleResend = async () => {
    if (!canResend) return
    setError(null)
    const res = await sendCode(phone)
    if (res.success) {
      setOtp(['', '', '', '', '', ''])
      if (inputsRef.current[0]) {
        inputsRef.current[0].focus()
      }
    }
  }

  return (
    <div className="space-y-6 text-center animate-fade-in">
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-mimu-wine-text dark:text-white">
          Verificar Telefone
        </h2>
        <p className="text-sm text-mimu-wine-light-text dark:text-gray-300/80 mt-2">
          Enviámos um código de 6 dígitos para o número <span className="font-semibold text-mimu-wine-text dark:text-white">+{phone}</span>.
        </p>
      </div>

      {/* Inputs de OTP */}
      <div className="flex justify-center gap-2 md:gap-3 my-6" onPaste={handlePaste}>
        {otp.map((digit, index) => (
          <input
            key={index}
            ref={el => (inputsRef.current[index] = el)}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            value={digit}
            onChange={e => handleChange(index, e.target.value)}
            onKeyDown={e => handleKeyDown(index, e)}
            className="w-11 h-12 md:w-12 md:h-14 text-center text-xl md:text-2xl font-bold rounded-xl border-2 border-mimu-cream-border dark:border-[#2A2A2A] focus:border-mimu-gold focus:outline-none focus:ring-2 focus:ring-mimu-gold focus:border-transparent dark:bg-[#1E1E1E] text-mimu-wine-text dark:text-white transition-all"
          />
        ))}
      </div>

      {/* Erros e Sucessos */}
      {error && (
        <div className="p-3 bg-red-100 text-red-700 rounded-xl text-sm font-medium animate-shake">
          ⚠️ {error}
        </div>
      )}

      {hookSuccess && !error && (
        <div className="p-3 bg-green-100 text-green-700 rounded-xl text-sm font-medium">
          ✨ {hookSuccess}
        </div>
      )}

      {/* Ações */}
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => handleVerify()}
          disabled={verifying || otp.some(d => d === '')}
          className="w-full py-4 bg-mimu-gold hover:bg-mimu-gold-hover text-mimu-wine-text dark:text-white font-bold rounded-xl transition-all disabled:opacity-50 hover:shadow-md active:scale-95 flex items-center justify-center gap-2"
        >
          {verifying ? (
            <>
              <div className="w-5 h-5 border-2 border-mimu-wine-text dark:border-white border-t-transparent rounded-full animate-spin"></div>
              A verificar...
            </>
          ) : (
            'Confirmar Código'
          )}
        </button>

        <div className="flex items-center justify-between text-sm px-1">
          <button
            type="button"
            onClick={handleResend}
            disabled={!canResend || sending}
            className={`font-semibold hover:underline transition-colors ${
              canResend ? 'text-mimu-gold' : 'text-mimu-wine-light-text/60 dark:text-gray-500 cursor-not-allowed'
            }`}
          >
            {sending ? 'A enviar...' : 'Reenviar Código'}
          </button>
          
          {!canResend && (
            <span className="text-mimu-wine-light-text dark:text-gray-400 font-medium">
              Reenviar em {resendCountdown}s
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={onCancel}
          disabled={verifying}
          className="w-full py-3 border-2 border-mimu-cream-border dark:border-[#2A2A2A] text-mimu-wine-light-text dark:text-gray-300 hover:bg-mimu-cream/30 rounded-xl transition-all font-semibold"
        >
          Voltar ao formulário
        </button>
      </div>
    </div>
  )
}
