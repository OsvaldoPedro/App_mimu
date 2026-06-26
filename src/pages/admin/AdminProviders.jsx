import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAdminProviders, updateUserStatus } from '../../hooks/useAdmin'

export default function AdminProviders() {
  const { t } = useTranslation()
  const { providers, reload, loading } = useAdminProviders()
  const [selectedProvider, setSelectedProvider] = useState(null)
  const [showDocuments, setShowDocuments] = useState(false)
  const [processingId, setProcessingId] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')

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

  return (
    <div className="w-full">
        <h1 className="text-xl md:text-2xl sm:text-3xl font-bold text-mimu-wine-text dark:text-white mb-6 md:mb-8">{t('admin.providers')}</h1>

        <div className="mb-6">
          <input
            type="text"
            placeholder="Pesquisar por NIF..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-1/3 px-4 py-2 rounded-xl border-2 border-mimu-cream-border dark:border-[#2A2A2A] focus:border-mimu-gold focus:outline-none dark:bg-[#1E1E1E] text-mimu-wine-text dark:text-white"
          />
        </div>

        <div className="bg-mimu-white dark:bg-[#1E1E1E] p-4 sm:p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300">
          {loading ? (
             <p className="text-mimu-wine-light-text dark:text-gray-300">A carregar prestadores...</p>
          ) : providers.length === 0 ? (
             <p className="text-mimu-wine-light-text dark:text-gray-300">Não existem prestadores registados.</p>
          ) : (
          <div className="space-y-4">
            {providers.filter(p => !searchTerm || (p.nif && p.nif.includes(searchTerm))).map((provider) => (
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
                      className="px-3 py-1 text-sm bg-mimu-gold text-mimu-white-text rounded hover:bg-[#b87d26]"
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
                      className="px-3 py-1 text-sm bg-mimu-gold text-mimu-wine-text dark:text-white text-mimu-white-text rounded hover:bg-mimu-gold text-mimu-wine-text dark:text-white"
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