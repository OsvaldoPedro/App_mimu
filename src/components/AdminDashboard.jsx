import React, { useState, useEffect } from 'react';
import AdminCategoriesManager from './admin/AdminCategoriesManager';

/**
 * Componente AdminDashboard - Dashboard moderno e responsivo
 * Contém cards de estatísticas e tabela responsiva
 */
const StatCard = ({ title, value, icon, color }) => (
  <div className={`bg-mimu-white dark:bg-[#1E1E1E] p-4 md:p-6 rounded-lg shadow-md border-l-4 ${color}`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-mimu-text-muted">{title}</p>
        <p className="text-xl md:text-2xl md:text-3xl font-bold text-mimu-text-dark dark:text-white">{value.toLocaleString()}</p>
      </div>
      <div className="text-xl md:text-2xl md:text-3xl md:text-4xl">{icon}</div>
    </div>
  </div>
);

const AdminDashboard = () => {
  const [tab, setTab] = useState('overview');
  // Estado para dados mockados (em produção, viriam de API)
  const [stats, setStats] = useState({
    clients: 0,
    providers: 0,
    companies: 0,
    services: 0,
    orders: 0,
  });

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Simular carregamento de dados
  useEffect(() => {
    // Dados mockados para demonstração
    setTimeout(() => {
      setStats({
        clients: 1250,
        providers: 340,
        companies: 85,
        services: 1250,
        orders: 2100,
      });

      setUsers([
        { id: 1, name: 'João Silva', email: 'joao@email.com', role: 'Cliente', status: 'Ativo', createdAt: '2024-01-15' },
        { id: 2, name: 'Maria Santos', email: 'maria@email.com', role: 'Prestador', status: 'Pendente', createdAt: '2024-01-20' },
        { id: 3, name: 'Empresa ABC Ltda', email: 'contato@empresaabc.com', role: 'Empresa', status: 'Aprovado', createdAt: '2024-01-10' },
        { id: 4, name: 'Carlos Oliveira', email: 'carlos@email.com', role: 'Cliente', status: 'Ativo', createdAt: '2024-01-25' },
        { id: 5, name: 'Ana Costa', email: 'ana@email.com', role: 'Prestador', status: 'Aprovado', createdAt: '2024-01-18' },
      ]);

      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mimu-gold"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Título da página */}
      <div>
        <h1 className="text-xl md:text-2xl md:text-3xl font-bold text-mimu-text-dark dark:text-white">Dashboard Administrativo</h1>
        <p className="text-mimu-text-muted mt-2">Visão geral do sistema Mimu</p>
      </div>

      {/* Navegação de Tabs */}
      <div className="flex border-b border-mimu-cream-border dark:border-[#2A2A2A] mb-6">
        <button
          onClick={() => setTab('overview')}
          className={`px-6 py-3 font-medium text-sm focus:outline-none ${
            tab === 'overview'
              ? 'text-mimu-gold border-b-2 border-mimu-gold'
              : 'text-mimu-wine-light-text dark:text-gray-300 hover:text-mimu-wine-text dark:text-white'
          }`}
        >
          Visão Geral
        </button>
        <button
          onClick={() => setTab('categories')}
          className={`px-6 py-3 font-medium text-sm focus:outline-none ${
            tab === 'categories'
              ? 'text-mimu-gold border-b-2 border-mimu-gold'
              : 'text-mimu-wine-light-text dark:text-gray-300 hover:text-mimu-wine-text dark:text-white'
          }`}
        >
          Categorias & Serviços
        </button>
      </div>

      {tab === 'categories' && (
        <AdminCategoriesManager />
      )}

      {tab === 'overview' && (
        <>
          {/* Cards de estatísticas - Grid responsivo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            <StatCard
              title="Total de Clientes"
              value={stats.clients}
              icon="👥"
              color="border-mimu-gold"
            />
            <StatCard
              title="Prestadores"
              value={stats.providers}
              icon="🛠️"
              color="border-green-500"
            />
            <StatCard
              title="Empresas"
              value={stats.companies}
              icon="🏢"
              color="border-purple-500"
            />
            <StatCard
              title="Serviços"
              value={stats.services}
              icon="📋"
              color="border-orange-500"
            />
            <StatCard
              title="Encomendas"
              value={stats.orders}
              icon="📦"
              color="border-red-500"
            />
          </div>

          {/* Tabela de usuários recentes - Responsiva */}
          <div className="bg-mimu-white dark:bg-[#1E1E1E] rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="p-4 md:p-6 border-b">
              <h2 className="text-lg font-semibold text-mimu-text-dark dark:text-white">Utilizadores Recentes</h2>
              <p className="text-sm text-mimu-text-muted mt-1">Últimos usuários cadastrados no sistema</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-mimu-gray-50 dark:bg-[#121212]">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-mimu-text-muted uppercase tracking-wider">
                      Nome
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-mimu-text-muted uppercase tracking-wider hidden md:table-cell">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-mimu-text-muted uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-mimu-text-muted uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-mimu-text-muted uppercase tracking-wider hidden lg:table-cell">
                      Data Cadastro
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-mimu-text-muted uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-mimu-white dark:bg-[#1E1E1E] divide-y divide-mimu-border-light">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-mimu-gray-50 dark:bg-[#121212]">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-mimu-text-dark dark:text-white">{user.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                        <div className="text-sm text-mimu-text-muted">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${user.role === 'Cliente' ? 'bg-mimu-gold/20 text-mimu-gold' :
                          user.role === 'Prestador' ? 'bg-green-100 text-green-800' :
                            'bg-purple-100 text-purple-800'
                          }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${user.status === 'Ativo' ? 'bg-green-100 text-green-800' :
                          user.status === 'Pendente' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-mimu-text-muted hidden lg:table-cell">
                        {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button className="text-mimu-gold hover:text-mimu-gold mr-3 min-h-[44px]">
                          Ver
                        </button>
                        <button className="text-red-600 hover:text-red-900 min-h-[44px]">
                          Excluir
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginação simples */}
            <div className="px-6 py-4 border-t bg-mimu-gray-50 dark:bg-[#121212]">
              <div className="flex items-center justify-between">
                <div className="text-sm text-mimu-text-dark dark:text-white">
                  Mostrando <span className="font-medium">1</span> a <span className="font-medium">5</span> de{' '}
                  <span className="font-medium">100</span> resultados
                </div>
                <div className="flex space-x-2">
                  <button className="px-3 py-1 text-sm border rounded hover:bg-mimu-gray-100 dark:bg-[#121212] disabled:opacity-50 transition-all duration-300 hover:shadow-md active:scale-95 min-h-[44px]" disabled>
                    Anterior
                  </button>
                  <button className="px-3 py-1 text-sm bg-mimu-gold text-mimu-wine-text dark:text-white text-mimu-white-text rounded hover:bg-mimu-gold text-mimu-wine-text dark:text-white transition-all duration-300 hover:shadow-md active:scale-95 min-h-[44px]">
                    Próximo
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;