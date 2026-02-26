import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useAuth } from '../context/AuthContext'

export default function ResetPassword() {
  const { resetPassword } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleReset = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (!token) {
      setError('Token inválido ou em falta. Tenta novamente o processo de recuperação.')
      return
    }
    if (!password || password.length < 6) {
      setError('A nova palavra-passe deve ter pelo menos 6 caracteres.')
      return
    }
    if (password !== confirm) {
      setError('As palavras-passe não coincidem.')
      return
    }

    setLoading(true)
    try {
      const result = await resetPassword(token, password)
      if (!result.success) {
        setError(result.error || 'Não foi possível redefinir a palavra-passe.')
        return
      }
      setSuccess(true)
      setTimeout(() => {
        navigate('/entrar', { replace: true })
      }, 1200)
    } catch (err) {
      setError(err.message || 'Erro inesperado.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F4E8D8]">
      <Navbar />
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8">
          <Link to="/entrar" className="text-[#C58A2B] text-sm font-medium mb-4 inline-block">
            ← Voltar ao login
          </Link>
          <h1 className="text-2xl font-bold text-[#3A0D0D] mb-2">Definir nova senha</h1>
          <p className="text-[#5C1A1A]/80 mb-6">
            Escolhe uma nova palavra-passe para a tua conta.
          </p>

          <form onSubmit={handleReset} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-100 text-red-700 rounded-xl text-sm">{error}</div>
            )}
            {success && (
              <div className="p-3 bg-green-100 text-green-800 rounded-xl text-sm">
                Senha redefinida com sucesso.
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-[#3A0D0D] mb-2">Nova senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-[#F4E8D8] focus:border-[#C58A2B] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#3A0D0D] mb-2">
                Confirmar nova senha
              </label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-[#F4E8D8] focus:border-[#C58A2B] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#C58A2B] hover:bg-[#E0B15C] text-[#3A0D0D] font-bold rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'A redefinir...' : 'Redefinir senha'}
            </button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  )
}
