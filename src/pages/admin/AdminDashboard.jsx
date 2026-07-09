import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../config/supabaseClient'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'

const COLORS = ['#C58A2B', '#8C2E3C', '#1D3557', '#457B9D', '#A8DADC']

export default function AdminDashboard() {
  const { t } = useTranslation()
  const [stats, setStats] = useState({
    ordersToday: 0,
    ordersMonth: 0,
    totalRevenue: 0,
    completedServices: 0,
    totalEvents: 0,
    totalCompanies: 0,
    totalProviders: 0,
    totalCompanyPartners: 0,
    activeCompanyPartners: 0,
  })
  const [recentOrders, setRecentOrders] = useState([])
  const [weeklyData, setWeeklyData] = useState([])
  const [categoryData, setCategoryData] = useState([])
  const [recentSearches, setRecentSearches] = useState([])
  const [topSearches, setTopSearches] = useState([])
  const [refreshing, setRefreshing] = useState(false)
  const [lastRefreshed, setLastRefreshed] = useState(null)

  // Fetch de pesquisas — função independente para poder ser chamada no polling
  const fetchSearchData = async () => {
    const { data: recentSearchesData } = await supabase
      .from('search_history')
      .select('id, query, created_at, user_id, profiles:user_id(name, email)')
      .order('created_at', { ascending: false })
      .limit(8)

    if (recentSearchesData) {
      setRecentSearches(recentSearchesData)
    }

    const { data: allSearches } = await supabase
      .from('search_history')
      .select('query')
      .order('created_at', { ascending: false })
      .limit(2000)

    if (allSearches) {
      const searchCountMap = {}
      allSearches.forEach(item => {
        const raw = item.query.trim()
        const capitalized = raw.charAt(0).toUpperCase() + raw.slice(1)
        searchCountMap[capitalized] = (searchCountMap[capitalized] || 0) + 1
      })
      const sortedTop = Object.entries(searchCountMap)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
      setTopSearches(sortedTop)
    }

    setLastRefreshed(new Date())
  }

  const handleManualRefresh = async () => {
    setRefreshing(true)
    await fetchSearchData()
    setRefreshing(false)
  }

  useEffect(() => {
    const fetchAdminData = async () => {
      const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })

      if (!error && orders) {
        const now = new Date()
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

        const ordersToday = orders.filter(order => new Date(order.created_at) >= today).length
        const ordersMonth = orders.filter(order => new Date(order.created_at) >= monthStart).length
        
        const completedOnly = orders.filter(order => order.status === 'concluido')
        const totalRevenue = completedOnly.reduce((sum, order) => sum + (Number(order.total) || 0), 0)
        const completedServices = completedOnly.length

        const last7Days = Array.from({length: 7}, (_, i) => {
          const d = new Date()
          d.setDate(d.getDate() - (6 - i))
          return { date: d.toISOString().split('T')[0], name: d.toLocaleDateString('pt-AO', {weekday: 'short'}), Pedidos: 0 }
        })

        const catMap = {}
        orders.forEach(order => {
          const orderDate = new Date(order.created_at).toISOString().split('T')[0]
          const dayMatch = last7Days.find(d => d.date === orderDate)
          if (dayMatch) dayMatch.Pedidos += 1
          if (order.service_name) {
            catMap[order.service_name] = (catMap[order.service_name] || 0) + 1
          }
        })

        const catArray = Object.entries(catMap).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value).slice(0, 5)

        const [{ count: totalEvents }, { count: totalCompanies }, { count: totalProviders }, { data: allPartners }] = await Promise.all([
          supabase.from('events').select('*', { count: 'exact', head: true }),
          supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'company'),
          supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'provider'),
          supabase.from('company_partners').select('status'),
        ])

        const totalCompanyPartners = allPartners?.length || 0
        const activeCompanyPartners = allPartners?.filter(p => p.status === 'active').length || 0

        setStats({ 
          ordersToday, 
          ordersMonth, 
          totalRevenue, 
          completedServices,
          totalEvents: totalEvents || 0,
          totalCompanies: totalCompanies || 0,
          totalProviders: totalProviders || 0,
          totalCompanyPartners,
          activeCompanyPartners,
        })
        setRecentOrders(orders.slice(0, 5))
        setWeeklyData(last7Days)
        setCategoryData(catArray.length ? catArray : [{ name: t('admin.noData'), value: 1 }])
      }
    }

    fetchAdminData()
    fetchSearchData() // Primeiro fetch de pesquisas imediato

    // Auto-refresh a cada 30 segundos para manter o histórico de pesquisas atualizado
    const searchInterval = setInterval(fetchSearchData, 30000)
    return () => clearInterval(searchInterval)
  }, [])

  return (
    <div className="w-full">
        <h1 className="text-xl md:text-2xl sm:text-3xl font-bold text-mimu-wine-text dark:text-white mb-6 md:mb-8">Dashboard</h1>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 md:mb-8">
          <div className="bg-mimu-white dark:bg-[#1E1E1E] p-4 sm:p-6 rounded-2xl shadow-md hover:shadow-md hover:shadow-lg transition-shadow duration-300 transition-shadow">
            <h3 className="text-sm sm:text-lg font-semibold text-mimu-wine-text dark:text-white">{t('admin.ordersToday')}</h3>
            <p className="text-xl md:text-2xl sm:text-3xl font-bold text-mimu-gold mt-2">{stats.ordersToday}</p>
          </div>
          <div className="bg-mimu-white dark:bg-[#1E1E1E] p-4 sm:p-6 rounded-2xl shadow-md hover:shadow-md hover:shadow-lg transition-shadow duration-300 transition-shadow">
            <h3 className="text-sm sm:text-lg font-semibold text-mimu-wine-text dark:text-white">{t('admin.ordersMonth')}</h3>
            <p className="text-xl md:text-2xl sm:text-3xl font-bold text-mimu-gold mt-2">{stats.ordersMonth}</p>
          </div>
          <div className="bg-mimu-white dark:bg-[#1E1E1E] p-4 sm:p-6 rounded-2xl shadow-md hover:shadow-md hover:shadow-lg transition-shadow duration-300 transition-shadow">
            <h3 className="text-sm sm:text-lg font-semibold text-mimu-wine-text dark:text-white">{t('admin.totalRevenue')}</h3>
            <p className="text-xl md:text-2xl sm:text-3xl font-bold text-mimu-gold mt-2">{stats.totalRevenue.toFixed(2)} Kz</p>
          </div>
          <div className="bg-mimu-white dark:bg-[#1E1E1E] p-4 sm:p-6 rounded-2xl shadow-md hover:shadow-md hover:shadow-lg transition-shadow duration-300 transition-shadow">
            <h3 className="text-sm sm:text-lg font-semibold text-mimu-wine-text dark:text-white">{t('admin.completedServices')}</h3>
            <p className="text-xl md:text-2xl sm:text-3xl font-bold text-mimu-gold mt-2">{stats.completedServices}</p>
          </div>
        </div>

        {/* Seção de Controle de Prestadores por Empresa */}
        <div className="mb-6 md:mb-8 bg-mimu-cream/30 dark:bg-[#121212]/30 p-5 rounded-3xl border border-mimu-cream-border dark:border-[#2A2A2A]/60">
          <h2 className="text-sm sm:text-base font-bold text-mimu-wine-text dark:text-white mb-4 flex items-center gap-2">
            <span>👥</span> Visão Geral de Prestadores
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-mimu-white dark:bg-[#1E1E1E] p-4 rounded-2xl shadow-sm border border-mimu-cream-border dark:border-[#2A2A2A] hover:shadow-md transition-shadow duration-300">
              <h3 className="text-xs font-semibold text-mimu-wine-light-text dark:text-gray-400 uppercase tracking-wider">{t('admin.companies')}</h3>
              <p className="text-2xl font-extrabold text-mimu-wine-text dark:text-white mt-2">{stats.totalCompanies}</p>
            </div>
            <div className="bg-mimu-white dark:bg-[#1E1E1E] p-4 rounded-2xl shadow-sm border border-mimu-cream-border dark:border-[#2A2A2A] hover:shadow-md transition-shadow duration-300">
              <h3 className="text-xs font-semibold text-mimu-wine-light-text dark:text-gray-400 uppercase tracking-wider">{t('admin.registeredProviders')}</h3>
              <p className="text-2xl font-extrabold text-mimu-wine-text dark:text-white mt-2">{stats.totalProviders}</p>
            </div>
            <div className="bg-mimu-white dark:bg-[#1E1E1E] p-4 rounded-2xl shadow-sm border border-mimu-cream-border dark:border-[#2A2A2A] hover:shadow-md transition-shadow duration-300">
              <h3 className="text-xs font-semibold text-mimu-wine-light-text dark:text-gray-400 uppercase tracking-wider">{t('admin.providersByCompanies')}</h3>
              <p className="text-2xl font-extrabold text-mimu-gold mt-2">{stats.totalCompanyPartners}</p>
            </div>
            <div className="bg-mimu-white dark:bg-[#1E1E1E] p-4 rounded-2xl shadow-sm border border-mimu-cream-border dark:border-[#2A2A2A] hover:shadow-md transition-shadow duration-300">
              <h3 className="text-xs font-semibold text-mimu-wine-light-text dark:text-gray-400 uppercase tracking-wider">{t('admin.activeProviders')}</h3>
              <p className="text-2xl font-extrabold text-green-600 mt-2">{stats.activeCompanyPartners}</p>
            </div>
          </div>
        </div>

        {/* Seção de Controle de Eventos */}
        <div className="mb-6 md:mb-8 bg-mimu-cream/30 dark:bg-[#121212]/30 p-5 rounded-3xl border border-mimu-cream-border dark:border-[#2A2A2A]/60">
          <h2 className="text-sm sm:text-base font-bold text-mimu-wine-text dark:text-white mb-4 flex items-center gap-2">
            <span>📅</span> Estatísticas de Eventos
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="bg-mimu-white dark:bg-[#1E1E1E] p-4 sm:p-6 rounded-2xl shadow-sm border border-mimu-cream-border dark:border-[#2A2A2A] hover:shadow-md transition-shadow duration-300">
              <h3 className="text-xs sm:text-sm font-semibold text-mimu-wine-light-text dark:text-gray-400 uppercase tracking-wider">{t('admin.totalEvents')}</h3>
              <p className="text-xl sm:text-3xl font-extrabold text-mimu-wine-text dark:text-white mt-2">{stats.totalEvents}</p>
              <p className="text-[10px] text-mimu-wine-light-text dark:text-gray-500 mt-1">{t('admin.eventsCreated')}</p>
            </div>
          </div>
        </div>

        {/* Charts and Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 mb-6 md:mb-8">
          <div className="bg-mimu-white dark:bg-[#1E1E1E] p-4 sm:p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300">
            <h3 className="text-lg sm:text-xl font-semibold text-mimu-wine-text dark:text-white mb-4">{t('admin.weeklyOrders')}</h3>
            <div className="h-48 sm:h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB"/>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#4B5563', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#4B5563', fontSize: 12}} allowDecimals={false} />
                  <Tooltip cursor={{fill: 'rgba(197, 138, 43, 0.1)'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}} />
                  <Bar dataKey="Pedidos" fill="#C58A2B" radius={[4, 4, 0, 0]} barSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-mimu-white dark:bg-[#1E1E1E] p-4 sm:p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300">
            <h3 className="text-lg sm:text-xl font-semibold text-mimu-wine-text dark:text-white mb-4">{t('admin.mostRequestedServices')}</h3>
            <div className="h-48 sm:h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}} />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{fontSize: '12px'}} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Seção de Análise de Pesquisas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 mb-6 md:mb-8 animate-fade-in-slow">
          {/* Top Termos Pesquisados */}
          <div className="bg-mimu-white dark:bg-[#1E1E1E] p-4 sm:p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300">
            <h3 className="text-lg sm:text-xl font-semibold text-mimu-wine-text dark:text-white mb-4 flex items-center gap-2">
              <span>🔥</span> Termos Mais Procurados
            </h3>
            {topSearches.length === 0 ? (
              <p className="text-sm text-mimu-wine-light-text dark:text-gray-400 py-6 text-center">{t('admin.noSearches')}</p>
            ) : (
              <div className="space-y-4">
                {topSearches.map((item, idx) => {
                  const maxCount = topSearches[0]?.count || 1
                  const percentage = (item.count / maxCount) * 100
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between items-center text-sm font-medium">
                        <span className="text-mimu-wine-text dark:text-gray-300 font-bold">
                          {idx + 1}. {item.name}
                        </span>
                        <span className="text-mimu-gold font-extrabold">{item.count} {t('admin.searches')}</span>
                      </div>
                      <div className="w-full bg-mimu-cream/50 dark:bg-gray-800/50 h-2.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-mimu-gold h-full rounded-full transition-all duration-500" 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Últimas Pesquisas */}
          <div className="bg-mimu-white dark:bg-[#1E1E1E] p-4 sm:p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg sm:text-xl font-semibold text-mimu-wine-text dark:text-white flex items-center gap-2">
                <span>🔍</span> Histórico de Pesquisa Recente
              </h3>
              <div className="flex items-center gap-2">
                {lastRefreshed && (
                  <span className="text-xs text-gray-400 hidden sm:block">
                    {lastRefreshed.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                )}
                <button
                  onClick={handleManualRefresh}
                  disabled={refreshing}
                  title="Atualizar agora"
                  className="p-1.5 rounded-lg bg-mimu-cream/50 dark:bg-[#2A2A2A] hover:bg-mimu-gold/20 transition-colors disabled:opacity-50"
                >
                  <svg
                    className={`w-4 h-4 text-mimu-gold ${refreshing ? 'animate-spin' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-mimu-border-light text-mimu-wine-text dark:text-white pb-2 font-semibold">
                    <th className="pb-2">{t('admin.term')}</th>
                    <th className="pb-2">{t('admin.userCol')}</th>
                    <th className="pb-2 text-right">{t('admin.datetime')}</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSearches.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="py-4 text-center text-mimu-wine-light-text dark:text-gray-400">{t('admin.noRecentSearches')}</td>
                    </tr>
                  ) : (
                    recentSearches.map((search) => {
                      const userLabel = search.profiles?.name || search.profiles?.email || 'Anónimo'
                      const searchDate = new Date(search.created_at).toLocaleString('pt-PT', {
                        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
                      })
                      return (
                        <tr key={search.id} className="border-b border-mimu-border-light/40 hover:bg-mimu-gray-50 dark:hover:bg-[#121212]/40 transition-colors">
                          <td className="py-2.5 font-bold text-mimu-wine-text dark:text-gray-300 max-w-[120px] truncate" title={search.query}>
                            {search.query}
                          </td>
                          <td className="py-2.5 text-mimu-wine-light-text dark:text-gray-400">
                            {userLabel}
                          </td>
                          <td className="py-2.5 text-right text-gray-400">
                            {searchDate}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-mimu-white dark:bg-[#1E1E1E] p-4 sm:p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300">
          <h3 className="text-lg sm:text-xl font-semibold text-mimu-wine-text dark:text-white mb-4">{t('admin.recentOrders')}</h3>
          <div className="overflow-x-auto -mx-4 sm:mx-0 sm:overflow-visible">
            <table className="w-full text-left text-sm sm:text-base min-w-max sm:min-w-0">
              <thead>
                <tr className="border-b border-mimu-border-light">
                  <th className="pb-3 px-4 sm:px-0 font-semibold text-mimu-wine-text dark:text-white">{t('admin.clientCol')}</th>
                  <th className="pb-3 px-4 sm:px-0 font-semibold text-mimu-wine-text dark:text-white hidden sm:table-cell">{t('admin.serviceCol')}</th>
                  <th className="pb-3 px-4 sm:px-0 font-semibold text-mimu-wine-text dark:text-white">{t('admin.value')}</th>
                  <th className="pb-3 px-4 sm:px-0 font-semibold text-mimu-wine-text dark:text-white">{t('admin.statusCol')}</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-4 text-center text-mimu-wine-light-text dark:text-gray-300 text-sm">{t('admin.noRecentOrders')}</td>
                  </tr>
                ) : (
                  recentOrders.map((order) => (
                    <tr key={order.id} className="border-b border-mimu-border-light hover:bg-mimu-gray-50 dark:bg-[#121212] transition-colors">
                      <td className="py-3 px-4 sm:px-0 text-mimu-wine-light-text dark:text-gray-300">{order.client_name || t('admin.unknown')}</td>
                      <td className="py-3 px-4 sm:px-0 text-mimu-wine-light-text dark:text-gray-300 hidden sm:table-cell">{order.service_name || '-'}</td>
                      <td className="py-3 px-4 sm:px-0 text-mimu-wine-light-text dark:text-gray-300 font-medium">{order.total || 0} Kz</td>
                      <td className="py-3 px-4 sm:px-0">
                        <span className={`px-2 py-1 rounded text-xs sm:text-sm font-bold inline-block capitalize ${
                          order.status === 'concluido' ? 'bg-green-100 text-green-800' :
                          order.status === 'pendente' ? 'bg-amber-100 text-amber-800' :
                          'bg-mimu-gray-100 dark:bg-[#121212] text-mimu-text-dark dark:text-white'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
    </div>
  )
}
