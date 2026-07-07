import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAdminProviders, updateUserStatus } from '../../hooks/useAdmin'
import { supabase } from '../../config/supabaseClient'

export default function AdminProviders() {
  const { t } = useTranslation()
  const { providers, reload, loading } = useAdminProviders()
  const [selectedProvider, setSelectedProvider] = useState(null)
  const [showDocuments, setShowDocuments] = useState(false)
  const [processingId, setProcessingId] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Prestadores criados pelas empresas (company_partners)
  const [companyPartners, setCompanyPartners] = useState([])
  const [partnersLoading, setPartnersLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('registados') // 'registados' | 'empresas'

  useEffect(() => {
    const loadCompanyPartners = async () => {
      setPartnersLoading(true)
      const { data, error } = await supabase
        .from('company_partners')
        .select('*, company:company_id(id, company_name, email, phone)')
        .order('created_at', { ascending: false })

      if (!error && data) {
        setCompanyPartners(data)
      }
      setPartnersLoading(false)
    }
    loadCompanyPartners()
  }, [])

  const updateStatus = async (id, status) => {
    setProcessingId(id)
    await updateUserStatus(id, status)
    await reload()
    setProcessingId(null)
  }

  const viewDocuments = (provider) => {
    setSelectedProvider(provider)
    setShowDocuments(true)
  }

  const closeDocuments = () => {
    setShowDocuments(false)
    setSelectedProvider(null)
  }

  const filteredProviders = providers.filter(p => {
    const matchesSearch = !searchTerm || (p.nif && p.nif.includes(searchTerm));
    let matchesStatus = true;
    if (statusFilter === 'active') {
      matchesStatus = p.status === 'active' || p.status === 'approved';
    } else if (statusFilter === 'pending') {
      matchesStatus = p.status === 'pending_approval' || p.status === 'pending';
    } else if (statusFilter === 'suspended') {
      matchesStatus = p.status === 'suspended';
    }
    return matchesSearch && matchesStatus;
  });

  // Agrupar parceiros por empresa
  const partnersByCompany = companyPartners.reduce((acc, partner) => {
    const companyId = partner.company_id
    if (!acc[companyId]) {
      acc[companyId] = {
        company: partner.company || { id: companyId, company_name: 'Empresa Desconhecida' },
        partners: []
      }
    }
    acc[companyId].partners.push(partner)
    return acc
  }, {})

  const totalPartners = companyPartners.length
  const activePartners = companyPartners.filter(p => p.status === 'active').length

  return (
    <div className="w-full">
      <h1 className="text-xl md:text-2xl sm:text-3xl font-bold text-mimu-wine-text dark:text-white mb-6 md:mb-8">
        {t('admin.providers')}
      </h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-mimu-cream-border dark:border-[#2A2A2A]">
        <button
          onClick={() => setActiveTab('registados')}
          className={`px-5 py-2.5 text-sm font-bold rounded-t-xl transition-all duration-200 ${
            activeTab === 'registados'
              ? 'bg-mimu-wine text-white'
              : 'text-mimu-wine-light-text dark:text-gray-400 hover:text-mimu-wine dark:hover:text-white'
          }`}
        >
          👤 Prestadores Registados ({providers.length})
        </button>
        <button
          onClick={() => setActiveTab('empresas')}
          className={`px-5 py-2.5 text-sm font-bold rounded-t-xl transition-all duration-200 ${
            activeTab === 'empresas'
              ? 'bg-mimu-wine text-white'
              : 'text-mimu-wine-light-text dark:text-gray-400 hover:text-mimu-wine dark:hover:text-white'
          }`}
        >
          🏢 Criados por Empresas ({totalPartners})
        </button>
      </div>

      {/* ===== TAB: PRESTADORES REGISTADOS ===== */}
      {activeTab === 'registados' && (
        <>
          <div className="mb-6 flex flex-col md:flex-row gap-4">
            <input
              type="text"
              placeholder="Pesquisar por NIF..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-1/3 px-4 py-2 rounded-xl border-2 border-mimu-cream-border dark:border-[#2A2A2A] focus:border-mimu-gold focus:outline-none dark:bg-[#1E1E1E] text-mimu-wine-text dark:text-white"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full md:w-1/4 px-4 py-2 rounded-xl border-2 border-mimu-cream-border dark:border-[#2A2A2A] focus:border-mimu-gold focus:outline-none dark:bg-[#1E1E1E] text-mimu-wine-text dark:text-white"
            >
              <option value="all">Todos os Estados</option>
              <option value="active">Aprovados</option>
              <option value="pending">Pendentes</option>
              <option value="suspended">Suspensos</option>
            </select>
          </div>

          <div className="bg-mimu-white dark:bg-[#1E1E1E] p-4 sm:p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300">
            {loading ? (
              <p className="text-mimu-wine-light-text dark:text-gray-300">A carregar prestadores...</p>
            ) : providers.length === 0 ? (
              <p className="text-mimu-wine-light-text dark:text-gray-300">Não existem prestadores registados.</p>
            ) : filteredProviders.length === 0 ? (
              <p className="text-mimu-wine-light-text dark:text-gray-300">Nenhum prestador corresponde aos filtros aplicados.</p>
            ) : (
              <div className="space-y-4">
                {filteredProviders.map((provider) => (
                  <div key={provider.id} className="p-4 border rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-mimu-wine-text dark:text-white">{provider.name}</h3>
                        <p className="text-sm text-mimu-wine-light-text dark:text-gray-300/80">NIF: {provider.nif || 'Não preenchido'}</p>
                        <p className="text-sm text-mimu-wine-light-text dark:text-gray-300/80">{t('company.phone')}: {provider.phone || 'N/A'}</p>
                        <p className="text-sm text-mimu-wine-light-text dark:text-gray-300/80">{t('company.professionalEmail')}: {provider.email || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-mimu-wine-light-text dark:text-gray-300/80">{t('company.serviceCategory')}: {provider.category || 'N/A'}</p>
                        <p className="text-sm text-mimu-wine-light-text dark:text-gray-300/80">{t('company.province')}: {provider.province || 'N/A'}, {t('company.city')}: {provider.municipality || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-mimu-wine-light-text dark:text-gray-300/80">{t('company.description')}: {provider.description || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <span className={`px-2 py-1 rounded text-sm ${
                        provider.status === 'active' || provider.status === 'approved' ? 'bg-green-100 text-green-800' :
                        (provider.status === 'pending_approval' || provider.status === 'pending') ? 'bg-amber-100 text-amber-800' :
                        provider.status === 'suspended' ? 'bg-red-100 text-red-800' :
                        'bg-mimu-gray-100 dark:bg-[#121212] text-mimu-text-dark dark:text-white'
                      }`}>
                        {provider.status === 'active' || provider.status === 'approved' ? t('admin.status.approved') :
                         (provider.status === 'pending_approval' || provider.status === 'pending') ? t('admin.status.pending') :
                         provider.status === 'suspended' ? t('admin.status.suspended') :
                         t('admin.status.rejected')}
                      </span>
                      <div className="space-x-2">
                        {(provider.status === 'pending' || provider.status === 'pending_approval') && (
                          <>
                            <button
                              disabled={processingId === provider.id}
                              onClick={() => updateStatus(provider.id, 'active')}
                              className="px-3 py-1 text-sm bg-green-500 text-mimu-white-text rounded hover:bg-green-600 disabled:opacity-50"
                            >
                              {t('admin.actions.approve')}
                            </button>
                            <button
                              disabled={processingId === provider.id}
                              onClick={() => updateStatus(provider.id, 'rejected')}
                              className="px-3 py-1 text-sm bg-red-500 text-mimu-white-text rounded hover:bg-red-600 disabled:opacity-50"
                            >
                              {t('admin.actions.reject')}
                            </button>
                          </>
                        )}
                        {(provider.status === 'active' || provider.status === 'approved') && (
                          <button
                            disabled={processingId === provider.id}
                            onClick={() => updateStatus(provider.id, 'suspended')}
                            className="px-3 py-1 text-sm bg-orange-500 text-mimu-white-text rounded hover:bg-orange-600 disabled:opacity-50"
                          >
                            {t('admin.suspendAccount')}
                          </button>
                        )}
                        {provider.status === 'suspended' && (
                          <button
                            disabled={processingId === provider.id}
                            onClick={() => updateStatus(provider.id, 'active')}
                            className="px-3 py-1 text-sm bg-green-500 text-mimu-white-text rounded hover:bg-green-600 disabled:opacity-50"
                          >
                            Reativar Conta
                          </button>
                        )}
                        <button
                          onClick={() => viewDocuments(provider)}
                          className="px-3 py-1 text-sm bg-mimu-gold text-mimu-wine-text dark:text-white rounded hover:bg-[#b87d26]"
                        >
                          {t('admin.viewDocuments')}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* ===== TAB: CRIADOS POR EMPRESAS ===== */}
      {activeTab === 'empresas' && (
        <>
          {/* Estatísticas */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-mimu-white dark:bg-[#1E1E1E] p-4 rounded-2xl shadow-sm border border-mimu-cream-border dark:border-[#2A2A2A]">
              <p className="text-xs font-semibold text-mimu-wine-light-text dark:text-gray-400 uppercase tracking-wider">Total de Prestadores</p>
              <p className="text-3xl font-extrabold text-mimu-wine-text dark:text-white mt-1">{totalPartners}</p>
            </div>
            <div className="bg-mimu-white dark:bg-[#1E1E1E] p-4 rounded-2xl shadow-sm border border-mimu-cream-border dark:border-[#2A2A2A]">
              <p className="text-xs font-semibold text-mimu-wine-light-text dark:text-gray-400 uppercase tracking-wider">Ativos</p>
              <p className="text-3xl font-extrabold text-green-600 mt-1">{activePartners}</p>
            </div>
            <div className="bg-mimu-white dark:bg-[#1E1E1E] p-4 rounded-2xl shadow-sm border border-mimu-cream-border dark:border-[#2A2A2A]">
              <p className="text-xs font-semibold text-mimu-wine-light-text dark:text-gray-400 uppercase tracking-wider">Empresas com Prestadores</p>
              <p className="text-3xl font-extrabold text-mimu-gold mt-1">{Object.keys(partnersByCompany).length}</p>
            </div>
          </div>

          {partnersLoading ? (
            <div className="text-center py-10 text-mimu-wine-light-text dark:text-gray-400">A carregar prestadores das empresas...</div>
          ) : totalPartners === 0 ? (
            <div className="text-center py-16 bg-mimu-white dark:bg-[#1E1E1E] rounded-2xl border border-mimu-cream-border dark:border-[#2A2A2A]">
              <p className="text-4xl mb-4">👥</p>
              <p className="text-lg font-semibold text-mimu-wine-text dark:text-white">Nenhuma empresa adicionou prestadores ainda.</p>
              <p className="text-sm text-mimu-wine-light-text dark:text-gray-400 mt-1">Os prestadores criados pelas empresas aparecerão aqui agrupados por empresa.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.values(partnersByCompany).map(({ company, partners: cPartners }) => (
                <div key={company.id} className="bg-mimu-white dark:bg-[#1E1E1E] rounded-2xl border border-mimu-cream-border dark:border-[#2A2A2A] overflow-hidden shadow-sm">
                  {/* Cabeçalho da empresa */}
                  <div className="flex items-center justify-between p-4 bg-mimu-wine/5 dark:bg-mimu-gold/5 border-b border-mimu-cream-border dark:border-[#2A2A2A]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-mimu-wine flex items-center justify-center text-white font-bold text-sm">
                        {(company.company_name || 'E')[0]}
                      </div>
                      <div>
                        <p className="font-bold text-mimu-wine-text dark:text-white">{company.company_name || 'Empresa'}</p>
                        <p className="text-xs text-mimu-wine-light-text dark:text-gray-400">{company.email || ''} {company.phone ? `• ${company.phone}` : ''}</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-mimu-gold/20 text-mimu-wine-text dark:text-mimu-gold rounded-full text-xs font-bold">
                      {cPartners.length} prestador{cPartners.length !== 1 ? 'es' : ''}
                    </span>
                  </div>

                  {/* Lista de prestadores desta empresa */}
                  <div className="divide-y divide-mimu-cream-border dark:divide-[#2A2A2A]">
                    {cPartners.map(p => (
                      <div key={p.id} className="p-4 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-mimu-gold/20 flex items-center justify-center overflow-hidden text-sm font-bold text-mimu-wine-text dark:text-white shrink-0">
                            {p.photo ? (
                              <img src={p.photo} alt={p.name} className="w-full h-full object-cover" />
                            ) : (
                              (p.name?.[0] || 'P')
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-mimu-wine-text dark:text-white">{p.name}</p>
                            <div className="flex items-center gap-3 text-xs text-mimu-wine-light-text dark:text-gray-400 mt-0.5">
                              {p.phone && <span>📞 {p.phone}</span>}
                              {p.category_id && <span>🏷️ {p.category_id}</span>}
                              <span>🕒 {new Date(p.created_at).toLocaleDateString('pt-PT')}</span>
                            </div>
                          </div>
                        </div>
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                          p.status === 'active'
                            ? 'bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-400'
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-800/30 dark:text-gray-400'
                        }`}>
                          {p.status === 'active' ? '✅ Ativo' : '⏸ Inativo'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Modal de Documentos */}
      {showDocuments && selectedProvider && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-mimu-white dark:bg-[#1E1E1E] p-4 md:p-6 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-mimu-wine-text dark:text-white mb-4">{t('admin.documents')} - {selectedProvider.name}</h2>
            <div className="space-y-4">
              {selectedProvider.avatar_url && (
                <div className="border rounded p-4 flex justify-between items-center bg-mimu-gray-50 dark:bg-[#121212]">
                  <div>
                    <p className="font-semibold capitalize">Foto do Rosto</p>
                    <p className="text-sm text-mimu-text-muted">Validado via Supabase</p>
                  </div>
                  <button
                    onClick={() => window.open(selectedProvider.avatar_url, '_blank')}
                    className="px-3 py-1 text-sm bg-mimu-gold text-mimu-wine-text dark:text-white rounded hover:bg-[#b87d26]"
                  >
                    Abrir
                  </button>
                </div>
              )}
              {selectedProvider.document_urls && Object.keys(selectedProvider.document_urls).length > 0 ? (
                Object.entries(selectedProvider.document_urls).map(([key, value], index) => (
                  Array.isArray(value) ? (
                    value.map((url, i) => (
                      <div key={`${index}-${i}`} className="border rounded p-4 flex justify-between items-center">
                        <div>
                          <p className="font-semibold capitalize">{key.replace('_', ' ')} {i + 1}</p>
                          <p className="text-sm text-mimu-text-muted">Documento validado via Supabase</p>
                        </div>
                        <button onClick={() => window.open(url, '_blank')} className="px-3 py-1 text-sm bg-mimu-gold text-mimu-wine-text dark:text-white rounded hover:bg-[#b87d26]">
                          Abrir
                        </button>
                      </div>
                    ))
                  ) : (
                    <div key={index} className="border rounded p-4 flex justify-between items-center">
                      <div>
                        <p className="font-semibold capitalize">{key.replace('_', ' ')}</p>
                        <p className="text-sm text-mimu-text-muted">Documento validado via Supabase</p>
                      </div>
                      <button onClick={() => window.open(value, '_blank')} className="px-3 py-1 text-sm bg-mimu-gold text-mimu-wine-text dark:text-white rounded hover:bg-[#b87d26]">
                        Abrir
                      </button>
                    </div>
                  )
                ))
              ) : (
                (!selectedProvider.avatar_url) && (
                  <p className="text-mimu-text-muted">{t('admin.documents')} não disponíveis</p>
                )
              )}
            </div>
            <button
              onClick={closeDocuments}
              className="mt-4 px-4 py-2 bg-gray-500 text-mimu-white-text rounded hover:bg-gray-600 transition-all duration-300 hover:shadow-md active:scale-95 min-h-[44px]"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}