import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { ServicesContext } from '../context/ServicesContext';
import { NetworkContext } from '../context/NetworkContext';

/**
 * Componente para resetar todos os dados da aplicação
 * Mantém apenas os dados do administrador e limpa tudo o resto
 */
const ResetApplicationData = () => {
  // Acessar contextos para limpar estados
  const { setUser, setToken } = useContext(AuthContext);
  const { setServices, setCategories, setBookings } = useContext(ServicesContext);
  const { setIsOnline } = useContext(NetworkContext);

  /**
   * Função principal para resetar todos os dados da aplicação
   */
  const resetApplicationData = () => {
    try {
      // 1. Confirmar com o usuário antes de prosseguir
      const confirmed = window.confirm(
        'ATENÇÃO: Esta ação irá apagar TODOS os dados fictícios da aplicação (serviços, clientes, prestadores, pedidos, empresas, categorias, imagens, documentos, notificações).\n\n' +
        'Apenas os dados do administrador serão preservados.\n\n' +
        'Esta ação não pode ser desfeita. Deseja continuar?'
      );

      if (!confirmed) {
        console.log('Reset cancelado pelo usuário');
        return;
      }

      // 2. Limpar estados React temporários/fictícios
      // Preservar apenas dados do admin (user e token se for admin)
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const currentToken = localStorage.getItem('token');

      // Verificar se o usuário atual é admin antes de limpar
      if (currentUser && currentUser.role === 'admin') {
        // Manter dados do admin
        setUser(currentUser);
        setToken(currentToken);
      } else {
        // Se não for admin, limpar também
        setUser(null);
        setToken(null);
      }

      // Limpar estados dos contextos
      setServices([]); // Limpar lista de serviços
      setCategories([]); // Limpar categorias
      setBookings([]); // Limpar reservas/pedidos
      setIsOnline(true); // Resetar status de conexão

      // 3. Limpar localStorage e sessionStorage
      // Preservar apenas dados do admin
      const adminData = {
        user: currentUser && currentUser.role === 'admin' ? currentUser : null,
        token: currentUser && currentUser.role === 'admin' ? currentToken : null
      };

      // Limpar completamente o localStorage
      localStorage.clear();
      sessionStorage.clear();

      // Restaurar apenas dados do admin se existir
      if (adminData.user) {
        localStorage.setItem('user', JSON.stringify(adminData.user));
      }
      if (adminData.token) {
        localStorage.setItem('token', adminData.token);
      }

      // 4. Feedback de sucesso para o usuário
      alert('✅ Reset concluído com sucesso!\n\nTodos os dados fictícios foram removidos. Apenas os dados do administrador foram preservados.');
      console.log('Reset da aplicação concluído com sucesso');

    } catch (error) {
      // 5. Tratamento de erro
      console.error('Erro durante o reset da aplicação:', error);
      alert('❌ Erro durante o reset!\n\nVerifique o console para mais detalhes.');
    }
  };

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold text-red-600 mb-4">
        ⚠️ Reset de Dados da Aplicação
      </h3>
      <p className="text-sm text-gray-600 mb-4">
        Esta ação irá remover todos os dados fictícios da aplicação, mantendo apenas os dados do administrador.
      </p>
      <button
        onClick={resetApplicationData}
        className="bg-red-600 hover:bg-red-700 text-white rounded px-4 py-2 transition-colors duration-200"
      >
        Resetar Todos os Dados
      </button>
    </div>
  );
};

export default ResetApplicationData;