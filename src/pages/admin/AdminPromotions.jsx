import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../config/supabaseClient'
import { toast } from 'react-hot-toast'
import OptimizedImage from '../../components/common/OptimizedImage'

function formatPrice(price, currency = 'AOA') {
  if (price === undefined || price === null) return '0 AOA'
  const formatted = new Intl.NumberFormat('pt-AO', { minimumFractionDigits: 0 }).format(price)
  return `${formatted} ${currency}`
}

export default function AdminPromotions() {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState('todos') // todos, promo, novidade
  const [selectedService, setSelectedService] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)

  // Edit Modal Form State
  const [discountPct, setDiscountPct] = useState('')
  const [promoPrice, setPromoPrice] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [saving, setSaving] = useState(false)

  // Load services with nested profiles
  const loadServices = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*, profiles(name, company_name, phone)')
        .order('created_at', { ascending: false })

      if (error) throw error

      if (data) {
        const mapped = data.map(s => ({
          ...s,
          provider_name: s.profiles?.company_name || s.profiles?.name || 'Desconhecido',
          provider_phone: s.profiles?.phone || 'N/A'
        }))
        setServices(mapped)
      }
    } catch (err) {
      console.error('Erro ao carregar serviços:', err)
      toast.error('Erro ao carregar serviços.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadServices()

    // Subscribe to real-time changes
    const subscription = supabase
      .channel('services_promotions_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'services' },
        () => {
          loadServices()
        }
      )
      .subscribe()

    return () => {
      subscription?.unsubscribe()
    }
  }, [loadServices])

  // Instant toggles
  const togglePromoActive = async (service) => {
    const nextState = !service.promocao_activa
    
    // If turning on, check if promo details or dates are missing, open modal instead
    const hasDates = (service.data_inicio_promocao || service.data_promocao_inicio) && 
                     (service.data_fim_promocao || service.data_promocao_fim)
    if (nextState && (!service.preco_promocional || !service.desconto || !hasDates)) {
      handleOpenEditModal(service)
      return
    }

    try {
      const { error } = await supabase
        .from('services')
        .update({ promocao_activa: nextState })
        .eq('id', service.id)

      if (error) throw error
      toast.success(nextState ? 'Promoção activada!' : 'Promoção desactivada!')
    } catch (err) {
      console.error('Erro ao atualizar promoção:', err)
      toast.error('Erro ao atualizar estado da promoção.')
    }
  }

  const toggleNovidade = async (service) => {
    const nextState = !(service.novo_servico || service.novidade)
    try {
      const { error } = await supabase
        .from('services')
        .update({ 
          novidade: nextState,
          novo_servico: nextState
        })
        .eq('id', service.id)

      if (error) throw error
      toast.success(nextState ? 'Marcado como Novo Serviço!' : 'Removido dos Novos Serviços!')
    } catch (err) {
      console.error('Erro ao atualizar novo serviço:', err)
      toast.error('Erro ao atualizar estado do Novo Serviço.')
    }
  }

  // Open modal and prepopulate
  const handleOpenEditModal = (service) => {
    setSelectedService(service)
    setDiscountPct(service.desconto !== null && service.desconto !== undefined ? service.desconto : '')
    setPromoPrice(service.preco_promocional !== null && service.preco_promocional !== undefined ? service.preco_promocional : '')
    
    // Format dates to YYYY-MM-DD
    const formatDateForInput = (dateStr) => {
      if (!dateStr) return ''
      return new Date(dateStr).toISOString().substring(0, 10)
    }
    setStartDate(formatDateForInput(service.data_inicio_promocao || service.data_promocao_inicio))
    setEndDate(formatDateForInput(service.data_fim_promocao || service.data_promocao_fim))
    
    setShowEditModal(true)
  }

  // Auto calculations on change
  const handleDiscountInputChange = (val) => {
    setDiscountPct(val)
    if (!selectedService) return
    const pct = parseFloat(val)
    if (!isNaN(pct) && pct >= 0 && pct <= 100) {
      const calculated = selectedService.price * (1 - pct / 100)
      setPromoPrice(Math.round(calculated))
    } else {
      setPromoPrice('')
    }
  }

  const handlePromoPriceInputChange = (val) => {
    setPromoPrice(val)
    if (!selectedService || !selectedService.price) return
    const pPrice = parseFloat(val)
    if (!isNaN(pPrice) && pPrice >= 0) {
      const calculatedPct = ((selectedService.price - pPrice) / selectedService.price) * 100
      setDiscountPct(Math.max(0, Math.round(calculatedPct)))
    } else {
      setDiscountPct('')
    }
  }

  // Save promotion settings
  const handleSavePromotion = async (e) => {
    e.preventDefault()
    if (!selectedService) return

    setSaving(true)
    try {
      const discountVal = discountPct !== '' ? parseInt(discountPct) : null
      const promoPriceVal = promoPrice !== '' ? parseFloat(promoPrice) : null
      const startVal = startDate !== '' ? new Date(startDate).toISOString() : null
      const endVal = endDate !== '' ? new Date(endDate).toISOString() : null

      // Enforce start and end dates when a promotion is active/being activated
      if ((promoPriceVal !== null || discountVal !== null) && (!startVal || !endVal)) {
        toast.error('As datas de início e término são obrigatórias para activar a promoção.')
        setSaving(false)
        return
      }

      if (startVal && endVal && new Date(startVal) >= new Date(endVal)) {
        toast.error('A data de término deve ser posterior à data de início.')
        setSaving(false)
        return
      }

      const updateData = {
        desconto: discountVal,
        preco_promocional: promoPriceVal,
        data_promocao_inicio: startVal,
        data_promocao_fim: endVal,
        data_inicio_promocao: startVal,
        data_fim_promocao: endVal,
        // Automatically activate if values and dates are configured
        promocao_activa: promoPriceVal !== null && startVal !== null && endVal !== null
      }

      const { error } = await supabase
        .from('services')
        .update(updateData)
        .eq('id', selectedService.id)

      if (error) throw error

      toast.success('Configurações de promoção guardadas!')
      setShowEditModal(false)
      setSelectedService(null)
    } catch (err) {
      console.error('Erro ao guardar promoção:', err)
      toast.error('Erro ao guardar promoção.')
    } finally {
      setSaving(false)
    }
  }

  // Clear promotion details
  const handleClearPromotion = async () => {
    if (!selectedService) return
    if (!window.confirm('Tens a certeza que queres limpar todos os dados promocionais deste serviço?')) return

    setSaving(true)
    try {
      const updateData = {
        desconto: null,
        preco_promocional: null,
        data_promocao_inicio: null,
        data_promocao_fim: null,
        data_inicio_promocao: null,
        data_fim_promocao: null,
        promocao_activa: false
      }

      const { error } = await supabase
        .from('services')
        .update(updateData)
        .eq('id', selectedService.id)

      if (error) throw error

      toast.success('Dados promocionais limpos!')
      setShowEditModal(false)
      setSelectedService(null)
    } catch (err) {
      console.error('Erro ao limpar promoção:', err)
      toast.error('Erro ao limpar promoção.')
    } finally {
      setSaving(false)
    }
  }

  // Filters logic
  const filteredServices = services.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.provider_name.toLowerCase().includes(searchTerm.toLowerCase())
    
    if (!matchesSearch) return false
    
    if (filter === 'promo') return s.promocao_activa
    if (filter === 'novidade') return s.novo_servico || s.novidade
    return true
  })

  // Quick statistics
  const totalPromos = services.filter(s => s.promocao_activa).length
  const totalNovidades = services.filter(s => s.novo_servico || s.novidade).length

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6">
      
      {/* Upper stats widgets / Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-mimu-wine-text dark:text-white tracking-tight">
            Gestão de Promoções e Novos Serviços
          </h1>
          <p className="text-sm text-mimu-text-muted mt-1">
            Gere descontos, campanhas promocionais com prazos definidos e destaque novos serviços na página de descoberta.
          </p>
        </div>

        {/* Small stats badges */}
        <div className="flex gap-3">
          <div className="bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-300 px-4 py-2 rounded-2xl border border-red-500/20 flex flex-col items-center min-w-[100px]">
            <span className="text-xl font-black">{totalPromos}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider">Promoções</span>
          </div>
          <div className="bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300 px-4 py-2 rounded-2xl border border-blue-500/20 flex flex-col items-center min-w-[100px]">
            <span className="text-xl font-black">{totalNovidades}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider">Novos Serviços</span>
          </div>
        </div>
      </div>

      {/* Filter and search bar controls */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
            🔍
          </span>
          <input
            type="text"
            placeholder="Pesquisar por serviço ou prestador..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-mimu-cream-border dark:border-[#2A2A2A] bg-mimu-white dark:bg-[#1E1E1E] text-mimu-wine-text dark:text-white focus:outline-none focus:ring-1 focus:ring-mimu-gold"
          />
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('todos')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${
              filter === 'todos'
                ? 'bg-mimu-wine text-white dark:bg-mimu-gold dark:text-mimu-wine-text shadow-sm'
                : 'bg-mimu-white dark:bg-[#1E1E1E] border border-mimu-cream-border dark:border-[#2A2A2A] text-mimu-wine-text dark:text-white hover:bg-mimu-gray-50'
            }`}
          >
            Todos ({services.length})
          </button>
          <button
            onClick={() => setFilter('promo')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${
              filter === 'promo'
                ? 'bg-red-600 text-white shadow-sm'
                : 'bg-mimu-white dark:bg-[#1E1E1E] border border-mimu-cream-border dark:border-[#2A2A2A] text-mimu-wine-text dark:text-white hover:bg-mimu-gray-50'
            }`}
          >
            Promoções ({totalPromos})
          </button>
          <button
            onClick={() => setFilter('novidade')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${
              filter === 'novidade'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-mimu-white dark:bg-[#1E1E1E] border border-mimu-cream-border dark:border-[#2A2A2A] text-mimu-wine-text dark:text-white hover:bg-mimu-gray-50'
            }`}
          >
            Novos Serviços ({totalNovidades})
          </button>
        </div>
      </div>

      {/* Services Table and Lists */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-mimu-gold"></div>
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="bg-mimu-white dark:bg-[#1E1E1E] border border-mimu-cream-border dark:border-[#2A2A2A] p-12 rounded-3xl text-center shadow-inner">
          <p className="text-lg text-mimu-text-muted">Nenhum serviço encontrado.</p>
        </div>
      ) : (
        <div className="bg-mimu-white dark:bg-[#1E1E1E] rounded-3xl shadow-sm border border-mimu-cream-border dark:border-[#2A2A2A] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead className="bg-mimu-gray-100 dark:bg-[#121212] border-b border-mimu-cream-border dark:border-[#2A2A2A] text-mimu-wine-text dark:text-white">
                <tr>
                  <th className="p-4 md:p-5 font-bold tracking-wide">Serviço</th>
                  <th className="p-4 md:p-5 font-bold tracking-wide">Prestador</th>
                  <th className="p-4 md:p-5 font-bold tracking-wide">Promoção</th>
                  <th className="p-4 md:p-5 font-bold tracking-wide">Novo Serviço</th>
                  <th className="p-4 md:p-5 font-bold tracking-wide text-right">Acções</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-mimu-cream-border dark:divide-[#2A2A2A]">
                {filteredServices.map(service => {
                  const hasPromo = service.promocao_activa
                  const isNew = service.novo_servico || service.novidade

                  return (
                    <tr key={service.id} className="hover:bg-mimu-gray-50 dark:hover:bg-[#1A1A1A] transition duration-200">
                      {/* Service Info */}
                      <td className="p-4 md:p-5">
                        <div className="flex items-center gap-3">
                          <div className="shrink-0 w-12 h-12 rounded-xl overflow-hidden relative border border-mimu-cream-border dark:border-[#2A2A2A] bg-mimu-gray-100">
                            <OptimizedImage
                              src={service.images && service.images.length > 0 ? service.images[0] : 'https://via.placeholder.com/150'}
                              alt={service.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <div className="font-extrabold text-mimu-wine-text dark:text-white text-base leading-snug">
                              {service.name}
                            </div>
                            <div className="text-xs text-mimu-text-muted mt-0.5">
                              Preço Base: {formatPrice(service.price, service.currency)}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Provider Info */}
                      <td className="p-4 md:p-5 text-mimu-wine-text dark:text-gray-300">
                        <div className="font-semibold">{service.provider_name}</div>
                        <div className="text-xs text-mimu-text-muted mt-0.5">{service.provider_phone}</div>
                      </td>

                      {/* Promo Status & Toggle */}
                      <td className="p-4 md:p-5">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-3">
                            {/* Toggle switch styled cleanly */}
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={hasPromo}
                                onChange={() => togglePromoActive(service)}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                            </label>
                            <span className={`text-xs font-bold uppercase tracking-wider ${hasPromo ? 'text-red-500' : 'text-mimu-text-muted'}`}>
                              {hasPromo ? 'Activo' : 'Inactivo'}
                            </span>
                          </div>

                          {hasPromo && service.preco_promocional && (
                            <div className="text-xs bg-red-500/5 dark:bg-red-500/10 border border-red-500/10 p-2 rounded-xl text-red-600 dark:text-red-300 inline-block max-w-[200px]">
                              <div className="font-black">
                                {formatPrice(service.preco_promocional, service.currency)} (-{service.desconto}%)
                              </div>
                              {service.data_promocao_fim && (
                                <div className="text-[10px] text-red-500/80 dark:text-red-400/80 mt-0.5">
                                  Até {new Date(service.data_promocao_fim).toLocaleDateString('pt-AO')}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Novidade Status & Toggle */}
                      <td className="p-4 md:p-5">
                        <div className="flex items-center gap-3">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isNew}
                              onChange={() => toggleNovidade(service)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                          <span className={`text-xs font-bold uppercase tracking-wider ${isNew ? 'text-blue-500' : 'text-mimu-text-muted'}`}>
                            {isNew ? 'Novo' : 'Não'}
                          </span>
                        </div>
                      </td>

                      {/* Action Buttons */}
                      <td className="p-4 md:p-5 text-right">
                        <button
                          onClick={() => handleOpenEditModal(service)}
                          className="px-3.5 py-1.5 bg-mimu-gold hover:bg-mimu-gold-hover text-mimu-wine-text dark:text-white text-xs font-black rounded-xl transition duration-200 shadow-sm cursor-pointer"
                        >
                          Configurar Promoção
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Modal (Glassmorphism inspired dark overlay) */}
      {showEditModal && selectedService && (
        <div className="fixed inset-0 bg-black/65 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in-slow">
          <div className="bg-mimu-white dark:bg-[#1E1E1E] border border-mimu-cream-border dark:border-[#2A2A2A] p-6 md:p-8 rounded-3xl max-w-md w-full shadow-2xl relative">
            <button
              onClick={() => {
                setShowEditModal(false)
                setSelectedService(null)
              }}
              className="absolute top-4 right-4 text-mimu-text-muted hover:text-mimu-wine-text dark:hover:text-white text-lg font-bold min-h-[44px] px-2"
            >
              ✕
            </button>

            <h2 className="text-xl font-extrabold text-mimu-wine-text dark:text-white mb-2">
              Configurar Promoção
            </h2>
            <p className="text-xs text-mimu-text-muted mb-6">
              Serviço: <span className="font-bold text-mimu-wine-text dark:text-white">{selectedService.name}</span>
            </p>

            <form onSubmit={handleSavePromotion} className="space-y-4">
              {/* Base Price Display */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-mimu-text-muted mb-1">
                  Preço Base
                </label>
                <div className="w-full px-4 py-2.5 rounded-xl border border-mimu-cream-border dark:border-[#2A2A2A] bg-mimu-gray-100 dark:bg-[#121212] text-mimu-wine-text dark:text-gray-400 font-bold">
                  {formatPrice(selectedService.price, selectedService.currency)}
                </div>
              </div>

              {/* Discount and Promo Price Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-mimu-text-muted mb-1">
                    Desconto (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={discountPct}
                    onChange={(e) => handleDiscountInputChange(e.target.value)}
                    placeholder="Ex: 15"
                    className="w-full px-4 py-2.5 rounded-xl border border-mimu-cream-border dark:border-[#2A2A2A] bg-mimu-white dark:bg-[#1E1E1E] text-mimu-wine-text dark:text-white focus:outline-none focus:ring-1 focus:ring-mimu-gold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-mimu-text-muted mb-1">
                    Preço Promocional
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={promoPrice}
                    onChange={(e) => handlePromoPriceInputChange(e.target.value)}
                    placeholder="Preço final"
                    className="w-full px-4 py-2.5 rounded-xl border border-mimu-cream-border dark:border-[#2A2A2A] bg-mimu-white dark:bg-[#1E1E1E] text-mimu-wine-text dark:text-white focus:outline-none focus:ring-1 focus:ring-mimu-gold"
                  />
                </div>
              </div>

              {/* Date Inputs */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-mimu-text-muted mb-1">
                  Data de Início
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-mimu-cream-border dark:border-[#2A2A2A] bg-mimu-white dark:bg-[#1E1E1E] text-mimu-wine-text dark:text-white focus:outline-none focus:ring-1 focus:ring-mimu-gold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-mimu-text-muted mb-1">
                  Data de Fim
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-mimu-cream-border dark:border-[#2A2A2A] bg-mimu-white dark:bg-[#1E1E1E] text-mimu-wine-text dark:text-white focus:outline-none focus:ring-1 focus:ring-mimu-gold"
                />
              </div>

              {/* Form Buttons */}
              <div className="flex flex-col gap-2 pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-3 bg-mimu-gold hover:bg-mimu-gold-hover text-mimu-wine-text dark:text-white font-extrabold rounded-xl transition duration-200 shadow-md active:scale-98 disabled:opacity-50 min-h-[44px]"
                >
                  {saving ? 'A guardar...' : 'Guardar Alterações'}
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleClearPromotion}
                    disabled={saving}
                    className="flex-1 py-2.5 bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 font-bold rounded-xl transition duration-200 disabled:opacity-50 min-h-[44px]"
                  >
                    Limpar Promoção
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false)
                      setSelectedService(null)
                    }}
                    className="flex-1 py-2.5 bg-mimu-gray-100 dark:bg-gray-800 text-mimu-wine-text dark:text-white border border-mimu-cream-border dark:border-[#2A2A2A] hover:bg-mimu-gray-200 font-bold rounded-xl transition duration-200 min-h-[44px]"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
