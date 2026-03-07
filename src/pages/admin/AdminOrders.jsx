import { useState, useEffect } from 'react'
import AdminSidebar from '../../components/AdminSidebar'
import { storage, KEYS } from '../../utils/storage'
import { updateOrderStatus } from '../../hooks/useOrders'

export default function AdminOrders() {
  const [orders, setOrders] = useState([])

  useEffect(() => {
    const ords = storage.get(KEYS.ORDERS, [])
    setOrders(ords)
  }, [])

  const changeStatus = (id, status) => {
    updateOrderStatus(id, status)
    setOrders(ords => ords.map(o => o.id === id ? { ...o, status } : o))
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#F4E8D8]">
      <AdminSidebar />
      <div className="flex-1 p-4 sm:p-6 md:p-8 w-full">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#3A0D0D] mb-6 md:mb-8">Pedidos / Reservas</h1>

        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-[#3A0D0D]">{order.serviceName}</h3>
                  <span className={`px-2 py-1 rounded text-sm ${
                    order.status === 'concluido' ? 'bg-green-100 text-green-800' :
                    order.status === 'pendente' ? 'bg-amber-100 text-amber-800' :
                    order.status === 'confirmado' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {order.status}
                  </span>
                </div>
                <p className="text-sm text-[#5C1A1A]/80">Cliente: {order.clientName}</p>
                <p className="text-sm text-[#5C1A1A]/80">Prestador/Empresa: {order.providerName || 'N/A'}</p>
                <p className="text-sm text-[#5C1A1A]/80">Valor: {order.total} Kz</p>
                <div className="mt-4 space-x-2">
                  {['pendente', 'confirmado', 'concluido', 'cancelado'].map((status) => (
                    <button
                      key={status}
                      onClick={() => changeStatus(order.id, status)}
                      className={`px-3 py-1 text-sm rounded ${
                        order.status === status ? 'bg-[#C58A2B] text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}