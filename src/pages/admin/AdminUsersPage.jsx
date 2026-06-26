import React, { useState, useMemo, useEffect } from 'react'
import { useAllUsers, approveUser, rejectUser } from '../../hooks/useAdmin'
import { sendBroadcastNotification, addNotification } from '../../hooks/useNotifications'

const formatDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('pt-PT', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

export default function AdminUsersPage() {
  const { users, reload, loading } = useAllUsers()
  const [processing, setProcessing] = useState(null)
  const [viewingUser, setViewingUser] = useState(null)
  const [filterRole, setFilterRole] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  // Notificações / Broadcast UI
  const [showBroadcastModal, setShowBroadcastModal] = useState(false)
  const [broadcastTarget, setBroadcastTarget] = useState('all')
  const [broadcastTitle, setBroadcastTitle] = useState('')
  const [broadcastMessage, setBroadcastMessage] = useState('')
  const [sendingBroadcast, setSendingBroadcast] = useState(false)

  const handleSendNotification = async () => {
    if (!broadcastTitle || !broadcastMessage) {
      alert('Preencha título e mensagem.')
      return
    }
    setSendingBroadcast(true)
    
    if (['all', 'client', 'company', 'provider'].includes(broadcastTarget)) {
      const { success } = await sendBroadcastNotification(broadcastTarget, broadcastTitle, broadcastMessage)
      if (success) alert('Comunicado enviado com sucesso!')
      else alert('Erro ao enviar comunicado.')
    } else {
      // É um utilizador específico (broadcastTarget === userId)
      await addNotification(broadcastTarget, broadcastTitle, broadcastMessage)
      alert('Mensagem enviada com sucesso ao utilizador!')
    }
    
    setSendingBroadcast(false)
    setShowBroadcastModal(false)
    setBroadcastTitle('')
    setBroadcastMessage('')
  }

  // Filter users based on broadcast target selection
  const targetUsers = useMemo(() => {
    if (broadcastTarget === 'all') return users
    if (broadcastTarget === 'client') return users.filter(u => u.role === 'client')
    if (broadcastTarget === 'company') return users.filter(u => u.role === 'company')
    if (broadcastTarget === 'provider') return users.filter(u => u.role === 'provider')
    return []
  }, [users, broadcastTarget])

  // Reload users when page regains focus
  useEffect(() => {
    const handleFocus = () => {
      console.log('Admin Users page gained focus - reloading data')
      reload()
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [reload])

  // Filter users based on role and status
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const roleMatch = !filterRole || u.role === filterRole
      const statusMatch = !filterStatus || u.status === filterStatus
      return roleMatch && statusMatch
    })
  }, [users, filterRole, filterStatus])

  const handleApprove = async (id) => {
    setProcessing(id)
    await approveUser(id)
    await reload()
    setProcessing(null)
  }

  const handleReject = async (id) => {
    if (!window.confirm("Tens a certeza que queres rejeitar esta conta?")) return
    setProcessing(id)
    await rejectUser(id)
    await reload()
    setProcessing(null)
  }

  return (
    <div className="w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-xl md:text-2xl sm:text-3xl font-bold text-mimu-wine-text dark:text-white mb-2">Gestão de Utilizadores</h1>
            <p className="text-mimu-wine-light-text dark:text-gray-300 text-sm sm:text-base">Total: {users.length} utilizadores registados</p>
          </div>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <button
              onClick={() => {
                setBroadcastTarget('all')
                setShowBroadcastModal(true)
              }}
              className="px-4 py-2 bg-mimu-gold text-mimu-wine-text dark:text-white text-white font-medium rounded-lg hover:bg-mimu-gold text-mimu-wine-text dark:text-white transition-colors flex items-center gap-2"
              title="Avisar Vários Utilizadores"
            >
              <span>📢</span> Comunicado
            </button>
            <button
              onClick={() => reload()}
              disabled={loading}
              className="px-4 py-2 bg-mimu-gold text-mimu-wine-text dark:text-white font-medium rounded-lg hover:bg-[#b87d26] disabled:opacity-50 transition-colors"
              title="Recarregar lista"
            >
              {loading ? '⟳ A carregar...' : '⟳ Recarregar'}
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-mimu-wine-text dark:text-white mb-2">Filtrar por Tipo</label>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-mimu-cream-border dark:border-[#2A2A2A] focus:border-mimu-gold focus:outline-none bg-mimu-white dark:bg-[#1E1E1E]"
            >
              <option value="">Todos os Tipos</option>
              <option value="client">Clientes</option>
              <option value="company">Empresas</option>
              <option value="provider">Prestadores</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-mimu-wine-text dark:text-white mb-2">Filtrar por Estado</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-mimu-cream-border dark:border-[#2A2A2A] focus:border-mimu-gold focus:outline-none bg-mimu-white dark:bg-[#1E1E1E]"
            >
              <option value="">Todos os Estados</option>
              <option value="active">Ativo</option>
              <option value="approved">Aprovado</option>
              <option value="pending_approval">Pendente</option>
              <option value="rejected">Rejeitado</option>
            </select>
          </div>
        </div>

        {loading ? (
           <p className="text-mimu-wine-text dark:text-white">A carregar...</p>
        ) : filteredUsers.length === 0 ? (
           <div className="bg-mimu-white dark:bg-[#1E1E1E] p-4 md:p-8 rounded-2xl shadow text-center text-mimu-wine-light-text dark:text-gray-300/80">
              {filterRole || filterStatus ? 'Nenhum utilizador encontrado com os filtros aplicados.' : 'Nenhum utilizador registado ainda.'}
           </div>
        ) : (
          <div className="overflow-x-auto -mx-4 sm:mx-0 sm:overflow-visible">
            <table className="w-full text-left bg-mimu-white dark:bg-[#1E1E1E] rounded-lg shadow-md text-sm sm:text-base min-w-max sm:min-w-0">
              <thead>
                <tr className="border-b border-mimu-border-light">
                  <th className="px-4 py-3 font-semibold text-mimu-wine-text dark:text-white">Nome / Empresa</th>
                  <th className="px-4 py-3 font-semibold text-mimu-wine-text dark:text-white">E-mail</th>
                  <th className="px-4 py-3 font-semibold text-mimu-wine-text dark:text-white">Telemóvel</th>
                  <th className="px-4 py-3 font-semibold text-mimu-wine-text dark:text-white">Função</th>
                  <th className="px-4 py-3 font-semibold text-mimu-wine-text dark:text-white">Estado</th>
                  <th className="px-4 py-3 font-semibold text-mimu-wine-text dark:text-white">Data de Criação</th>
                  <th className="px-4 py-3 font-semibold text-mimu-wine-text dark:text-white text-right">Ação</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="border-b border-mimu-border-light hover:bg-mimu-gray-50 dark:bg-[#121212] transition-colors">
                    <td className="px-4 py-3 text-mimu-wine-light-text dark:text-gray-300 font-medium">{u.name || u.company_name || 'N/A'}</td>
                    <td className="px-4 py-3 text-mimu-wine-light-text dark:text-gray-300 text-sm">{u.email || '-'}</td>
                    <td className="px-4 py-3 text-mimu-wine-light-text dark:text-gray-300">{u.phone || '-'}</td>
                    <td className="px-4 py-3 text-mimu-wine-light-text dark:text-gray-300 capitalize">
                      <span className="px-2 py-1 rounded bg-amber-100 text-amber-800 text-xs font-bold inline-block">
                        {u.role === 'client' ? 'Cliente' : u.role === 'company' ? 'Empresa' : u.role === 'provider' ? 'Prestador' : u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-mimu-wine-light-text dark:text-gray-300">
                      <span className={`px-2 py-1 rounded text-xs font-bold inline-block ${
                        u.status === 'active' ? 'bg-green-100 text-green-800' :
                        u.status === 'approved' ? 'bg-mimu-gold/20 text-mimu-gold' :
                        u.status === 'pending_approval' ? 'bg-yellow-100 text-yellow-800' :
                        u.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-mimu-gray-100 dark:bg-[#121212] text-mimu-text-dark dark:text-white'
                      }`}>
                        {u.status === 'active' ? 'Ativo' : u.status === 'approved' ? 'Aprovado' : u.status === 'pending_approval' ? 'Pendente' : u.status === 'rejected' ? 'Rejeitado' : u.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-mimu-wine-light-text dark:text-gray-300 text-sm">{formatDate(u.created_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => setViewingUser(u)}
                          className="px-3 py-1 bg-mimu-gold/20 text-mimu-gold hover:bg-mimu-gold/30 rounded font-medium text-xs"
                        >
                          Ver
                        </button>
                        {u.status === 'pending_approval' && (
                          <>
                            <button 
                              disabled={processing === u.id}
                              onClick={() => handleApprove(u.id)}
                              className="px-3 py-1 bg-green-100 text-green-700 hover:bg-green-200 rounded font-medium text-xs disabled:opacity-50"
                            >
                              Aprovar
                            </button>
                            <button 
                              disabled={processing === u.id}
                              onClick={() => handleReject(u.id)}
                              className="px-3 py-1 bg-red-100 text-red-700 hover:bg-red-200 rounded font-medium text-xs disabled:opacity-50"
                            >
                              Rejeitar
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal de View Profile */}
        {viewingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
            <div className="bg-mimu-white dark:bg-[#1E1E1E] rounded-2xl shadow-xl w-full max-w-2xl p-4 md:p-6 max-h-[90vh] overflow-y-auto relative mt-10 mb-10">
              <button 
                onClick={() => setViewingUser(null)}
                className="absolute top-4 right-4 text-mimu-text-muted hover:text-red-500"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
              
              <h2 className="text-xl md:text-2xl font-bold mb-6 text-mimu-wine-text dark:text-white border-b pb-2">Perfil Completo</h2>
              
              <div className="flex flex-col md:flex-row gap-6 mb-6">
                {(viewingUser.avatar_url || viewingUser.logo_url) ? (
                   <img 
                     src={viewingUser.logo_url || viewingUser.avatar_url} 
                     alt="Foto de Perfil" 
                     className="w-32 h-32 rounded-lg object-cover border-4 border-mimu-cream"
                   />
                ) : (
                   <div className="w-32 h-32 rounded-lg bg-mimu-gray-200 flex items-center justify-center text-mimu-text-muted font-bold border-4 border-mimu-cream text-xl md:text-2xl md:text-3xl md:text-4xl">
                      {(viewingUser.name || viewingUser.company_name || '?').charAt(0)}
                   </div>
                )}
                
                <div className="flex-1">
                   <h3 className="text-xl font-bold text-mimu-text-dark dark:text-white">{viewingUser.company_name || viewingUser.name}</h3>
                   <div className="mt-2 space-y-1 text-sm text-mimu-text-muted">
                      <p><strong className="text-mimu-wine-text dark:text-white">ID:</strong> {viewingUser.id}</p>
                      <p><strong className="text-mimu-wine-text dark:text-white">Email:</strong> {viewingUser.email}</p>
                      <p><strong className="text-mimu-wine-text dark:text-white">Telefone:</strong> {viewingUser.phone || 'N/A'}</p>
                      <p><strong className="text-mimu-wine-text dark:text-white">Função:</strong> <span className="uppercase text-amber-700 font-bold">{viewingUser.role}</span></p>
                      <p><strong className="text-mimu-wine-text dark:text-white">Localização:</strong> {viewingUser.province || 'N/A'}, {viewingUser.city || 'N/A'}</p>
                   </div>
                </div>
              </div>

              {viewingUser.description && (
                <div className="mb-6">
                  <h4 className="font-bold text-mimu-wine-text dark:text-white mb-2 border-b pb-1">Descrição</h4>
                  <p className="text-sm text-mimu-text-muted whitespace-pre-wrap">{viewingUser.description}</p>
                </div>
              )}

              {viewingUser.gallery_urls && viewingUser.gallery_urls.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-bold text-mimu-wine-text dark:text-white mb-2 border-b pb-1">Galeria (Carrossel)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 sm:grid-cols-4 gap-2">
                    {viewingUser.gallery_urls.map((url, i) => (
                       <img 
                         key={i} 
                         src={url} 
                         alt={`Gallery ${i}`} 
                         className="w-full aspect-square object-cover rounded shadow-sm border hover:scale-[1.02] cursor-pointer transition-transform" 
                         onClick={() => window.open(url, '_blank')}
                         title="Clique para ver no tamanho original"
                       />
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-8 flex gap-3 justify-end border-t pt-4">
                 <button 
                   onClick={() => {
                     setBroadcastTarget(viewingUser.id)
                     setShowBroadcastModal(true)
                   }}
                   className="px-6 py-2 bg-mimu-gold text-mimu-wine-text dark:text-white text-white rounded font-bold hover:bg-mimu-gold text-mimu-wine-text dark:text-white"
                 >
                   📩 Avisar Utilizador
                 </button>
                 <button 
                   onClick={() => setViewingUser(null)}
                   className="px-6 py-2 bg-mimu-gray-200 text-mimu-text-dark dark:text-white rounded font-bold hover:bg-mimu-gray-200"
                 >
                   Fechar
                 </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Comunicados */}
        {showBroadcastModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
            <div className="bg-mimu-white dark:bg-[#1E1E1E] rounded-2xl shadow-xl w-full max-w-md p-6">
              <h2 className="text-xl font-bold mb-4 text-mimu-wine-text dark:text-white">
                {['all', 'client', 'company', 'provider'].includes(broadcastTarget) ? 'Enviar Comunicado Global' : 'Enviar Mensagem Individual'}
              </h2>
              
              {['all', 'client', 'company', 'provider'].includes(broadcastTarget) && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-mimu-text-muted mb-1">Público Alvo</label>
                  <select 
                    value={broadcastTarget} 
                    onChange={(e) => setBroadcastTarget(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-mimu-gold"
                  >
                    <option value="all">Todos os Utilizadores</option>
                    <option value="client">Apenas Clientes</option>
                    <option value="company">Apenas Empresas</option>
                    <option value="provider">Apenas Prestadores</option>
                  </select>
                  <div className="mt-3">
                    <p className="text-sm text-mimu-wine-text dark:text-white font-bold mb-1">Público abrangerá: {targetUsers.length} utilizador(es)</p>
                    <div className="max-h-32 overflow-y-auto border rounded bg-mimu-gray-50 dark:bg-[#121212] p-2 text-xs space-y-1">
                      {targetUsers.map(u => (
                        <div key={u.id} className="truncate border-b border-mimu-border-light pb-1 last:border-0 last:pb-0 text-mimu-text-muted">
                          <span className="font-semibold">{u.name || u.company_name || 'Sem nome'}</span> - <span>{u.email || 'S/ Email'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-medium text-mimu-text-muted mb-1">Título/Assunto</label>
                <input 
                  type="text" 
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-mimu-gold"
                  placeholder="Ex: Atualização Terms & Cond."
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-mimu-text-muted mb-1">Mensagem</label>
                <textarea 
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  rows="4"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-mimu-gold"
                  placeholder="Escreve aqui o conteúdo da notificação..."
                ></textarea>
              </div>

              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setShowBroadcastModal(false)}
                  className="px-4 py-2 text-mimu-text-muted hover:text-mimu-text-dark dark:text-white font-medium"
                  disabled={sendingBroadcast}
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSendNotification}
                  disabled={sendingBroadcast}
                  className="px-6 py-2 bg-mimu-gold text-mimu-wine-text dark:text-white text-white rounded-lg hover:bg-mimu-gold text-mimu-wine-text dark:text-white font-medium disabled:opacity-50"
                >
                  {sendingBroadcast ? 'A Enviar...' : 'Enviar'}
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  )
}