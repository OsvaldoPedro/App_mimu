import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

/**
 * Layout responsivo principal da aplicação
 * - Header responsivo (Topbar)
 * - Sidebar responsiva
 * - Conteúdo principal flexível
 * - Funciona em mobile, tablet, laptop e desktop
 */
const ResponsiveLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Topbar sempre visível */}
      <Topbar onMenuClick={() => setSidebarOpen(true)} />

      <div className="flex">
        {/* Sidebar */}
        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

        {/* Conteúdo principal */}
        <main className="flex-1 lg:ml-0">
          <div className="max-w-screen-xl mx-auto px-4 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ResponsiveLayout;