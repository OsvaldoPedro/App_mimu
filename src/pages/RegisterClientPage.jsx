import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function RegisterClientPage() {
  const [form, setForm] = useState({
    name: '', phone: '', email: '', password: '', confirmPassword: '', photo: ''
  })
  const [error, setError] = useState('')
  const { registerClient } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirmPassword) {
      setError('As palavras-passe não coincidem')
      return
    }
    if (form.password.length < 6) {
      setError('A palavra-passe deve ter pelo menos 6 caracteres')
      return
    }
    const result = registerClient({
      name: form.name,
      phone: form.phone,
      email: form.email,
      password: form.password,
      photo: form.photo || null
    })
    if (result.success) navigate('/painel')
    else setError(result.error)
  }

  return (
    <div className="min-h-screen bg-[#F4E8D8]">
      <Navbar />
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8">
          <Link to="/registar" className="text-[#C58A2B] text-sm font-medium mb-4 inline-block">← Voltar</Link>
          <h1 className="text-2xl font-bold text-[#3A0D0D] mb-2">Conta de Cliente</h1>
          <p className="text-[#5C1A1A]/80 mb-6">Cria a tua conta para reservar serviços</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="p-3 bg-red-100 text-red-700 rounded-xl text-sm">{error}</div>}
            <div>
              <label className="block text-sm font-medium text-[#3A0D0D] mb-2">Nome completo</label>
              <input name="name" value={form.name} onChange={handleChange} required
                className="w-full px-4 py-3 rounded-xl border-2 border-[#F4E8D8] focus:border-[#C58A2B] focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#3A0D0D] mb-2">Telefone</label>
              <input name="phone" value={form.phone} onChange={handleChange} required
                className="w-full px-4 py-3 rounded-xl border-2 border-[#F4E8D8] focus:border-[#C58A2B] focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#3A0D0D] mb-2">Email (opcional)</label>
              <input name="email" type="email" value={form.email} onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border-2 border-[#F4E8D8] focus:border-[#C58A2B] focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#3A0D0D] mb-2">Foto (URL opcional)</label>
              <input name="photo" value={form.photo} onChange={handleChange}
                placeholder="https://..."
                className="w-full px-4 py-3 rounded-xl border-2 border-[#F4E8D8] focus:border-[#C58A2B] focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#3A0D0D] mb-2">Palavra-passe</label>
              <input name="password" type="password" value={form.password} onChange={handleChange} required
                className="w-full px-4 py-3 rounded-xl border-2 border-[#F4E8D8] focus:border-[#C58A2B] focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#3A0D0D] mb-2">Confirmar palavra-passe</label>
              <input name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} required
                className="w-full px-4 py-3 rounded-xl border-2 border-[#F4E8D8] focus:border-[#C58A2B] focus:outline-none" />
            </div>
            <button type="submit"
              className="w-full py-4 bg-[#C58A2B] hover:bg-[#E0B15C] text-[#3A0D0D] font-bold rounded-xl transition-colors">
              Criar conta
            </button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  )
}
