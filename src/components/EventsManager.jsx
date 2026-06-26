import React, { useState, useEffect } from 'react'
import { 
  useMyEvents, 
  createEvent, 
  deleteEvent, 
  updateEvent 
} from '../hooks/useEvents'
import AngolaLocationSelect from './AngolaLocationSelect'
import { fileToBase64 } from '../utils/fileHelpers'
import { useLocations } from '../hooks/useLocations'
import { useTheme } from '../context/ThemeContext'
import toast from 'react-hot-toast'
import { supabase } from '../config/supabaseClient'
import { 
  validateMKT360Ticket, 
  checkinMKT360Ticket, 
  blockMKT360Ticket, 
  unblockMKT360Ticket,
  createMKT360Event
} from '../hooks/useMKT360'

export default function EventsManager({ userId, role }) {
  const { myEvents, loading, reload } = useMyEvents(userId)
  const { provinces, municipalities } = useLocations()
  const { theme } = useTheme()
  
  // Abas do painel
  const [activeTab, setActiveTab] = useState('manager') // 'manager' | 'gate'

  // Portaria / Gate State
  const [ticketCode, setTicketCode] = useState('')
  const [selectedEventId, setSelectedEventId] = useState('')
  const [validationResult, setValidationResult] = useState(null)
  const [validating, setValidating] = useState(false)
  const [checkingIn, setCheckingIn] = useState(false)
  
  // Scanner State
  const [showScanner, setShowScanner] = useState(false)

  // Criar Evento Form State
  const [form, setForm] = useState({
    title: '',
    description: '',
    image_url: '',
    location: '',
    province: '',
    city: '',
    date: '',
    time: '',
    max_participants: '',
    price: '',
    activity_type: 'Evento',
    category: '',
    additional_info: '',
    mkt360_event_id: ''
  })
  
  // Edição Evento State
  const [editingEvent, setEditingEvent] = useState(null)
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    image_url: '',
    location: '',
    province: '',
    city: '',
    date: '',
    time: '',
    max_participants: '',
    price: '',
    activity_type: 'Evento',
    category: '',
    additional_info: '',
    mkt360_event_id: ''
  })

  const [publishing, setPublishing] = useState(false)
  const [error, setError] = useState('')
  const [editError, setEditError] = useState('')

  // Lotes de bilhetes para criação integrada
  const [ticketBatches, setTicketBatches] = useState([
    { name: 'Geral', price: '', quantity: '', description: 'Ingresso Geral' }
  ])

  const handleAddBatch = () => {
    setTicketBatches(prev => [...prev, { name: '', price: '', quantity: '', description: '' }])
  }

  const handleRemoveBatch = (index) => {
    if (ticketBatches.length <= 1) {
      toast.error('O evento precisa de ter pelo menos um lote de bilhetes.')
      return
    }
    setTicketBatches(prev => prev.filter((_, idx) => idx !== index))
  }

  const handleBatchChange = (index, field, value) => {
    setTicketBatches(prev => prev.map((batch, idx) => {
      if (idx === index) {
        return { ...batch, [field]: value }
      }
      return batch
    }))
  }

  // Participantes / Ticket Block & Unblock states
  const [selectedEventForParticipants, setSelectedEventForParticipants] = useState(null)
  const [participants, setParticipants] = useState([])
  const [loadingParticipants, setLoadingParticipants] = useState(false)
  const [blockingTicket, setBlockingTicket] = useState(null)
  const [unblockingTicket, setUnblockingTicket] = useState(null)
  const [blockReason, setBlockReason] = useState('')
  const [processingAction, setProcessingAction] = useState(false)

  const loadParticipants = async (event) => {
    setLoadingParticipants(true)
    try {
      if (!event || !event.mkt360_event_id) {
        setParticipants([])
        setLoadingParticipants(false)
        return
      }
      const { data, error: dbErr } = await supabase
        .from('tickets')
        .select('*, profiles:user_id(name, email)')
        .eq('event_id', event.mkt360_event_id)
        .order('created_at', { ascending: false })
      if (dbErr) throw dbErr
      setParticipants(data || [])
    } catch (err) {
      console.error('Erro ao carregar participantes:', err)
      toast.error('Erro ao carregar lista de participantes.')
    } finally {
      setLoadingParticipants(false)
    }
  }

  const handleBlockTicketSubmit = async (e) => {
    e.preventDefault()
    if (!blockReason.trim()) {
      toast.error('Por favor, informe o motivo do bloqueio.')
      return
    }

    setProcessingAction(true)
    const toastId = toast.loading('A bloquear o ticket...')
    try {
      const res = await blockMKT360Ticket(blockingTicket.id, blockReason)
      if (res.success) {
        toast.success('Ticket bloqueado com sucesso!', { id: toastId })
        setBlockingTicket(null)
        setBlockReason('')
        await loadParticipants(selectedEventForParticipants)
      } else {
        toast.error(`Erro: ${res.error}`, { id: toastId })
      }
    } catch {
      toast.error('Ocorreu um erro ao bloquear o ticket.', { id: toastId })
    } finally {
      setProcessingAction(false)
    }
  }

  const handleUnblockTicketConfirm = async () => {
    setProcessingAction(true)
    const toastId = toast.loading('A desbloquear o ticket...')
    try {
      const res = await unblockMKT360Ticket(unblockingTicket.id)
      if (res.success) {
        toast.success('Ticket desbloqueado com sucesso!', { id: toastId })
        setUnblockingTicket(null)
        await loadParticipants(selectedEventForParticipants)
      } else {
        toast.error(`Erro: ${res.error}`, { id: toastId })
      }
    } catch {
      toast.error('Ocorreu um erro ao desbloquear o ticket.', { id: toastId })
    } finally {
      setProcessingAction(false)
    }
  }

  const handleViewParticipants = async (event) => {
    setSelectedEventForParticipants(event)
    await loadParticipants(event)
  }

  // Efeito para carregar o scanner html5-qrcode dinamicamente a partir do CDN quando selecionado
  useEffect(() => {
    let html5QrcodeScanner = null

    if (activeTab === 'gate' && showScanner) {
      const scriptId = 'html5-qrcode-cdn-script'
      let script = document.getElementById(scriptId)

      const initScanner = () => {
        try {
          html5QrcodeScanner = new window.Html5QrcodeScanner(
            "qr-reader", 
            { fps: 10, qrbox: { width: 250, height: 250 } },
            false
          )
          html5QrcodeScanner.render((decodedText) => {
            setTicketCode(decodedText)
            setShowScanner(false)
            toast.success('QR Code escaneado com sucesso!')
            if (html5QrcodeScanner) {
              html5QrcodeScanner.clear()
            }
          }, () => {
            // Log de scanner omitido para evitar ruídos de logs
          })
        } catch (e) {
          console.error('Erro ao inicializar scanner:', e)
          toast.error('Não foi possível iniciar a câmara.')
        }
      }

      if (!script) {
        script = document.createElement('script')
        script.id = scriptId
        script.src = 'https://unpkg.com/html5-qrcode'
        script.async = true
        script.onload = initScanner
        document.body.appendChild(script)
      } else {
        initScanner()
      }
    }

    return () => {
      if (html5QrcodeScanner) {
        try {
          html5QrcodeScanner.clear()
        } catch {
          // ignore
        }
      }
    }
  }, [activeTab, showScanner])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
  }

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Apenas imagens são permitidas.')
      return
    }
    try {
      const base64 = await fileToBase64(file)
      setForm(f => ({ ...f, image_url: base64 }))
    } catch {
      setError('Erro ao processar imagem.')
    }
  }

  const handlePublish = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.title || !form.description || !form.location || !form.date || !form.time || !form.category) {
      setError('Por favor preenche todos os campos obrigatórios (incluindo Categoria).')
      return
    }

    // Validar lotes se forem preenchidos
    for (let i = 0; i < ticketBatches.length; i++) {
      const b = ticketBatches[i]
      if (!b.name || b.price === '' || b.quantity === '') {
        setError(`Por favor, preencha todos os campos obrigatórios (Nome, Preço e Qtd) do Lote #${i + 1}.`)
        return
      }
    }

    const eventDate = new Date(`${form.date}T${form.time}`)
    if (eventDate < new Date()) {
      setError('A data do evento não pode ser no passado.')
      return
    }

    setPublishing(true)

    const selectedProv = provinces?.find(p => p.id === form.province)?.name || form.province
    const selectedCity = municipalities?.find(m => m.id === form.city)?.name || form.city
    const locationText = selectedCity && selectedProv ? `${selectedCity}, ${selectedProv}` : (form.location || '')

    let finalMktEventId = form.mkt360_event_id ? parseInt(form.mkt360_event_id, 10) : null

    // Se o mkt360_event_id não estiver definido, criamos o evento na GoTicket primeiro!
    if (!finalMktEventId) {
      const ticketTypesPayload = ticketBatches.map(b => ({
        name: b.name,
        price: b.price === '0' || b.price === 0 || !b.price ? 'Grátis' : String(b.price),
        quantity: parseInt(b.quantity, 10),
        description: b.description || ''
      }))

      const mktRes = await createMKT360Event({
        title: form.title,
        description: form.description,
        location: locationText,
        date: eventDate.toISOString(),
        image_url: form.image_url || null,
        ticket_types: ticketTypesPayload
      })

      if (mktRes.success && mktRes.data?.event_id) {
        finalMktEventId = mktRes.data.event_id
        toast.success(`Evento criado com sucesso na GoTicket! (ID: ${finalMktEventId})`)
      } else {
        setError(mktRes.error || 'Erro ao sincronizar evento com a GoTicket.')
        setPublishing(false)
        return
      }
    }

    const payload = {
      title: form.title,
      description: form.description,
      image_url: form.image_url || null,
      location: locationText,
      date: eventDate.toISOString(),
      created_by: userId,
      type: role === 'company' ? 'empresa' : 'prestador',
      max_participants: form.max_participants ? parseInt(form.max_participants) : null,
      price: form.price ? String(form.price) : 'Grátis',
      activity_type: form.activity_type,
      category: form.category,
      additional_info: form.additional_info,
      mkt360_event_id: finalMktEventId
    }

    const res = await createEvent(payload)

    if (res.success) {
      setForm({ 
        title: '', 
        description: '', 
        image_url: '', 
        location: '', 
        province: '', 
        city: '', 
        date: '', 
        time: '', 
        max_participants: '', 
        price: '', 
        activity_type: 'Evento',
        category: '',
        additional_info: '',
        mkt360_event_id: ''
      })
      setTicketBatches([
        { name: 'Geral', price: '', quantity: '', description: 'Ingresso Geral' }
      ])
      await reload()
    } else {
      setError(res.error || 'Erro ao publicar evento.')
    }
    setPublishing(false)
  }

  const handleDelete = async (id) => {
    if (!window.confirm("Tens a certeza que queres eliminar este evento?")) return
    const res = await deleteEvent(id)
    if (res.success) {
      await reload()
    } else {
      alert("Erro ao eliminar: " + res.error)
    }
  }

  // Ações de Edição
  const handleStartEdit = (event) => {
    const evDate = event.date ? new Date(event.date) : new Date()
    const year = evDate.getFullYear()
    const month = String(evDate.getMonth() + 1).padStart(2, '0')
    const day = String(evDate.getDate()).padStart(2, '0')
    const dateStr = `${year}-${month}-${day}`
    const timeStr = String(evDate.getHours()).padStart(2, '0') + ':' + String(evDate.getMinutes()).padStart(2, '0')
    
    let provStr = ''
    let cityStr = ''
    if (event.location && event.location.includes(',')) {
      const parts = event.location.split(',').map(p => p.trim())
      cityStr = parts[0]
      provStr = parts[1]
    } else {
      provStr = event.location || ''
    }

    setEditForm({
      title: event.title || '',
      description: event.description || '',
      image_url: event.image_url || '',
      location: event.location || '',
      province: provinces?.find(p => p.name === provStr)?.id || provStr,
      city: municipalities?.find(m => m.name === cityStr)?.id || cityStr,
      date: dateStr,
      time: timeStr,
      max_participants: event.max_participants ? String(event.max_participants) : '',
      price: event.price !== 'Grátis' ? String(event.price || '') : '',
      activity_type: event.activity_type || 'Evento',
      category: event.category || '',
      additional_info: event.additional_info || '',
      mkt360_event_id: event.mkt360_event_id ? String(event.mkt360_event_id) : ''
    })
    setEditingEvent(event)
    setEditError('')
  }

  const handleEditChange = (e) => {
    const { name, value } = e.target
    setEditForm(f => ({ ...f, [name]: value }))
  }

  const handleEditImageChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setEditError('Apenas imagens são permitidas.')
      return
    }
    try {
      const base64 = await fileToBase64(file)
      setEditForm(f => ({ ...f, image_url: base64 }))
    } catch {
      setEditError('Erro ao processar imagem.')
    }
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    setEditError('')

    if (!editForm.title || !editForm.description || !editForm.location || !editForm.date || !editForm.time || !editForm.category) {
      setEditError('Por favor preenche todos os campos obrigatórios (incluindo Categoria).')
      return
    }

    const eventDate = new Date(`${editForm.date}T${editForm.time}`)
    const selectedProv = provinces?.find(p => p.id === editForm.province)?.name || editForm.province
    const selectedCity = municipalities?.find(m => m.id === editForm.city)?.name || editForm.city
    const locationText = selectedCity && selectedProv ? `${selectedCity}, ${selectedProv}` : (editForm.location || '')

    const payload = {
      title: editForm.title,
      description: editForm.description,
      image_url: editForm.image_url || null,
      location: locationText,
      date: eventDate.toISOString(),
      max_participants: editForm.max_participants ? parseInt(editForm.max_participants) : null,
      price: editForm.price ? String(editForm.price) : 'Grátis',
      activity_type: editForm.activity_type,
      category: editForm.category,
      additional_info: editForm.additional_info,
      mkt360_event_id: editForm.mkt360_event_id ? parseInt(editForm.mkt360_event_id, 10) : null
    }

    const res = await updateEvent(editingEvent.id, payload)
    if (res.success) {
      setEditingEvent(null)
      await reload()
    } else {
      setEditError(res.error || 'Erro ao atualizar evento.')
    }
  }

  // Ações de Portaria MKT360
  const handleValidateTicket = async (e) => {
    e.preventDefault()
    if (!ticketCode) {
      toast.error('Digite ou escaneie o código do ticket.')
      return
    }

    setValidating(true)
    setValidationResult(null)
    const toastId = toast.loading('A verificar validade do ticket na MKT360...')

    try {
      const res = await validateMKT360Ticket(ticketCode, selectedEventId || null)
      if (res.success) {
        toast.success('Ticket localizado!', { id: toastId })
        setValidationResult({ error: false, ticket: res.data?.ticket || res.data })
      } else {
        toast.error(`Código inválido: ${res.error}`, { id: toastId })
        setValidationResult({ error: true, message: res.error })
      }
    } catch (err) {
      console.error(err)
      toast.error('Erro de rede ao validar ticket.', { id: toastId })
    } finally {
      setValidating(false)
    }
  }

  const handleRegisterCheckin = async () => {
    if (!ticketCode) return
    setCheckingIn(true)
    const toastId = toast.loading('A processar check-in na portaria...')

    try {
      const res = await checkinMKT360Ticket(ticketCode, selectedEventId || null)
      if (res.success) {
        toast.success('Entrada autorizada! Check-in realizado.', { id: toastId })
        // Atualizar visual do status local
        if (validationResult && !validationResult.error) {
          setValidationResult(prev => ({
            ...prev,
            ticket: { ...prev.ticket, status: 'INSIDE' }
          }))
        }
      } else {
        toast.error(`Falha no check-in: ${res.error}`, { id: toastId })
      }
    } catch (err) {
      console.error(err)
      toast.error('Erro ao efetuar check-in.', { id: toastId })
    } finally {
      setCheckingIn(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Abas Superiores */}
      <div className={`p-1.5 rounded-2xl flex border transition ${
        theme === 'dark' ? 'bg-[#1E1E1E] border-[#2A2A2A]' : 'bg-white border-mimu-border-light shadow-sm'
      }`}>
        <button
          onClick={() => setActiveTab('manager')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
            activeTab === 'manager'
              ? 'bg-mimu-gold text-mimu-text-dark shadow'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          📅 Gerir Eventos & Novidades
        </button>
        <button
          onClick={() => setActiveTab('gate')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
            activeTab === 'gate'
              ? 'bg-mimu-gold text-mimu-text-dark shadow'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          🎟️ Portaria & Validação MKT360
        </button>
      </div>

      {activeTab === 'manager' ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-mimu-wine-text dark:text-white">Novidades e Eventos</h2>
              <p className="text-sm text-mimu-wine-light-text dark:text-gray-300/70">
                Publica atividades, descontos ou eventos para aparecerem em destaque na Página Inicial.
              </p>
            </div>
          </div>

          {/* Formulário de Criação */}
          <form onSubmit={handlePublish} className="bg-mimu-cream dark:bg-[#121212]/60 rounded-2xl p-5 sm:p-6 space-y-4">
            <h3 className="font-semibold text-mimu-wine-text dark:text-white text-sm">Criar nova publicação</h3>
            
            {error && (
              <div className="p-3 bg-red-100 text-red-700 rounded-xl text-sm">{error}</div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-mimu-wine-text dark:text-white mb-1">Título do Evento / Novidade *</label>
                <input name="title" value={form.title} onChange={handleChange} placeholder="Ex: Workshop de Estética Avançada" className="w-full px-4 py-2 rounded-xl border-2 border-mimu-cream-border dark:border-[#2A2A2A] focus:border-mimu-gold focus:outline-none focus:ring-2 focus:ring-mimu-gold focus:border-transparent bg-white dark:bg-[#1A1A1A] text-mimu-text-dark dark:text-white" />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-mimu-wine-text dark:text-white mb-1">Descrição completa *</label>
                <textarea name="description" value={form.description} onChange={handleChange} rows="3" placeholder="Detalhes sobre o que vai acontecer..." className="w-full px-4 py-2 rounded-xl bg-mimu-white dark:bg-[#1E1E1E] text-mimu-text-dark dark:text-white border-2 border-mimu-border-light focus:border-mimu-gold focus:outline-none focus:ring-2 focus:ring-mimu-gold focus:border-transparent"></textarea>
              </div>

              <div>
                 <label className="block text-xs font-medium text-mimu-wine-text dark:text-white mb-1">Tipo de Actividade *</label>
                 <select name="activity_type" value={form.activity_type} onChange={handleChange} className="w-full px-4 py-2 rounded-xl bg-mimu-white dark:bg-[#1E1E1E] text-mimu-text-dark dark:text-white border-2 border-mimu-border-light focus:border-mimu-gold focus:outline-none">
                   <option value="Evento">Evento Público</option>
                   <option value="Workshop">Workshop / Aula</option>
                   <option value="Promoção">Promoção Específica</option>
                   <option value="Aviso">Aviso / Notícia</option>
                 </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-mimu-wine-text dark:text-white mb-1">Categoria *</label>
                <select name="category" value={form.category} onChange={handleChange} className="w-full px-4 py-2 rounded-xl bg-mimu-white dark:bg-[#1E1E1E] text-mimu-text-dark dark:text-white border-2 border-mimu-border-light focus:border-mimu-gold focus:outline-none">
                  <option value="">Seleciona uma categoria</option>
                  <option value="Lazer & Entretenimento">Lazer & Entretenimento</option>
                  <option value="Beleza & Bem-Estar">Beleza & Bem-Estar</option>
                  <option value="Educação & Workshops">Educação & Workshops</option>
                  <option value="Gastronomia">Gastronomia</option>
                  <option value="Tecnologia">Tecnologia</option>
                  <option value="Moda & Arte">Moda & Arte</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>

              <div>
                 <label className="block text-xs font-medium text-mimu-wine-text dark:text-white mb-1">Valor da Actividade (Kz)</label>
                 <input type="number" min="0" step="100" name="price" value={form.price} onChange={handleChange} placeholder="Deixar em branco se for Grátis" className="w-full px-4 py-2 rounded-xl bg-mimu-white dark:bg-[#1E1E1E] text-mimu-text-dark dark:text-white border-2 border-mimu-border-light focus:border-mimu-gold focus:outline-none focus:ring-2 focus:ring-mimu-gold focus:border-transparent" />
              </div>

              <div>
                <label className="block text-xs font-medium text-mimu-wine-text dark:text-white mb-1">Lotação Máxima (Opcional)</label>
                <input type="number" name="max_participants" value={form.max_participants} onChange={handleChange} placeholder="Deixar em branco se ilimitado" className="w-full px-4 py-2 rounded-xl bg-mimu-white dark:bg-[#1E1E1E] text-mimu-text-dark dark:text-white border-2 border-mimu-border-light focus:border-mimu-gold focus:outline-none focus:ring-2 focus:ring-mimu-gold focus:border-transparent" />
              </div>

              <div>
                <label className="block text-xs font-medium text-mimu-wine-text dark:text-white mb-1">Data *</label>
                <input type="date" name="date" value={form.date} onChange={handleChange} className="w-full px-4 py-2 rounded-xl bg-mimu-white dark:bg-[#1E1E1E] text-mimu-text-dark dark:text-white border-2 border-mimu-border-light focus:border-mimu-gold focus:outline-none focus:ring-2 focus:ring-mimu-gold focus:border-transparent" />
              </div>

              <div>
                <label className="block text-xs font-medium text-mimu-wine-text dark:text-white mb-1">Hora *</label>
                <input type="time" name="time" value={form.time} onChange={handleChange} className="w-full px-4 py-2 rounded-xl bg-mimu-white dark:bg-[#1E1E1E] text-mimu-text-dark dark:text-white border-2 border-mimu-border-light focus:border-mimu-gold focus:outline-none focus:ring-2 focus:ring-mimu-gold focus:border-transparent" />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-mimu-wine-text dark:text-white mb-1">Localização *</label>
                <AngolaLocationSelect 
                  province={form.province || ''} 
                  city={form.city || ''} 
                  onProvinceChange={(v) => setForm(f => ({ ...f, province: v, city: '', location: v }))} 
                  onCityChange={(v) => setForm(f => ({ ...f, city: v, location: `${v}, ${form.province}` }))} 
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-mimu-wine-text dark:text-white mb-1">ID do Evento GoTicket (Opcional - para integração de bilhetes)</label>
                <input 
                  type="number" 
                  name="mkt360_event_id" 
                  value={form.mkt360_event_id} 
                  onChange={handleChange} 
                  placeholder="Ex: 12345" 
                  className="w-full px-4 py-2 rounded-xl border-2 border-mimu-cream-border dark:border-[#2A2A2A] focus:border-mimu-gold focus:outline-none focus:ring-2 focus:ring-mimu-gold focus:border-transparent bg-white dark:bg-[#1A1A1A] text-mimu-text-dark dark:text-white" 
                />
                <p className="text-[10px] text-mimu-wine-light-text dark:text-gray-300/60 mt-1">Preencha este campo se o evento já estiver criado no portal GoTicket. Deixe vazio para criar o evento e lotes de bilhetes automaticamente.</p>
              </div>

              {/* Lotes de Ingressos / Batches */}
              <div className="md:col-span-2 p-4 bg-mimu-white dark:bg-[#1E1E1E] border border-mimu-cream-border dark:border-[#2A2A2A] rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-mimu-wine-text dark:text-white">Lotes de Ingressos (Integração GoTicket)</h4>
                  <button
                    type="button"
                    onClick={handleAddBatch}
                    className="px-3 py-1 bg-mimu-gold/10 hover:bg-mimu-gold/20 text-mimu-gold text-xs font-bold rounded-lg transition"
                  >
                    + Adicionar Lote
                  </button>
                </div>
                
                <div className="space-y-3">
                  {ticketBatches.map((batch, index) => (
                    <div key={index} className="p-3 bg-mimu-cream/30 dark:bg-[#121212]/30 border border-mimu-cream-border/50 dark:border-[#2A2A2A]/50 rounded-xl space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-mimu-wine-light-text dark:text-gray-400">Lote #{index + 1}</span>
                        {ticketBatches.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveBatch(index)}
                            className="text-red-500 hover:text-red-700 text-xs font-medium"
                          >
                            Remover Lote
                          </button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[10px] font-medium text-mimu-wine-light-text dark:text-gray-400 mb-1">Nome do Lote *</label>
                          <input
                            type="text"
                            placeholder="Ex: Geral, VIP, Gold"
                            value={batch.name}
                            onChange={(e) => handleBatchChange(index, 'name', e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg border border-mimu-cream-border dark:border-[#2A2A2A] bg-white dark:bg-[#1A1A1A] text-xs text-mimu-text-dark dark:text-white focus:outline-none focus:border-mimu-gold"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-medium text-mimu-wine-light-text dark:text-gray-400 mb-1">Preço (Kz) *</label>
                          <input
                            type="number"
                            min="0"
                            placeholder="0 para Grátis"
                            value={batch.price}
                            onChange={(e) => handleBatchChange(index, 'price', e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg border border-mimu-cream-border dark:border-[#2A2A2A] bg-white dark:bg-[#1A1A1A] text-xs text-mimu-text-dark dark:text-white focus:outline-none focus:border-mimu-gold"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-medium text-mimu-wine-light-text dark:text-gray-400 mb-1">Lotação (Qtd) *</label>
                          <input
                            type="number"
                            min="1"
                            placeholder="Ex: 100"
                            value={batch.quantity}
                            onChange={(e) => handleBatchChange(index, 'quantity', e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg border border-mimu-cream-border dark:border-[#2A2A2A] bg-white dark:bg-[#1A1A1A] text-xs text-mimu-text-dark dark:text-white focus:outline-none focus:border-mimu-gold"
                            required
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-[10px] font-medium text-mimu-wine-light-text dark:text-gray-400 mb-1">Descrição do Lote</label>
                        <input
                          type="text"
                          placeholder="Ex: Acesso geral ao evento, brinde..."
                          value={batch.description}
                          onChange={(e) => handleBatchChange(index, 'description', e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-mimu-cream-border dark:border-[#2A2A2A] bg-white dark:bg-[#1A1A1A] text-xs text-mimu-text-dark dark:text-white focus:outline-none focus:border-mimu-gold"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="md:col-span-2">
                 <label className="block text-xs font-medium text-mimu-wine-text dark:text-white mb-1">Imagem / Cartaz</label>
                 <div className="flex items-center gap-4">
                   {form.image_url && (
                     <div className="w-16 h-16 rounded-lg overflow-hidden border border-mimu-border-light shrink-0">
                       <img src={form.image_url} alt="Preview" className="w-full h-full object-cover" />
                     </div>
                   )}
                   <input type="file" accept="image/*" onChange={handleImageChange} className="w-full px-4 py-2 rounded-xl bg-mimu-white dark:bg-[#1E1E1E] text-mimu-text-dark dark:text-white border-2 border-mimu-border-light file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-mimu-gold/10 file:text-mimu-gold hover:file:bg-mimu-gold/20" />
                 </div>
                 <p className="text-[10px] text-mimu-wine-light-text dark:text-gray-300/60 mt-1">* Se deixares em branco, aparecerá um ícone de calendário genérico na home.</p>
              </div>
            </div>

            <div className="pt-2">
              <button type="submit" disabled={publishing} className="px-6 py-3 rounded-xl bg-mimu-gold text-mimu-white-text font-bold text-sm hover:bg-[#b87d26] disabled:opacity-50 transition transition-all duration-300 hover:shadow-md active:scale-95">
                {publishing ? 'A publicar...' : 'Publicar na Home'}
              </button>
            </div>
          </form>

          {/* Listagem / Histórico de Eventos */}
          <div>
            <h3 className="text-sm font-semibold text-mimu-wine-text dark:text-white mb-3">As minhas publicações</h3>
            {loading ? (
              <p className="text-mimu-wine-light-text dark:text-gray-300/80 text-sm">A carregar...</p>
            ) : myEvents.length === 0 ? (
              <div className="p-4 bg-mimu-white dark:bg-[#1E1E1E] rounded-2xl shadow-sm text-center">
                <p className="text-mimu-wine-light-text dark:text-gray-300/80 text-sm">Ainda não publicaste nenhuma novidade.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {myEvents.map(ev => (
                  <div key={ev.id} className="p-4 bg-mimu-white dark:bg-[#1E1E1E] rounded-2xl shadow-sm border border-mimu-border-light flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-lg bg-mimu-gray-100 dark:bg-[#121212] shrink-0 overflow-hidden">
                        {ev.image_url ? (
                          <img src={ev.image_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex justify-center items-center bg-mimu-gold/20 text-mimu-gold text-xl">📅</div>
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-mimu-wine-text dark:text-white line-clamp-1">{ev.title}</h4>
                        <p className="text-xs text-mimu-wine-light-text dark:text-gray-300/80 mt-1">
                          {new Date(ev.date).toLocaleDateString('pt-PT')} • {ev.participants_count || 0} inscritos
                        </p>
                        <div className="mt-2 flex gap-2 text-xs">
                          <span className={`px-2 py-0.5 rounded-full font-medium ${
                            ev.status === 'aprovado' ? 'bg-green-100 text-green-700' :
                            ev.status === 'rejeitado' ? 'bg-red-100 text-red-700' :
                            'bg-amber-100 text-amber-700'
                          }`}>
                            {ev.status === 'aprovado' ? 'Aprovado' : ev.status === 'rejeitado' ? 'Rejeitado' : 'Pendente (Em Análise)'}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-mimu-cream dark:bg-[#121212] border border-mimu-border-light text-mimu-text-dark dark:text-white font-medium">
                            {ev.activity_type || 'Evento'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                       <button 
                         onClick={() => handleViewParticipants(ev)} 
                         className="px-3 py-1.5 text-xs font-bold text-mimu-gold bg-mimu-gold/10 hover:bg-mimu-gold/20 rounded-lg transition border border-mimu-gold/25"
                       >
                         👥 Participantes
                       </button>
                       <button 
                         onClick={() => handleStartEdit(ev)} 
                         className="px-3 py-1.5 text-xs font-bold text-mimu-wine-text dark:text-gray-300 bg-mimu-cream dark:bg-[#2A2A2A] hover:bg-mimu-cream-border dark:hover:bg-[#3A3A3A] rounded-lg transition border border-mimu-cream-border dark:border-[#2A2A2A]"
                       >
                         Editar
                       </button>
                       <button 
                         onClick={() => handleDelete(ev.id)} 
                         className="px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition border border-red-100"
                       >
                         Eliminar
                       </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        /* Painel de Portaria/Check-in MKT360 */
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-bold text-mimu-wine-text dark:text-white">Validação & Portaria</h3>
            <p className="text-sm text-gray-400">
              Controle a entrada dos participantes nos seus eventos da MKT360 através do código digital.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            
            {/* Bloco Esquerdo: Inputs de Busca e Validação */}
            <div className={`md:col-span-2 p-5 sm:p-6 rounded-2xl border ${
              theme === 'dark' ? 'bg-[#121212]/60 border-[#2A2A2A]' : 'bg-mimu-cream/40 border-mimu-cream-border'
            } space-y-4`}>
              <h4 className="font-bold text-sm text-mimu-gold uppercase tracking-wider">Buscar Bilhete</h4>
              
              <form onSubmit={handleValidateTicket} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-gray-400">Filtro de Evento (Opcional)</label>
                    <select 
                      value={selectedEventId} 
                      onChange={(e) => setSelectedEventId(e.target.value)} 
                      className={`w-full p-2.5 rounded-xl border focus:outline-none transition text-sm ${
                        theme === 'dark' ? 'bg-[#1E1E1E] border-[#2A2A2A] text-white' : 'bg-white border-mimu-cream-border'
                      }`}
                    >
                      <option value="">Qualquer evento</option>
                      {myEvents.map((ev) => (
                        <option key={ev.id} value={ev.id}>{ev.title}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-gray-400">Código do Bilhete *</label>
                    <input
                      type="text"
                      placeholder="Ex: TKT-180d9fd7..."
                      value={ticketCode}
                      onChange={(e) => setTicketCode(e.target.value)}
                      className={`w-full p-2.5 rounded-xl border focus:outline-none transition text-sm font-mono ${
                        theme === 'dark' ? 'bg-[#1E1E1E] border-[#2A2A2A] text-white focus:border-mimu-gold' : 'bg-white border-mimu-cream-border focus:border-mimu-wine'
                      }`}
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={validating}
                    className="flex-1 py-3 rounded-xl bg-mimu-gold hover:bg-[#b87d26] text-mimu-text-dark font-black uppercase text-xs tracking-wider transition shadow"
                  >
                    {validating ? 'A verificar...' : 'Validar Bilhete 🔍'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowScanner(!showScanner)}
                    className={`px-5 py-3 rounded-xl border font-black uppercase text-xs tracking-wider transition flex items-center justify-center gap-1.5 ${
                      showScanner 
                        ? 'bg-red-500/15 border-red-500/30 text-red-400' 
                        : theme === 'dark'
                        ? 'bg-[#2A2A2A] border-transparent text-white hover:bg-[#3A3A3A]'
                        : 'bg-white border-mimu-cream-border text-mimu-wine hover:bg-gray-100'
                    }`}
                  >
                    <span>📷</span> {showScanner ? 'Fechar Câmara' : 'Escanear QR'}
                  </button>
                </div>
              </form>

              {/* Área do Leitor de Câmara */}
              {showScanner && (
                <div className="border border-dashed border-gray-700/50 p-4 rounded-2xl bg-black/40">
                  <h5 className="text-xs font-bold uppercase tracking-widest text-mimu-gold text-center mb-3">Leitor de QR Code Activo</h5>
                  <div id="qr-reader" className="mx-auto max-w-sm rounded-xl overflow-hidden shadow"></div>
                  <p className="text-[10px] text-gray-400 text-center mt-3">Posicione o QR Code impresso ou no telemóvel em frente à câmara.</p>
                </div>
              )}
            </div>

            {/* Bloco Direito: Resultado da Validação & Acção de Check-in */}
            <div className={`p-5 sm:p-6 rounded-2xl border ${
              theme === 'dark' ? 'bg-[#1E1E1E] border-[#2A2A2A]' : 'bg-white border-mimu-border-light shadow-sm'
            } flex flex-col justify-between min-h-[300px]`}>
              
              <div>
                <h4 className="font-bold text-sm text-mimu-gold uppercase tracking-wider mb-4 pb-2 border-b border-gray-700/20">
                  Estado de Validação
                </h4>

                {validationResult ? (
                  validationResult.error ? (
                    <div className="text-center py-6 space-y-2">
                      <span className="text-4xl block">❌</span>
                      <h5 className="font-bold text-red-500">Bilhete Inválido</h5>
                      <p className="text-xs text-gray-400">{validationResult.message}</p>
                    </div>
                  ) : (
                    <div className="space-y-4 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-400 font-bold uppercase">Estado</span>
                        {validationResult.ticket?.status === 'NOT_USED' || validationResult.ticket?.status === 'OUTSIDE' ? (
                          <span className="px-2.5 py-1 bg-green-500/10 text-green-400 border border-green-500/20 text-[10px] font-black rounded-full uppercase">
                            Válido (Não Usado)
                          </span>
                        ) : validationResult.ticket?.status === 'INSIDE' ? (
                          <span className="px-2.5 py-1 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 text-[10px] font-black rounded-full uppercase">
                            Alerta (Já Utilizado)
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-black rounded-full uppercase">
                            Cancelado / Inválido
                          </span>
                        )}
                      </div>

                      <div className="space-y-2 pt-2 border-t border-gray-700/10 text-xs">
                        <p>👤 <strong>Comprador:</strong> {validationResult.ticket?.buyer_name || validationResult.ticket?.buyer || 'N/D'}</p>
                        <p>✉️ <strong>Email:</strong> {validationResult.ticket?.buyer_email || 'N/D'}</p>
                        <p>🎫 <strong>Tipo de Bilhete:</strong> {validationResult.ticket?.ticket_type_name || validationResult.ticket?.ticket_type || 'Geral'}</p>
                        <p>🔢 <strong>Quantidade:</strong> {validationResult.ticket?.quantity || 1}</p>
                        <p>⚙️ <strong>ID Evento MKT360:</strong> {validationResult.ticket?.event_id}</p>
                      </div>
                    </div>
                  )
                ) : (
                  <div className="text-center py-12 text-gray-500 text-xs space-y-2">
                    <span className="text-3xl block">🎟️</span>
                    <p>Aguardando validação de código...</p>
                  </div>
                )}
              </div>

              {/* Botão de Check-in (Ativado apenas se ticket válido for retornado) */}
              {validationResult && !validationResult.error && (
                <div className="pt-4 border-t border-gray-700/20">
                  <button
                    onClick={handleRegisterCheckin}
                    disabled={checkingIn || validationResult.ticket?.status === 'INSIDE' || validationResult.ticket?.status === 'CANCELLED'}
                    className="w-full py-3 rounded-xl bg-green-500 hover:bg-green-600 disabled:opacity-40 disabled:pointer-events-none text-white font-extrabold text-xs uppercase tracking-wider transition shadow flex items-center justify-center gap-1.5"
                  >
                    {checkingIn ? (
                      'A Registar...'
                    ) : validationResult.ticket?.status === 'INSIDE' ? (
                      'Check-in Já Realizado'
                    ) : (
                      'Confirmar Entrada (Check-in) ✓'
                    )}
                  </button>
                </div>
              )}

            </div>

          </div>
        </div>
      )}

      {/* Modal de Edição */}
      {editingEvent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-mimu-white dark:bg-[#1E1E1E] rounded-3xl p-6 max-w-2xl w-full shadow-2xl my-8 border border-mimu-cream-border dark:border-[#2A2A2A]">
            <div className="flex items-center justify-between border-b border-mimu-cream-border dark:border-[#2A2A2A] pb-4 mb-4">
              <h3 className="text-lg font-bold text-mimu-wine-text dark:text-white">Editar Publicação</h3>
              <button 
                onClick={() => setEditingEvent(null)} 
                className="text-mimu-wine-light-text dark:text-gray-400 hover:text-mimu-wine-text dark:hover:text-white text-xl"
              >
                ✕
              </button>
            </div>

            {editError && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-xl text-sm">{editError}</div>
            )}

            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-mimu-wine-text dark:text-white mb-1">Título do Evento / Novidade *</label>
                  <input name="title" value={editForm.title} onChange={handleEditChange} placeholder="Ex: Workshop de Estética Avançada" className="w-full px-4 py-2 rounded-xl border-2 border-mimu-cream-border dark:border-[#2A2A2A] focus:border-mimu-gold focus:outline-none focus:ring-2 focus:ring-mimu-gold focus:border-transparent bg-white dark:bg-[#1A1A1A] text-mimu-text-dark dark:text-white" />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-mimu-wine-text dark:text-white mb-1">Descrição completa *</label>
                  <textarea name="description" value={editForm.description} onChange={handleEditChange} rows="3" placeholder="Detalhes sobre o que vai acontecer..." className="w-full px-4 py-2 rounded-xl bg-mimu-white dark:bg-[#1E1E1E] text-mimu-text-dark dark:text-white border-2 border-mimu-border-light focus:border-mimu-gold focus:outline-none focus:ring-2 focus:ring-mimu-gold focus:border-transparent"></textarea>
                </div>

                <div>
                   <label className="block text-xs font-medium text-mimu-wine-text dark:text-white mb-1">Tipo de Actividade *</label>
                   <select name="activity_type" value={editForm.activity_type} onChange={handleEditChange} className="w-full px-4 py-2 rounded-xl bg-mimu-white dark:bg-[#1E1E1E] text-mimu-text-dark dark:text-white border-2 border-mimu-border-light focus:border-mimu-gold focus:outline-none">
                     <option value="Evento">Evento Público</option>
                     <option value="Workshop">Workshop / Aula</option>
                     <option value="Promoção">Promoção Específica</option>
                     <option value="Aviso">Aviso / Notícia</option>
                   </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-mimu-wine-text dark:text-white mb-1">Categoria *</label>
                  <select name="category" value={editForm.category} onChange={handleEditChange} className="w-full px-4 py-2 rounded-xl bg-mimu-white dark:bg-[#1E1E1E] text-mimu-text-dark dark:text-white border-2 border-mimu-border-light focus:border-mimu-gold focus:outline-none">
                    <option value="">Seleciona uma categoria</option>
                    <option value="Lazer & Entretenimento">Lazer & Entretenimento</option>
                    <option value="Beleza & Bem-Estar">Beleza & Bem-Estar</option>
                    <option value="Educação & Workshops">Educação & Workshops</option>
                    <option value="Gastronomia">Gastronomia</option>
                    <option value="Tecnologia">Tecnologia</option>
                    <option value="Moda & Arte">Moda & Arte</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>

                <div>
                   <label className="block text-xs font-medium text-mimu-wine-text dark:text-white mb-1">Valor da Actividade (Kz)</label>
                   <input type="number" min="0" step="100" name="price" value={editForm.price} onChange={handleEditChange} placeholder="Deixar em branco se for Grátis" className="w-full px-4 py-2 rounded-xl bg-mimu-white dark:bg-[#1E1E1E] text-mimu-text-dark dark:text-white border-2 border-mimu-border-light focus:border-mimu-gold focus:outline-none focus:ring-2 focus:ring-mimu-gold focus:border-transparent" />
                </div>

                <div>
                  <label className="block text-xs font-medium text-mimu-wine-text dark:text-white mb-1">Lotação Máxima (Opcional)</label>
                  <input type="number" name="max_participants" value={editForm.max_participants} onChange={handleEditChange} placeholder="Deixar em branco se ilimitado" className="w-full px-4 py-2 rounded-xl bg-mimu-white dark:bg-[#1E1E1E] text-mimu-text-dark dark:text-white border-2 border-mimu-border-light focus:border-mimu-gold focus:outline-none focus:ring-2 focus:ring-mimu-gold focus:border-transparent" />
                </div>

                <div>
                  <label className="block text-xs font-medium text-mimu-wine-text dark:text-white mb-1">Data *</label>
                  <input type="date" name="date" value={editForm.date} onChange={handleEditChange} className="w-full px-4 py-2 rounded-xl bg-mimu-white dark:bg-[#1E1E1E] text-mimu-text-dark dark:text-white border-2 border-mimu-border-light focus:border-mimu-gold focus:outline-none focus:ring-2 focus:ring-mimu-gold focus:border-transparent" />
                </div>

                <div>
                  <label className="block text-xs font-medium text-mimu-wine-text dark:text-white mb-1">Hora *</label>
                  <input type="time" name="time" value={editForm.time} onChange={handleEditChange} className="w-full px-4 py-2 rounded-xl bg-mimu-white dark:bg-[#1E1E1E] text-mimu-text-dark dark:text-white border-2 border-mimu-border-light focus:border-mimu-gold focus:outline-none focus:ring-2 focus:ring-mimu-gold focus:border-transparent" />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-mimu-wine-text dark:text-white mb-1">Localização *</label>
                  <AngolaLocationSelect 
                    province={editForm.province || ''} 
                    city={editForm.city || ''} 
                    onProvinceChange={(v) => setEditForm(f => ({ ...f, province: v, city: '', location: v }))} 
                    onCityChange={(v) => setEditForm(f => ({ ...f, city: v, location: `${v}, ${editForm.province}` }))} 
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-mimu-wine-text dark:text-white mb-1">ID do Evento GoTicket (Opcional)</label>
                  <input 
                    type="number" 
                    name="mkt360_event_id" 
                    value={editForm.mkt360_event_id} 
                    onChange={handleEditChange} 
                    placeholder="Ex: 12345" 
                    className="w-full px-4 py-2 rounded-xl border-2 border-mimu-cream-border dark:border-[#2A2A2A] focus:border-mimu-gold focus:outline-none focus:ring-2 focus:ring-mimu-gold focus:border-transparent bg-white dark:bg-[#1A1A1A] text-mimu-text-dark dark:text-white" 
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-mimu-wine-text dark:text-white mb-1">Instruções / Informações Adicionais para o Bilhete</label>
                  <textarea name="additional_info" value={editForm.additional_info} onChange={handleEditChange} rows="2" placeholder="Ex: Apresentar bilhete no local..." className="w-full px-4 py-2 rounded-xl bg-mimu-white dark:bg-[#1E1E1E] text-mimu-text-dark dark:text-white border-2 border-mimu-border-light focus:border-mimu-gold focus:outline-none focus:ring-2 focus:ring-mimu-gold focus:border-transparent"></textarea>
                </div>

                <div className="md:col-span-2">
                   <label className="block text-xs font-medium text-mimu-wine-text dark:text-white mb-1">Imagem / Cartaz</label>
                   <div className="flex items-center gap-4">
                     {editForm.image_url && (
                       <div className="w-16 h-16 rounded-lg overflow-hidden border border-mimu-border-light shrink-0">
                         <img src={editForm.image_url} alt="Preview" className="w-full h-full object-cover" />
                       </div>
                     )}
                     <input type="file" accept="image/*" onChange={handleEditImageChange} className="w-full px-4 py-2 rounded-xl bg-mimu-white dark:bg-[#1E1E1E] text-mimu-text-dark dark:text-white border-2 border-mimu-border-light file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-mimu-gold/10 file:text-mimu-gold hover:file:bg-mimu-gold/20" />
                   </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-mimu-cream-border dark:border-[#2A2A2A]">
                <button
                  type="button"
                  onClick={() => setEditingEvent(null)}
                  className="px-4 py-2 rounded-xl bg-mimu-cream dark:bg-[#2A2A2A] text-mimu-wine-text dark:text-gray-300 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-mimu-gold text-white font-bold hover:bg-[#b87d26]"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal de Lista de Participantes */}
      {selectedEventForParticipants && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-40 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-mimu-white dark:bg-[#1E1E1E] rounded-3xl p-6 max-w-4xl w-full shadow-2xl my-8 border border-mimu-cream-border dark:border-[#2A2A2A] flex flex-col max-h-[85vh] text-mimu-text-dark dark:text-white">
            <div className="flex items-center justify-between border-b border-mimu-cream-border dark:border-[#2A2A2A] pb-4 mb-4">
              <div>
                <h3 className="text-lg font-black text-mimu-wine-text dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <span>👥</span> Participantes Inscritos
                </h3>
                <p className="text-xs text-gray-400 mt-0.5 font-medium">
                  {selectedEventForParticipants.title} • {new Date(selectedEventForParticipants.date).toLocaleDateString('pt-PT')}
                </p>
              </div>
              <button 
                onClick={() => setSelectedEventForParticipants(null)} 
                className="text-mimu-wine-light-text dark:text-gray-400 hover:text-mimu-wine-text dark:hover:text-white text-xl p-1 hover:bg-white/10 rounded-full transition"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto flex-1 pr-1 space-y-4 min-h-[300px]">
              {loadingParticipants ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <div className="w-10 h-10 border-4 border-mimu-gold border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">A carregar lista de inscritos...</span>
                </div>
              ) : !selectedEventForParticipants.mkt360_event_id ? (
                <div className="text-center py-20 space-y-3">
                  <span className="text-5xl block">🔗</span>
                  <h4 className="font-extrabold text-sm text-gray-400">Este evento não está associado ao GoTicket</h4>
                  <p className="text-xs text-gray-500 max-w-xs mx-auto leading-normal">
                    Para visualizar e gerir os participantes e os seus ingressos digitais, edite esta publicação e insira o <strong>ID do Evento GoTicket</strong>.
                  </p>
                </div>
              ) : participants.length === 0 ? (
                <div className="text-center py-20 space-y-3">
                  <span className="text-5xl block">🎟️</span>
                  <h4 className="font-extrabold text-sm text-gray-400">Nenhum participante inscrito neste evento</h4>
                  <p className="text-xs text-gray-500 max-w-xs mx-auto">
                    Os ingressos comprados ou reservados aparecerão aqui para gestão de portaria e bloqueios.
                  </p>
                </div>
              ) : (
                <div className="border border-mimu-cream-border dark:border-[#2A2A2A] rounded-2xl overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-mimu-cream/50 dark:bg-[#121212] border-b border-mimu-cream-border dark:border-[#2A2A2A] font-bold text-gray-400">
                        <th className="p-3.5">Código</th>
                        <th className="p-3.5">Participante</th>
                        <th className="p-3.5">Ordem de Compra</th>
                        <th className="p-3.5 text-center">Estado</th>
                        <th className="p-3.5 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-mimu-cream-border dark:divide-[#2A2A2A]">
                      {participants.map((t) => {
                        const isBlocked = t.is_blocked;
                        const isCancelled = t.status === 'CANCELLED';
                        const isUsed = t.status === 'INSIDE';

                        // Badge logic
                        let badgeColor = "bg-green-500/10 text-green-400 border border-green-500/20";
                        let badgeLabel = "Ativo";

                        if (isBlocked) {
                          badgeColor = "bg-red-500/10 text-red-400 border border-red-500/20";
                          badgeLabel = "Bloqueado";
                        } else if (isCancelled) {
                          badgeColor = "bg-gray-500/10 text-gray-400 border border-gray-500/20";
                          badgeLabel = "Cancelado";
                        } else if (isUsed) {
                          badgeColor = "bg-blue-500/10 text-blue-400 border border-blue-500/20";
                          badgeLabel = "Usado";
                        }

                        return (
                          <tr key={t.id} className="hover:bg-mimu-cream/10 dark:hover:bg-white/5 transition-colors">
                            <td className="p-3.5 font-mono font-bold text-[11px] text-mimu-gold">
                              {t.ticket_code}
                            </td>
                            <td className="p-3.5">
                              <p className="font-extrabold text-[13px]">{t.profiles?.name || 'Comprador'}</p>
                              <p className="text-gray-400 text-[10px]">{t.profiles?.email || 'Sem email'}</p>
                              {isBlocked && t.blocked_reason && (
                                <p className="text-[10px] text-red-400 italic mt-1 font-medium bg-red-500/5 px-2 py-0.5 rounded border border-red-500/10 inline-block">
                                  🔒 Motivo: {t.blocked_reason}
                                </p>
                              )}
                            </td>
                            <td className="p-3.5 text-gray-400 text-[11px]">
                              {t.order_ref}
                            </td>
                            <td className="p-3.5 text-center">
                              <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded-full tracking-wider ${badgeColor}`}>
                                {badgeLabel}
                              </span>
                            </td>
                            <td className="p-3.5 text-right">
                              {isBlocked ? (
                                <button
                                  onClick={() => setUnblockingTicket(t)}
                                  className="px-2.5 py-1 bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 text-green-400 rounded-lg font-black uppercase text-[10px] tracking-wider transition-all"
                                >
                                  🔓 Desbloquear
                                </button>
                              ) : (
                                !isCancelled && (
                                  <button
                                    onClick={() => setBlockingTicket(t)}
                                    className="px-2.5 py-1 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 rounded-lg font-black uppercase text-[10px] tracking-wider transition-all"
                                  >
                                    🔒 Bloquear
                                  </button>
                                )
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4 border-t border-mimu-cream-border dark:border-[#2A2A2A] mt-4">
              <button
                onClick={() => setSelectedEventForParticipants(null)}
                className="px-5 py-2.5 rounded-xl bg-mimu-cream dark:bg-[#2A2A2A] text-mimu-wine-text dark:text-gray-300 font-extrabold uppercase text-xs tracking-wider transition"
              >
                Fechar Painel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Bloqueio de Ticket */}
      {blockingTicket && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-mimu-white dark:bg-[#1E1E1E] rounded-3xl p-6 max-w-md w-full shadow-2xl border border-mimu-cream-border dark:border-[#2A2A2A] text-mimu-text-dark dark:text-white">
            <h3 className="text-lg font-black text-red-500 uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <span>🔒</span> Bloquear Ticket
            </h3>
            <p className="text-xs text-gray-400 mb-4 font-medium">
              O participante com o código <span className="font-mono text-mimu-gold font-bold">{blockingTicket.ticket_code}</span> não poderá usar este ingresso para entrar no evento enquanto estiver bloqueado.
            </p>

            <form onSubmit={handleBlockTicketSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                  Motivo do bloqueio *
                </label>
                <textarea
                  required
                  rows="3"
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="Ex: Pagamento não identificado, duplicidade, comportamento inadequado..."
                  className="w-full px-3 py-2 text-sm rounded-xl border bg-white dark:bg-[#1A1A1A] border-mimu-cream-border dark:border-[#2A2A2A] focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 text-mimu-text-dark dark:text-white"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setBlockingTicket(null);
                    setBlockReason('');
                  }}
                  className="px-4 py-2 rounded-xl bg-mimu-cream dark:bg-[#2A2A2A] text-mimu-wine-text dark:text-gray-300 font-extrabold uppercase text-[10px] tracking-wider"
                  disabled={processingAction}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-extrabold uppercase text-[10px] tracking-wider shadow disabled:opacity-50"
                  disabled={processingAction}
                >
                  {processingAction ? 'A bloquear...' : 'Confirmar Bloqueio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Desbloqueio */}
      {unblockingTicket && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-mimu-white dark:bg-[#1E1E1E] rounded-3xl p-6 max-w-md w-full shadow-2xl border border-mimu-cream-border dark:border-[#2A2A2A] text-mimu-text-dark dark:text-white text-center">
            <span className="text-4xl block mb-3 animate-pulse">🔓</span>
            <h3 className="text-lg font-black text-green-500 uppercase tracking-wider mb-2">
              Desbloquear Ticket?
            </h3>
            <p className="text-xs text-gray-400 mb-6 max-w-xs mx-auto leading-normal">
              Tem a certeza que deseja desbloquear o ticket <span className="font-mono text-mimu-gold font-bold">{unblockingTicket.ticket_code}</span>? O ingresso voltará a estar ativo e elegível para portaria e check-in.
            </p>

            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setUnblockingTicket(null)}
                className="px-4 py-2 rounded-xl bg-mimu-cream dark:bg-[#2A2A2A] text-mimu-wine-text dark:text-gray-300 font-extrabold uppercase text-[10px] tracking-wider"
                disabled={processingAction}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleUnblockTicketConfirm}
                className="px-5 py-2.5 rounded-xl bg-green-500 hover:bg-green-600 text-white font-extrabold uppercase text-[10px] tracking-wider shadow disabled:opacity-50"
                disabled={processingAction}
              >
                {processingAction ? 'A desbloquear...' : 'Desbloquear'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
