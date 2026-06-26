import React from 'react';
import AdminCategoriesManager from '../../components/admin/AdminCategoriesManager';

export default function AdminCategories() {
  return (
    <div className="w-full relative pb-10">
      <h1 className="text-xl md:text-2xl sm:text-3xl font-bold text-mimu-wine-text dark:text-white mb-6 md:mb-8">Gestão de Categorias</h1>
      
      <div className="bg-mimu-white dark:bg-[#1E1E1E] p-4 sm:p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300">
        <AdminCategoriesManager />
      </div>
    </div>
  );
}