import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { useCategories } from '../hooks/useCategories'
import { useLocations } from '../hooks/useLocations'
import AngolaLocationSelect from './AngolaLocationSelect'
import { enforceNumeric } from '../utils/validation'

const IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp'
const MAX_IMAGES = 2
const PRICE_TYPES = [
  { value: 'perNight', label: 'Por noite' },
  { value: 'perPerson', label: 'Por pessoa' },
  { value: 'perDay', label: 'Por dia' },
  { value: 'session', label: 'Por sessão' },
  { value: 'consultation', label: 'Por consulta' },
  { value: 'event', label: 'Por evento' },
  { value: 'service', label: 'Serviço único' }
]
const BOOKING_TYPES = [
  { value: 'standard', label: 'Pedido Normal (Produtos, Serviços simples)' },
  { value: 'accommodation', label: 'Alojamento / Estadias (Hotéis, Quartos)' },
  { value: 'appointment', label: 'Marcação por Hora (Clínicas, Barbearias)' },
  { value: 'table', label: 'Reserva de Mesa (Restaurantes, Bares)' },
  { value: 'event', label: 'Inscrição / Bilhete (Cursos, Eventos)' }
]

const defaultForm = {
  name: '',
  categoryId: '',
  serviceType: '',
  description: '',
  price: '',
  priceType: 'service',
  bookingType: 'standard',
  province: '',
  city: '',
  location: '', // Deprecated conceptually, but kept for fallback
  amenities: [],
  promocao_activa: false,
  desconto: '',
  preco_promocional: '',
  data_inicio_promocao: '',
  data_fim_promocao: '',
  novo_servico: false
}

function getInitialForm(initialService) {
  if (!initialService) return { ...defaultForm }

  const rawStart = initialService.data_inicio_promocao || initialService.data_promocao_inicio || ''
  const rawEnd = initialService.data_fim_promocao || initialService.data_promocao_fim || ''

  const formatDateTime = (isoString) => {
    if (!isoString) return ''
    try {
      const date = new Date(isoString)
      if (isNaN(date.getTime())) return ''
      const pad = (num) => String(num).padStart(2, '0')
      const yyyy = date.getFullYear()
      const mm = pad(date.getMonth() + 1)
      const dd = pad(date.getDate())
      const hh = pad(date.getHours())
      const min = pad(date.getMinutes())
      return `${yyyy}-${mm}-${dd}T${hh}:${min}`
    } catch {
      return ''
    }
  }

  return {
    name: initialService.name || '',
    categoryId: initialService.categoryId || '',
    serviceType: initialService.serviceType || '',
    description: initialService.description || '',
    price: initialService.price ?? '',
    priceType: initialService.priceType || 'service',
    bookingType: initialService.bookingType || 'standard',
    province: initialService.province_id || initialService.location?.split(',')[0]?.trim() || '',
    city: initialService.municipality_id || initialService.location?.split(',')[1]?.trim() || '',
    location: initialService.location || '',
    amenities: Array.isArray(initialService.amenities) ? initialService.amenities : [],
    promocao_activa: initialService.promocao_activa || false,
    desconto: initialService.desconto !== null && initialService.desconto !== undefined ? initialService.desconto : '',
    preco_promocional: initialService.preco_promocional !== null && initialService.preco_promocional !== undefined ? initialService.preco_promocional : '',
    data_inicio_promocao: formatDateTime(rawStart),
    data_fim_promocao: formatDateTime(rawEnd),
    novo_servico: initialService.novo_servico || initialService.novidade || false
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
  const { user } = useAuth()
  const canUploadImages = user?.status === 'active'
  const { t } = useTranslation()
  const { categories, loading: catsLoading } = useCategories()
  const { provinces, municipalities } = useLocations()
  
  const category = categories.find((c) => c.id === form.categoryId)
  const serviceTypes = category?.services || []

  useEffect(() => {
    setForm(getInitialForm(initialService))
    setExistingImages(initialService?.images ? [...initialService.images] : [])
  }, [initialService])

  const handleChange = (e) => {
    let { name, value } = e.target
    if (name === 'price') {
      value = enforceNumeric(value)
      setForm((f) => {
        const basePrice = parseFloat(value)
        const pct = parseFloat(f.desconto)
        let calculatedPromoPrice = f.preco_promocional
        if (!isNaN(basePrice) && !isNaN(pct) && pct >= 0 && pct <= 100) {
          calculatedPromoPrice = Math.round(basePrice * (1 - pct / 100))
        }
        return {
          ...f,
          price: value,
          preco_promocional: f.promocao_activa && f.desconto !== '' ? calculatedPromoPrice : f.preco_promocional
        }
      })
      setError('')
      return
    }

    setForm((f) => ({ ...f, [name]: value }))
    if (name === 'categoryId') setForm((f) => ({ ...f, serviceType: '' }))
    setError('')
  }

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    const valid = files.filter((f) => f.type.startsWith('image/'))
    if (valid.length !== files.length) setError('Apenas ficheiros de imagem (JPEG, PNG, WebP) são aceites.')
    // enforce max count
    const total = existingImages.length + imageFiles.length + valid.length
    if (total > MAX_IMAGES) {
      setError(t('service.maxImages', { count: MAX_IMAGES }))
      return
    }
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
      const images = [...existingImages, ...imageFiles]

      if (images.length === 0) {
        setError('Adicione pelo menos uma imagem.')
        setLoading(false)
        return
      }
      if (images.length > MAX_IMAGES) {
        setError(t('service.maxImages', { count: MAX_IMAGES }))
        setLoading(false)
        return
      }

      console.log('>>> [START] Service Creation Form validation passed for:', form.name);

      const selectedProv = provinces?.find(p => p.id === form.province)?.name || form.province
      const selectedCity = municipalities?.find(m => m.id === form.city)?.name || form.city
      const locationText = selectedCity && selectedProv ? `${selectedCity}, ${selectedProv}` : `${form.city}, ${form.province}`

      const payload = {
        name: form.name.trim(),
        categoryId: form.categoryId,
        serviceType: form.serviceType || null,
        description: form.description.trim(),
        price: Number(form.price) || 0,
        priceType: form.priceType,
        bookingType: form.bookingType,
        province: form.province,
        city: form.city,
        location: locationText, // Text-based location for fast UI reads
        images,
        amenities: form.amenities,
        promocao_activa: form.promocao_activa,
        desconto: form.promocao_activa && form.desconto !== '' ? parseInt(form.desconto) : null,
        preco_promocional: form.promocao_activa && form.preco_promocional !== '' ? parseFloat(form.preco_promocional) : null,
        data_inicio_promocao: form.promocao_activa && form.data_inicio_promocao !== '' ? new Date(form.data_inicio_promocao).toISOString() : null,
        data_fim_promocao: form.promocao_activa && form.data_fim_promocao !== '' ? new Date(form.data_fim_promocao).toISOString() : null,
        data_promocao_inicio: form.promocao_activa && form.data_inicio_promocao !== '' ? new Date(form.data_inicio_promocao).toISOString() : null,
        data_promocao_fim: form.promocao_activa && form.data_fim_promocao !== '' ? new Date(form.data_fim_promocao).toISOString() : null,
        novo_servico: form.novo_servico,
        novidade: form.novo_servico
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
      // Fix: Only validate serviceType if the category actually has serviceTypes.
      if (serviceTypes.length > 0 && !payload.serviceType) {
        setError(t('form.selectServiceType'))
        setLoading(false)
        return
      }
      if (payload.price < 0) {
        setError('Preço deve ser um número positivo.')
        setLoading(false)
        return
      }
      if (!payload.province || !payload.city) {
        setError('A localização do serviço (Província / Município) é obrigatória.')
        setLoading(false)
        return
      }
      if (form.promocao_activa) {
        if (!form.data_inicio_promocao || !form.data_fim_promocao) {
          setError('As datas de início e término são obrigatórias para activar a promoção.')
          setLoading(false)
          return
        }
        if (form.desconto === '' && form.preco_promocional === '') {
          setError('Defina um desconto ou preço promocional para a promoção ativa.')
          setLoading(false)
          return
        }
        if (new Date(form.data_inicio_promocao) >= new Date(form.data_fim_promocao)) {
          setError('A data de término da promoção deve ser posterior à data de início.')
          setLoading(false)
          return
        }
      }

      console.log('>>> [ACTION] Submitting payload via onSubmit...', payload);
      await onSubmit(payload)
      
      console.log('>>> [SUCCESS] onSubmit completed. Resetting form.');
      // Reset form fields back to default state upon successful submission
      setForm(getInitialForm(null))
      setImageFiles([])
      setImagePreviews([])
      setExistingImages([])
      setAmenityInput('')

    } catch (err) {
      console.error('>>> [ERROR] ServiceForm error caught:', err);
      setError(err.message || 'Erro ao guardar o serviço. Tente novamente.')
    } finally {
      console.log('>>> [FINALLY] Releasing loading state.');
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
        <label className="block text-sm font-medium text-mimu-wine-text dark:text-white mb-2">Nome do serviço *</label>
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          required
          placeholder="Ex: Hotel Miramar"
          className="w-full px-4 py-3 rounded-xl border-2 border-mimu-cream-border dark:border-[#2A2A2A] focus:border-mimu-gold focus:outline-none focus:ring-2 focus:ring-mimu-gold focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-mimu-wine-text dark:text-white mb-2">Categoria *</label>
        <select
          name="categoryId"
          value={form.categoryId}
          onChange={handleChange}
          required
          className="w-full px-4 py-3 rounded-xl border-2 border-mimu-cream-border dark:border-[#2A2A2A] focus:border-mimu-gold focus:outline-none bg-mimu-white dark:bg-[#1E1E1E]"
          disabled={catsLoading}
        >
          <option value="">{catsLoading ? 'A carregar...' : 'Escolher...'}</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
          ))}
        </select>
      </div>

      {serviceTypes.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-mimu-wine-text dark:text-white mb-2">{t('form.serviceType')} *</label>
          <select
            name="serviceType"
            value={form.serviceType}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 rounded-xl border-2 border-mimu-cream-border dark:border-[#2A2A2A] focus:border-mimu-gold focus:outline-none"
          >
            <option value="">Escolher...</option>
            {serviceTypes.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-mimu-wine-text dark:text-white mb-2">Descrição</label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          rows={4}
          placeholder="Descreva o serviço..."
          className="w-full px-4 py-3 rounded-xl border-2 border-mimu-cream-border dark:border-[#2A2A2A] focus:border-mimu-gold focus:outline-none focus:ring-2 focus:ring-mimu-gold focus:border-transparent"
        />
      </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-mimu-wine-text dark:text-white mb-2">{t('form.servicePrice')} *</label>
          <input
            name="price"
            type="number"
            min="0"
            step="1"
            value={form.price}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 rounded-xl border-2 border-mimu-cream-border dark:border-[#2A2A2A] focus:border-mimu-gold focus:outline-none focus:ring-2 focus:ring-mimu-gold focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-mimu-wine-text dark:text-white mb-2">Tipo de preço</label>
          <select
            name="priceType"
            value={form.priceType}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-xl border-2 border-mimu-cream-border dark:border-[#2A2A2A] focus:border-mimu-gold focus:outline-none"
          >
            {PRICE_TYPES.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-mimu-wine-text dark:text-white mb-2">Modelo de Reserva (Importante) *</label>
        <select
          name="bookingType"
          value={form.bookingType}
          onChange={handleChange}
          required
          className="w-full px-4 py-3 rounded-xl border-2 border-mimu-cream-border dark:border-[#2A2A2A] focus:border-mimu-gold focus:outline-none bg-mimu-white dark:bg-[#1E1E1E] font-medium text-mimu-wine-text dark:text-white"
        >
          {BOOKING_TYPES.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
        <p className="text-xs text-mimu-wine-light-text dark:text-gray-300 mt-1">Este campo decide que tipo de calendário ou formulário os clientes verão quando quiserem reservar.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-mimu-wine-text dark:text-white mb-2">Localização *</label>
        <AngolaLocationSelect
           province={form.province}
           city={form.city}
           onProvinceChange={v => setForm(f => ({ ...f, province: v, city: '' }))}
           onCityChange={v => setForm(f => ({ ...f, city: v }))}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-mimu-wine-text dark:text-white mb-2">Imagens {canUploadImages ? '*' : '(apenas após aprovação)'} </label>
        <div className="flex flex-wrap gap-4 items-start">
          {allPreviews.map((src, i) => (
            <div key={i} className="relative group">
              <div className="w-24 h-24 rounded-xl overflow-hidden border-2 border-mimu-cream-border dark:border-[#2A2A2A] bg-mimu-cream dark:bg-[#121212]">
                <img src={src} alt="" className="w-full h-full object-cover" />
              </div>
              <button
                type="button"
                onClick={() => (i < existingImages.length ? removeExistingImage(i) : removeImagePreview(i - existingImages.length))}
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-mimu-white-text text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ×
              </button>
            </div>
          ))}
          {canUploadImages ? (
            <label className="w-24 h-24 rounded-xl border-2 border-dashed border-mimu-gold flex items-center justify-center cursor-pointer hover:bg-mimu-cream dark:bg-[#121212]/50 text-mimu-gold text-xl md:text-2xl">
              +
              <input
                type="file"
                accept={IMAGE_ACCEPT}
                multiple
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
          ) : (
            <p className="text-sm text-mimu-wine-light-text dark:text-gray-300/60">{t('service.uploadOnlyAfterApproval')}</p>
          )}
        </div>
        <p className="text-sm text-mimu-wine-light-text dark:text-gray-300/70 mt-1">Pelo menos uma imagem (máx. 2). JPEG, PNG ou WebP.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-mimu-wine-text dark:text-white mb-2">Amenidades (opcional)</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {form.amenities.map((a) => (
            <span
              key={a}
              className="inline-flex items-center gap-1 px-3 py-1 bg-mimu-cream dark:bg-[#121212] rounded-lg text-sm"
            >
              {a}
              <button type="button" onClick={() => removeAmenity(a)} className="text-mimu-wine-light-text dark:text-gray-300/70 hover:text-red-600">
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
            className="flex-1 px-4 py-3 rounded-xl border-2 border-mimu-cream-border dark:border-[#2A2A2A] focus:border-mimu-gold focus:outline-none"
          />
          <button type="button" onClick={addAmenity} className="px-4 py-3 bg-mimu-cream dark:bg-[#121212] rounded-xl font-medium text-mimu-wine-text dark:text-white hover:bg-mimu-gold/20 transition-all duration-300 hover:shadow-md active:scale-95">
            Adicionar
          </button>
        </div>
      </div>

      {/* Promoções e Destaques */}
      <div className="pt-6 border-t border-mimu-cream-border dark:border-[#2A2A2A] space-y-6">
        <h3 className="text-lg font-bold text-mimu-wine-text dark:text-white flex items-center gap-2">
          🏷️ Promoções e Destaques
        </h3>

        {/* Novo Serviço Toggle */}
        <div className="bg-mimu-cream/35 dark:bg-[#1A1A1A]/40 border border-mimu-cream-border dark:border-[#2A2A2A] rounded-2xl p-4 transition-all duration-300">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <span className="text-sm font-bold text-mimu-wine-text dark:text-white block">
                Marcar como Novo Serviço
              </span>
              <span className="text-xs text-mimu-wine-light-text dark:text-gray-400 mt-1 block">
                O serviço aparecerá na aba "Novos Serviços" e no feed Geral do Descobrir.
              </span>
            </div>
            <div className="relative inline-flex items-center">
              <input
                type="checkbox"
                name="novo_servico"
                checked={form.novo_servico}
                onChange={(e) => setForm(f => ({ ...f, novo_servico: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-mimu-gold"></div>
            </div>
          </label>
        </div>

        {/* Promoção Activa Toggle */}
        <div className="bg-mimu-cream/35 dark:bg-[#1A1A1A]/40 border border-mimu-cream-border dark:border-[#2A2A2A] rounded-2xl p-4 transition-all duration-300">
          <label className="flex items-center justify-between cursor-pointer mb-2">
            <div>
              <span className="text-sm font-bold text-mimu-wine-text dark:text-white block">
                Activar Promoção
              </span>
              <span className="text-xs text-mimu-wine-light-text dark:text-gray-400 mt-1 block">
                Define um preço promocional especial para este serviço e destaca-o.
              </span>
            </div>
            <div className="relative inline-flex items-center">
              <input
                type="checkbox"
                name="promocao_activa"
                checked={form.promocao_activa}
                onChange={(e) => {
                  const active = e.target.checked
                  setForm(f => ({ 
                    ...f, 
                    promocao_activa: active,
                    desconto: active ? f.desconto : '',
                    preco_promocional: active ? f.preco_promocional : '',
                    data_inicio_promocao: active ? f.data_inicio_promocao : '',
                    data_fim_promocao: active ? f.data_fim_promocao : ''
                  }))
                }}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
            </div>
          </label>

          {/* Collapsible promotion fields */}
          {form.promocao_activa && (
            <div className="mt-4 pt-4 border-t border-mimu-cream-border dark:border-[#2A2A2A] space-y-4 animate-fade-in-slow">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-mimu-wine-text dark:text-gray-300 mb-1">
                    Percentagem de Desconto (%)
                  </label>
                  <input
                    type="number"
                    name="desconto"
                    min="0"
                    max="100"
                    value={form.desconto}
                    onChange={(e) => {
                      const val = e.target.value
                      setForm(f => {
                        const pct = parseFloat(val)
                        const basePrice = parseFloat(f.price)
                        let calculated = f.preco_promocional
                        if (!isNaN(pct) && pct >= 0 && pct <= 100 && !isNaN(basePrice)) {
                          calculated = Math.round(basePrice * (1 - pct / 100))
                        }
                        return {
                          ...f,
                          desconto: val,
                          preco_promocional: val === '' ? '' : calculated
                        }
                      })
                    }}
                    placeholder="Ex: 15"
                    className="w-full px-4 py-2.5 rounded-xl border border-mimu-cream-border dark:border-[#2A2A2A] bg-mimu-white dark:bg-[#1E1E1E] text-mimu-wine-text dark:text-white focus:outline-none focus:ring-1 focus:ring-mimu-gold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-mimu-wine-text dark:text-gray-300 mb-1">
                    Preço Promocional
                  </label>
                  <input
                    type="number"
                    name="preco_promocional"
                    min="0"
                    value={form.preco_promocional}
                    onChange={(e) => {
                      const val = e.target.value
                      setForm(f => {
                        const pPrice = parseFloat(val)
                        const basePrice = parseFloat(f.price)
                        let calculatedPct = f.desconto
                        if (!isNaN(pPrice) && pPrice >= 0 && !isNaN(basePrice) && basePrice > 0) {
                          calculatedPct = Math.max(0, Math.round(((basePrice - pPrice) / basePrice) * 100))
                        }
                        return {
                          ...f,
                          preco_promocional: val,
                          desconto: val === '' ? '' : calculatedPct
                        }
                      })
                    }}
                    placeholder="Preço com desconto"
                    className="w-full px-4 py-2.5 rounded-xl border border-mimu-cream-border dark:border-[#2A2A2A] bg-mimu-white dark:bg-[#1E1E1E] text-mimu-wine-text dark:text-white focus:outline-none focus:ring-1 focus:ring-mimu-gold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-mimu-wine-text dark:text-gray-300 mb-1">
                    Data de Começo da Promoção
                  </label>
                  <input
                    type="datetime-local"
                    name="data_inicio_promocao"
                    value={form.data_inicio_promocao}
                    onChange={(e) => setForm(f => ({ ...f, data_inicio_promocao: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-mimu-cream-border dark:border-[#2A2A2A] bg-mimu-white dark:bg-[#1E1E1E] text-mimu-wine-text dark:text-white focus:outline-none focus:ring-1 focus:ring-mimu-gold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-mimu-wine-text dark:text-gray-300 mb-1">
                    Data de Término da Promoção
                  </label>
                  <input
                    type="datetime-local"
                    name="data_fim_promocao"
                    value={form.data_fim_promocao}
                    onChange={(e) => setForm(f => ({ ...f, data_fim_promocao: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-mimu-cream-border dark:border-[#2A2A2A] bg-mimu-white dark:bg-[#1E1E1E] text-mimu-wine-text dark:text-white focus:outline-none focus:ring-1 focus:ring-mimu-gold"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-3 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 rounded-xl font-medium bg-mimu-gold text-mimu-wine-text dark:text-white hover:bg-[#b87d26] disabled:opacity-60 transition-all duration-300 hover:shadow-md active:scale-95"
        >
          {loading ? 'A guardar...' : submitLabel}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="px-6 py-3 rounded-xl font-medium border-2 border-mimu-cream-border dark:border-[#2A2A2A] text-mimu-wine-text dark:text-white hover:bg-mimu-cream dark:bg-[#121212] transition-all duration-300 hover:shadow-md active:scale-95">
            Cancelar
          </button>
        )}
      </div>
    </form>
  )
}
