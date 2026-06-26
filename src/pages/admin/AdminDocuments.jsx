import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../config/supabaseClient'

export default function AdminDocuments() {
  const [documents, setDocuments] = useState([])
  const [selectedDoc, setSelectedDoc] = useState(null)
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const currentCountRef = useRef(0)

  const fetchDocs = async (reset = false) => {
    setLoading(true)
    if (reset) currentCountRef.current = 0;
    const from = currentCountRef.current;
    
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .in('role', ['provider', 'company'])
      .not('document_urls', 'is', null)
      .range(from, from + 19)
    
    if (data) {
      const docs = data.map(u => ({
        id: u.id,
        name: u.role === 'company' ? u.company_name || u.name : u.name,
        role: u.role,
        documents: u.document_urls || {}
      }))
      if (reset) setDocuments(docs)
      else setDocuments(prev => [...prev, ...docs])
      currentCountRef.current += data.length
      setHasMore(data.length === 20)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchDocs(true)
  }, [])

  const openModal = (doc) => {
    setSelectedDoc(doc)
  }

  const closeModal = () => {
    setSelectedDoc(null)
  }

  return (
    <div className="w-full">
        <h1 className="text-xl md:text-2xl sm:text-3xl font-bold text-mimu-wine-text dark:text-white mb-6 md:mb-8">Documentos da Plataforma</h1>

        <div className="bg-mimu-white dark:bg-[#1E1E1E] p-4 sm:p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300">
          {loading ? (
             <p className="text-mimu-wine-light-text dark:text-gray-300">A carregar documentos...</p>
          ) : documents.length === 0 ? (
             <p className="text-mimu-wine-light-text dark:text-gray-300">Não existem utilizadores com documentos registados.</p>
          ) : (
            <>
              <div className="space-y-4">
                {documents.map((doc) => (
                  <div key={doc.id} className="p-4 border rounded-lg flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-mimu-wine-text dark:text-white">{doc.name || 'Sem nome'}</h3>
                      <p className="text-sm text-mimu-wine-light-text dark:text-gray-300/80">{doc.role === 'company' ? 'Empresa' : 'Prestador'}</p>
                    </div>
                    <button
                      onClick={() => openModal(doc)}
                      className="px-4 py-2 bg-mimu-gold text-mimu-white-text rounded hover:bg-[#b87d26]"
                    >
                      Ver Documentos
                    </button>
                  </div>
                ))}
              </div>
              {hasMore && (
                <div className="mt-8 flex justify-center">
                  <button onClick={() => fetchDocs(false)} disabled={loading} className="px-6 py-2 bg-mimu-gold hover:bg-mimu-gold-hover text-mimu-wine-text dark:text-white font-bold rounded-lg transition-colors shadow-sm">
                    Carregar Mais Documentos
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {selectedDoc && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-mimu-white dark:bg-[#1E1E1E] p-4 md:p-6 rounded-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <h2 className="text-xl font-bold text-mimu-wine-text dark:text-white mb-4">Documentos de {selectedDoc.name}</h2>
              <div className="space-y-4">
                {Object.keys(selectedDoc.documents).length > 0 ? (
                  Object.entries(selectedDoc.documents).map(([key, value], index) => (
                    Array.isArray(value) ? (
                      value.map((url, i) => (
                        <div key={`${index}-${i}`} className="border rounded p-4 flex justify-between items-center">
                          <div>
                             <p className="font-semibold capitalize">{key.replace('_', ' ')} {i + 1}</p>
                             <p className="text-sm text-mimu-text-muted">Documento hospedado via Supabase Storage</p>
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
                           <p className="text-sm text-mimu-text-muted">Documento hospedado via Supabase Storage</p>
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
                  <p className="text-mimu-text-muted">Nenhum documento disponível.</p>
                )}
              </div>
              <button
                onClick={closeModal}
                className="mt-6 px-4 py-2 bg-gray-500 text-mimu-white-text rounded hover:bg-gray-600 transition-all duration-300 hover:shadow-md active:scale-95 min-h-[44px]"
              >
                Fechar
              </button>
            </div>
          </div>
        )}
    </div>
  )
}