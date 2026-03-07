import { useState, useEffect } from 'react'
import AdminSidebar from '../../components/AdminSidebar'
import { storage, KEYS } from '../../utils/storage'

export default function AdminDocuments() {
  const [documents, setDocuments] = useState([])
  const [selectedDoc, setSelectedDoc] = useState(null)

  useEffect(() => {
    // Simulate documents from users
    const users = storage.get(KEYS.USERS, [])
    const docs = users.filter(u => u.role === 'provider' || u.role === 'company').map(u => ({
      id: u.id,
      name: u.role === 'company' ? u.companyName : u.name,
      role: u.role,
      documents: u.documents || { idCard: null, photo: null, logo: null }
    }))
    setDocuments(docs)
  }, [])

  const openModal = (doc) => {
    setSelectedDoc(doc)
  }

  const closeModal = () => {
    setSelectedDoc(null)
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#F4E8D8]">
      <AdminSidebar />
      <div className="flex-1 p-4 sm:p-6 md:p-8 w-full">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#3A0D0D] mb-6 md:mb-8">Documentos</h1>

        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
          <div className="space-y-4">
            {documents.map((doc) => (
              <div key={doc.id} className="p-4 border rounded-lg flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-[#3A0D0D]">{doc.name}</h3>
                  <p className="text-sm text-[#5C1A1A]/80">{doc.role === 'company' ? 'Empresa' : 'Prestador'}</p>
                </div>
                <button
                  onClick={() => openModal(doc)}
                  className="px-4 py-2 bg-[#C58A2B] text-white rounded hover:bg-[#b87d26]"
                >
                  Ver Documentos
                </button>
              </div>
            ))}
          </div>
        </div>

        {selectedDoc && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
              <h2 className="text-xl font-bold text-[#3A0D0D] mb-4">Documentos de {selectedDoc.name}</h2>
              <div className="space-y-4">
                {selectedDoc.documents.idCard && (
                  <div>
                    <p className="font-semibold">Bilhete de Identidade</p>
                    <img src={selectedDoc.documents.idCard} alt="ID Card" className="w-full h-32 object-cover rounded" />
                  </div>
                )}
                {selectedDoc.documents.photo && (
                  <div>
                    <p className="font-semibold">Fotografia</p>
                    <img src={selectedDoc.documents.photo} alt="Photo" className="w-full h-32 object-cover rounded" />
                  </div>
                )}
                {selectedDoc.documents.logo && (
                  <div>
                    <p className="font-semibold">Logotipo</p>
                    <img src={selectedDoc.documents.logo} alt="Logo" className="w-full h-32 object-cover rounded" />
                  </div>
                )}
              </div>
              <button
                onClick={closeModal}
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