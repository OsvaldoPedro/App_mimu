import React, { useState, useEffect } from 'react';

/**
 * Componente AdminDashboard - Dashboard moderno e responsivo
 * Contém cards de estatísticas e tabela responsiva
 */
const AdminDashboard = () => {
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

  // Cards de estatísticas
  const StatCard = ({ title, value, icon, color }) => (
    <div className={`bg-white p-6 rounded-lg shadow-md border-l-4 ${color}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value.toLocaleString()}</p>
        </div>
        <div className="text-4xl">{icon}</div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Título da página */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Dashboard Administrativo</h1>
        <p className="text-gray-600 mt-2">Visão geral do sistema Mimu</p>
      </div>

      {/* Cards de estatísticas - Grid responsivo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        <StatCard
          title="Total de Clientes"
          value={stats.clients}
          icon="👥"
          color="border-blue-500"
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
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Utilizadores Recentes</h2>
          <p className="text-sm text-gray-600 mt-1">Últimos usuários cadastrados no sistema</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nome
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                  Data Cadastro
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{user.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.role === 'Cliente' ? 'bg-blue-100 text-blue-800' :
                      user.role === 'Prestador' ? 'bg-green-100 text-green-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.status === 'Ativo' ? 'bg-green-100 text-green-800' :
                      user.status === 'Pendente' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden lg:table-cell">
                    {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-blue-600 hover:text-blue-900 mr-3">
                      Ver
                    </button>
                    <button className="text-red-600 hover:text-red-900">
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginação simples */}
        <div className="px-6 py-4 border-t bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Mostrando <span className="font-medium">1</span> a <span className="font-medium">5</span> de{' '}
              <span className="font-medium">100</span> resultados
            </div>
            <div className="flex space-x-2">
              <button className="px-3 py-1 text-sm border rounded hover:bg-gray-100 disabled:opacity-50" disabled>
                Anterior
              </button>
              <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
                Próximo
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;