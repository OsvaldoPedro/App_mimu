import React from 'react';
import ResponsiveLayout from '../components/ResponsiveLayout';
import AdminDashboard from '../components/AdminDashboard';

/**
 * Página do Dashboard Administrativo
 * Usa o layout responsivo e renderiza o conteúdo do dashboard
 */
const AdminDashboardPage = () => {
  return (
    <ResponsiveLayout>
      <AdminDashboard />
    </ResponsiveLayout>
  );
};

export default AdminDashboardPage;