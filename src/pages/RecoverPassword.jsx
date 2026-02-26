import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useAuth } from '../context/AuthContext'

export default function RecoverPassword() {
  const { forgotPassword } = useAuth()
  const navigate = useNavigate()
  const [identifier, setIdentifier] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  const handleRecover = async (e) => {
    e.preventDefault()
    setError('')
    setInfo('')
    if (!identifier.trim()) {
      setError('Indica o email ou telefone associado à tua conta.')
      return
    }
    setLoading(true)
    try {
      const result = await forgotPassword(identifier.trim())
      if (!result.success) {
        setError(result.error || 'Não foi possível iniciar a recuperação de senha.')
        return
      }

      if (result.token) {
        // eslint-disable-next-line no-console
        console.log('Token de recuperação usado na navegação:', result.token)
        navigate(`/reset-password?token=${encodeURIComponent(result.token)}`)
      } else {
        setInfo('Se existir uma conta com estes dados, receberás instruções para redefinir a senha.')
      }
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
          <h1 className="text-2xl font-bold text-[#3A0D0D] mb-2">Recuperar senha</h1>
          <p className="text-[#5C1A1A]/80 mb-6">
            Introduz o teu email ou telefone. Vamos enviar um código de recuperação (simulação em modo demo).
          </p>

          <form onSubmit={handleRecover} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-100 text-red-700 rounded-xl text-sm">{error}</div>
            )}
            {info && (
              <div className="p-3 bg-green-100 text-green-800 rounded-xl text-sm">{info}</div>
            )}
            <div>
              <label className="block text-sm font-medium text-[#3A0D0D] mb-2">
                Email ou telefone
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-[#F4E8D8] focus:border-[#C58A2B] focus:outline-none"
                placeholder="ex: admin@meusite.com ou 925..."
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#C58A2B] hover:bg-[#E0B15C] text-[#3A0D0D] font-bold rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'A enviar...' : 'Enviar código'}
            </button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  )
}

