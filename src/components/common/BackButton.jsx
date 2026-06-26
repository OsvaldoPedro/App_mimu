import { useNavigate, useLocation } from 'react-router-dom';

export default function BackButton({ variant = 'dark', className = "" }) {
  const navigate = useNavigate();
  const location = useLocation();

  // Esconde apenas nas rotas de entrada da app (home/login/registro), mas mantém o controle em fluxos internos e painéis.
  const hiddenPaths = ['/', '/entrar', '/registar'];

  // Condicional de exact match para esconder nas rotas iniciais
  if (hiddenPaths.includes(location.pathname)) {
    return null;
  }

  const handleBack = () => {
    // Se o histórico existe (maior que 1 página nesta sessão)
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      // Fallback Inteligente (se abriu o link direto, voltar para a raiz daquela secção)
      if (location.pathname.startsWith('/admin')) navigate('/admin', { replace: true });
      else if (location.pathname.startsWith('/empresa')) navigate('/empresa', { replace: true });
      else if (location.pathname.startsWith('/prestador')) navigate('/prestador', { replace: true });
      else navigate('/', { replace: true });
    }
  };

  // Tema: light para Navbar (fundo escuro), dark para Topbar (fundo claro)
  const style = variant === 'light' 
    ? 'text-mimu-white-text hover:bg-mimu-white dark:bg-[#1E1E1E]/20 active:bg-mimu-white dark:bg-[#1E1E1E]/30' 
    : 'text-mimu-wine-text dark:text-white hover:bg-mimu-gray-100 dark:bg-[#121212] active:bg-mimu-gray-200';

  return (
    <button
      onClick={handleBack}
      className={`p-2.5 sm:p-3 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90 group focus:outline-none focus:ring-2 focus:ring-mimu-gold ${style} ${className}`}
      aria-label="Voltar para a página anterior"
      title="Voltar"
    >
      <svg className="w-6 h-6 sm:w-7 sm:h-7 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {/* Ícone de seta "<-" limpa e profissional */}
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
      </svg>
    </button>
  );
}
