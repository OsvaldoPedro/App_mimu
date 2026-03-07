import { useState, useEffect } from 'react'
import AdminSidebar from '../../components/AdminSidebar'
import { storage, KEYS } from '../../utils/storage'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    ordersToday: 0,
    ordersMonth: 0,
    totalRevenue: 0,
    completedServices: 0,
  })

  useEffect(() => {
    // Calculate stats from storage
    const orders = storage.get(KEYS.ORDERS, [])
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    const ordersToday = orders.filter(order => new Date(order.createdAt) >= today).length
    const ordersMonth = orders.filter(order => new Date(order.createdAt) >= monthStart).length
    const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0)
    const completedServices = orders.filter(order => order.status === 'concluido').length

    setStats({ ordersToday, ordersMonth, totalRevenue, completedServices })
  }, [])

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#F4E8D8]">
      <AdminSidebar />
      
      {/* Main Content */}
      <div className="flex-1 p-4 sm:p-6 md:p-8 w-full">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#3A0D0D] mb-6 md:mb-8">Dashboard</h1>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 md:mb-8">
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <h3 className="text-sm sm:text-lg font-semibold text-[#3A0D0D]">Pedidos Hoje</h3>
            <p className="text-2xl sm:text-3xl font-bold text-[#C58A2B] mt-2">{stats.ordersToday}</p>
          </div>
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <h3 className="text-sm sm:text-lg font-semibold text-[#3A0D0D]">Pedidos no Mês</h3>
            <p className="text-2xl sm:text-3xl font-bold text-[#C58A2B] mt-2">{stats.ordersMonth}</p>
          </div>
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <h3 className="text-sm sm:text-lg font-semibold text-[#3A0D0D]">Receita Total</h3>
            <p className="text-2xl sm:text-3xl font-bold text-[#C58A2B] mt-2">{stats.totalRevenue.toFixed(2)} Kz</p>
          </div>
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <h3 className="text-sm sm:text-lg font-semibold text-[#3A0D0D]">Serviços Concluídos</h3>
            <p className="text-2xl sm:text-3xl font-bold text-[#C58A2B] mt-2">{stats.completedServices}</p>
          </div>
        </div>

        {/* Charts and Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 mb-6 md:mb-8">
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
            <h3 className="text-lg sm:text-xl font-semibold text-[#3A0D0D] mb-4">Pedidos da Semana</h3>
            {/* Placeholder for chart */}
            <div className="h-48 sm:h-64 bg-gray-100 rounded flex items-center justify-center">
              <p className="text-gray-500 text-center px-4 text-sm sm:text-base">Gráfico de pedidos da semana (implementar com Chart.js ou Recharts)</p>
            </div>
          </div>
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
            <h3 className="text-lg sm:text-xl font-semibold text-[#3A0D0D] mb-4">Categorias Mais Usadas</h3>
            {/* Placeholder for chart */}
            <div className="h-48 sm:h-64 bg-gray-100 rounded flex items-center justify-center">
              <p className="text-gray-500 text-center px-4 text-sm sm:text-base">Gráfico de categorias mais usadas</p>
            </div>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
          <h3 className="text-lg sm:text-xl font-semibold text-[#3A0D0D] mb-4">Pedidos Recentes</h3>
          <div className="overflow-x-auto -mx-4 sm:mx-0 sm:overflow-visible">
            <table className="w-full text-left text-sm sm:text-base min-w-max sm:min-w-0">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="pb-3 px-4 sm:px-0 font-semibold text-[#3A0D0D]">Cliente</th>
                  <th className="pb-3 px-4 sm:px-0 font-semibold text-[#3A0D0D] hidden sm:table-cell">Serviço</th>
                  <th className="pb-3 px-4 sm:px-0 font-semibold text-[#3A0D0D]">Valor</th>
                  <th className="pb-3 px-4 sm:px-0 font-semibold text-[#3A0D0D]">Estado</th>
                </tr>
              </thead>
              <tbody>
                {storage.get(KEYS.ORDERS, []).slice(0, 5).map((order) => (
                  <tr key={order.id} className="border-b border-gray-100">
                    <td className="py-3 px-4 sm:px-0 text-[#5C1A1A]">{order.clientName}</td>
                    <td className="py-3 px-4 sm:px-0 text-[#5C1A1A] hidden sm:table-cell">{order.serviceName}</td>
                    <td className="py-3 px-4 sm:px-0 text-[#5C1A1A]">{order.total} Kz</td>
                    <td className="py-3 px-4 sm:px-0">
                      <span className={`px-2 py-1 rounded text-xs sm:text-sm font-medium inline-block ${
                        order.status === 'concluido' ? 'bg-green-100 text-green-800' :
                        order.status === 'pendente' ? 'bg-amber-100 text-amber-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

