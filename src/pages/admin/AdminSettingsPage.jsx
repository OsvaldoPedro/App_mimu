import { useState, useEffect } from 'react'
import AdminSidebar from '../../components/AdminSidebar'
import { storage, KEYS } from '../../utils/storage'
import { useAuth } from '../../context/AuthContext'

export default function AdminSettingsPage() {
  const { user, updateProfile } = useAuth()
  const [name, setName] = useState(user?.name || '')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [photo, setPhoto] = useState(user?.photo || '')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    setMessage('')

    if (password && password !== confirmPassword) {
      setError('As senhas não coincidem.')
      return
    }

    // update storage and auth context
    const users = storage.get(KEYS.USERS, [])
    const updated = users.map(u => {
      if (u.id === user.id) {
        return {
          ...u,
          name,
          photo,
          ...(password ? { password } : {})
        }
      }
      return u
    })
    storage.set(KEYS.USERS, updated)
    updateProfile({ name, photo, ...(password ? { password } : {}) })
    setMessage('Perfil guardado')
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#F4E8D8]">
      <AdminSidebar />
      <div className="flex-1 p-4 sm:p-6 md:p-8 w-full md:max-w-md">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#3A0D0D] mb-6">Configurações</h1>
        {message && <div className="mb-4 p-3 bg-green-100 text-green-800 rounded text-sm">{message}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="p-3 bg-red-100 text-red-700 rounded mb-4 text-sm">{error}</div>}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-[#3A0D0D] mb-2">Nome</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-4 py-2 rounded border text-sm focus:outline-none focus:ring-2 focus:ring-[#C58A2B]" />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-[#3A0D0D] mb-2">Senha (deixe em branco para não alterar)</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-2 rounded border text-sm focus:outline-none focus:ring-2 focus:ring-[#C58A2B]" />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-[#3A0D0D] mb-2">Confirmar senha</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 rounded border text-sm focus:outline-none focus:ring-2 focus:ring-[#C58A2B]" />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-[#3A0D0D] mb-2">Foto de perfil</label>
            <input
              type="file"
              accept="image/*"
              onChange={e => {
                const file = e.target.files[0]
                if (file) {
                  const reader = new FileReader()
                  reader.onload = () => setPhoto(reader.result)
                  reader.readAsDataURL(file)
                }
              }}
              className="w-full text-sm"
            />
            {photo && <img src={photo} alt="preview" className="mt-3 w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover" />}
          </div>
          <button
            type="submit"
            className="w-full px-6 py-2 bg-[#C58A2B] text-[#3A0D0D] font-bold rounded hover:bg-[#b87d26] transition-colors text-sm sm:text-base"
          >Salvar</button>
        </form>
      </div>
    </div>
  )
}