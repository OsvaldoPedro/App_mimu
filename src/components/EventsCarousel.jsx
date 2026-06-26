import React, { useRef, useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useUpcomingEvents } from '../hooks/useEvents'
import EventDetailsModal from './EventDetailsModal'
import { useTheme } from '../context/ThemeContext'
import OptimizedImage from './common/OptimizedImage'

const mockEvents = [
  {
    id: 'mock-1',
    title: "Show ao Vivo em Luanda",
    image_url: "https://placehold.co/300x200",
    date: new Date(new Date().setHours(18, 0, 0, 0)).toISOString(),
    location: "Ilha de Luanda",
    type: 'prestador',
    participants_count: 50
  },
  {
    id: 'mock-2',
    title: "Workshop de Programação",
    image_url: "https://placehold.co/300x200",
    date: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString(),
    location: "Talatona",
    type: 'empresa',
    participants_count: 12
  }
];

export default function EventsCarousel() {
  const { t } = useTranslation()
  const { events, loading } = useUpcomingEvents()
  const { theme } = useTheme()
  const scrollRef = useRef(null)
  
  const [selectedEvent, setSelectedEvent] = useState(null)

  const openEvent = (event) => {
    setSelectedEvent(event)
  }

  // LOG PARA CONFIRMAR EXECUÇÃO (OBRIGATÓRIO PELA INSTRUÇÃO DO USER)
  useEffect(() => {
    console.log("EventsCarousel renderizado")
  }, [])

  const scroll = (direction) => {
    if (scrollRef.current) {
      const { current } = scrollRef
      const scrollAmount = direction === 'left' ? -300 : 300
      current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
    }
  }

  // Use base de dados se houver eventos, caso contrário use MOCK
  const displayEvents = events.length > 0 ? events : mockEvents

  if (loading) {
    return (
      <section className="py-8 bg-gradient-to-r from-[#F4E8D8] to-[#FFFBF5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mimu-gold"></div>
        </div>
      </section>
    )
  }

  return (
    <section className={`pt-12 pb-8 relative overflow-hidden transition-colors duration-300 ${theme === 'dark' ? 'bg-[#121212]' : 'bg-gradient-to-r from-[#F4E8D8] to-[#FFFBF5]'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-end justify-between mb-6">
          <div>
            {/* TÍTULO REQUISITADO */}
            <h2 className={`text-xl md:text-2xl sm:text-3xl font-extrabold tracking-tight transition-colors ${theme === 'dark' ? 'text-mimu-white-text' : 'text-mimu-wine-text dark:text-white'}`}>
              {t('events.newsTitle', 'Novidades')}
            </h2>
            <p className={`font-medium mt-1 transition-colors ${theme === 'dark' ? 'text-mimu-text-muted' : 'text-mimu-wine-light-text dark:text-gray-300/80'}`}>
              {t('events.newsSubtitle', 'Eventos e atividades criadas pelos nossos parceiros')}
            </p>
          </div>
          
          <div className="hidden sm:flex gap-2">
            <button 
              onClick={() => scroll('left')}
              className="w-10 h-10 rounded-full bg-mimu-white dark:bg-[#1E1E1E] shadow-md flex items-center justify-center text-mimu-wine-light-text dark:text-gray-300 hover:text-mimu-gold hover:bg-mimu-gray-50 dark:bg-[#121212] transition"
            >
              ←
            </button>
            <button 
              onClick={() => scroll('right')}
              className="w-10 h-10 rounded-full bg-mimu-white dark:bg-[#1E1E1E] shadow-md flex items-center justify-center text-mimu-wine-light-text dark:text-gray-300 hover:text-mimu-gold hover:bg-mimu-gray-50 dark:bg-[#121212] transition"
            >
              →
            </button>
          </div>
        </div>

        {/* Container Horizontal com Scroll */}
        <div 
          ref={scrollRef}
          className="flex overflow-x-auto gap-[16px] pb-6 pt-2 snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', scrollBehavior: 'smooth' }}
        >
          {displayEvents.map((ev) => (
            <div 
              key={ev.id} 
              onClick={() => openEvent(ev)}
              className={`w-[250px] min-w-[250px] shrink-0 rounded-xl overflow-hidden shadow-lg snap-start cursor-pointer group transition-all hover:-translate-y-1 hover:shadow-xl border ${theme === 'dark' ? 'bg-[#1E1E1E] border-[#2A2A2A] text-mimu-white-text' : 'bg-mimu-white dark:bg-[#1E1E1E] border-transparent'}`}
            >
              <div className="h-40 bg-mimu-gray-200 relative overflow-hidden">
                {ev.image_url ? (
                  <OptimizedImage 
                    src={ev.image_url} 
                    alt={ev.title} 
                    className="w-full h-full"
                    imgClassName="group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full bg-mimu-gold/20 flex items-center justify-center">
                    <span className="text-xl md:text-2xl md:text-3xl md:text-4xl">📅</span>
                  </div>
                )}
                
                {/* Badge Data */}
                <div className="absolute top-3 right-3 bg-mimu-white dark:bg-[#1E1E1E]/95 backdrop-blur-sm px-2 py-1 rounded-2xl shadow-sm text-center">
                  <p className="text-mimu-gold font-bold text-[10px] uppercase leading-none">
                    {new Date(ev.date).toLocaleDateString('pt-PT', { month: 'short' })}
                  </p>
                  <p className="text-mimu-wine-text dark:text-white font-extrabold text-base leading-none mt-1">
                    {new Date(ev.date).getDate()}
                  </p>
                </div>

                {/* Type Tag */}
                {ev.type && (
                   <div className="absolute bottom-3 left-3">
                     <span className="px-2 py-1 bg-black/60 backdrop-blur-md text-mimu-white-text/90 text-[10px] font-bold rounded uppercase">
                       {ev.type}
                     </span>
                   </div>
                )}
              </div>
              
              <div className="p-4">
                <h3 className={`font-bold text-base line-clamp-2 mb-2 transition-colors h-10 ${theme === 'dark' ? 'text-mimu-white-text group-hover:text-mimu-gold' : 'text-mimu-wine-text dark:text-white group-hover:text-mimu-gold'}`}>
                  {ev.title}
                </h3>
                
                <div className="space-y-1 mt-2">
                  <div className={`flex items-center gap-1.5 text-[13px] ${theme === 'dark' ? 'text-gray-300' : 'text-mimu-wine-light-text dark:text-gray-300/80'}`}>
                    <span className="shrink-0">📍</span>
                    <span className="truncate">{ev.location}</span>
                  </div>
                  <div className={`flex items-center gap-1.5 text-[13px] ${theme === 'dark' ? 'text-gray-300' : 'text-mimu-wine-light-text dark:text-gray-300/80'}`}>
                    <span className="shrink-0">👥</span>
                    <span>{ev.participants_count || 0} confirmados</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Genérico que aceita tanto Mocks como Reais */}
      {selectedEvent && (
        <EventDetailsModal 
          event={selectedEvent} 
          onClose={() => setSelectedEvent(null)} 
        />
      )}
    </section>
  )
}
