import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function MorePage() {
  const { user, isAdmin } = useAuth()
  const currentYear = new Date().getFullYear()

  const options = [
    {
      title: 'Sobre o Mimu',
      path: '/sobre-mimu',
      icon: '✨',
      image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&q=80',
      delay: '0ms'
    },
    {
      title: 'Ajuda e Suporte',
      path: '/suporte',
      icon: '🎧',
      image: 'https://images.unsplash.com/photo-1534536281715-e28d76689b4d?w=600&q=80',
      delay: '100ms'
    },
    ...(user && !isAdmin ? [{
      title: 'Os Meus Tickets',
      path: '/meus-tickets',
      icon: '🎫',
      image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=80',
      delay: '150ms'
    }, {
      title: 'Carteira Digital',
      path: '/carteira',
      icon: '💰',
      image: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=600&q=80',
      delay: '200ms'
    }] : []),
    {
      title: 'Privacidade',
      path: '/politica-privacidade',
      icon: '🔒',
      image: 'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=600&q=80',
      delay: '200ms'
    },
    {
      title: 'Termos de Uso',
      path: '/termos-de-uso',
      icon: '📝',
      image: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=600&q=80',
      delay: '300ms'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-mimu-wine via-mimu-wine-light to-[#2A0808] dark:bg-none dark:bg-[#000000] pb-24 pt-12 md:pt-20 overflow-hidden relative transition-colors duration-300">
      {/* Elementos decorativos de fundo */}
      <div className="absolute top-[-5%] left-[-10%] w-96 h-96 bg-mimu-gold/20 dark:bg-mimu-gold/5 rounded-full blur-[100px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[10%] right-[-10%] w-[30rem] h-[30rem] bg-orange-500/10 dark:bg-orange-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[40%] left-[50%] w-64 h-64 bg-mimu-wine-light/40 dark:bg-white/5 rounded-full blur-[100px] pointer-events-none -translate-x-1/2" />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 relative z-10 flex flex-col min-h-[calc(100vh-8rem)]">
        
        {/* Header / Brand */}
        <div className="text-center mb-10 animate-[fadeInDown_0.8s_ease-out]">
          <p className="text-white/95 mx-auto max-w-sm text-base md:text-lg font-medium leading-relaxed bg-black/20 backdrop-blur-sm p-4 rounded-2xl shadow-xl border border-white/10 mt-8">
            A tua plataforma de reservas e serviços em Angola. Conectamos quem precisa com quem sabe fazer.
          </p>
        </div>

        {/* Grid de Cubos */}
        <div className="grid grid-cols-2 gap-4 md:gap-6 mb-12">
          {options.map((opt, index) => (
            <Link 
              key={index}
              to={opt.path} 
              className="group relative aspect-square rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border-2 border-white/10 hover:border-white/20"
              style={{ animation: `fadeInUp 0.6s ease-out ${opt.delay} both` }}
            >
              {/* Imagem de Fundo */}
              <img 
                src={opt.image} 
                alt={opt.title} 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              {/* Gradiente Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#1A0505]/95 via-[#1A0505]/50 to-transparent dark:from-black/95 dark:via-black/60 transition-opacity duration-300 group-hover:opacity-90" />
              
              {/* Conteúdo */}
              <div className="absolute inset-0 p-5 flex flex-col justify-end items-start">
                <span className="text-3xl mb-3 transform transition-transform duration-300 group-hover:-translate-y-1 group-hover:scale-110 drop-shadow-md">
                  {opt.icon}
                </span>
                <h2 className="text-white font-bold text-lg md:text-xl leading-tight drop-shadow-lg transform transition-transform duration-300 group-hover:-translate-y-1">
                  {opt.title}
                </h2>
              </div>
            </Link>
          ))}
        </div>

        {/* Footer info */}
        <div className="text-center mt-auto pt-4">
          <div className="inline-block bg-black/20 backdrop-blur-md px-6 py-2 rounded-full shadow-sm border border-white/10">
            <p className="text-sm font-semibold text-white/70">
              © {currentYear} Mimu Angola.
            </p>
          </div>
        </div>

      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
