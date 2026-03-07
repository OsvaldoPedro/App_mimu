import { useState, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Navbar from '../components/Navbar'
import CategoryHeader from '../components/CategoryHeader'
import SearchAndFilter from '../components/SearchAndFilter'
import ServiceCard from '../components/ServiceCard'
import Footer from '../components/Footer'
import { categories } from '../data/categories'
import { provinces } from '../data/provinces'
import { getServicesByCategory } from '../data/services'

export default function CategoryPage() {
  const { categoryId } = useParams()
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('price_asc')

  // filtro adicional
  const [selectedServiceType, setSelectedServiceType] = useState('')
  const [selectedProvince, setSelectedProvince] = useState('')

  const category = categories.find(c => c.id === categoryId) || categories[0]
  const allServices = getServicesByCategory(categoryId || category?.id)

  const filteredAndSorted = useMemo(() => {
    let list = allServices

    // aplicar filtros tipo/província se selecionados
    if (selectedServiceType) {
      list = list.filter(s => s.type === selectedServiceType)
    }
    if (selectedProvince) {
      list = list.filter(s => s.province === selectedProvince)
    }
    
    // Aplicar filtro de pesquisa apenas se houver texto
    if (search.trim()) {
      const searchLower = search.toLowerCase()
      list = list.filter(s =>
        (s.name && s.name.toLowerCase().includes(searchLower)) ||
        (s.description && s.description.toLowerCase().includes(searchLower)) ||
        (s.location && s.location.toLowerCase().includes(searchLower))
      )
    }
    
    // Aplicar ordenação
    if (sortBy === 'price_asc') list = [...list].sort((a, b) => (a.price || 0) - (b.price || 0))
    if (sortBy === 'price_desc') list = [...list].sort((a, b) => (b.price || 0) - (a.price || 0))
    if (sortBy === 'rating') list = [...list].sort((a, b) => (b.rating || 0) - (a.rating || 0))
    
    return list
  }, [allServices, search, sortBy, selectedServiceType, selectedProvince])

  const categoryName = t(`category.${categoryId}`)

  return (
    <div className="min-h-screen bg-[#F4E8D8]">
      <Navbar />
      <CategoryHeader
        categoryId={categoryId}
        title={categoryName}
        showSearch={true}
        search={search}
        onSearch={setSearch}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">        {/* filtros por tipo e província */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <select
            value={selectedServiceType}
            onChange={e => setSelectedServiceType(e.target.value)}
            className="w-full sm:w-auto px-4 py-2 rounded-lg border border-gray-300 bg-white text-[#3A0D0D]"
          >
            <option value="">Todos os serviços</option>
            {category.services.map((s, i) => (
              <option key={i} value={s}>{s}</option>
            ))}
          </select>

          <select
            value={selectedProvince}
            onChange={e => setSelectedProvince(e.target.value)}
            className="w-full sm:w-auto px-4 py-2 rounded-lg border border-gray-300 bg-white text-[#3A0D0D]"
          >
            <option value="">Todas as províncias</option>
            {provinces.map((p, i) => (
              <option key={i} value={p}>{p}</option>
            ))}
          </select>
        </div>
        <SearchAndFilter search={search} onSearch={setSearch} sortBy={sortBy} onSortBy={setSortBy} />

        <p className="mt-4 text-[#5C1A1A]/80">
          {t('listing.results', { count: filteredAndSorted.length })}
        </p>

        {filteredAndSorted.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-xl text-[#5C1A1A]/80">{t('listing.noResults')}</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mt-6">
            {filteredAndSorted.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
