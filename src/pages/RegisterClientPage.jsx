import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTranslation } from 'react-i18next'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function RegisterClientPage() {
  const { t } = useTranslation()
  const [form, setForm] = useState({
    name: '', phone: '', email: '', password: '', confirmPassword: ''
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
      setError(t('form.passwordMismatch'))
      return
    }
    if (form.password.length < 6) {
      setError(t('form.passwordTooShort'))
      return
    }
    const result = registerClient({
      name: form.name,
      phone: form.phone,
      email: form.email,
      password: form.password
    })
    if (result.success) navigate('/painel')
    else setError(result.error)
  }

  return (
    <div className="min-h-screen bg-[#F4E8D8]">
      <Navbar />
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8">
          <Link to="/registar" className="text-[#C58A2B] text-sm font-medium mb-4 inline-block">← {t('form.back')}</Link>
          <h1 className="text-2xl font-bold text-[#3A0D0D] mb-2">{t('form.clientAccount')}</h1>
          <p className="text-[#5C1A1A]/80 mb-6">{t('form.clientSubtitle')}</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="p-3 bg-red-100 text-red-700 rounded-xl text-sm">{error}</div>}
            <div>
              <label className="block text-sm font-medium text-[#3A0D0D] mb-2">{t('form.name')}</label>
              <input name="name" value={form.name} onChange={handleChange} required
                className="w-full px-4 py-3 rounded-xl border-2 border-[#F4E8D8] focus:border-[#C58A2B] focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#3A0D0D] mb-2">{t('form.phone')}</label>
              <input name="phone" value={form.phone} onChange={handleChange} required
                className="w-full px-4 py-3 rounded-xl border-2 border-[#F4E8D8] focus:border-[#C58A2B] focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#3A0D0D] mb-2">{t('form.emailOptional')}</label>
              <input name="email" type="email" value={form.email} onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border-2 border-[#F4E8D8] focus:border-[#C58A2B] focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#3A0D0D] mb-2">{t('form.password')}</label>
              <input name="password" type="password" value={form.password} onChange={handleChange} required
                className="w-full px-4 py-3 rounded-xl border-2 border-[#F4E8D8] focus:border-[#C58A2B] focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#3A0D0D] mb-2">{t('form.confirmPassword')}</label>
              <input name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} required
                className="w-full px-4 py-3 rounded-xl border-2 border-[#F4E8D8] focus:border-[#C58A2B] focus:outline-none" />
            </div>
            <button type="submit"
              className="w-full py-4 bg-[#C58A2B] hover:bg-[#E0B15C] text-[#3A0D0D] font-bold rounded-xl transition-colors">
              {t('auth.createAccount')}
            </button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  )
}
