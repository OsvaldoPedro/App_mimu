import { useState } from 'react'
import { useAdminServices, updateServiceStatus } from '../../hooks/useAdmin'

export default function AdminServices() {
  const { services, reload, loading } = useAdminServices()
  const [selectedService, setSelectedService] = useState(null)
  const [showImages, setShowImages] = useState(false)
  const [processingId, setProcessingId] = useState(null)

  const updateStatus = async (service, status) => {
    setProcessingId(service.id)
    await updateServiceStatus(service.id, status, service.owner_id, service.name)
    await reload()
    setProcessingId(null)
  }

  const viewImages = (service) => {
    setSelectedService(service)
    setShowImages(true)
  }

  const closeImages = () => {
    setShowImages(false)
    setSelectedService(null)
  }

  return (
    <div className="w-full">
        <h1 className="text-xl md:text-2xl sm:text-3xl font-bold text-mimu-wine-text dark:text-white mb-6 md:mb-8">Serviços Pendentes e Aprovados</h1>

        <div className="bg-mimu-white dark:bg-[#1E1E1E] p-4 sm:p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300">
          {loading ? (
             <p className="text-mimu-wine-light-text dark:text-gray-300">A carregar serviços...</p>
          ) : services.length === 0 ? (
             <p className="text-mimu-wine-light-text dark:text-gray-300">Não existem serviços registados.</p>
          ) : (
             <div className="space-y-4">
               {services.map((service) => (
                 <div key={service.id} className="p-4 border rounded-lg">
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                     <div>
                       <h3 className="text-lg font-semibold text-mimu-wine-text dark:text-white">{service.name}</h3>
                       <p className="text-sm text-mimu-gold font-bold">{service.price} {service.currency || 'AOA'}</p>
                       <p className="text-sm text-mimu-wine-light-text dark:text-gray-300/80">{service.location}</p>
                     </div>
                     <div>
                       <p className="text-sm text-mimu-wine-light-text dark:text-gray-300/80 font-medium">Fornecedor: {service.provider_name}</p>
                       <p className="text-sm text-mimu-wine-light-text dark:text-gray-300/80">Contacto: {service.provider_phone}</p>
                     </div>
                     <div>
                       <p className="text-sm text-mimu-wine-light-text dark:text-gray-300/80 line-clamp-3">{service.description}</p>
                     </div>
                   </div>
                   <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                     <span className={`px-2 py-1 rounded text-sm font-medium ${
                         service.status === 'approved' ? 'bg-green-100 text-green-800' :
                         (service.status === 'pending_validation' || service.status === 'pending') ? 'bg-amber-100 text-amber-800' :
                         service.status === 'rejected' ? 'bg-red-100 text-red-800' :
                         'bg-mimu-gray-100 dark:bg-[#121212] text-mimu-text-dark dark:text-white'
                       }`}>
                       {service.status === 'approved' ? 'Aprovado (Público)' :
                        (service.status === 'pending_validation' || service.status === 'pending') ? 'Pendente' :
                        service.status === 'rejected' ? 'Rejeitado' : service.status}
                     </span>
                     <div className="space-x-2">
                       {(service.status === 'pending_validation' || service.status === 'pending') && (
                         <>
                           <button
                             disabled={processingId === service.id}
                             onClick={() => updateStatus(service, 'approved')}
                             className="px-3 py-1 text-sm bg-green-500 text-mimu-white-text rounded hover:bg-green-600 disabled:opacity-50"
                           >
                             Aprovar Serviço
                           </button>
                           <button
                             disabled={processingId === service.id}
                             onClick={() => updateStatus(service, 'rejected')}
                             className="px-3 py-1 text-sm bg-red-500 text-mimu-white-text rounded hover:bg-red-600 disabled:opacity-50"
                           >
                             Rejeitar
                           </button>
                         </>
                       )}
                       {service.status === 'approved' && (
                           <button
                             disabled={processingId === service.id}
                             onClick={() => updateStatus(service, 'pending')}
                             className="px-3 py-1 text-sm bg-orange-500 text-mimu-white-text rounded hover:bg-orange-600 disabled:opacity-50"
                           >
                             Ocultar (Suspender)
                           </button>
                       )}
                       {service.images && service.images.length > 0 && (
                         <button
                           onClick={() => viewImages(service)}
                           className="px-3 py-1 text-sm bg-mimu-gold text-mimu-white-text rounded hover:bg-[#b87d26]"
                         >
                           Ver Imagens
                         </button>
                       )}
                     </div>
                   </div>
                 </div>
               ))}
             </div>
          )}
        </div>

        {showImages && selectedService && (
          <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
            <div className="bg-mimu-white dark:bg-[#1E1E1E] p-4 md:p-6 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-mimu-wine-text dark:text-white">Galeria: {selectedService.name}</h2>
                  <button onClick={closeImages} className="text-red-500 font-bold hover:text-red-700 min-h-[44px]">X Fechar</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                 {selectedService.images.map((img, idx) => (
                    <div key={idx} className="rounded overflow-hidden">
                       <img src={img} alt={`Serviço ${idx+1}`} className="w-full h-48 object-cover" />
                    </div>
                 ))}
              </div>
            </div>
          </div>
        )}
    </div>
  )
}
