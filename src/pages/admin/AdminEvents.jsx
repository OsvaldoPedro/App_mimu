import { useState, useEffect } from 'react'
import { getAllEventsForAdmin, updateEventStatus, deleteEvent } from '../../hooks/useEvents'
import { toast } from 'react-hot-toast'
import { supabase } from '../../config/supabaseClient'
import { blockTicket, unblockTicket } from '../../hooks/useTicketBlock'

export default function AdminEvents() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('todos')

  // Gestão de Tickets
  const [ticketModal, setTicketModal] = useState(null) // { eventId, eventTitle }
  const [eventTickets, setEventTickets] = useState([])
  const [ticketsLoading, setTicketsLoading] = useState(false)
  const [blockingId, setBlockingId] = useState(null)
  const [blockReasonMap, setBlockReasonMap] = useState({})

  const loadEvents = async () => {
    setLoading(true)
    const res = await getAllEventsForAdmin()
    if (res.success) {
      setEvents(res.data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    loadEvents()
  }, [])

  const handleStatusChange = async (id, newStatus) => {
    const statusText = newStatus === 'approved' ? 'aprovado' : newStatus === 'rejected' ? 'rejeitado' : newStatus;
    const res = await updateEventStatus(id, newStatus)
    if (res.success) {
      toast.success(`Evento ${statusText} com sucesso!`)
      loadEvents()
    } else {
      toast.error(`Erro ao alterar o estado: ${res.error || 'Erro de RLS / Permissão'}`)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm("Tens a certeza que queres eliminar este evento/novidade permanentemente?")) return
    const res = await deleteEvent(id)
    if (res.success) {
      toast.success("Evento eliminado com sucesso!")
      loadEvents()
    } else {
      toast.error(`Erro ao eliminar: ${res.error || 'Erro desconhecido'}`)
    }
  }

  const filteredEvents = events.filter(e => {
    if (filter === 'todos') return true
    return e.status === filter
  })

  const openTicketModal = async (ev) => {
    setTicketModal({ eventId: ev.mkt360_event_id, eventTitle: ev.title })
    setTicketsLoading(true)
    setEventTickets([])
    const { data, error } = await supabase
      .from('tickets')
      .select('id, ticket_code, user_id, status, is_blocked, blocked_reason, blocked_at, profiles:user_id(name, email)')
      .eq('event_id', ev.mkt360_event_id)
      .order('created_at', { ascending: false })
    if (!error && data) setEventTickets(data)
    else toast.error('Erro ao carregar tickets.')
    setTicketsLoading(false)
  }

  const handleBlock = async (ticket) => {
    const reason = blockReasonMap[ticket.id] || ''
    setBlockingId(ticket.id)
    const res = await blockTicket(ticket.id, reason)
    setBlockingId(null)
    if (res.success) {
      toast.success('Ticket bloqueado!')
      setEventTickets(prev => prev.map(t =>
        t.id === ticket.id ? { ...t, is_blocked: true, blocked_reason: reason } : t
      ))
    } else {
      toast.error(res.error || 'Erro ao bloquear.')
    }
  }

  const handleUnblock = async (ticket) => {
    setBlockingId(ticket.id)
    const res = await unblockTicket(ticket.id)
    setBlockingId(null)
    if (res.success) {
      toast.success('Ticket desbloqueado!')
      setEventTickets(prev => prev.map(t =>
        t.id === ticket.id ? { ...t, is_blocked: false, blocked_reason: null } : t
      ))
    } else {
      toast.error(res.error || 'Erro ao desbloquear.')
    }
  }

  return (
    <>
    <div className="w-full max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h1 className="text-xl md:text-2xl sm:text-3xl font-bold text-mimu-text-dark dark:text-white">Moderação de Eventos e Novidades</h1>
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border rounded-xl bg-mimu-white dark:bg-[#1E1E1E] text-mimu-text-dark dark:text-white focus:outline-none focus:border-mimu-gold"
          >
            <option value="todos">Todos os Eventos</option>
            <option value="pending">Pendentes (Em Análise)</option>
            <option value="approved">Aprovados (Ativos)</option>
            <option value="rejected">Rejeitados</option>
          </select>
        </div>

        {loading ? (
          <p className="text-mimu-text-muted">A carregar publicações...</p>
        ) : filteredEvents.length === 0 ? (
          <div className="bg-mimu-white dark:bg-[#1E1E1E] p-4 md:p-8 rounded-2xl shadow-sm border border-mimu-border-light text-center">
            <p className="text-mimu-text-muted">Nenhum evento encontrado nesta categoria.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Desktop Table View (hidden on mobile) */}
            <div className="desktop-only bg-mimu-white dark:bg-[#1E1E1E] rounded-2xl shadow-sm border border-mimu-border-light overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-mimu-gray-50 dark:bg-[#121212] border-b border-mimu-border-light text-mimu-text-dark dark:text-white">
                    <tr>
                      <th className="p-4 font-semibold">Publicação</th>
                      <th className="p-4 font-semibold">Tipo & Valor</th>
                      <th className="p-4 font-semibold">Criador</th>
                      <th className="p-4 font-semibold">Status</th>
                      <th className="p-4 font-semibold text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-mimu-border-light">
                    {filteredEvents.map(ev => (
                      <tr key={ev.id} className="hover:bg-mimu-gray-50 dark:bg-[#121212] transition text-mimu-text-muted">
                        <td className="p-4">
                          <div className="font-bold text-mimu-text-dark dark:text-white mb-1">{ev.title}</div>
                          <div className="text-xs">📍 {ev.location}</div>
                          <div className="text-xs">📅 {new Date(ev.date).toLocaleString('pt-PT')}</div>
                        </td>
                        <td className="p-4">
                          <div className="font-medium text-mimu-text-dark dark:text-white">{ev.activity_type || 'Evento'}</div>
                          <div className="text-xs">{ev.price === 'Grátis' || !ev.price ? 'Grátis' : `${ev.price} Kz`}</div>
                        </td>
                        <td className="p-4">
                          <div className="font-medium text-mimu-text-dark dark:text-white">{ev.profiles?.name || ev.profiles?.company_name || 'Desconhecido'}</div>
                          <div className="text-xs capitalize">{ev.profiles?.role || ev.type}</div>
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                            ev.status === 'approved' ? 'bg-green-100 text-green-700' :
                            ev.status === 'rejected' ? 'bg-red-100 text-red-700' :
                            'bg-amber-100 text-amber-700'
                          }`}>
                            {ev.status === 'approved' ? 'Aprovado' : ev.status === 'rejected' ? 'Rejeitado' : 'Pendente'}
                          </span>
                        </td>
                        <td className="p-4 text-right space-x-2">
                          {ev.status !== 'approved' && (
                            <button onClick={() => handleStatusChange(ev.id, 'approved')} className="text-green-600 hover:text-green-800 font-medium text-xs px-2 py-1 bg-green-50 rounded">
                              Aprovar
                            </button>
                          )}
                          {ev.status !== 'rejected' && (
                            <button onClick={() => handleStatusChange(ev.id, 'rejected')} className="text-amber-600 hover:text-amber-800 font-medium text-xs px-2 py-1 bg-amber-50 rounded">
                              Rejeitar
                            </button>
                          )}
                          {ev.mkt360_event_id && (
                            <button onClick={() => openTicketModal(ev)} className="text-blue-600 hover:text-blue-800 font-medium text-xs px-2 py-1 bg-blue-50 rounded">
                              🎫 Tickets
                            </button>
                          )}
                          <button onClick={() => handleDelete(ev.id)} className="text-red-600 hover:text-red-800 font-medium text-xs px-2 py-1 bg-red-50 rounded">
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Card List View (hidden on desktop) */}
            <div className="mobile-only space-y-4">
              {filteredEvents.map(ev => (
                <div key={ev.id} className="bg-mimu-white dark:bg-[#1E1E1E] p-4 rounded-2xl shadow-sm border border-mimu-border-light flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-mimu-gray-50 dark:bg-gray-800 rounded-md text-mimu-text-muted">
                        {ev.activity_type || 'Evento'}
                      </span>
                      <h3 className="font-bold text-mimu-text-dark dark:text-white mt-1.5 text-base leading-snug">
                        {ev.title}
                      </h3>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 ${
                      ev.status === 'approved' ? 'bg-green-100 text-green-700' :
                      ev.status === 'rejected' ? 'bg-red-100 text-red-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {ev.status === 'approved' ? 'Aprovado' : ev.status === 'rejected' ? 'Rejeitado' : 'Pendente'}
                    </span>
                  </div>

                  <div className="text-xs space-y-1 text-mimu-text-muted">
                    <div className="flex items-center gap-1.5">
                      <span className="shrink-0">📍</span>
                      <span className="truncate">{ev.location}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="shrink-0">📅</span>
                      <span>{new Date(ev.date).toLocaleString('pt-PT')}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="shrink-0">💰</span>
                      <span className="font-semibold text-mimu-text-dark dark:text-white">
                        {ev.price === 'Grátis' || !ev.price ? 'Grátis' : `${ev.price} Kz`}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-mimu-border-light dark:border-gray-800 pt-3 mt-1 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                    <div className="text-xs">
                      <div className="text-[10px] text-mimu-text-muted uppercase tracking-wider">Criador</div>
                      <div className="font-semibold text-mimu-text-dark dark:text-white">
                        {ev.profiles?.name || ev.profiles?.company_name || 'Desconhecido'}
                      </div>
                      <div className="text-[10px] text-mimu-text-muted capitalize">
                        {ev.profiles?.role || ev.type}
                      </div>
                    </div>

                    <div className="flex gap-2 justify-end">
                      {ev.status !== 'approved' && (
                        <button 
                          onClick={() => handleStatusChange(ev.id, 'approved')} 
                          className="flex-1 sm:flex-initial text-green-600 hover:text-green-800 font-bold text-xs px-3 py-2 bg-green-50 dark:bg-green-950/20 dark:text-green-400 rounded-xl border border-green-500/20 shadow-sm transition active:scale-95 cursor-pointer"
                        >
                          Aprovar
                        </button>
                      )}
                      {ev.status !== 'rejected' && (
                        <button 
                          onClick={() => handleStatusChange(ev.id, 'rejected')} 
                          className="flex-1 sm:flex-initial text-amber-600 hover:text-amber-800 font-bold text-xs px-3 py-2 bg-amber-50 dark:bg-amber-950/20 dark:text-amber-400 rounded-xl border border-amber-500/20 shadow-sm transition active:scale-95 cursor-pointer"
                        >
                          Rejeitar
                        </button>
                      )}
                      {ev.mkt360_event_id && (
                        <button
                          onClick={() => openTicketModal(ev)}
                          className="flex-1 sm:flex-initial text-blue-600 hover:text-blue-800 font-bold text-xs px-3 py-2 bg-blue-50 dark:bg-blue-950/20 dark:text-blue-400 rounded-xl border border-blue-500/20 shadow-sm transition active:scale-95 cursor-pointer"
                        >
                          🎫 Tickets
                        </button>
                      )}
                      <button 
                        onClick={() => handleDelete(ev.id)} 
                        className="flex-1 sm:flex-initial text-red-600 hover:text-red-800 font-bold text-xs px-3 py-2 bg-red-50 dark:bg-red-950/20 dark:text-red-400 rounded-xl border border-red-500/20 shadow-sm transition active:scale-95 cursor-pointer"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
    </div>

    {/* ======== MODAL DE GESTÃO DE TICKETS ======== */}
    {ticketModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <div className="bg-white dark:bg-[#1E1E1E] rounded-3xl border border-gray-200 dark:border-[#2A2A2A] shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
          <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-[#2A2A2A]">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">🎫 Gestão de Tickets</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate max-w-[400px]">{ticketModal.eventTitle}</p>
            </div>
            <button onClick={() => setTicketModal(null)}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-[#121212] text-gray-500 hover:text-white hover:bg-red-500 transition">
              ✕
            </button>
          </div>

          <div className="overflow-y-auto flex-1 p-5">
            {ticketsLoading ? (
              <div className="py-10 text-center text-gray-400">A carregar tickets...</div>
            ) : eventTickets.length === 0 ? (
              <div className="py-10 text-center">
                <span className="text-4xl block mb-3">🎟️</span>
                <p className="text-gray-400 text-sm">Nenhum ticket encontrado para este evento.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {eventTickets.map(ticket => (
                  <div key={ticket.id}
                    className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center gap-3 transition ${
                      ticket.is_blocked
                        ? 'border-red-500/30 bg-red-50/30 dark:bg-red-950/10'
                        : 'border-gray-200 dark:border-[#2A2A2A] bg-gray-50/50 dark:bg-[#121212]/30'
                    }`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-sm font-bold text-gray-800 dark:text-white">#{ticket.ticket_code}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          ticket.is_blocked ? 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400' :
                          ticket.status === 'NOT_USED' ? 'bg-green-100 text-green-700' :
                          ticket.status === 'INSIDE' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {ticket.is_blocked ? '🔒 Bloqueado' : ticket.status === 'NOT_USED' ? 'Disponível' : ticket.status === 'INSIDE' ? 'Check-in' : ticket.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        👤 {ticket.profiles?.name || 'Utilizador'} · {ticket.profiles?.email}
                      </p>
                      {ticket.is_blocked && ticket.blocked_reason && (
                        <p className="text-xs text-red-500 italic mt-0.5">🔒 Motivo: {ticket.blocked_reason}</p>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
                      {ticket.is_blocked ? (
                        <button
                          onClick={() => handleUnblock(ticket)}
                          disabled={blockingId === ticket.id}
                          className="px-3 py-1.5 text-xs font-bold bg-green-500 hover:bg-green-600 text-white rounded-xl transition active:scale-95 disabled:opacity-50">
                          {blockingId === ticket.id ? '...' : '🔓 Desbloquear'}
                        </button>
                      ) : (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Motivo (opcional)"
                            value={blockReasonMap[ticket.id] || ''}
                            onChange={e => setBlockReasonMap(prev => ({ ...prev, [ticket.id]: e.target.value }))}
                            className="px-2 py-1.5 text-xs rounded-xl border border-gray-300 dark:border-[#2A2A2A] bg-white dark:bg-[#121212] text-gray-800 dark:text-white focus:outline-none focus:border-red-400 w-36"
                          />
                          <button
                            onClick={() => handleBlock(ticket)}
                            disabled={blockingId === ticket.id}
                            className="px-3 py-1.5 text-xs font-bold bg-red-500 hover:bg-red-600 text-white rounded-xl transition active:scale-95 disabled:opacity-50">
                            {blockingId === ticket.id ? '...' : '🔒 Bloquear'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    )}
  </>
  )
}
