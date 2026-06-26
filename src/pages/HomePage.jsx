import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import EventsCarousel from '../components/EventsCarousel'
import { useCategories } from '../hooks/useCategories'
import { useTheme } from '../context/ThemeContext'
import { supabase } from '../config/supabaseClient'
import { PartyPopper, Hotel, Utensils, Car, MoreHorizontal, Star, Heart, MapPin, Sparkles } from 'lucide-react'
import OptimizedImage from '../components/common/OptimizedImage'

const fallbackPromos = [
  {
    id: 'promo-1',
    name: 'Hotel Vista Mar',
    location: 'Luanda, Angola',
    price: 45000,
    currency: 'Kz',
    priceType: 'perNight',
    rating: 4.8,
    reviewCount: 142,
    images: ['https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80'],
    desconto: 15,
    promocao_activa: true,
    category_id: 'estadia'
  },
  {
    id: 'promo-2',
    name: 'Festa Sunset',
    location: 'Luanda, Angola',
    price: 5000,
    currency: 'Kz',
    priceType: 'perPerson',
    rating: 4.9,
    reviewCount: 98,
    images: ['https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=600&q=80'],
    desconto: 20,
    promocao_activa: true,
    category_id: 'festas'
  },
  {
    id: 'promo-3',
    name: 'Restaurante Baía',
    location: 'Ilha de Luanda, Angola',
    price: 18000,
    currency: 'Kz',
    priceType: 'perPerson',
    rating: 4.7,
    reviewCount: 210,
    images: ['https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=80'],
    desconto: 10,
    promocao_activa: true,
    category_id: 'comer'
  }
]

const fallbackRecommended = [
  {
    id: 'rec-1',
    name: 'Musa Estadia & Spa',
    location: 'Talatona, Luanda',
    price: 65000,
    currency: 'Kz',
    priceType: 'perNight',
    rating: 5.0,
    reviewCount: 34,
    images: ['https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&q=80'],
    category_id: 'estadia'
  },
  {
    id: 'rec-2',
    name: 'Kupapula Rent-a-Car',
    location: 'Aeroporto, Luanda',
    price: 25000,
    currency: 'Kz',
    priceType: 'perDay',
    rating: 4.6,
    reviewCount: 88,
    images: ['https://images.unsplash.com/photo-1549488344-1f9b8d2bd1f3?w=600&q=80'],
    category_id: 'transporte'
  },
  {
    id: 'rec-3',
    name: 'Espaço Luanda Eventos',
    location: 'Patriota, Luanda',
    price: 120000,
    currency: 'Kz',
    priceType: 'service',
    rating: 4.9,
    reviewCount: 57,
    images: ['https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=600&q=80'],
    category_id: 'festas'
  }
]

const fallbackLuanda = [
  {
    id: 'lda-1',
    name: 'Restaurante Lookal Mar',
    location: 'Ilha de Luanda',
    price: 22000,
    currency: 'Kz',
    priceType: 'perPerson',
    rating: 4.8,
    reviewCount: 312,
    images: ['https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80'],
    category_id: 'comer'
  },
  {
    id: 'lda-2',
    name: 'Alojamento Miramar',
    location: 'Miramar, Luanda',
    price: 55000,
    currency: 'Kz',
    priceType: 'perNight',
    rating: 4.5,
    reviewCount: 45,
    images: ['https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=600&q=80'],
    category_id: 'estadia'
  },
  {
    id: 'lda-3',
    name: 'Táxi Executivo Luanda',
    location: 'Luanda Geral',
    price: 15000,
    currency: 'Kz',
    priceType: 'session',
    rating: 4.7,
    reviewCount: 128,
    images: ['https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=600&q=80'],
    category_id: 'transporte'
  }
]

export default function HomePage() {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { categories, loading: categoriesLoading } = useCategories()
  const navigate = useNavigate()

  const [promoServices, setPromoServices] = useState([])
  const [recommendedServices, setRecommendedServices] = useState([])
  const [luandaServices, setLuandaServices] = useState([])
  const [favorites, setFavorites] = useState({})
  const [loadingServices, setLoadingServices] = useState(true)

  // Fetch Services from DB with fallbacks
  useEffect(() => {
    async function fetchServices() {
      try {
        setLoadingServices(true)
        // 1. Fetch Promotions
        const { data: promos } = await supabase
          .from('services')
          .select('*')
          .eq('status', 'approved')
          .eq('promocao_activa', true)
          .limit(6)
        
        // 2. Fetch Recommended (high rating)
        const { data: recs } = await supabase
          .from('services')
          .select('*')
          .eq('status', 'approved')
          .order('rating', { ascending: false })
          .limit(6)

        // 3. Fetch Luanda services
        const { data: lda } = await supabase
          .from('services')
          .select('*')
          .eq('status', 'approved')
          .ilike('location', '%Luanda%')
          .limit(6)

        if (promos && promos.length > 0) setPromoServices(promos)
        else setPromoServices(fallbackPromos)

        if (recs && recs.length > 0) setRecommendedServices(recs)
        else setRecommendedServices(fallbackRecommended)

        if (lda && lda.length > 0) setLuandaServices(lda)
        else setLuandaServices(fallbackLuanda)

      } catch (err) {
        console.error('Erro ao buscar serviços:', err)
        setPromoServices(fallbackPromos)
        setRecommendedServices(fallbackRecommended)
        setLuandaServices(fallbackLuanda)
      } finally {
        setLoadingServices(false)
      }
    }
    fetchServices()
  }, [])

  const toggleFavorite = (id, e) => {
    e.preventDefault()
    e.stopPropagation()
    setFavorites(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  const formatPrice = (price, currency = 'Kz') => {
    const formatted = new Intl.NumberFormat('pt-AO', { minimumFractionDigits: 0 }).format(price)
    return `${formatted} ${currency}`
  }

  const getPriceSuffix = (type) => {
    const mapping = {
      perNight: '/noite',
      perPerson: '/pessoa',
      perDay: '/dia',
      session: '/sessão',
      consultation: '/consulta',
      event: '/evento',
      service: ''
    }
    return mapping[type] || ''
  }

  // Quick categories row definition
  const quickCats = [
    { id: 'festas', name: 'Festas & Eventos', icon: <PartyPopper className="w-5 h-5" />, path: '/categoria/festas' },
    { id: 'estadia', name: 'Hotéis', icon: <Hotel className="w-5 h-5" />, path: '/categoria/estadia' },
    { id: 'comer', name: 'Restaurantes', icon: <Utensils className="w-5 h-5" />, path: '/categoria/comer' },
    { id: 'transporte', name: 'Transporte', icon: <Car className="w-5 h-5" />, path: '/categoria/transporte' },
    { id: 'mais', name: 'Mais', icon: <MoreHorizontal className="w-5 h-5" />, path: '/servicos' }
  ]

  // Curated featured categories images and captions
  const featuredCatsList = [
    { id: 'festas', name: 'Festas & Eventos', desc: 'Tudo para seu evento inesquecível', image: 'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=600&q=80', popular: true },
    { id: 'estadia', name: 'Hotéis', desc: 'Conforto e hospitalidade premium', image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80' },
    { id: 'comer', name: 'Restaurantes', desc: 'Sabores que criam memórias', image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80' },
    { id: 'transporte', name: 'Transporte', desc: 'Mobilidade com toda a segurança', image: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=600&q=80' }
  ]

  return (
    <div className={`min-h-screen transition-colors duration-300 pb-20 ${theme === 'dark' ? 'bg-[#121212] text-white' : 'bg-mimu-cream/30 text-mimu-wine-text'}`}>
      <Navbar />

      <main className="w-full">
        {/* Banner principal (Hero) */}
        <Hero />

        {/* 1. Quick Categories Row */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex overflow-x-auto gap-3 pb-3 scrollbar-hide snap-x" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {quickCats.map((cat) => (
              <button
                key={cat.id}
                onClick={() => navigate(cat.path)}
                className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl whitespace-nowrap snap-start border text-sm font-semibold transition-all duration-300 active:scale-95 shadow-sm ${
                  theme === 'dark'
                    ? 'bg-[#1E1E1E] border-[#2A2A2A] text-gray-300 hover:text-mimu-gold hover:border-mimu-gold/50'
                    : 'bg-white border-mimu-cream-border text-mimu-wine-light-text hover:text-mimu-gold hover:border-mimu-gold/50'
                }`}
              >
                <span className="text-mimu-gold shrink-0">{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        </section>

        {/* 2. Categorias em Destaque */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg sm:text-xl font-black uppercase tracking-wider text-mimu-gold">
                Categorias em destaque
              </h2>
              <p className="text-xs sm:text-sm text-mimu-text-muted dark:text-gray-400 mt-1">
                Explore os serviços essenciais mais procurados
              </p>
            </div>
            <Link to="/servicos" className="text-xs sm:text-sm font-bold text-mimu-gold hover:underline shrink-0">
              Ver todas
            </Link>
          </div>

          {/* Categories Cards Row */}
          <div className="flex overflow-x-auto gap-4 pb-4 scrollbar-hide snap-x lg:grid lg:grid-cols-4 lg:overflow-visible" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {featuredCatsList.map((cat) => (
              <Link
                key={cat.id}
                to={`/categoria/${cat.id}`}
                className="group relative w-64 min-w-64 lg:w-full shrink-0 aspect-[4/3] rounded-2xl overflow-hidden shadow-lg snap-start block border border-mimu-cream-border/10 dark:border-[#2A2A2A]"
              >
                <OptimizedImage
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover"
                  imgClassName="group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                
                {cat.popular && (
                  <span className="absolute top-3 left-3 bg-mimu-gold text-black text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded shadow flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5 fill-black" /> Popular
                  </span>
                )}

                <div className="absolute bottom-0 left-0 right-0 p-4 pointer-events-none">
                  <h3 className="text-base font-black text-white group-hover:text-mimu-gold transition-colors leading-tight">
                    {cat.name}
                  </h3>
                  <p className="text-white/70 text-[11px] mt-1 leading-normal">
                    {cat.desc}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* MKT360 Upcoming Events Section */}
        <EventsCarousel />

        {/* 3. Ofertas Especiais para você */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg sm:text-xl font-black uppercase tracking-wider text-mimu-gold">
                Ofertas especiais para você
              </h2>
              <p className="text-xs sm:text-sm text-mimu-text-muted dark:text-gray-400 mt-1">
                Campanhas e descontos imperdíveis dos nossos parceiros
              </p>
            </div>
            <Link to="/servicos?tab=promocoes" className="text-xs sm:text-sm font-bold text-mimu-gold hover:underline shrink-0">
              Ver todas
            </Link>
          </div>

          {/* Cards Row */}
          <div className="flex overflow-x-auto gap-5 pb-4 scrollbar-hide snap-x lg:grid lg:grid-cols-3 lg:overflow-visible" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {promoServices.map((service) => {
              const isFav = !!favorites[service.id]
              const oldPrice = service.price || 0
              const discount = service.desconto || 15
              const promoPrice = service.preco_promocional || (oldPrice * (1 - discount / 100))
              
              return (
                <div
                  key={service.id}
                  onClick={() => navigate(`/servico/${service.id}`)}
                  className={`relative w-[280px] min-w-[280px] lg:w-full shrink-0 rounded-3xl overflow-hidden shadow-lg border snap-start cursor-pointer group transition-all duration-300 hover:-translate-y-1 ${
                    theme === 'dark' ? 'bg-[#1E1E1E] border-[#2A2A2A]' : 'bg-white border-mimu-cream-border/50'
                  }`}
                >
                  {/* Image Container */}
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <OptimizedImage
                      src={service.images && service.images[0] ? service.images[0] : 'https://via.placeholder.com/300x200'}
                      alt={service.name}
                      className="w-full h-full object-cover"
                      imgClassName="group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    
                    {/* Discount Badge */}
                    <span className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg shadow-md">
                      {discount}% OFF
                    </span>

                    {/* Favorite Heart Button */}
                    <button
                      onClick={(e) => toggleFavorite(service.id, e)}
                      className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:scale-105 transition-transform"
                    >
                      <Heart className={`w-4 h-4 transition-colors ${isFav ? 'fill-red-500 text-red-500' : 'text-white'}`} />
                    </button>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 sm:p-5">
                    <h3 className="font-extrabold text-base line-clamp-1 group-hover:text-mimu-gold transition-colors leading-tight">
                      {service.name}
                    </h3>
                    
                    <div className="flex items-center gap-1 text-[11px] text-mimu-text-muted dark:text-gray-400 mt-1.5">
                      <MapPin className="w-3 h-3 text-mimu-gold shrink-0" />
                      <span className="truncate">{service.location}</span>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-mimu-cream-border/20 dark:border-[#2A2A2A]/50">
                      {/* Price container */}
                      <div className="flex flex-col">
                        <span className="text-[10px] line-through text-red-500/70 dark:text-red-400/60 font-semibold leading-none">
                          {formatPrice(oldPrice)}
                        </span>
                        <span className="text-sm sm:text-base font-black text-mimu-gold mt-1 leading-none">
                          {formatPrice(promoPrice)}{getPriceSuffix(service.priceType)}
                        </span>
                      </div>

                      {/* Rating container */}
                      <div className="flex items-center gap-1 bg-mimu-gold/10 px-2 py-1 rounded-lg">
                        <Star className="w-3.5 h-3.5 fill-mimu-gold text-mimu-gold" />
                        <span className="font-black text-xs text-mimu-gold">
                          {service.rating > 0 ? Number(service.rating).toFixed(1) : 'Novo'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* 4. Recomendado para si */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg sm:text-xl font-black uppercase tracking-wider text-mimu-gold">
                Recomendado para si
              </h2>
              <p className="text-xs sm:text-sm text-mimu-text-muted dark:text-gray-400 mt-1">
                Serviços personalizados com base nas melhores avaliações
              </p>
            </div>
            <Link to="/servicos?sort=rating" className="text-xs sm:text-sm font-bold text-mimu-gold hover:underline shrink-0">
              Ver mais
            </Link>
          </div>

          {/* Cards Row */}
          <div className="flex overflow-x-auto gap-5 pb-4 scrollbar-hide snap-x lg:grid lg:grid-cols-3 lg:overflow-visible" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {recommendedServices.map((service) => {
              const isFav = !!favorites[service.id]
              return (
                <div
                  key={service.id}
                  onClick={() => navigate(`/servico/${service.id}`)}
                  className={`relative w-[280px] min-w-[280px] lg:w-full shrink-0 rounded-3xl overflow-hidden shadow-lg border snap-start cursor-pointer group transition-all duration-300 hover:-translate-y-1 ${
                    theme === 'dark' ? 'bg-[#1E1E1E] border-[#2A2A2A]' : 'bg-white border-mimu-cream-border/50'
                  }`}
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <OptimizedImage
                      src={service.images && service.images[0] ? service.images[0] : 'https://via.placeholder.com/300x200'}
                      alt={service.name}
                      className="w-full h-full object-cover"
                      imgClassName="group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    
                    <button
                      onClick={(e) => toggleFavorite(service.id, e)}
                      className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:scale-105 transition-transform"
                    >
                      <Heart className={`w-4 h-4 transition-colors ${isFav ? 'fill-red-500 text-red-500' : 'text-white'}`} />
                    </button>
                  </div>

                  <div className="p-4 sm:p-5">
                    <h3 className="font-extrabold text-base line-clamp-1 group-hover:text-mimu-gold transition-colors leading-tight">
                      {service.name}
                    </h3>
                    
                    <div className="flex items-center gap-1 text-[11px] text-mimu-text-muted dark:text-gray-400 mt-1.5">
                      <MapPin className="w-3 h-3 text-mimu-gold shrink-0" />
                      <span className="truncate">{service.location}</span>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-mimu-cream-border/20 dark:border-[#2A2A2A]/50">
                      <span className="text-sm sm:text-base font-black text-mimu-gold leading-none">
                        {formatPrice(service.price)}{getPriceSuffix(service.priceType)}
                      </span>

                      <div className="flex items-center gap-1 bg-mimu-gold/10 px-2 py-1 rounded-lg">
                        <Star className="w-3.5 h-3.5 fill-mimu-gold text-mimu-gold" />
                        <span className="font-black text-xs text-mimu-gold">
                          {service.rating > 0 ? Number(service.rating).toFixed(1) : 'Novo'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* 5. Mais procurados em Luanda */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg sm:text-xl font-black uppercase tracking-wider text-mimu-gold">
                Mais procurados em Luanda
              </h2>
              <p className="text-xs sm:text-sm text-mimu-text-muted dark:text-gray-400 mt-1">
                Tendências e serviços mais requisitados na capital
              </p>
            </div>
            <Link to="/servicos?location=Luanda" className="text-xs sm:text-sm font-bold text-mimu-gold hover:underline shrink-0">
              Ver mais
            </Link>
          </div>

          {/* Cards Row */}
          <div className="flex overflow-x-auto gap-5 pb-4 scrollbar-hide snap-x lg:grid lg:grid-cols-3 lg:overflow-visible" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {luandaServices.map((service) => {
              const isFav = !!favorites[service.id]
              return (
                <div
                  key={service.id}
                  onClick={() => navigate(`/servico/${service.id}`)}
                  className={`relative w-[280px] min-w-[280px] lg:w-full shrink-0 rounded-3xl overflow-hidden shadow-lg border snap-start cursor-pointer group transition-all duration-300 hover:-translate-y-1 ${
                    theme === 'dark' ? 'bg-[#1E1E1E] border-[#2A2A2A]' : 'bg-white border-mimu-cream-border/50'
                  }`}
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <OptimizedImage
                      src={service.images && service.images[0] ? service.images[0] : 'https://via.placeholder.com/300x200'}
                      alt={service.name}
                      className="w-full h-full object-cover"
                      imgClassName="group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    
                    <button
                      onClick={(e) => toggleFavorite(service.id, e)}
                      className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:scale-105 transition-transform"
                    >
                      <Heart className={`w-4 h-4 transition-colors ${isFav ? 'fill-red-500 text-red-500' : 'text-white'}`} />
                    </button>
                  </div>

                  <div className="p-4 sm:p-5">
                    <h3 className="font-extrabold text-base line-clamp-1 group-hover:text-mimu-gold transition-colors leading-tight">
                      {service.name}
                    </h3>
                    
                    <div className="flex items-center gap-1 text-[11px] text-mimu-text-muted dark:text-gray-400 mt-1.5">
                      <MapPin className="w-3 h-3 text-mimu-gold shrink-0" />
                      <span className="truncate">{service.location}</span>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-mimu-cream-border/20 dark:border-[#2A2A2A]/50">
                      <span className="text-sm sm:text-base font-black text-mimu-gold leading-none">
                        {formatPrice(service.price)}{getPriceSuffix(service.priceType)}
                      </span>

                      <div className="flex items-center gap-1 bg-mimu-gold/10 px-2 py-1 rounded-lg">
                        <Star className="w-3.5 h-3.5 fill-mimu-gold text-mimu-gold" />
                        <span className="font-black text-xs text-mimu-gold">
                          {service.rating > 0 ? Number(service.rating).toFixed(1) : 'Novo'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      </main>
    </div>
  )
}

