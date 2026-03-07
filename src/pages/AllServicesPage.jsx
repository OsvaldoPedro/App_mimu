import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import Navbar from '../components/Navbar'
import SearchAndFilter from '../components/SearchAndFilter'
import ServiceCard from '../components/ServiceCard'
import Footer from '../components/Footer'
import { getAllServices } from '../data/services'

export default function AllServicesPage() {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('price_asc')

  const allServices = getAllServices()

  const filteredAndSorted = useMemo(() => {
    let list = allServices

    if (search.trim()) {
      const searchLower = search.toLowerCase()
      list = list.filter(s =>
        (s.name && s.name.toLowerCase().includes(searchLower)) ||
        (s.description && s.description.toLowerCase().includes(searchLower)) ||
        (s.location && s.location.toLowerCase().includes(searchLower))
      )
    }

    if (sortBy === 'price_asc') list = [...list].sort((a, b) => (a.price || 0) - (b.price || 0))
    if (sortBy === 'price_desc') list = [...list].sort((a, b) => (b.price || 0) - (a.price || 0))
    if (sortBy === 'rating') list = [...list].sort((a, b) => (b.rating || 0) - (a.rating || 0))

    return list
  }, [allServices, search, sortBy])

  return (
    <div className="min-h-screen bg-[#F4E8D8]">
      <Navbar />

      <header className="relative pt-20 pb-8 bg-gradient-to-r from-[#3A0D0D]/90 to-[#3A0D0D]/70">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white">
            {t('home.featuredTitle') /* using featured title as generic "Serviços" */}
          </h1>
          <p className="text-[#F4E8D8]/80 mt-2">
            {t('home.featuredSubtitle')}
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
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
