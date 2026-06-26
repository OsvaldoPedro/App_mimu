import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useMyMKT360Tickets } from '../hooks/useMKT360'
import { supabase } from '../config/supabaseClient'

export default function MyTicketsPage() {
  const { user } = useAuth()
  const { theme } = useTheme()
  const { tickets, loading, error, reload } = useMyMKT360Tickets(user?.id)

  const [filter, setFilter] = useState('active') // 'all' | 'active' | 'used' | 'cancelled' | 'blocked'
  const [selectedTicket, setSelectedTicket] = useState(null)

  const [localEvents, setLocalEvents] = useState({})
  const [loadingEvents, setLoadingEvents] = useState(false)

  useEffect(() => {
    const fetchLocalEvents = async () => {
      if (!tickets || tickets.length === 0) return
      setLoadingEvents(true)
      const eventIds = [...new Set(tickets.map(t => t.event_id).filter(Boolean))]
      try {
        const { data, error: dbErr } = await supabase
          .from('events')
          .select('mkt360_event_id, title, location, date, image_url')
          .in('mkt360_event_id', eventIds)

        if (!dbErr && data) {
          const mapping = {}
          data.forEach(ev => {
            mapping[ev.mkt360_event_id] = ev
          })
          setLocalEvents(mapping)
        }
      } catch (err) {
        console.error('Erro ao carregar dados dos eventos:', err)
      } finally {
        setLoadingEvents(false)
      }
    }

    fetchLocalEvents()
  }, [tickets])

  // Realtime: actualizar bilhetes automaticamente quando o webhook alterar estado ou bloqueio
  useEffect(() => {
    if (!user?.id) return

    const channel = supabase
      .channel(`tickets-realtime-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tickets',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('[MyTickets] Realtime update recebido:', payload.eventType, payload.new)
          reload()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  // Filtragem dos bilhetes locais
  const filteredTickets = tickets.filter((tkt) => {
    if (filter === 'blocked') {
      return tkt.is_blocked === true
    }
    if (filter === 'active') {
      return !tkt.is_blocked && (tkt.status === 'NOT_USED' || tkt.status === 'OUTSIDE')
    }
    if (filter === 'used') {
      return tkt.status === 'INSIDE'
    }
    if (filter === 'cancelled') {
      return tkt.status === 'CANCELLED'
    }
    return true
  })

  const blockedCount = tickets.filter(t => t.is_blocked).length

  const getStatusBadge = (status, isBlocked) => {
    if (isBlocked) {
      return (
        <span className="px-2.5 py-1 bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-extrabold rounded-full uppercase tracking-wider">
          Bloqueado
        </span>
      )
    }
    switch (status) {
      case 'NOT_USED':
        return (
          <span className="px-2.5 py-1 bg-green-500/10 text-green-400 border border-green-500/20 text-[10px] font-extrabold rounded-full uppercase tracking-wider">
            Disponível
          </span>
        )
      case 'INSIDE':
        return (
          <span className="px-2.5 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-extrabold rounded-full uppercase tracking-wider">
            Utilizado
          </span>
        )
      case 'OUTSIDE':
        return (
          <span className="px-2.5 py-1 bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 text-[10px] font-extrabold rounded-full uppercase tracking-wider">
            Fora do Evento
          </span>
        )
      case 'CANCELLED':
        return (
          <span className="px-2.5 py-1 bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-extrabold rounded-full uppercase tracking-wider">
            Cancelado
          </span>
        )
      default:
        return (
          <span className="px-2.5 py-1 bg-gray-500/10 text-gray-400 border border-gray-500/20 text-[10px] font-extrabold rounded-full uppercase tracking-wider">
            {status}
          </span>
        )
    }
  }

  return (
    <div className={`min-h-screen pb-20 md:pb-0 transition-colors duration-300 ${
      theme === 'dark' ? 'bg-[#121212] text-white' : 'bg-mimu-cream text-mimu-text-dark'
    }`}>
      <Navbar />

      <div className="pt-28 pb-16 max-w-5xl mx-auto px-4 sm:px-6">
        
        {/* Cabeçalho */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className={`text-3xl font-extrabold tracking-tight transition-colors ${
              theme === 'dark' ? 'text-mimu-white-text' : 'text-mimu-wine-text'
            }`}>
              Os Meus Tickets
            </h1>
            <p className={`font-medium mt-1 text-sm ${theme === 'dark' ? 'text-mimu-text-muted' : 'text-mimu-wine-light-text'}`}>
              Gira as tuas inscrições, consulta QR Codes e acede à portaria dos eventos.
            </p>
          </div>

          <button 
            onClick={reload}
            className="px-4 py-2 text-xs font-bold bg-mimu-wine hover:bg-mimu-wine-light text-white rounded-xl shadow-md transition-all flex items-center gap-1.5"
          >
            <span>🔄</span> Sincronizar
          </button>
        </div>

        {/* Filtros de Status */}
        <div className={`mb-6 p-1.5 rounded-2xl flex gap-1 items-center border transition overflow-x-auto ${
          theme === 'dark' ? 'bg-[#1E1E1E] border-[#2A2A2A]' : 'bg-white border-mimu-border-light shadow-sm'
        }`}>
          {[
            { id: 'active', label: 'Ativos' },
            { id: 'used', label: 'Utilizados' },
            { id: 'cancelled', label: 'Cancelados' },
            { id: 'blocked', label: blockedCount > 0 ? `🔒 Bloqueados (${blockedCount})` : '🔒 Bloqueados' },
            { id: 'all', label: 'Todos' }
          ].map((opt) => (
            <button
              key={opt.id}
              onClick={() => setFilter(opt.id)}
              className={`flex-shrink-0 flex-1 py-2 px-3 rounded-xl text-xs font-extrabold transition-all ${
                filter === opt.id
                  ? opt.id === 'blocked'
                    ? 'bg-red-500/90 text-white shadow-sm'
                    : 'bg-mimu-gold text-mimu-text-dark shadow-sm'
                  : theme === 'dark'
                  ? 'text-gray-400 hover:text-white hover:bg-[#2A2A2A]'
                  : 'text-mimu-wine-light-text hover:text-mimu-wine hover:bg-mimu-cream'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Erro */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
            ⚠️ {error}
          </div>
        )}

        {/* Listagem */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div 
                key={i} 
                className={`h-32 rounded-2xl animate-pulse border ${
                  theme === 'dark' ? 'bg-[#1E1E1E] border-[#2A2A2A]' : 'bg-white border-mimu-border-light'
                }`}
              />
            ))}
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="text-center py-16 px-4">
            <span className="text-5xl block mb-4">🎟️</span>
            <h3 className="text-lg font-bold mb-1">Nenhum ticket encontrado</h3>
            <p className="text-gray-400 text-sm max-w-xs mx-auto">
              De momento não possuis ingressos {filter !== 'all' ? `com o estado selecionado` : ''} na tua conta.
            </p>
            {filter === 'active' && (
              <a 
                href="/eventos" 
                className="inline-block mt-5 px-5 py-2.5 bg-mimu-wine hover:bg-mimu-wine-light text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow"
              >
                Explorar Eventos
              </a>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredTickets.map((ticket) => {
              const isCancelled = ticket.status === 'CANCELLED'
              const isBlocked = ticket.is_blocked
              const associatedEvent = localEvents[ticket.event_id]

              return (
                <div
                  key={ticket.id}
                  onClick={() => !isCancelled && setSelectedTicket(ticket)}
                  className={`relative overflow-hidden rounded-3xl border transition-all duration-300 flex flex-col justify-between ${
                    isCancelled ? 'opacity-60 cursor-default' : 'cursor-pointer hover:shadow-lg hover:-translate-y-0.5'
                  } ${
                    theme === 'dark' 
                      ? 'bg-[#1E1E1E] border-[#2A2A2A] text-white' 
                      : 'bg-white border-mimu-border-light shadow-sm text-mimu-text-dark'
                  }`}
                >
                  
                  {/* Detalhe estético do Ticket (picotado nas laterais) */}
                  <div className="absolute top-1/2 -left-3 w-6 h-6 rounded-full bg-mimu-cream dark:bg-[#121212] border-r border-transparent"></div>
                  <div className="absolute top-1/2 -right-3 w-6 h-6 rounded-full bg-mimu-cream dark:bg-[#121212] border-l border-transparent"></div>

                  <div className="p-5 flex gap-4 items-start">
                    
                    {/* Elemento Visual Esquerdo do Ticket */}
                    {associatedEvent?.image_url ? (
                      <div className="w-16 h-16 shrink-0 rounded-2xl overflow-hidden border border-mimu-border-light dark:border-gray-800">
                        <img src={associatedEvent.image_url} alt="" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-16 h-16 shrink-0 rounded-2xl bg-mimu-gold/10 border border-mimu-gold/25 flex flex-col items-center justify-center text-center">
                        <span className="text-2xl">🎫</span>
                        <span className="text-[9px] font-black text-mimu-gold tracking-widest mt-1">GoTicket</span>
                      </div>
                    )}

                    {/* Dados Centrais */}
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex justify-between items-center gap-2">
                        {getStatusBadge(ticket.status, ticket.is_blocked)}
                        <span className="text-[10px] font-mono text-gray-500 truncate max-w-[100px]">
                          #{ticket.ticket_code}
                        </span>
                      </div>
                      
                      <h4 className="font-extrabold text-base truncate pr-2">
                        {associatedEvent?.title || `Evento #${ticket.event_id}`}
                      </h4>

                      {associatedEvent && (
                        <div className="text-xs text-gray-400 space-y-0.5">
                          <p>📍 {associatedEvent.location}</p>
                          <p>📅 {new Date(associatedEvent.date).toLocaleString('pt-PT')}</p>
                        </div>
                      )}

                      {isBlocked && (
                        <p className="text-xs text-red-500 font-semibold italic flex items-center gap-1">
                          <span>🔒 Motivo:</span> <span className="truncate max-w-[180px]">{ticket.blocked_reason || 'Não informado'}</span>
                        </p>
                      )}

                      <p className="text-xs text-gray-500">
                        Adquirido a: {new Date(ticket.created_at).toLocaleDateString('pt-PT')}
                      </p>
                    </div>

                  </div>

                  {/* Rodapé do Ticket */}
                  <div className={`px-5 py-3 border-t flex justify-between items-center text-xs ${
                    theme === 'dark' ? 'border-gray-800 bg-[#1A1A1A]/40' : 'border-gray-100 bg-gray-50/50'
                  }`}>
                    <span className="font-semibold text-gray-500">Ref: {ticket.order_ref}</span>
                    {!isCancelled && !isBlocked && (
                      <span className="text-mimu-gold font-bold flex items-center gap-1">
                        Visualizar QR Code 🔍
                      </span>
                    )}
                    {isBlocked && (
                      <span className="text-red-500 font-bold flex items-center gap-1">
                        🔒 Ticket Bloqueado
                      </span>
                    )}
                  </div>

                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal para Visualizar o QR Code */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className={`w-full max-w-sm rounded-3xl p-6 relative text-center border transition ${
            theme === 'dark' ? 'bg-[#1E1E1E] border-[#2A2A2A] text-white' : 'bg-white border-mimu-cream-border text-mimu-text-dark'
          }`}>
            <button
              onClick={() => setSelectedTicket(null)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-black/20 text-gray-400 hover:text-white rounded-full transition active:scale-95"
            >
              ✕
            </button>

            <h3 className="font-black text-xl mb-1 uppercase tracking-wider">O Teu Bilhete Digital</h3>
            <p className="text-xs text-gray-400 mb-6">
              {selectedTicket.is_blocked ? 'Acesso temporariamente suspenso.' : 'Apresenta este código de validação na portaria do evento.'}
            </p>

            {/* QR Code Container */}
            {selectedTicket.is_blocked ? (
              <div className="w-60 h-60 bg-red-500/5 border-2 border-dashed border-red-500/20 rounded-2xl mx-auto flex flex-col items-center justify-center p-4 text-red-500">
                <span className="text-4xl mb-2 animate-bounce">🔒</span>
                <p className="text-xs font-bold uppercase tracking-wider">🔒 Ticket Bloqueado</p>
                <p className="text-[10px] text-gray-400 mt-2 text-center leading-normal">
                  Este ticket não pode ser utilizado até ser desbloqueado pelo organizador.
                </p>
                {selectedTicket.blocked_reason && (
                  <div className="mt-3 p-2 bg-red-500/10 border border-red-500/20 rounded-xl w-full text-center">
                    <p className="text-[9px] text-red-400 uppercase tracking-wider font-bold">Motivo do Bloqueio</p>
                    <p className="text-[10px] text-red-300 mt-0.5 italic">"{selectedTicket.blocked_reason}"</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-60 h-60 bg-white p-3 rounded-2xl mx-auto shadow-inner flex items-center justify-center border border-gray-200">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(selectedTicket.qr_data)}`} 
                  alt="QR Code do Bilhete" 
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=250&h=250&q=80"; // fallback if offline
                  }}
                />
              </div>
            )}

            {/* Código do Ticket */}
            <div className="mt-5 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 block">Código Único</span>
              <span className="px-4 py-2 font-mono text-base font-extrabold bg-mimu-wine/10 dark:bg-white/5 border border-mimu-wine/20 dark:border-white/10 rounded-xl inline-block text-mimu-wine dark:text-mimu-gold">
                {selectedTicket.ticket_code}
              </span>
            </div>

            <div className={`mt-6 pt-4 border-t border-gray-700/20 text-left space-y-2 text-xs text-gray-400`}>
              <p>📍 <strong>Evento:</strong> {localEvents[selectedTicket.event_id]?.title || `#${selectedTicket.event_id}`}</p>
              {localEvents[selectedTicket.event_id] && (
                <>
                  <p>📍 <strong>Local:</strong> {localEvents[selectedTicket.event_id].location}</p>
                  <p>📅 <strong>Data:</strong> {new Date(localEvents[selectedTicket.event_id].date).toLocaleString('pt-PT')}</p>
                </>
              )}
              <p>🎫 <strong>Ordem:</strong> {selectedTicket.order_ref}</p>
              <p>⚙️ <strong>Estado:</strong> <span className="font-bold text-white uppercase">{selectedTicket.is_blocked ? 'BLOQUEADO' : (selectedTicket.status === 'NOT_USED' ? 'DISPONÍVEL (NÃO USADO)' : selectedTicket.status)}</span></p>
            </div>

            <button
              onClick={() => setSelectedTicket(null)}
              className="mt-6 w-full py-2.5 rounded-xl bg-mimu-gold hover:bg-mimu-gold/90 text-mimu-text-dark font-black uppercase text-xs tracking-wider shadow"
            >
              Concluído
            </button>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}
