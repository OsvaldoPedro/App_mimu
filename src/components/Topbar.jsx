import React from 'react';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import BackButton from './common/BackButton';

/**
 * Componente Topbar responsivo para o painel administrativo
 * - Logotipo da aplicação
 * - Nome do administrador
 * - Foto de perfil (placeholder)
 * - Botão logout
 * - Botão menu hamburguer para mobile
 */
const Topbar = ({ onMenuClick }) => {
  const { user, logout } = useContext(AuthContext);

  const handleLogout = () => {
    if (window.confirm('Tem certeza que deseja sair?')) {
      logout();
    }
  };

  return (
    <header className="bg-mimu-white dark:bg-[#1E1E1E] shadow-md border-b">
      <div className="max-w-screen-xl mx-auto px-4">
        <div className="flex items-center justify-between h-24">
          {/* Lado esquerdo - Menu hamburguer e logotipo */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Botão de voltar global para painéis */}
            <BackButton variant="dark" />
            
            {/* Botão menu hamburguer - visível apenas em mobile/tablet */}
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 rounded-xl hover:bg-mimu-gray-100 dark:bg-[#121212] transition-colors transition-all duration-300 hover:shadow-md active:scale-95"
              aria-label="Abrir menu"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>

            {/* Logotipo */}
            <div className="flex items-center">
              <img src="/mimu-logo.png" alt="Mimu Logo" className="h-[80px] w-auto object-contain" />
            </div>
          </div>

          {/* Lado direito - Informações do usuário */}
          <div className="flex items-center space-x-4">
            {/* Nome do administrador */}
            <div className="hidden md:block">
              <p className="text-sm text-mimu-text-muted">Olá,</p>
              <p className="text-sm font-medium text-mimu-text-dark dark:text-white">
                {user?.name || 'Administrador'}
              </p>
            </div>

            {/* Foto de perfil (placeholder) */}
            <div className="w-10 h-10 bg-mimu-gray-200 rounded-full flex items-center justify-center">
              <span className="text-mimu-text-muted font-medium">
                {user?.name?.charAt(0)?.toUpperCase() || 'A'}
              </span>
            </div>

            {/* Botão logout */}
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-mimu-white-text bg-red-600 rounded-xl hover:bg-red-700 transition-colors transition-all duration-300 hover:shadow-md active:scale-95 min-h-[44px]"
            >
              Sair
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;