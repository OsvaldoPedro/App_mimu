import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { categories } from '../data/categories'
import { provinces } from '../data/provinces'

const IMAGE_KEY = { cliente: 'photo', empresa: 'logo', prestador: 'photo' }
const IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp'

function getInitialForm(user, userType) {
  if (!user) return {}
  const base = {
    name: user.name ?? '',
    email: user.email ?? '',
    phone: user.phone ?? '',
    address: user.address ?? '',
    province: user.province ?? '',
    description: user.description ?? '',
    companyName: user.companyName ?? '',
    basePrice: user.basePrice ?? '',
    hours: user.hours ?? '',
    categoryId: user.categoryId ?? '',
    serviceTypes: Array.isArray(user.serviceTypes) ? user.serviceTypes : []
  }
  return base
}

export default function EditProfile({ onSuccess, className = '' }) {
  const { user, userType, updateProfile, changePassword } = useAuth()
  const [form, setForm] = useState(() => getInitialForm(user, userType))
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [secCurrent, setSecCurrent] = useState('')
  const [secNew, setSecNew] = useState('')
  const [secConfirm, setSecConfirm] = useState('')
  const [secError, setSecError] = useState('')
  const [secSuccess, setSecSuccess] = useState(false)
  const [secLoading, setSecLoading] = useState(false)

  useEffect(() => {
    setForm(getInitialForm(user, userType))
  }, [user, userType])

  const imageKey = userType ? IMAGE_KEY[userType] : 'photo'
  const currentImageUrl = imagePreview ?? (imageKey === 'logo' ? user?.logo : user?.photo)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
    setError('')
  }

  const handleImageChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Selecciona um ficheiro de imagem (JPEG, PNG ou WebP).')
      return
    }
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    setError('')
  }

  const removeImage = () => {
    setImageFile(null)
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImagePreview(null)
    setForm((f) => ({ ...f, [imageKey]: '' }))
  }

  const buildPayload = () => {
    const payload = { ...form }
    if (userType === 'empresa') {
      payload.companyName = form.companyName
      payload.description = form.description
      payload.serviceTypes = form.serviceTypes
    }
    if (userType === 'prestador') {
      payload.province = form.province
      payload.basePrice = form.basePrice ? Number(form.basePrice) : null
      payload.hours = form.hours
      payload.serviceTypes = form.serviceTypes
    }
    if (imageFile) payload[imageKey] = imageFile
    else if (form[imageKey] === '' || form[imageKey] === null) payload[imageKey] = ''
    return payload
  }

  const buildFormData = (payload) => {
    const fd = new FormData()
    const skip = ['serviceTypes', 'password']
    Object.entries(payload).forEach(([key, value]) => {
      if (skip.includes(key) || value === undefined || value === null) return
      if (key === imageKey && value instanceof File) {
        fd.append(key, value)
        return
      }
      if (Array.isArray(value)) {
        fd.append(key, JSON.stringify(value))
        return
      }
      fd.append(key, String(value))
    })
    return fd
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setLoading(true)

    try {
      const payload = buildPayload()
      const hasImage = payload[imageKey] instanceof File
      const body = hasImage ? buildFormData(payload) : payload

      const result = await updateProfile(body)

      if (result.success) {
        setSuccess(true)
        setImageFile(null)
        if (imagePreview) URL.revokeObjectURL(imagePreview)
        setImagePreview(null)
        onSuccess?.(result.user)
      } else {
        setError(result.error || 'Erro ao actualizar perfil.')
      }
    } catch (err) {
      setError(err.message || 'Erro inesperado.')
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async () => {
    setSecError('')
    setSecSuccess(false)
    if (!secCurrent || !secNew || !secConfirm) {
      setSecError('Preenche todos os campos de palavra-passe.')
      return
    }
    if (secNew.length < 6) {
      setSecError('A nova palavra-passe deve ter pelo menos 6 caracteres.')
      return
    }
    if (secNew !== secConfirm) {
      setSecError('As palavras-passe não coincidem.')
      return
    }
    setSecLoading(true)
    try {
      const result = await changePassword(secCurrent, secNew)
      if (!result.success) {
        setSecError(result.error || 'Não foi possível alterar a palavra-passe.')
        return
      }
      setSecSuccess(true)
      setSecCurrent('')
      setSecNew('')
      setSecConfirm('')
    } catch (err) {
      setSecError(err.message || 'Erro inesperado.')
    } finally {
      setSecLoading(false)
    }
  }

  const toggleService = (s) => {
    setForm((f) => ({
      ...f,
      serviceTypes: f.serviceTypes.includes(s)
        ? f.serviceTypes.filter((x) => x !== s)
        : [...f.serviceTypes, s]
    }))
  }

  if (!user || !userType) {
    return (
      <p className="text-[#5C1A1A]/80">Inicia sessão para editar o perfil.</p>
    )
  }

  const category = categories.find((c) => c.id === form.categoryId)

  return (
    <div className={className}>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
        {error && (
          <div className="p-3 bg-red-100 text-red-700 rounded-xl text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="p-3 bg-green-100 text-green-800 rounded-xl text-sm">
            Perfil actualizado com sucesso.
          </div>
        )}

        {/* Upload de imagem + preview */}
        <div>
          <label className="block text-sm font-medium text-[#3A0D0D] mb-2">
            {userType === 'empresa' ? 'Logótipo' : 'Foto'}
          </label>
          <div className="flex flex-wrap items-start gap-4">
            <div className="w-24 h-24 rounded-xl bg-[#F4E8D8] flex items-center justify-center overflow-hidden border-2 border-[#F4E8D8]">
              {currentImageUrl ? (
                <img
                  src={typeof currentImageUrl === 'string' ? currentImageUrl : imagePreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-3xl text-[#C58A2B]">
                  {userType === 'empresa' ? '🏢' : '👤'}
                </span>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <input
                type="file"
                accept={IMAGE_ACCEPT}
                onChange={handleImageChange}
                className="block w-full text-sm text-[#5C1A1A]/80 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[#C58A2B] file:text-[#3A0D0D] file:font-medium"
              />
              {(imageFile || currentImageUrl) && (
                <button
                  type="button"
                  onClick={removeImage}
                  className="text-sm text-[#5C1A1A]/80 hover:text-red-600"
                >
                  Remover imagem
                </button>
              )}
            </div>
          </div>
        </div>

        {(userType === 'cliente' || userType === 'prestador') && (
          <div>
            <label className="block text-sm font-medium text-[#3A0D0D] mb-2">Nome completo</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 rounded-xl border-2 border-[#F4E8D8] focus:border-[#C58A2B] focus:outline-none"
            />
          </div>
        )}

        {userType === 'empresa' && (
          <div>
            <label className="block text-sm font-medium text-[#3A0D0D] mb-2">Nome da empresa</label>
            <input
              name="companyName"
              value={form.companyName}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 rounded-xl border-2 border-[#F4E8D8] focus:border-[#C58A2B] focus:outline-none"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-[#3A0D0D] mb-2">Email</label>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 rounded-xl border-2 border-[#F4E8D8] focus:border-[#C58A2B] focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#3A0D0D] mb-2">Telefone</label>
          <input
            name="phone"
            value={form.phone}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 rounded-xl border-2 border-[#F4E8D8] focus:border-[#C58A2B] focus:outline-none"
          />
        </div>

        {(userType === 'empresa' || userType === 'prestador') && (
          <div>
            <label className="block text-sm font-medium text-[#3A0D0D] mb-2">Morada</label>
            <input
              name="address"
              value={form.address}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border-2 border-[#F4E8D8] focus:border-[#C58A2B] focus:outline-none"
            />
          </div>
        )}

        {userType === 'prestador' && (
          <>
            <div>
              <label className="block text-sm font-medium text-[#3A0D0D] mb-2">Província</label>
              <select
                name="province"
                value={form.province}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border-2 border-[#F4E8D8] focus:border-[#C58A2B] focus:outline-none"
              >
                <option value="">Escolher...</option>
                {provinces.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#3A0D0D] mb-2">Preço base (AOA)</label>
              <input
                name="basePrice"
                type="number"
                min="0"
                value={form.basePrice}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border-2 border-[#F4E8D8] focus:border-[#C58A2B] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#3A0D0D] mb-2">Horários</label>
              <input
                name="hours"
                value={form.hours}
                onChange={handleChange}
                placeholder="ex: Seg–Sex 8h–18h"
                className="w-full px-4 py-3 rounded-xl border-2 border-[#F4E8D8] focus:border-[#C58A2B] focus:outline-none"
              />
            </div>
          </>
        )}

        {userType === 'empresa' && (
          <div>
            <label className="block text-sm font-medium text-[#3A0D0D] mb-2">Descrição</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border-2 border-[#F4E8D8] focus:border-[#C58A2B] focus:outline-none"
            />
          </div>
        )}

        {(userType === 'empresa' || userType === 'prestador') && (
          <>
            <div>
              <label className="block text-sm font-medium text-[#3A0D0D] mb-2">Categoria</label>
              <select
                name="categoryId"
                value={form.categoryId}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border-2 border-[#F4E8D8] focus:border-[#C58A2B] focus:outline-none"
              >
                <option value="">Escolher...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                ))}
              </select>
            </div>
            {category && (
              <div>
                <label className="block text-sm font-medium text-[#3A0D0D] mb-2">Tipos de serviço</label>
                <div className="flex flex-wrap gap-2">
                  {category.services.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggleService(s)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border-2 ${
                        form.serviceTypes.includes(s)
                          ? 'border-[#C58A2B] bg-[#C58A2B]/10 text-[#3A0D0D]'
                          : 'border-[#F4E8D8] text-[#5C1A1A]/80 hover:border-[#C58A2B]/50'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-3 rounded-xl font-medium bg-[#C58A2B] text-[#3A0D0D] hover:bg-[#b87d26] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'A guardar...' : 'Guardar alterações'}
          </button>
        </div>
      </form>
      {/* Secção de segurança / alteração de palavra-passe */}
      <div className="mt-8 pt-6 border-t border-[#F4E8D8] max-w-lg">
        <h2 className="text-lg font-bold text-[#3A0D0D] mb-2">Segurança</h2>
        <p className="text-sm text-[#5C1A1A]/80 mb-4">
          Altera a tua palavra-passe actual.
        </p>
        {secError && (
          <div className="p-3 bg-red-100 text-red-700 rounded-xl text-sm mb-3">
            {secError}
          </div>
        )}
        {secSuccess && (
          <div className="p-3 bg-green-100 text-green-800 rounded-xl text-sm mb-3">
            Senha alterada com sucesso.
          </div>
        )}
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-[#3A0D0D] mb-2">Senha actual</label>
            <input
              type="password"
              value={secCurrent}
              onChange={(e) => setSecCurrent(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-[#F4E8D8] focus:border-[#C58A2B] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#3A0D0D] mb-2">Nova senha</label>
            <input
              type="password"
              value={secNew}
              onChange={(e) => setSecNew(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-[#F4E8D8] focus:border-[#C58A2B] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#3A0D0D] mb-2">Confirmar nova senha</label>
            <input
              type="password"
              value={secConfirm}
              onChange={(e) => setSecConfirm(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-[#F4E8D8] focus:border-[#C58A2B] focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={handleChangePassword}
            disabled={secLoading}
            className="w-full px-4 py-3 rounded-xl font-medium border-2 border-[#C58A2B] text-[#C58A2B] hover:bg-[#C58A2B]/10 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {secLoading ? 'A alterar...' : 'Alterar senha'}
          </button>
        </div>
      </div>
    </div>
  )
}
