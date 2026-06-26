import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { enforceAlphaText } from '../../utils/validation'

export default function AdminSettingsPage() {
  const { user, updateProfile, changePassword } = useAuth()
  const [name, setName] = useState(user?.name || '')
  const [photo, setPhoto] = useState(user?.photo || '')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  // Security states
  const [sec_currentPassword, setSecCurrentPassword] = useState('')
  const [sec_newPassword, setSecNewPassword] = useState('')
  const [sec_confirmPassword, setSecConfirmPassword] = useState('')
  const [sec_error, setSecError] = useState('')
  const [sec_success, setSecSuccess] = useState(false)
  const [sec_loading, setSecLoading] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    setMessage('')

    // update auth context and supabase

    updateProfile({ name, photo })
    setMessage('Perfil guardado')
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setSecError('')
    setSecSuccess(false)

    if (sec_newPassword.length < 6) {
      setSecError('A nova palavra-passe deve ter pelo menos 6 caracteres.')
      return
    }
    if (sec_newPassword !== sec_confirmPassword) {
      setSecError('A nova palavra-passe e a confirmação não coincidem.')
      return
    }

    setSecLoading(true)
    const result = await changePassword(user.email, sec_currentPassword, sec_newPassword)
    setSecLoading(false)

    if (result.success) {
      setSecSuccess(true)
      setSecCurrentPassword('')
      setSecNewPassword('')
      setSecConfirmPassword('')
    } else {
      setSecError(result.error)
    }
  }

  return (
    <div className="w-full md:max-w-md">
        <h1 className="text-xl md:text-2xl sm:text-3xl font-bold text-mimu-wine-text dark:text-white mb-6">Configurações</h1>
        {message && <div className="mb-4 p-3 bg-green-100 text-green-800 rounded text-sm">{message}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="p-3 bg-red-100 text-red-700 rounded mb-4 text-sm">{error}</div>}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-mimu-wine-text dark:text-white mb-2">Nome</label>
            <input
              value={name}
              onChange={e => setName(enforceAlphaText(e.target.value))}
              className="w-full px-4 py-2 rounded border text-sm focus:outline-none focus:ring-2 focus:ring-[#C58A2B]" />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-mimu-wine-text dark:text-white mb-2">Foto de perfil</label>
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
            className="w-full px-6 py-2 bg-mimu-gold text-mimu-wine-text dark:text-white font-bold rounded hover:bg-[#b87d26] transition-colors text-sm sm:text-base transition-all duration-300 hover:shadow-md active:scale-95 min-h-[44px]"
          >Salvar</button>
        </form>

        <div className="mt-12 max-w-lg border-t-2 border-mimu-cream-border dark:border-[#2A2A2A] pt-8">
          <h3 className="text-xl font-bold text-mimu-wine-text dark:text-white mb-4">Segurança (Alterar Palavra-passe)</h3>
          <form onSubmit={handleChangePassword} className="space-y-4">
            {sec_error && (
              <div className="p-3 bg-red-100 text-red-700 rounded text-sm sm:text-base">
                {sec_error}
              </div>
            )}
            {sec_success && (
              <div className="p-3 bg-green-100 text-green-800 rounded text-sm sm:text-base">
                Palavra-passe alterada com sucesso.
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-mimu-wine-text dark:text-white mb-2">
                Palavra-passe atual
              </label>
              <input
                type="password"
                value={sec_currentPassword}
                onChange={(e) => setSecCurrentPassword(e.target.value)}
                className="w-full px-4 py-2 rounded border text-sm focus:outline-none focus:ring-2 focus:ring-[#C58A2B]"
                placeholder="Insira a sua senha atual"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-mimu-wine-text dark:text-white mb-2">
                Nova palavra-passe
              </label>
              <input
                type="password"
                value={sec_newPassword}
                onChange={(e) => setSecNewPassword(e.target.value)}
                className="w-full px-4 py-2 rounded border text-sm focus:outline-none focus:ring-2 focus:ring-[#C58A2B]"
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-mimu-wine-text dark:text-white mb-2">
                Confirmar nova palavra-passe
              </label>
              <input
                type="password"
                value={sec_confirmPassword}
                onChange={(e) => setSecConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 rounded border text-sm focus:outline-none focus:ring-2 focus:ring-[#C58A2B]"
              />
            </div>

            <button
              type="submit"
              disabled={sec_loading || !sec_currentPassword || !sec_newPassword || !sec_confirmPassword}
              className="w-full px-6 py-2 bg-mimu-gray-200 text-mimu-text-dark dark:text-white font-bold rounded hover:bg-mimu-gray-200 transition-colors disabled:opacity-50 text-sm sm:text-base transition-all duration-300 hover:shadow-md active:scale-95 min-h-[44px]"
            >
              {sec_loading ? 'A alterar...' : 'Alterar'}
            </button>
          </form>
        </div>
    </div>
  )
}