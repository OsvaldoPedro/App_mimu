import { useState, useEffect } from 'react'
import { categories } from '../data/categories'

const IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp'
const PRICE_TYPES = [
  { value: 'perNight', label: 'Por noite' },
  { value: 'perPerson', label: 'Por pessoa' },
  { value: 'perDay', label: 'Por dia' },
  { value: 'session', label: 'Por sessão' },
  { value: 'consultation', label: 'Por consulta' },
  { value: 'event', label: 'Por evento' },
  { value: 'service', label: 'Serviço único' }
]

const defaultForm = {
  name: '',
  categoryId: '',
  serviceType: '',
  description: '',
  price: '',
  priceType: 'service',
  location: '',
  amenities: []
}

function getInitialForm(initialService) {
  if (!initialService) return { ...defaultForm }
  return {
    name: initialService.name || '',
    categoryId: initialService.categoryId || '',
    serviceType: initialService.serviceType || '',
    description: initialService.description || '',
    price: initialService.price ?? '',
    priceType: initialService.priceType || 'service',
    location: initialService.location || '',
    amenities: Array.isArray(initialService.amenities) ? initialService.amenities : []
  }
}

export default function ServiceForm({ initialService, onSubmit, submitLabel = 'Guardar', onCancel }) {
  const [form, setForm] = useState(() => getInitialForm(initialService))
  const [imageFiles, setImageFiles] = useState([])
  const [imagePreviews, setImagePreviews] = useState([])
  const [existingImages, setExistingImages] = useState(initialService?.images ? [...initialService.images] : [])
  const [amenityInput, setAmenityInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const category = categories.find((c) => c.id === form.categoryId)
  const serviceTypes = category?.services || []

  useEffect(() => {
    setForm(getInitialForm(initialService))
    setExistingImages(initialService?.images ? [...initialService.images] : [])
  }, [initialService])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
    if (name === 'categoryId') setForm((f) => ({ ...f, serviceType: '' }))
    setError('')
  }

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    const valid = files.filter((f) => f.type.startsWith('image/'))
    if (valid.length !== files.length) setError('Apenas ficheiros de imagem (JPEG, PNG, WebP) são aceites.')
    setImageFiles((prev) => [...prev, ...valid])
    setImagePreviews((prev) => [...prev, ...valid.map((f) => URL.createObjectURL(f))])
  }

  const removeImagePreview = (index) => {
    setImagePreviews((prev) => {
      const next = [...prev]
      URL.revokeObjectURL(next[index])
      next.splice(index, 1)
      return next
    })
    setImageFiles((prev) => {
      const next = [...prev]
      next.splice(index, 1)
      return next
    })
  }

  const removeExistingImage = (index) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index))
  }

  const addAmenity = () => {
    const value = amenityInput.trim()
    if (!value || form.amenities.includes(value)) return
    setForm((f) => ({ ...f, amenities: [...f.amenities, value] }))
    setAmenityInput('')
  }

  const removeAmenity = (value) => {
    setForm((f) => ({ ...f, amenities: f.amenities.filter((a) => a !== value) }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const images = [...existingImages]
      for (const file of imageFiles) {
        const dataUrl = await new Promise((resolve) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result)
          reader.readAsDataURL(file)
        })
        images.push(dataUrl)
      }

      if (images.length === 0) {
        setError('Adicione pelo menos uma imagem.')
        setLoading(false)
        return
      }

      const payload = {
        name: form.name.trim(),
        categoryId: form.categoryId,
        serviceType: form.serviceType || null,
        description: form.description.trim(),
        price: Number(form.price) || 0,
        priceType: form.priceType,
        location: form.location.trim(),
        images,
        amenities: form.amenities
      }

      if (!payload.name) {
        setError('Nome do serviço é obrigatório.')
        setLoading(false)
        return
      }
      if (!payload.categoryId) {
        setError('Seleccione uma categoria.')
        setLoading(false)
        return
      }
      if (payload.price < 0) {
        setError('Preço deve ser um número positivo.')
        setLoading(false)
        return
      }

      await onSubmit(payload)
    } catch (err) {
      setError(err.message || 'Erro ao guardar.')
    } finally {
      setLoading(false)
    }
  }

  const allPreviews = [...existingImages, ...imagePreviews]

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
      {error && (
        <div className="p-3 bg-red-100 text-red-700 rounded-xl text-sm">{error}</div>
      )}

      <div>
        <label className="block text-sm font-medium text-[#3A0D0D] mb-2">Nome do serviço *</label>
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          required
          placeholder="Ex: Hotel Miramar"
          className="w-full px-4 py-3 rounded-xl border-2 border-[#F4E8D8] focus:border-[#C58A2B] focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-[#3A0D0D] mb-2">Categoria *</label>
        <select
          name="categoryId"
          value={form.categoryId}
          onChange={handleChange}
          required
          className="w-full px-4 py-3 rounded-xl border-2 border-[#F4E8D8] focus:border-[#C58A2B] focus:outline-none"
        >
          <option value="">Escolher...</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
          ))}
        </select>
      </div>

      {serviceTypes.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-[#3A0D0D] mb-2">Subcategoria</label>
          <select
            name="serviceType"
            value={form.serviceType}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-xl border-2 border-[#F4E8D8] focus:border-[#C58A2B] focus:outline-none"
          >
            <option value="">Escolher...</option>
            {serviceTypes.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-[#3A0D0D] mb-2">Descrição</label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          rows={4}
          placeholder="Descreva o serviço..."
          className="w-full px-4 py-3 rounded-xl border-2 border-[#F4E8D8] focus:border-[#C58A2B] focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[#3A0D0D] mb-2">Preço (AOA) *</label>
          <input
            name="price"
            type="number"
            min="0"
            step="1"
            value={form.price}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 rounded-xl border-2 border-[#F4E8D8] focus:border-[#C58A2B] focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#3A0D0D] mb-2">Tipo de preço</label>
          <select
            name="priceType"
            value={form.priceType}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-xl border-2 border-[#F4E8D8] focus:border-[#C58A2B] focus:outline-none"
          >
            {PRICE_TYPES.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-[#3A0D0D] mb-2">Localização *</label>
        <input
          name="location"
          value={form.location}
          onChange={handleChange}
          required
          placeholder="Ex: Luanda, Angola"
          className="w-full px-4 py-3 rounded-xl border-2 border-[#F4E8D8] focus:border-[#C58A2B] focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-[#3A0D0D] mb-2">Imagens *</label>
        <div className="flex flex-wrap gap-4 items-start">
          {allPreviews.map((src, i) => (
            <div key={i} className="relative group">
              <div className="w-24 h-24 rounded-xl overflow-hidden border-2 border-[#F4E8D8] bg-[#F4E8D8]">
                <img src={src} alt="" className="w-full h-full object-cover" />
              </div>
              <button
                type="button"
                onClick={() => (i < existingImages.length ? removeExistingImage(i) : removeImagePreview(i - existingImages.length))}
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ×
              </button>
            </div>
          ))}
          <label className="w-24 h-24 rounded-xl border-2 border-dashed border-[#C58A2B] flex items-center justify-center cursor-pointer hover:bg-[#F4E8D8]/50 text-[#C58A2B] text-2xl">
            +
            <input
              type="file"
              accept={IMAGE_ACCEPT}
              multiple
              onChange={handleImageChange}
              className="hidden"
            />
          </label>
        </div>
        <p className="text-sm text-[#5C1A1A]/70 mt-1">Pelo menos uma imagem. JPEG, PNG ou WebP.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-[#3A0D0D] mb-2">Amenidades (opcional)</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {form.amenities.map((a) => (
            <span
              key={a}
              className="inline-flex items-center gap-1 px-3 py-1 bg-[#F4E8D8] rounded-lg text-sm"
            >
              {a}
              <button type="button" onClick={() => removeAmenity(a)} className="text-[#5C1A1A]/70 hover:text-red-600">
                ×
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={amenityInput}
            onChange={(e) => setAmenityInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAmenity())}
            placeholder="Ex: Wi-Fi, Piscina"
            className="flex-1 px-4 py-3 rounded-xl border-2 border-[#F4E8D8] focus:border-[#C58A2B] focus:outline-none"
          />
          <button type="button" onClick={addAmenity} className="px-4 py-3 bg-[#F4E8D8] rounded-xl font-medium text-[#3A0D0D] hover:bg-[#C58A2B]/20">
            Adicionar
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 rounded-xl font-medium bg-[#C58A2B] text-[#3A0D0D] hover:bg-[#b87d26] disabled:opacity-60"
        >
          {loading ? 'A guardar...' : submitLabel}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="px-6 py-3 rounded-xl font-medium border-2 border-[#F4E8D8] text-[#3A0D0D] hover:bg-[#F4E8D8]">
            Cancelar
          </button>
        )}
      </div>
    </form>
  )
}
