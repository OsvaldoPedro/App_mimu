import { updateOrderStatus } from '../../hooks/useOrders'
import { useTranslation } from 'react-i18next'
import { useAllOrders } from '../../hooks/useAdmin'

export default function AdminOrders() {
  const { orders, reload, loading, hasMore, loadMore } = useAllOrders()

  const changeStatus = async (id, status) => {
    await updateOrderStatus(id, status)
    reload()
  }

  return (
    <div className="w-full">
        <h1 className="text-xl md:text-2xl sm:text-3xl font-bold text-mimu-wine-text dark:text-white mb-6 md:mb-8">{t('admin.orders.title')}</h1>

        <div className="bg-mimu-white dark:bg-[#1E1E1E] p-4 sm:p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-mimu-wine-text dark:text-white">{order.serviceName}</h3>
                  <span className={`px-2 py-1 rounded text-sm ${
                    order.status === 'concluido' ? 'bg-green-100 text-green-800' :
                    order.status === 'pendente' ? 'bg-amber-100 text-amber-800' :
                    order.status === 'confirmado' ? 'bg-mimu-gold/20 text-mimu-gold' :
                    'bg-mimu-gray-100 dark:bg-[#121212] text-mimu-text-dark dark:text-white'
                  }`}>
                    {order.status}
                  </span>
                </div>
                <p className="text-sm text-mimu-wine-light-text dark:text-gray-300/80">{t('admin.orders.client')}: {order.clientName}</p>
                <p className="text-sm text-mimu-wine-light-text dark:text-gray-300/80">{t('admin.orders.providerCompany')}: {order.providerName || 'N/A'}</p>
                <p className="text-sm text-mimu-wine-light-text dark:text-gray-300/80">{t('admin.orders.value')}: {order.total} Kz</p>
                <div className="mt-4 space-x-2">
                  {['pendente', 'confirmado', 'concluido', 'cancelado'].map((status) => (
                    <button
                      key={status}
                      onClick={() => changeStatus(order.id, status)}
                      className={`px-3 py-1 text-sm rounded ${
                        order.status === status ? 'bg-mimu-gold text-mimu-white-text' : 'bg-mimu-gray-200 text-mimu-text-dark dark:text-white hover:bg-mimu-gray-200'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {loading && <p className="text-mimu-wine-text dark:text-white mt-4">{t('admin.users.loading')}</p>}
          {!loading && hasMore && orders.length > 0 && (
            <div className="mt-8 flex justify-center">
              <button 
                onClick={loadMore} 
                className="px-6 py-2 bg-mimu-gold hover:bg-mimu-gold-hover text-mimu-wine-text dark:text-white font-bold rounded-lg transition-colors shadow-sm"
              >
                Carregar Mais Pedidos
              </button>
            </div>
          )}
        </div>
    </div>
  )
}