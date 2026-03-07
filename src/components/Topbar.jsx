import React from 'react';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

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
    <header className="bg-white shadow-md border-b">
      <div className="max-w-screen-xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Lado esquerdo - Menu hamburguer e logotipo */}
          <div className="flex items-center space-x-4">
            {/* Botão menu hamburguer - visível apenas em mobile/tablet */}
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 rounded-md hover:bg-gray-100 transition-colors"
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
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">M</span>
              </div>
              <span className="text-xl font-bold text-gray-800 hidden sm:block">
                Mimu
              </span>
            </div>
          </div>

          {/* Lado direito - Informações do usuário */}
          <div className="flex items-center space-x-4">
            {/* Nome do administrador */}
            <div className="hidden md:block">
              <p className="text-sm text-gray-600">Olá,</p>
              <p className="text-sm font-medium text-gray-900">
                {user?.name || 'Administrador'}
              </p>
            </div>

            {/* Foto de perfil (placeholder) */}
            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-gray-600 font-medium">
                {user?.name?.charAt(0)?.toUpperCase() || 'A'}
              </span>
            </div>

            {/* Botão logout */}
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
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