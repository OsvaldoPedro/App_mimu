import { useState, useMemo, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Navbar from '../components/Navbar'
import CategoryHeader from '../components/CategoryHeader'
import SearchAndFilter from '../components/SearchAndFilter'
import ServiceCard from '../components/ServiceCard'
import Footer from '../components/Footer'
import { categories as staticCategories } from '../data/categories'
import { getServicesByCategory } from '../data/services'
import { useCategories } from '../hooks/useCategories'

export default function CategoryPage() {
  const { categoryId } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [allServices, setAllServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [visibleCount, setVisibleCount] = useState(20)

  const [selectedServiceType, setSelectedServiceType] = useState('')
  const [selectedProvince, setSelectedProvince] = useState('')
  const [selectedCity, setSelectedCity] = useState('')

  const { categories } = useCategories()
  const category = categories.find(c => c.id === categoryId) || staticCategories.find(c => c.id === categoryId) || { services: [] }

  useEffect(() => {
    async function load() {
      setLoading(true)
      const data = await getServicesByCategory(categoryId || category?.id)
      setAllServices(data)
      setLoading(false)
    }
    load()
    setVisibleCount(20)
  }, [categoryId, category?.id])

  const filteredAndSorted = useMemo(() => {
    let list = allServices

    if (selectedServiceType) {
      list = list.filter(s => s.type === selectedServiceType)
    }
    if (selectedProvince) {
      list = list.filter(s => s.provinceId === selectedProvince)
    }
    if (selectedCity) {
      list = list.filter(s => s.municipalityId === selectedCity)
    }
    
    return list
  }, [allServices, selectedServiceType, selectedProvince, selectedCity])

  const categoryName = t(`category.${categoryId}`)

  return (
    <div className="min-h-screen bg-mimu-cream dark:bg-[#121212]">
      <Navbar />
      <CategoryHeader
        categoryId={categoryId}
        title={categoryName}
        showSearch={false}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">        
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <select
            value={selectedServiceType}
            onChange={e => setSelectedServiceType(e.target.value)}
            className="w-full sm:w-auto px-4 py-2 rounded-lg border-2 border-mimu-cream-border dark:border-[#2A2A2A] focus:border-mimu-gold bg-mimu-white dark:bg-[#1E1E1E] text-mimu-wine-text dark:text-white focus:outline-none"
          >
            <option value="">{t('common.allServices', 'Todos os serviços')}</option>
            {category.services.map((s, i) => (
              <option key={i} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <SearchAndFilter 
          selectedCategories={[categoryId]}
          onCategoryToggle={(val) => {
             if(val && val !== categoryId) navigate(`/categoria/${val}`, { replace: true })
             else if(!val) navigate(`/servicos`, { replace: true })
          }}
          province={selectedProvince} onProvinceChange={p => { setSelectedProvince(p); setSelectedCity(''); }}
          city={selectedCity} onCityChange={setSelectedCity}
        />

        <p className="mt-4 text-mimu-wine-light-text dark:text-gray-300/80">
          {loading ? t('common.searchServices', 'A carregar serviços...') : t('listing.results', { count: filteredAndSorted.length })}
        </p>

        {loading ? (
             <div className="py-20 flex justify-center items-center">
               <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-mimu-gold"></div>
             </div>
        ) : filteredAndSorted.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-xl text-mimu-wine-light-text dark:text-gray-300/80">{t('listing.noResults')}</p>
          </div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mt-6">
              {filteredAndSorted.slice(0, visibleCount).map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
            {visibleCount < filteredAndSorted.length && (
              <div className="mt-10 flex justify-center">
                <button 
                  onClick={() => setVisibleCount(c => c + 20)}
                  className="px-8 py-3 bg-mimu-gold hover:bg-mimu-gold-hover text-mimu-wine-text dark:text-white font-bold rounded-xl transition-all duration-300 shadow-md hover:shadow-lg"
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
