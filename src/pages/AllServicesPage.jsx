import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import SearchAndFilter from '../components/SearchAndFilter'
import CompactServiceCard from '../components/CompactServiceCard'
import Footer from '../components/Footer'
import { searchServicesPaginated } from '../data/services'
import { trackSearch } from '../utils/searchTracker'

const LIMIT = 20

export default function AllServicesPage() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const [selectedCategories, setSelectedCategories] = useState([])
  const [province, setProvince] = useState('')
  const [city, setCity] = useState('')
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '')

  // Sync searchTerm when search query in URL changes (e.g. from Hero component search bar)
  useEffect(() => {
    const urlSearch = searchParams.get('search')
    if (urlSearch !== null) {
      setSearchTerm(urlSearch)
    }
  }, [searchParams])
  const [sortBy, setSortBy] = useState('recent')
  const [activeTab, setActiveTab] = useState('geral') // 'geral', 'promocoes', 'novos_servicos'

  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [totalCount, setTotalCount] = useState(0)

  // Reset page when filters or tabs change
  useEffect(() => {
    setPage(0)
  }, [searchTerm, selectedCategories, province, city, sortBy, activeTab])

  // Fetch data from server
  useEffect(() => {
    let isMounted = true

    async function load() {
      if (page === 0) setLoading(true)
      else setLoadingMore(true)

      if (page === 0 && searchTerm && searchTerm.trim().length >= 2) {
        trackSearch(searchTerm, {
          categories: selectedCategories,
          province,
          city,
          tab: activeTab
        })
      }

      const result = await searchServicesPaginated({
        term: searchTerm,
        categoryIds: selectedCategories,
        provinceId: province,
        cityId: city,
        sortBy: sortBy,
        page: page,
        limit: LIMIT,
        tab: activeTab
      })

      if (isMounted) {
        if (page === 0) {
          setServices(result.data)
        } else {
          setServices(prev => {
             // Deduplicate by ID just in case
             const newIds = new Set(prev.map(s => s.id))
             const uniqueNew = result.data.filter(s => !newIds.has(s.id))
             return [...prev, ...uniqueNew]
          })
        }
        
        setTotalCount(result.count || 0)
        setHasMore(result.data.length === LIMIT)
        setLoading(false)
        setLoadingMore(false)
      }
    }

    // Debounce the initial fetch slightly to prevent spamming while typing
    const timeoutId = setTimeout(() => {
      load()
    }, 300)

    return () => {
      isMounted = false
      clearTimeout(timeoutId)
    }
  }, [searchTerm, selectedCategories, province, city, sortBy, page, activeTab])

  return (
    <div className="min-h-screen bg-mimu-cream dark:bg-[#121212]">
      <Navbar />

      {/* Spacer for fixed navbar */}
      <div className="pt-28 sm:pt-32"></div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
        {/* Navigation Tabs (Geral, Promoções, Novos Serviços) */}
        <div className="flex bg-[#1C1111]/90 backdrop-blur-md dark:bg-[#1E1E1E]/90 p-1.5 rounded-2xl border border-mimu-cream-border/10 dark:border-[#2A2A2A] mb-8 max-w-md mx-auto shadow-xl transition-all duration-300 hover:border-mimu-cream-border/20">
          <button
            onClick={() => setActiveTab('geral')}
            className={`flex-grow py-2.5 px-4 text-xs sm:text-sm font-bold rounded-xl transition-all duration-300 cursor-pointer active:scale-95 ${
              activeTab === 'geral'
                ? 'bg-mimu-gold text-white dark:text-[#121212] shadow-md scale-102 font-extrabold'
                : 'text-white/80 dark:text-gray-400 hover:text-mimu-gold'
            }`}
          >
            {t('common.all', 'Geral')}
          </button>
          <button
            onClick={() => setActiveTab('promocoes')}
            className={`flex-grow py-2.5 px-4 text-xs sm:text-sm font-bold rounded-xl transition-all duration-300 cursor-pointer active:scale-95 relative ${
              activeTab === 'promocoes'
                ? 'bg-mimu-gold text-white dark:text-[#121212] shadow-md scale-102 font-extrabold'
                : 'text-white/80 dark:text-gray-400 hover:text-mimu-gold'
            }`}
          >
            {t('common.promotions', 'Promoções')}
            <span className="absolute top-1.5 right-1 sm:right-2 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
          </button>
          <button
            onClick={() => setActiveTab('novos_servicos')}
            className={`flex-grow py-2.5 px-4 text-xs sm:text-sm font-bold rounded-xl transition-all duration-300 cursor-pointer active:scale-95 relative ${
              activeTab === 'novos_servicos'
                ? 'bg-mimu-gold text-white dark:text-[#121212] shadow-md scale-102 font-extrabold'
                : 'text-white/80 dark:text-gray-400 hover:text-mimu-gold'
            }`}
          >
            {t('common.newServices', 'Novos Serviços')}
            <span className="absolute top-1.5 right-1 sm:right-2 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
          </button>
        </div>

        {/* Card de Destaques */}
        <div className="relative w-full h-40 md:h-52 rounded-2xl overflow-hidden shadow-md mb-8 bg-mimu-wine-light">
          <img
            src="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80"
            alt="Destaques Mimu"
            className="absolute inset-0 w-full h-full object-cover z-0"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent z-[1]" />
          
          <div className="relative z-10 flex flex-col justify-center h-full p-5 sm:p-6 md:p-8">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white drop-shadow-md">
              {t('home.featuredTitle')}
            </h1>
            <p className="text-white/90 mt-1 text-sm sm:text-base max-w-md drop-shadow">
              {t('home.featuredSubtitle')}
            </p>
          </div>
        </div>

        <SearchAndFilter 
          selectedCategories={selectedCategories} 
          onSetSelectedCategories={setSelectedCategories}
          onCategoryToggle={(catId) => {
             setSelectedCategories(prev => 
               prev.includes(catId) ? prev.filter(c => c !== catId) : [...prev, catId]
             )
          }}
          province={province} onProvinceChange={p => { setProvince(p); setCity(''); }}
          city={city} onCityChange={setCity}
          searchTerm={searchTerm} onSearchChange={setSearchTerm}
          sortBy={sortBy} onSortChange={setSortBy}
        />

        <div className="mt-4 flex items-center justify-between">
          <p className="text-mimu-wine-light-text dark:text-gray-300/80">
             {loading ? t('common.searchServices', 'A pesquisar serviços...') : t('listing.results', { count: totalCount || services.length })}
          </p>
        </div>

        {loading ? (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="bg-mimu-white dark:bg-[#1E1E1E] rounded-2xl shadow-sm border border-mimu-cream-border dark:border-[#2A2A2A] overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 dark:via-white/5 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }}></div>
                    <div className="flex flex-row p-3 sm:p-4 gap-4 animate-pulse">
                      <div className="shrink-0 w-24 h-24 sm:w-28 sm:h-28 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
                      <div className="flex flex-col flex-grow justify-between py-1">
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded w-2/3"></div>
                          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded-full w-16"></div>
                        </div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/2 mb-2"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/3 mb-auto"></div>
                        <div className="flex items-center justify-between mt-4">
                          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-12"></div>
                          <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded-lg w-16"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
             </div>
        ) : services.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center justify-center animate-fade-in-slow">
            <svg className="w-20 h-20 text-mimu-wine-light-text dark:text-gray-600 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <h3 className="text-2xl font-bold text-mimu-wine-text dark:text-white mb-2">{t('listing.noResults', 'Nenhum serviço encontrado')}</h3>
            <p className="text-lg text-mimu-wine-light-text dark:text-gray-300/80 max-w-md mx-auto">{t('listing.noResults')} Tenta ajustar os teus filtros ou termos de pesquisa.</p>
            <button onClick={() => { setSearchTerm(''); setSelectedCategories([]); setProvince(''); setCity(''); }} className="mt-6 px-6 py-2 bg-mimu-gold hover:bg-mimu-gold-hover text-mimu-wine-text dark:text-white font-bold rounded-lg transition-colors cursor-pointer">{t('common.clearFilters', 'Limpar Filtros')}</button>
          </div>
        ) : (
          <>
            <div key={activeTab} className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 animate-fade-in-slow">
              {services.map((service) => (
                <CompactServiceCard key={service.id} service={service} />
              ))}
            </div>
            
            {loadingMore && (
              <div className="mt-6 flex justify-center">
                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mimu-gold"></div>
              </div>
            )}

            {hasMore && !loadingMore && (
              <div className="mt-10 flex justify-center">
                <button 
                  onClick={() => setPage(p => p + 1)}
                  className="px-8 py-3 bg-mimu-gold hover:bg-mimu-gold-hover text-mimu-wine-text dark:text-white font-bold rounded-xl transition-all duration-300 shadow-md hover:shadow-lg cursor-pointer"
                >
                  {t('common.loadMore', 'Carregar Mais')}
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  )
}
