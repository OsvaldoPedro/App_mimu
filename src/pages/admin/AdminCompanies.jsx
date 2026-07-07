import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAdminCompanies, updateUserStatus } from '../../hooks/useAdmin'

export default function AdminCompanies() {
  const { t } = useTranslation()
  const { companies, reload, loadMore, hasMore, loading } = useAdminCompanies()
  const [selectedCompany, setSelectedCompany] = useState(null)
  const [showDocuments, setShowDocuments] = useState(false)
  const [processingId, setProcessingId] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const updateStatus = async (id, status) => {
    setProcessingId(id)
    await updateUserStatus(id, status)
    await reload()
    setProcessingId(null)
  }

  const viewDocuments = (company) => {
    setSelectedCompany(company)
    setShowDocuments(true)
  }

  const closeDocuments = () => {
    setShowDocuments(false)
    setSelectedCompany(null)
  }

  const filteredCompanies = companies.filter(c => {
    const matchesSearch = !searchTerm || (c.nif && c.nif.includes(searchTerm));
    let matchesStatus = true;
    if (statusFilter === 'active') {
      matchesStatus = c.status === 'active' || c.status === 'approved';
    } else if (statusFilter === 'pending') {
      matchesStatus = c.status === 'pending_approval' || c.status === 'pending';
    } else if (statusFilter === 'suspended') {
      matchesStatus = c.status === 'suspended';
    }
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="w-full">
        <h1 className="text-xl md:text-2xl sm:text-3xl font-bold text-mimu-wine-text dark:text-white mb-6 md:mb-8">{t('admin.companies')}</h1>
        
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
             <p className="text-mimu-wine-light-text dark:text-gray-300">A carregar empresas...</p>
          ) : companies.length === 0 ? (
             <p className="text-mimu-wine-light-text dark:text-gray-300">Não existem empresas registadas.</p>
          ) : filteredCompanies.length === 0 ? (
             <p className="text-mimu-wine-light-text dark:text-gray-300">Nenhuma empresa corresponde aos filtros aplicados.</p>
          ) : (
            <>
             <div className="space-y-4">
               {filteredCompanies.map((company) => (
                 <div key={company.id} className="p-4 border rounded-lg">
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                     <div>
                       <h3 className="text-lg font-semibold text-mimu-wine-text dark:text-white">{company.company_name || company.name || 'Sem nome'}</h3>
                    <p className="text-sm text-mimu-wine-light-text dark:text-gray-300/80">NIF: {company.nif || 'Não preenchido'}</p>
                    <p className="text-sm text-mimu-wine-light-text dark:text-gray-300/80">{t('company.phone')}: {company.phone || 'N/A'}</p>
                    <p className="text-sm text-mimu-wine-light-text dark:text-gray-300/80">{t('company.professionalEmail')}: {company.email || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-mimu-wine-light-text dark:text-gray-300/80">{t('company.serviceCategory')}: {company.category || 'N/A'}</p>
                    <p className="text-sm text-mimu-wine-light-text dark:text-gray-300/80">{t('company.province')}: {company.province || 'N/A'}, {t('company.city')}: {company.municipality || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-mimu-wine-light-text dark:text-gray-300/80">{t('company.description')}: {company.description || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <span className={`px-2 py-1 rounded text-sm ${company.status === 'active' || company.status === 'approved' ? 'bg-green-100 text-green-800' :
                      (company.status === 'pending_approval' || company.status === 'pending') ? 'bg-amber-100 text-amber-800' :
                        company.status === 'suspended' ? 'bg-red-100 text-red-800' :
                          'bg-mimu-gray-100 dark:bg-[#121212] text-mimu-text-dark dark:text-white'
                    }`}>
                    {company.status === 'active' || company.status === 'approved' ? t('admin.status.approved') :
                      (company.status === 'pending_approval' || company.status === 'pending') ? t('admin.status.pending') :
                        company.status === 'suspended' ? t('admin.status.suspended') :
                          t('admin.status.rejected')}
                  </span>
                  <div className="space-x-2">
                    {(company.status === 'pending' || company.status === 'pending_approval') && (
                      <>
                        <button
                          disabled={processingId === company.id}
                          onClick={() => updateStatus(company.id, 'active')}
                          className="px-3 py-1 text-sm bg-green-500 text-mimu-white-text rounded hover:bg-green-600 disabled:opacity-50"
                        >
                          {t('admin.actions.approve')}
                        </button>
                        <button
                          disabled={processingId === company.id}
                          onClick={() => updateStatus(company.id, 'rejected')}
                          className="px-3 py-1 text-sm bg-red-500 text-mimu-white-text rounded hover:bg-red-600 disabled:opacity-50"
                        >
                          {t('admin.actions.reject')}
                        </button>
                      </>
                    )}
                    {(company.status === 'active' || company.status === 'approved') && (
                      <button
                        disabled={processingId === company.id}
                        onClick={() => updateStatus(company.id, 'suspended')}
                        className="px-3 py-1 text-sm bg-orange-500 text-mimu-white-text rounded hover:bg-orange-600 disabled:opacity-50"
                      >
                        {t('admin.suspendAccount')}
                      </button>
                    )}
                    {company.status === 'suspended' && (
                      <button
                        disabled={processingId === company.id}
                        onClick={() => updateStatus(company.id, 'active')}
                        className="px-3 py-1 text-sm bg-green-500 text-mimu-white-text rounded hover:bg-green-600 disabled:opacity-50"
                      >
                        Reativar Conta
                      </button>
                    )}
                    <button
                      onClick={() => viewDocuments(company)}
                      className="px-3 py-1 text-sm bg-mimu-gold text-mimu-white-text rounded hover:bg-[#b87d26]"
                    >
                      {t('admin.viewDocuments')}
                    </button>
                  </div>
                </div>
              </div>
            ))}
              </div>
              {hasMore && (
                <div className="mt-8 flex justify-center">
                  <button onClick={loadMore} disabled={loading} className="px-6 py-2 bg-mimu-gold hover:bg-mimu-gold-hover text-mimu-wine-text dark:text-white font-bold rounded-lg transition-colors shadow-sm">
                    Carregar Mais Empresas
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {showDocuments && selectedCompany && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-mimu-white dark:bg-[#1E1E1E] p-4 md:p-6 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <h2 className="text-xl font-bold text-mimu-wine-text dark:text-white mb-4">{t('admin.documents')} - {selectedCompany.company_name || selectedCompany.name}</h2>
              <div className="space-y-4">
                {selectedCompany.avatar_url && (
                  <div className="border rounded p-4 flex justify-between items-center bg-mimu-gray-50 dark:bg-[#121212]">
                    <div>
                       <p className="font-semibold capitalize">Foto / Logotipo</p>
                       <p className="text-sm text-mimu-text-muted">Validado via Supabase</p>
                    </div>
                    <button
                      onClick={() => window.open(selectedCompany.avatar_url, '_blank')}
                      className="px-3 py-1 text-sm bg-mimu-gold text-mimu-wine-text dark:text-white text-mimu-white-text rounded hover:bg-mimu-gold text-mimu-wine-text dark:text-white"
                    >
                      Abrir
                    </button>
                  </div>
                )}
                {selectedCompany.logo_url && (
                  <div className="border rounded p-4 flex justify-between items-center bg-mimu-gray-50 dark:bg-[#121212]">
                    <div>
                       <p className="font-semibold capitalize">Logotipo</p>
                       <p className="text-sm text-mimu-text-muted">Validado via Supabase</p>
                    </div>
                    <button
                      onClick={() => window.open(selectedCompany.logo_url, '_blank')}
                      className="px-3 py-1 text-sm bg-mimu-gold text-mimu-wine-text dark:text-white text-mimu-white-text rounded hover:bg-mimu-gold text-mimu-wine-text dark:text-white"
                    >
                      Abrir
                    </button>
                  </div>
                )}
                {selectedCompany.document_urls && Object.keys(selectedCompany.document_urls).length > 0 ? (
                  Object.entries(selectedCompany.document_urls).map(([key, value], index) => (
                    Array.isArray(value) ? (
                      value.map((url, i) => (
                        <div key={`${index}-${i}`} className="border rounded p-4 flex justify-between items-center">
                          <div>
                             <p className="font-semibold capitalize">{key.replace('_', ' ')} {i + 1}</p>
                             <p className="text-sm text-mimu-text-muted">Documento validado via Supabase</p>
                          </div>
                          <button
                            onClick={() => window.open(url, '_blank')}
                            className="px-3 py-1 text-sm bg-mimu-gold text-mimu-wine-text dark:text-white text-mimu-white-text rounded hover:bg-mimu-gold text-mimu-wine-text dark:text-white"
                          >
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
                        <button
                          onClick={() => window.open(value, '_blank')}
                          className="px-3 py-1 text-sm bg-mimu-gold text-mimu-wine-text dark:text-white text-mimu-white-text rounded hover:bg-mimu-gold text-mimu-wine-text dark:text-white"
                        >
                          Abrir
                        </button>
                      </div>
                    )
                  ))
                ) : (
                  (!selectedCompany.avatar_url && !selectedCompany.logo_url) && (
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