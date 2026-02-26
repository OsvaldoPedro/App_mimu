import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { categories } from '../data/categories'
import { provinces } from '../data/provinces'

export default function RegisterProviderPage() {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', province: '', address: '',
    categoryId: '', serviceTypes: [], basePrice: '', hours: ''
  })
  const [error, setError] = useState('')
  const { registerProvider } = useAuth()
  const navigate = useNavigate()

  const category = categories.find(c => c.id === form.categoryId)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
    if (name === 'categoryId') setForm(f => ({ ...f, serviceTypes: [] }))
  }

  const toggleService = (s) => {
    setForm(f => ({
      ...f,
      serviceTypes: f.serviceTypes.includes(s) ? f.serviceTypes.filter(x => x !== s) : [...f.serviceTypes, s]
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    if (form.password.length < 6) {
      setError('A palavra-passe deve ter pelo menos 6 caracteres')
      return
    }
    const result = registerProvider({
      name: form.name,
      email: form.email,
      phone: form.phone,
      password: form.password,
      province: form.province,
      address: form.address,
      categoryId: form.categoryId,
      serviceTypes: form.serviceTypes,
      basePrice: form.basePrice ? Number(form.basePrice) : null,
      hours: form.hours
    })
    if (result.success) navigate('/prestador')
    else setError(result.error)
  }

  return (
    <div className="min-h-screen bg-[#F4E8D8]">
      <Navbar />
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-8">
          <Link to="/registar" className="text-[#C58A2B] text-sm font-medium mb-4 inline-block">← Voltar</Link>
          <h1 className="text-2xl font-bold text-[#3A0D0D] mb-2">Criar conta – Prestador de Serviço</h1>
          <p className="text-[#5C1A1A]/80 mb-2">A conta ficará "Pendente de Aprovação" até validação.</p>
          <p className="text-amber-700 text-sm mb-6">Após registo, terás acesso ao painel do prestador.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="p-3 bg-red-100 text-red-700 rounded-xl text-sm">{error}</div>}
            <div>
              <label className="block text-sm font-medium text-[#3A0D0D] mb-2">Nome completo</label>
              <input name="name" value={form.name} onChange={handleChange} required
                className="w-full px-4 py-3 rounded-xl border-2 border-[#F4E8D8] focus:border-[#C58A2B] focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#3A0D0D] mb-2">Categoria</label>
              <select name="categoryId" value={form.categoryId} onChange={handleChange} required
                className="w-full px-4 py-3 rounded-xl border-2 border-[#F4E8D8] focus:border-[#C58A2B] focus:outline-none">
                <option value="">Escolher...</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                ))}
              </select>
            </div>
            {category && (
              <div>
                <label className="block text-sm font-medium text-[#3A0D0D] mb-2">Serviços oferecidos</label>
                <div className="flex flex-wrap gap-2">
                  {category.services.map(s => (
                    <label key={s} className="flex items-center gap-2 px-3 py-2 bg-[#F4E8D8] rounded-xl cursor-pointer">
                      <input type="checkbox" checked={form.serviceTypes.includes(s)} onChange={() => toggleService(s)} />
                      <span className="text-sm">{s}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-[#3A0D0D] mb-2">Preço base (AOA)</label>
              <input name="basePrice" type="number" value={form.basePrice} onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border-2 border-[#F4E8D8] focus:border-[#C58A2B] focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#3A0D0D] mb-2">Horários de atendimento</label>
              <input name="hours" value={form.hours} onChange={handleChange} placeholder="Ex: 9h-18h"
                className="w-full px-4 py-3 rounded-xl border-2 border-[#F4E8D8] focus:border-[#C58A2B] focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#3A0D0D] mb-2">Email</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} required
                className="w-full px-4 py-3 rounded-xl border-2 border-[#F4E8D8] focus:border-[#C58A2B] focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#3A0D0D] mb-2">Telefone</label>
              <input name="phone" value={form.phone} onChange={handleChange} required
                className="w-full px-4 py-3 rounded-xl border-2 border-[#F4E8D8] focus:border-[#C58A2B] focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#3A0D0D] mb-2">Província/Cidade</label>
              <select name="province" value={form.province} onChange={handleChange} required
                className="w-full px-4 py-3 rounded-xl border-2 border-[#F4E8D8] focus:border-[#C58A2B] focus:outline-none">
                <option value="">Escolher...</option>
                {provinces.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#3A0D0D] mb-2">Endereço (opcional)</label>
              <input name="address" value={form.address} onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border-2 border-[#F4E8D8] focus:border-[#C58A2B] focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#3A0D0D] mb-2">Palavra-passe</label>
              <input name="password" type="password" value={form.password} onChange={handleChange} required
                className="w-full px-4 py-3 rounded-xl border-2 border-[#F4E8D8] focus:border-[#C58A2B] focus:outline-none" />
            </div>
            <button type="submit"
              className="w-full py-4 bg-[#C58A2B] hover:bg-[#E0B15C] text-[#3A0D0D] font-bold rounded-xl transition-colors">
              Criar conta – Prestador
            </button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  )
}
