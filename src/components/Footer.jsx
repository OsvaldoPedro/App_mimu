import { Link } from 'react-router-dom'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="hidden md:block bg-mimu-white dark:bg-[#1E1E1E] border-t border-mimu-cream-border dark:border-[#2A2A2A] pt-10 pb-24 md:pb-10 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand/About */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <h3 className="text-xl font-bold text-mimu-wine dark:text-white mb-3">Mimu</h3>
            <p className="text-sm text-mimu-wine-light-text dark:text-gray-300/80 max-w-xs">
              A tua plataforma de reservas e serviços em Angola. Conectamos quem precisa com quem sabe fazer.
            </p>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <h4 className="text-sm font-bold text-mimu-wine-text dark:text-white mb-4 uppercase tracking-wider">A Plataforma</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/sobre-mimu" className="text-sm text-mimu-wine-light-text dark:text-gray-300/80 hover:text-mimu-gold transition-colors">
                  Sobre o Mimu
                </Link>
              </li>
              <li>
                <Link to="/suporte" className="text-sm text-mimu-wine-light-text dark:text-gray-300/80 hover:text-mimu-gold transition-colors">
                  Ajuda e Suporte
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <h4 className="text-sm font-bold text-mimu-wine-text dark:text-white mb-4 uppercase tracking-wider">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/politica-privacidade" className="text-sm text-mimu-wine-light-text dark:text-gray-300/80 hover:text-mimu-gold transition-colors">
                  Política de Privacidade
                </Link>
              </li>
              <li>
                <Link to="/termos-de-uso" className="text-sm text-mimu-wine-light-text dark:text-gray-300/80 hover:text-mimu-gold transition-colors">
                  Termos de Uso
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-mimu-cream-border dark:border-[#2A2A2A]/50 pt-6 flex flex-col md:flex-row justify-between items-center text-xs text-mimu-wine-light-text dark:text-gray-300/60">
          <p>© {currentYear} Mimu Angola. Todos os direitos reservados.</p>
          <div className="mt-2 md:mt-0 flex space-x-4">
            <Link to="/politica-privacidade" className="hover:text-mimu-gold transition-colors">Privacidade</Link>
            <span>&middot;</span>
            <Link to="/termos-de-uso" className="hover:text-mimu-gold transition-colors">Termos</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
