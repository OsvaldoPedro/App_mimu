import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import AdminSidebar from '../../components/AdminSidebar'
import { storage, KEYS } from '../../utils/storage'

export default function AdminCompanies() {
  const { t } = useTranslation()
  const [companies, setCompanies] = useState([])
  const [selectedCompany, setSelectedCompany] = useState(null)
  const [showDocuments, setShowDocuments] = useState(false)

  useEffect(() => {
    const users = storage.get(KEYS.USERS, [])
    const comps = users.filter(u => u.role === 'company')
    setCompanies(comps)
  }, [])

  const updateStatus = (id, status) => {
    const users = storage.get(KEYS.USERS, [])
    const updated = users.map(u => u.id === id ? { ...u, status } : u)
    storage.set(KEYS.USERS, updated)
    setCompanies(updated.filter(u => u.role === 'company'))
  }

  const viewDocuments = (company) => {
    setSelectedCompany(company)
    setShowDocuments(true)
  }

  const closeDocuments = () => {
    setShowDocuments(false)
    setSelectedCompany(null)
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#F4E8D8]">
      <AdminSidebar />
      <div className="flex-1 p-4 sm:p-6 md:p-8 w-full">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#3A0D0D] mb-6 md:mb-8">{t('admin.companies')}</h1>

        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
          <div className="space-y-4">
            {companies.map((company) => (
              <div key={company.id} className="p-4 border rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-[#3A0D0D]">{company.companyName}</h3>
                    <p className="text-sm text-[#5C1A1A]/80">{t('company.phone')}: {company.phone || 'N/A'}</p>
                    <p className="text-sm text-[#5C1A1A]/80">{t('company.professionalEmail')}: {company.email || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[#5C1A1A]/80">{t('company.serviceCategory')}: {company.category || 'N/A'}</p>
                    <p className="text-sm text-[#5C1A1A]/80">{t('company.province')}: {company.province || 'N/A'}, {t('company.city')}: {company.municipality || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[#5C1A1A]/80">{t('company.description')}: {company.description || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-1 rounded text-sm ${
                    company.status === 'active' ? 'bg-green-100 text-green-800' :
                    company.status === 'pending_approval' ? 'bg-amber-100 text-amber-800' :
                    company.status === 'suspended' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {company.status === 'active' ? t('admin.status.approved') :
                     company.status === 'pending_approval' ? t('admin.status.pending') :
                     company.status === 'suspended' ? t('admin.status.suspended') :
                     t('admin.status.rejected')}
                  </span>
                  <div className="space-x-2">
                    {company.status === 'pending_approval' && (
                      <>
                        <button
                          onClick={() => updateStatus(company.id, 'active')}
                          className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
                        >
                          {t('admin.actions.approve')}
                        </button>
                        <button
                          onClick={() => updateStatus(company.id, 'rejected')}
                          className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                        >
                          {t('admin.actions.reject')}
                        </button>
                      </>
                    )}
                    {company.status === 'active' && (
                      <button
                        onClick={() => updateStatus(company.id, 'suspended')}
                        className="px-3 py-1 text-sm bg-orange-500 text-white rounded hover:bg-orange-600"
                      >
                        {t('admin.suspendAccount')}
                      </button>
                    )}
                    <button
                      onClick={() => viewDocuments(company)}
                      className="px-3 py-1 text-sm bg-[#C58A2B] text-white rounded hover:bg-[#b87d26]"
                    >
                      {t('admin.viewDocuments')}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {showDocuments && selectedCompany && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <h2 className="text-xl font-bold text-[#3A0D0D] mb-4">{t('admin.documents')} - {selectedCompany.companyName}</h2>
              <div className="space-y-4">
                {selectedCompany.documents && selectedCompany.documents.length > 0 ? (
                  selectedCompany.documents.map((doc, index) => (
                    <div key={index} className="border rounded p-4">
                      <p className="font-semibold">{doc.name}</p>
                      <p className="text-sm text-gray-600">{doc.type}</p>
                      <button
                        onClick={() => window.open(doc.url, '_blank')}
                        className="mt-2 px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                      >
                        {t('admin.viewDocuments')}
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">{t('admin.documents')} não disponíveis</p>
                )}
              </div>
              <button
                onClick={closeDocuments}
                className="mt-4 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Fechar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}