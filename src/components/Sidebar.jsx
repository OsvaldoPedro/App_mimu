import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

/**
 * Componente Sidebar responsivo para o painel administrativo
 * - Visível em desktop (lg+)
 * - Escondida em mobile/tablet
 * - Botão hamburguer para abrir em telas pequenas
 * - Animação suave de abertura/fechamento
 */
const Sidebar = ({ isOpen, setIsOpen }) => {
  const location = useLocation();

  // Links de navegação do admin
  const navItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/admin/users', label: 'Utilizadores', icon: '👥' },
    { path: '/admin/companies', label: 'Empresas', icon: '🏢' },
    { path: '/admin/services', label: 'Serviços', icon: '🛠️' },
    { path: '/admin/orders', label: 'Encomendas', icon: '📦' },
  ];

  return (
    <>
      {/* Overlay para mobile - fecha sidebar ao clicar */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-50 lg:translate-x-0 lg:static lg:inset-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header da Sidebar */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-xl font-bold text-gray-800">Admin Panel</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="lg:hidden p-2 rounded-md hover:bg-gray-100"
            >
              ✕
            </button>
          </div>

          {/* Navegação */}
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {navItems.map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      location.pathname === item.path
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    onClick={() => setIsOpen(false)} // Fecha sidebar em mobile após navegar
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span className="font-medium">{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Footer da Sidebar */}
          <div className="p-4 border-t">
            <p className="text-sm text-gray-500">Mimu Admin v1.0</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;