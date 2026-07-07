import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useTheme } from '../context/ThemeContext'
import { useUpcomingEvents } from '../hooks/useEvents'
import EventDetailsModal from '../components/EventDetailsModal'
import OptimizedImage from '../components/common/OptimizedImage'

export default function EventsPage() {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { events, loading, reload } = useUpcomingEvents()
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')

  // Extrair categorias exclusivas presentes nos eventos carregados
  const categories = Array.from(
    new Set(
      events
        .map((ev) => ev.category || ev.activity_type || ev.type)
        .filter(Boolean)
    )
  )

  // Filtragem no frontend
  const filteredEvents = events.filter((ev) => {
    const title = ev.title || ev.name || ''
    const location = ev.location || ev.venue || ev.address || ''
    const category = ev.category || ev.activity_type || ev.type || 'Geral'

    const matchesSearch =
      title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      location.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCategory = selectedCategory
      ? category.toLowerCase() === selectedCategory.toLowerCase()
      : true

    return matchesSearch && matchesCategory
  })

  return (
    <div className={`min-h-screen pb-20 md:pb-0 transition-colors duration-300 ${theme === 'dark' ? 'bg-[#121212] text-mimu-white-text' : 'bg-mimu-cream text-mimu-text-dark dark:text-white'}`}>
      <Navbar />
      
      <div className="pt-28 pb-16 max-w-7xl mx-auto px-4 sm:px-6">
        {/* Cabeçalho */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
          <div className="text-center md:text-left">
            <h1 className={`text-3xl md:text-4xl font-extrabold tracking-tight transition-colors ${theme === 'dark' ? 'text-mimu-white-text' : 'text-mimu-wine-text dark:text-white'}`}>
              {t('events.pageTitle', 'Agenda de Eventos')}
            </h1>
            <p className={`font-medium mt-2 transition-colors ${theme === 'dark' ? 'text-mimu-text-muted' : 'text-mimu-wine-light-text dark:text-gray-300/80'}`}>
              {t('events.pageSubtitle', 'Adquira bilhetes e assista aos melhores eventos em parceria com a MKT360.')}
            </p>
          </div>
          
          <button 
            onClick={reload}
            className="px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-xl transition-all duration-300 bg-mimu-wine hover:bg-mimu-wine-light text-white shadow-md hover:shadow-lg flex items-center gap-2"
          >
            <span>🔄</span> {t('events.refresh', 'Atualizar')}
          </button>
        </div>

        {/* Barra de Filtros & Pesquisa */}
        <div className={`mb-8 p-4 rounded-2xl border transition-all duration-300 flex flex-col sm:flex-row gap-4 items-center justify-between ${theme === 'dark' ? 'bg-[#1E1E1E] border-[#2A2A2A]' : 'bg-white border-mimu-border-light shadow-sm'}`}>
          <div className="relative w-full sm:max-w-md">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              🔍
            </span>
            <input
              type="text"
              placeholder={t('events.searchPlaceholder', 'Pesquisar por evento ou localização...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl border focus:outline-none transition-all duration-200 text-sm ${
                theme === 'dark' 
                  ? 'bg-[#121212] border-[#2A2A2A] text-white focus:border-mimu-gold' 
                  : 'bg-mimu-cream/50 border-mimu-border-light focus:border-mimu-wine'
              }`}
            />
          </div>

          {/* Categorias Selector */}
          <div className="flex gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-thin">
            <button
              onClick={() => setSelectedCategory('')}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 ${
                selectedCategory === ''
                  ? 'bg-mimu-gold text-mimu-text-dark shadow-sm'
                  : theme === 'dark'
                  ? 'bg-[#121212] text-gray-300 hover:bg-[#2A2A2A]'
                  : 'bg-mimu-cream text-mimu-wine-light-text hover:bg-mimu-border-light'
              }`}
            >
              {t('events.allCategories', 'Todas')}
            </button>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 uppercase ${
                  selectedCategory.toLowerCase() === category.toLowerCase()
                    ? 'bg-mimu-gold text-mimu-text-dark shadow-sm'
                    : theme === 'dark'
                    ? 'bg-[#121212] text-gray-300 hover:bg-[#2A2A2A]'
                    : 'bg-mimu-cream text-mimu-wine-light-text hover:bg-mimu-border-light'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Mensagem de Erro */}

        {/* Grid ou Loader */}
        {loading ? (
          /* Modern Shimmer Loading Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className={`h-80 rounded-2xl border ${theme === 'dark' ? 'bg-[#1E1E1E] border-[#2A2A2A]' : 'bg-white border-transparent'} overflow-hidden`}>
                <div className="h-40 bg-mimu-gray-200 dark:bg-gray-800"></div>
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-mimu-gray-200 dark:bg-gray-800 rounded w-3/4"></div>
                  <div className="h-3 bg-mimu-gray-200 dark:bg-gray-800 rounded w-1/2"></div>
                  <div className="h-3 bg-mimu-gray-200 dark:bg-gray-800 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          /* Empty State elegantly styled */
          <div className="flex flex-col items-center justify-center min-h-[40vh] px-4 text-center">
            <div className="w-20 h-20 mb-6 flex items-center justify-center bg-mimu-gold/10 text-mimu-gold rounded-full">
              <span className="text-3xl">📅</span>
            </div>
            <h2 className="text-xl font-bold mb-2">{t('events.emptyTitle', 'Nenhum evento agendado')}</h2>
            <p className="text-mimu-wine-light-text dark:text-gray-400 max-w-sm mx-auto">
              {t('events.emptyText', 'De momento não foram encontrados eventos correspondentes aos filtros ativos.')}
            </p>
          </div>
        ) : (
          /* Dynamically rendered cards grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredEvents.map((ev) => {
              const dateVal = ev.date || ev.start_date || ev.created_at
              const dateObj = dateVal ? new Date(dateVal) : new Date()
              const title = ev.title || ev.name || 'Evento'
              const location = ev.location || ev.venue || ev.address || 'Consultar Detalhes'
              const category = ev.category || ev.activity_type || ev.type
              const imageUrl = ev.image_url || null

              return (
                <div 
                  key={ev.id} 
                  onClick={() => setSelectedEvent(ev)}
                  className={`group rounded-2xl overflow-hidden shadow-md cursor-pointer transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl border ${theme === 'dark' ? 'bg-[#1E1E1E] border-[#2A2A2A] text-mimu-white-text' : 'bg-white border-transparent'}`}
                >
                  <div className="h-44 bg-mimu-gray-200 dark:bg-gray-800 relative overflow-hidden">
                    {imageUrl ? (
                      <OptimizedImage 
                        src={imageUrl} 
                        alt={title} 
                        className="w-full h-full"
                        imgClassName="group-hover:scale-105 transition-transform duration-500 object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-mimu-gold/15 flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
                        <span className="text-4xl">📅</span>
                      </div>
                    )}
                    
                    {/* Date Badge */}
                    <div className="absolute top-3 right-3 bg-mimu-white/95 dark:bg-[#1E1E1E]/95 backdrop-blur-sm px-2.5 py-1.5 rounded-2xl shadow-sm text-center">
                      <p className="text-mimu-gold font-bold text-[10px] uppercase leading-none">
                        {dateObj.toLocaleDateString('pt-PT', { month: 'short' })}
                      </p>
                      <p className="text-mimu-wine-text dark:text-white font-extrabold text-base leading-none mt-1">
                        {dateObj.getDate()}
                      </p>
                    </div>

                    {/* Activity Type Tag */}
                    {category && (
                       <div className="absolute bottom-3 left-3">
                         <span className="px-2.5 py-1 bg-black/60 backdrop-blur-md text-mimu-white-text text-[10px] font-bold rounded-lg uppercase tracking-wider">
                           {category}
                         </span>
                       </div>
                    )}
                  </div>
                  
                  <div className="p-5">
                    <h3 className={`font-bold text-lg line-clamp-2 mb-3 h-12 transition-colors duration-200 group-hover:text-mimu-gold ${theme === 'dark' ? 'text-mimu-white-text' : 'text-mimu-wine-text dark:text-white'}`}>
                      {title}
                    </h3>
                    
                    <div className="space-y-2 mt-4 border-t border-mimu-border-light dark:border-gray-800 pt-3">
                      <div className={`flex items-center gap-2 text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-mimu-wine-light-text dark:text-gray-300/80'}`}>
                        <span className="shrink-0">📍</span>
                        <span className="truncate">{location}</span>
                      </div>
                      
                      <div className="flex justify-between items-center pt-2">
                        <span className="text-[10px] font-semibold text-mimu-gold uppercase tracking-wider">Mimu Eventos</span>
                        <span className="text-xs px-2.5 py-1 rounded-full bg-mimu-wine/10 text-mimu-wine dark:bg-mimu-gold/10 dark:text-mimu-gold font-semibold">
                          Ver Detalhes →
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {selectedEvent && (
        <EventDetailsModal 
          event={selectedEvent} 
          onClose={() => setSelectedEvent(null)} 
        />
      )}

      <Footer />
    </div>
  )
}

