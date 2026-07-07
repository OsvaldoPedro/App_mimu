import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { categories } from '../data/categories'
import AngolaLocationSelect from '../components/AngolaLocationSelect' // new location picker
import WeeklyScheduler from '../components/WeeklyScheduler'
import { enforceNumeric, enforceAlphaText, enforceAlphanumericText } from '../utils/validation'

const IMAGE_KEY = { cliente: 'photo', empresa: 'logo', prestador: 'photo' }
const IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp'

function getInitialForm(user) {
  if (!user) return {}
  const base = {
    name: user.name ?? '',
    phone: user.phone ?? '',
    province: user.province ?? '',
    city: user.city ?? '',
    description: user.description ?? '',
    companyName: user.companyName ?? '',
    hours: user.hours ?? '',
    categoryId: user.categoryId ?? '',
    serviceTypes: Array.isArray(user.serviceTypes) ? user.serviceTypes : []
  }
  return base
}

export default function EditProfile({ onSuccess, className = '' }) {
  const { user, userType, updateProfile, changePassword } = useAuth()
  const [form, setForm] = useState(() => getInitialForm(user))
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  
  // Carousel States
  const [existingGallery, setExistingGallery] = useState(() => Array.isArray(user?.gallery_urls) ? user.gallery_urls : [])
  const [newGalleryFiles, setNewGalleryFiles] = useState([])
  const [newGalleryPreviews, setNewGalleryPreviews] = useState([])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [locationError, setLocationError] = useState('')
  const [success, setSuccess] = useState(false)

  // Security states
  const [sec_currentPassword, setSecCurrentPassword] = useState('')
  const [sec_newPassword, setSecNewPassword] = useState('')
  const [sec_confirmPassword, setSecConfirmPassword] = useState('')
  const [sec_error, setSecError] = useState('')
  const [sec_success, setSecSuccess] = useState(false)
  const [sec_loading, setSecLoading] = useState(false)

  useEffect(() => {
    setForm(getInitialForm(user))
  }, [user, userType])

  const imageKey = userType ? IMAGE_KEY[userType] : 'photo'
  const currentImageUrl = imagePreview ?? (imageKey === 'logo' ? user?.logo_url : user?.avatar_url)

  const handleChange = (e) => {
    let { name, value } = e.target

    if (name === 'phone') value = enforceNumeric(value).substring(0, 9)
    if (name === 'name') value = enforceAlphaText(value)
    if (name === 'companyName') value = enforceAlphanumericText(value)

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

  // --- Gallery Handlers ---
  const handleGalleryChange = (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return
    
    const validFiles = files.filter(f => f.type.startsWith('image/'))
    if (validFiles.length !== files.length) {
      setError('Apenas imagens são permitidas no carrossel.')
    }
    
    setNewGalleryFiles(prev => [...prev, ...validFiles])
    
    const previews = validFiles.map(f => URL.createObjectURL(f))
    setNewGalleryPreviews(prev => [...prev, ...previews])
  }

  const removeExistingGalleryImage = (urlToRemove) => {
    setExistingGallery(prev => prev.filter(url => url !== urlToRemove))
  }

  const removeNewGalleryImage = (index) => {
    setNewGalleryFiles(prev => prev.filter((_, i) => i !== index))
    setNewGalleryPreviews(prev => {
      const p = prev[index];
      if (p) URL.revokeObjectURL(p);
      return prev.filter((_, i) => i !== index);
    })
  }

  const buildPayload = () => {
    const payload = { ...form }
    if (userType === 'empresa') {
      payload.companyName = form.companyName
      payload.description = form.description
      payload.serviceTypes = form.serviceTypes
      payload.province = form.province
      payload.city = form.city
      payload.hours = form.hours
    }
    if (userType === 'prestador') {
      payload.province = form.province
      payload.city = form.city
      payload.hours = form.hours
      payload.serviceTypes = form.serviceTypes
    }
    if (imageFile) payload[imageKey] = imageFile
    else if (form[imageKey] === '' || form[imageKey] === null) payload[imageKey] = ''
    
    // Add Gallery arrays
    if (userType === 'empresa' || userType === 'prestador') {
      payload.existingGallery = existingGallery;
      payload.newGalleryFiles = newGalleryFiles;
    }

    return payload
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setLoading(true)

    if ((userType === 'empresa' || userType === 'prestador') && (!form.province || !form.city)) {
      setError('Selecciona província e município')
      setLoading(false)
      return
    }

    try {
      const payload = buildPayload()
      // Send the payload straight into context, no FormData
      const result = await updateProfile(payload)

      if (result.success) {
        setSuccess(true)
        setImageFile(null)
        if (imagePreview) URL.revokeObjectURL(imagePreview)
        setImagePreview(null)
        
        // Reset gallery additions to became existing
        setNewGalleryFiles([])
        setNewGalleryPreviews([])
        if (result.user?.gallery_urls) {
           setExistingGallery(result.user.gallery_urls)
        }

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


  const toggleService = (s) => {
    setForm((f) => ({
      ...f,
      serviceTypes: f.serviceTypes.includes(s)
        ? f.serviceTypes.filter((x) => x !== s)
        : [...f.serviceTypes, s]
    }))
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

  if (!user || !userType) {
    return (
      <p className="text-mimu-wine-light-text dark:text-gray-300/80">Inicia sessão para editar o perfil.</p>
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
          <label className="block text-sm font-medium text-mimu-wine-text dark:text-white mb-2">
            {userType === 'empresa' ? 'Logótipo' : 'Foto'}
          </label>
          <div className="flex flex-wrap items-start gap-4">
            <div className="w-24 h-24 rounded-xl bg-mimu-cream dark:bg-[#121212] flex items-center justify-center overflow-hidden border-2 border-mimu-cream-border dark:border-[#2A2A2A]">
              {currentImageUrl ? (
                <img
                  src={typeof currentImageUrl === 'string' ? currentImageUrl : imagePreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xl md:text-2xl md:text-3xl text-mimu-gold">
                  {userType === 'empresa' ? '🏢' : '👤'}
                </span>
              )}
            </div>
            <div className="flex flex-col gap-2 min-w-0 flex-1">
              <input
                type="file"
                accept={IMAGE_ACCEPT}
                onChange={handleImageChange}
                className="block w-full text-sm text-mimu-wine-light-text dark:text-gray-300/80 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-mimu-gold file:text-mimu-wine-text dark:text-white file:font-medium truncate"
              />
              {(imageFile || currentImageUrl) && (
                <button
                  type="button"
                  onClick={removeImage}
                  className="text-sm text-mimu-wine-light-text dark:text-gray-300/80 hover:text-red-600 min-h-[44px]"
                >
                  Remover imagem
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Galeria Carrossel (Apenas Empresa e Prestador) */}
        {(userType === 'empresa' || userType === 'prestador') && (
          <div className="pt-4 border-t border-mimu-cream-border dark:border-[#2A2A2A]">
            <label className="block text-sm font-medium text-mimu-wine-text dark:text-white mb-2">
              Galeria de Fotos (Carrossel)
            </label>
            <p className="text-xs text-mimu-wine-light-text dark:text-gray-300/60 mb-4">Adiciona fotos dos teus serviços ou espaço. Elas ficarão visíveis para todos os clientes.</p>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-4">
              {/* Existing Images */}
              {existingGallery.map((url, i) => (
                <div key={url} className="relative aspect-square rounded-xl overflow-hidden border-2 border-mimu-cream-border dark:border-[#2A2A2A] group">
                  <img src={url} alt={`Galeria ${i}`} className="w-full h-full object-cover" />
                  <button 
                    type="button"
                    onClick={() => removeExistingGalleryImage(url)}
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                  >
                     <span className="text-white bg-red-600 rounded-full p-1 border border-white">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                     </span>
                  </button>
                </div>
              ))}
              
              {/* Previews of new files */}
              {newGalleryPreviews.map((url, i) => (
                <div key={url} className="relative aspect-square rounded-xl overflow-hidden border-2 border-mimu-gold group">
                  <img src={url} alt={`Nova foto ${i}`} className="w-full h-full object-cover opacity-80" />
                  <button 
                    type="button"
                    onClick={() => removeNewGalleryImage(i)}
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                  >
                     <span className="text-white bg-red-600 rounded-full p-1 border border-white">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                     </span>
                  </button>
                </div>
              ))}
              
              {/* Add Button */}
              <label className="relative aspect-square rounded-xl border-2 border-dashed border-mimu-cream-border dark:border-[#2A2A2A] hover:border-mimu-gold flex flex-col items-center justify-center cursor-pointer bg-mimu-cream dark:bg-[#121212] transition-colors text-mimu-wine-light-text dark:text-gray-300/60 hover:text-mimu-gold">
                <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                </svg>
                <span className="text-[10px] font-semibold">Adicionar</span>
                <input 
                  type="file" 
                  multiple 
                  accept={IMAGE_ACCEPT} 
                  className="hidden" 
                  onChange={handleGalleryChange}
                />
              </label>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-mimu-wine-text dark:text-white mb-2">E-mail (Identificador principal)</label>
          <input
            type="email"
            value={user?.email || ''}
            disabled
            className="w-full px-4 py-3 rounded-xl border-2 border-mimu-cream-border dark:border-[#2A2A2A] bg-mimu-cream dark:bg-[#121212] text-mimu-wine-text dark:text-white opacity-70 cursor-not-allowed"
          />
        </div>

        {(userType === 'cliente' || userType === 'prestador') && (
          <div>
            <label className="block text-sm font-medium text-mimu-wine-text dark:text-white mb-2">Nome completo</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 rounded-xl border-2 border-mimu-cream-border dark:border-[#2A2A2A] focus:border-mimu-gold focus:outline-none focus:ring-2 focus:ring-mimu-gold focus:border-transparent"
            />
          </div>
        )}

        {userType === 'empresa' && (
          <div>
            <label className="block text-sm font-medium text-mimu-wine-text dark:text-white mb-2">Nome da empresa</label>
            <input
              name="companyName"
              value={form.companyName}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 rounded-xl border-2 border-mimu-cream-border dark:border-[#2A2A2A] focus:border-mimu-gold focus:outline-none focus:ring-2 focus:ring-mimu-gold focus:border-transparent"
            />
          </div>
        )}



        <div>
          <label className="block text-sm font-medium text-mimu-wine-text dark:text-white mb-2">Telefone (Opcional)</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-mimu-wine-light-text dark:text-gray-300/80 font-medium">+244</span>
            <input
              name="phone"
              type="tel"
              maxLength={9}
              value={form.phone}
              onChange={handleChange}
              className="w-full pl-14 pr-4 py-3 rounded-xl border-2 border-mimu-cream-border dark:border-[#2A2A2A] focus:border-mimu-gold focus:outline-none focus:ring-2 focus:ring-mimu-gold focus:border-transparent"
            />
          </div>
        </div>

        {(userType === 'empresa' || userType === 'prestador') && (
          <>
            <div>
              <AngolaLocationSelect
                province={form.province}
                city={form.city}
                onProvinceChange={v => { setForm(f => ({ ...f, province: v, city: '' })); setLocationError('') }}
                onCityChange={v => { setForm(f => ({ ...f, city: v })); setLocationError('') }}
                error={locationError}
              />
            </div>

          </>
        )}

        {(userType === 'prestador' || userType === 'empresa') && (
          <div className="pt-2 pb-2">
            <label className="block text-sm font-medium text-mimu-wine-text dark:text-white mb-2">Horário de Atendimento</label>
            <WeeklyScheduler 
              value={form.hours} 
              onChange={(val) => setForm(f => ({ ...f, hours: val }))} 
            />
          </div>
        )}

        {userType === 'empresa' && (
          <div>
            <label className="block text-sm font-medium text-mimu-wine-text dark:text-white mb-2">Descrição</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border-2 border-mimu-cream-border dark:border-[#2A2A2A] focus:border-mimu-gold focus:outline-none focus:ring-2 focus:ring-mimu-gold focus:border-transparent"
            />
          </div>
        )}

        {(userType === 'empresa' || userType === 'prestador') && (
          <>
            <div>
              <label className="block text-sm font-medium text-mimu-wine-text dark:text-white mb-2">Categoria</label>
              <select
                name="categoryId"
                value={form.categoryId}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border-2 border-mimu-cream-border dark:border-[#2A2A2A] focus:border-mimu-gold focus:outline-none"
              >
                <option value="">Escolher...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon && c.icon.length <= 3 ? c.icon + ' ' : ''}{c.name}
                  </option>
                ))}
              </select>
            </div>
            {category && (
              <div>
                <label className="block text-sm font-medium text-mimu-wine-text dark:text-white mb-2">Tipos de serviço</label>
                <div className="flex flex-wrap gap-2">
                  {category.services.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggleService(s)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border-2 ${form.serviceTypes.includes(s)
                        ? 'border-mimu-gold bg-mimu-gold/10 text-mimu-wine-text dark:text-white'
                        : 'border-mimu-cream-border dark:border-[#2A2A2A] text-mimu-wine-light-text dark:text-gray-300/80 hover:border-mimu-gold/50'
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
            className="w-full px-4 py-3 rounded-xl font-medium bg-mimu-gold text-mimu-wine-text dark:text-white hover:bg-[#b87d26] disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-md active:scale-95"
          >
            {loading ? 'A guardar...' : 'Guardar alterações'}
          </button>
        </div>
      </form>

      {/* Secção de segurança / alteração de palavra-passe */}
      <div className="mt-12 max-w-lg border-t-2 border-mimu-cream-border dark:border-[#2A2A2A] pt-8">
        <h3 className="text-xl font-bold text-mimu-wine-text dark:text-white mb-4">Segurança</h3>
        <form onSubmit={handleChangePassword} className="space-y-4">
          {sec_error && (
            <div className="p-3 bg-red-100 text-red-700 rounded-xl text-sm">
              {sec_error}
            </div>
          )}
          {sec_success && (
            <div className="p-3 bg-green-100 text-green-800 rounded-xl text-sm">
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
              className="w-full px-4 py-3 rounded-xl border-2 border-mimu-cream-border dark:border-[#2A2A2A] focus:border-mimu-gold focus:outline-none"
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
              className="w-full px-4 py-3 rounded-xl border-2 border-mimu-cream-border dark:border-[#2A2A2A] focus:border-mimu-gold focus:outline-none"
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
              className="w-full px-4 py-3 rounded-xl border-2 border-mimu-cream-border dark:border-[#2A2A2A] focus:border-mimu-gold focus:outline-none"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={sec_loading || !sec_currentPassword || !sec_newPassword || !sec_confirmPassword}
              className="w-full px-4 py-3 rounded-xl font-medium bg-mimu-cream dark:bg-[#121212] text-mimu-wine-light-text dark:text-gray-300 hover:bg-[#EBD5B7] disabled:opacity-60 disabled:cursor-not-allowed transition-colors transition-all duration-300 hover:shadow-md active:scale-95"
            >
              {sec_loading ? 'A alterar...' : 'Alterar Palavra-passe'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
