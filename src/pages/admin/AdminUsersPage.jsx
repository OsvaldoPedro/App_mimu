import React, { useState, useMemo, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAllUsers, approveUser, rejectUser, deleteUser } from '../../hooks/useAdmin'
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
  const { t } = useTranslation()
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
      alert(t('admin.users.broadcastFillAll'))
      return
    }
    setSendingBroadcast(true)
    
    if (['all', 'client', 'company', 'provider'].includes(broadcastTarget)) {
      const { success, count } = await sendBroadcastNotification(broadcastTarget, broadcastTitle, broadcastMessage)
      if (success) alert(`${t('admin.users.broadcastSuccess')} (${count} utilizadores notificados)`)
      else alert(t('admin.users.broadcastError'))
    } else {
      // É um utilizador específico (broadcastTarget === userId)
      await addNotification(broadcastTarget, broadcastTitle, broadcastMessage)
      alert(t('admin.users.broadcastSentUser'))
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
    if (!window.confirm(t('admin.users.rejectConfirm'))) return
    setProcessing(id)
    await rejectUser(id)
    await reload()
    setProcessing(null)
  }

  const handleDelete = async (id) => {
    if (!window.confirm(t('admin.users.deleteConfirm'))) return
    setProcessing(id)
    const result = await deleteUser(id)
    if (result.success) {
      alert(t('admin.users.deleteSuccess'))
    } else {
      alert(t('admin.users.deleteError') + ': ' + result.error)
    }
    await reload()
    setProcessing(null)
  }

  return (
    <div className="w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-xl md:text-2xl sm:text-3xl font-bold text-mimu-wine-text dark:text-white mb-2">{t('admin.users.title')}</h1>
            <p className="text-mimu-wine-light-text dark:text-gray-300 text-sm sm:text-base">Total: {users.length} {t('admin.users.totalUsers')}</p>
          </div>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <button
              onClick={() => {
                setBroadcastTarget('all')
                setShowBroadcastModal(true)
              }}
              className="px-4 py-2 bg-mimu-gold text-mimu-wine-text dark:text-white text-white font-medium rounded-lg hover:bg-mimu-gold text-mimu-wine-text dark:text-white transition-colors flex items-center gap-2"
              title={t('admin.users.broadcastTitle')}
            >
              <span>📢</span> {t('admin.users.broadcast')}
            </button>
            <button
              onClick={() => reload()}
              disabled={loading}
              className="px-4 py-2 bg-mimu-gold text-mimu-wine-text dark:text-white font-medium rounded-lg hover:bg-[#b87d26] disabled:opacity-50 transition-colors"
              title={t('admin.users.reload')}
            >
              {loading ? t('admin.users.loading') : t('admin.users.reload')}
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-mimu-wine-text dark:text-white mb-2">{t('admin.users.filterByType')}</label>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-mimu-cream-border dark:border-[#2A2A2A] focus:border-mimu-gold focus:outline-none bg-mimu-white dark:bg-[#1E1E1E]"
            >
              <option value="">{t('admin.users.allTypes')}</option>
              <option value="client">{t('admin.users.clients')}</option>
              <option value="company">{t('admin.users.companies')}</option>
              <option value="provider">{t('admin.users.providers')}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-mimu-wine-text dark:text-white mb-2">{t('admin.users.filterByStatus')}</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-mimu-cream-border dark:border-[#2A2A2A] focus:border-mimu-gold focus:outline-none bg-mimu-white dark:bg-[#1E1E1E]"
            >
              <option value="">{t('admin.users.allStatuses')}</option>
              <option value="active">{t('admin.users.active')}</option>
              <option value="approved">{t('admin.users.approved')}</option>
              <option value="pending_approval">{t('admin.users.pending')}</option>
              <option value="rejected">{t('admin.users.rejected')}</option>
            </select>
          </div>
        </div>

        {loading ? (
           <p className="text-mimu-wine-text dark:text-white">{t('admin.users.loading')}</p>
        ) : filteredUsers.length === 0 ? (
           <div className="bg-mimu-white dark:bg-[#1E1E1E] p-4 md:p-8 rounded-2xl shadow text-center text-mimu-wine-light-text dark:text-gray-300/80">
              filterRole || filterStatus ? t('admin.users.noUsersFiltered') : t('admin.users.noUsers')
           </div>
        ) : (
          <div className="overflow-x-auto -mx-4 sm:mx-0 sm:overflow-visible">
            <table className="w-full text-left bg-mimu-white dark:bg-[#1E1E1E] rounded-lg shadow-md text-sm sm:text-base min-w-max sm:min-w-0">
              <thead>
                <tr className="border-b border-mimu-border-light">
                  <th className="px-4 py-3 font-semibold text-mimu-wine-text dark:text-white">{t('admin.users.nameCompany')}</th>
                  <th className="px-4 py-3 font-semibold text-mimu-wine-text dark:text-white">{t('admin.users.email')}</th>
                  <th className="px-4 py-3 font-semibold text-mimu-wine-text dark:text-white">{t('admin.users.phone')}</th>
                  <th className="px-4 py-3 font-semibold text-mimu-wine-text dark:text-white">{t('admin.users.role')}</th>
                  <th className="px-4 py-3 font-semibold text-mimu-wine-text dark:text-white">{t('admin.users.statusCol')}</th>
                  <th className="px-4 py-3 font-semibold text-mimu-wine-text dark:text-white">{t('admin.users.createdAt')}</th>
                  <th className="px-4 py-3 font-semibold text-mimu-wine-text dark:text-white text-right">{t('admin.users.action')}</th>
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
                        {u.role === 'client' ? t('admin.users.client') : u.role === 'company' ? t('admin.users.company') : u.role === 'provider' ? t('admin.users.provider') : u.role}
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
                        {u.status === 'active' ? t('admin.users.active') : u.status === 'approved' ? t('admin.users.approved') : u.status === 'pending_approval' ? t('admin.users.pending') : u.status === 'rejected' ? t('admin.users.rejected') : u.status}
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
                        <button 
                          disabled={processing === u.id}
                          onClick={() => handleDelete(u.id)}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded font-medium text-xs disabled:opacity-50"
                        >
                          Apagar
                        </button>
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
              
              <h2 className="text-xl md:text-2xl font-bold mb-6 text-mimu-wine-text dark:text-white border-b pb-2">{t('admin.users.userDetails')}</h2>
              
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
                      <p><strong className="text-mimu-wine-text dark:text-white">{t('admin.users.email')}:</strong> {viewingUser.email}</p>
                      <p><strong className="text-mimu-wine-text dark:text-white">{t('admin.users.phone')}:</strong> {viewingUser.phone || 'N/A'}</p>
                      <p><strong className="text-mimu-wine-text dark:text-white">{t('admin.users.role')}:</strong> <span className="uppercase text-amber-700 font-bold">{viewingUser.role}</span></p>
                      <p><strong className="text-mimu-wine-text dark:text-white">{t('listing.location')}:</strong> {viewingUser.province || 'N/A'}, {viewingUser.city || 'N/A'}</p>
                   </div>
                </div>
              </div>

              {viewingUser.description && (
                <div className="mb-6">
                  <h4 className="font-bold text-mimu-wine-text dark:text-white mb-2 border-b pb-1">{t('more.description')}</h4>
                  <p className="text-sm text-mimu-text-muted whitespace-pre-wrap">{viewingUser.description}</p>
                </div>
              )}

              {viewingUser.gallery_urls && viewingUser.gallery_urls.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-bold text-mimu-wine-text dark:text-white mb-2 border-b pb-1">{t('listing.gallery')}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 sm:grid-cols-4 gap-2">
                    {viewingUser.gallery_urls.map((url, i) => (
                       <img 
                         key={i} 
                         src={url} 
                         alt={`Gallery ${i}`} 
                         className="w-full aspect-square object-cover rounded shadow-sm border hover:scale-[1.02] cursor-pointer transition-transform" 
                         onClick={() => window.open(url, '_blank')}
                         title={t('admin.users.viewOriginal')}
                       />
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-8 flex gap-3 justify-end border-t pt-4">
                  <button 
                    disabled={processing === viewingUser.id}
                    onClick={async () => {
                      if (window.confirm(t('admin.users.deleteConfirm'))) {
                        setProcessing(viewingUser.id)
                        const result = await deleteUser(viewingUser.id)
                        if (result.success) {
                          alert(t('admin.users.deleteSuccess'))
                          setViewingUser(null)
                          reload()
                        } else {
                          alert(t('admin.users.deleteError') + ': ' + result.error)
                        }
                        setProcessing(null)
                      }
                    }}
                    className="px-6 py-2 bg-red-600 text-white rounded font-bold hover:bg-red-700 disabled:opacity-50"
                  >
                    🗑️ Apagar Conta
                  </button>
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
                ['all', 'client', 'company', 'provider'].includes(broadcastTarget) ? t('admin.users.broadcastTitle') : t('admin.users.notifyBtn')
              </h2>
              
              {['all', 'client', 'company', 'provider'].includes(broadcastTarget) && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-mimu-text-muted mb-1">{t('admin.users.broadcastTo')}</label>
                  <select 
                    value={broadcastTarget} 
                    onChange={(e) => setBroadcastTarget(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-mimu-gold"
                  >
                    <option value="all">{t('admin.users.broadcastAllUsers')}</option>
                    <option value="client">{t('admin.users.clients')}</option>
                    <option value="company">{t('admin.users.companies')}</option>
                    <option value="provider">{t('admin.users.providers')}</option>
                  </select>
                  <div className="mt-3">
                    <p className="text-sm text-mimu-wine-text dark:text-white font-bold mb-1">{t('admin.users.broadcastTargetCount')}: {targetUsers.length}</p>
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
                <label className="block text-sm font-medium text-mimu-text-muted mb-1">{t('admin.users.broadcastTitleField')}</label>
                <input 
                  type="text" 
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-mimu-gold"
                  placeholder={t('admin.users.broadcastTitleField')}
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-mimu-text-muted mb-1">{t('admin.users.broadcastMessage')}</label>
                <textarea 
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  rows="4"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-mimu-gold"
                  placeholder={t('admin.users.broadcastMessagePlaceholder') || ''}
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
                  {sendingBroadcast ? t('admin.users.broadcastSending') : t('admin.users.broadcastSend')}
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  )
}