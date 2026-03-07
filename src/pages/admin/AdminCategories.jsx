import { useState, useEffect } from 'react'
import AdminSidebar from '../../components/AdminSidebar'
import { storage, KEYS } from '../../utils/storage'

export default function AdminCategories() {
  const [categories, setCategories] = useState([])

  useEffect(() => {
    // Load categories from data/categories.js or similar
    const cats = [
      { id: 1, name: 'Estádia', servicesCount: 15, active: true },
      { id: 2, name: 'Comer', servicesCount: 23, active: true },
      { id: 3, name: 'Festas', servicesCount: 8, active: true },
      { id: 4, name: 'Transporte', servicesCount: 12, active: true },
      { id: 5, name: 'Automovel', servicesCount: 18, active: true },
      { id: 6, name: 'Entregas', servicesCount: 9, active: true },
      { id: 7, name: 'Profissionais', servicesCount: 25, active: true },
      { id: 8, name: 'Formação', servicesCount: 6, active: true },
      { id: 9, name: 'Beleza', servicesCount: 14, active: true },
      { id: 10, name: 'Casa', servicesCount: 20, active: true },
    ]
    setCategories(cats)
  }, [])

  const toggleCategory = (id) => {
    setCategories(cats => cats.map(cat => cat.id === id ? { ...cat, active: !cat.active } : cat))
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#F4E8D8]">
      <AdminSidebar />
      <div className="flex-1 p-4 sm:p-6 md:p-8 w-full">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#3A0D0D] mb-6 md:mb-8">Categorias</h1>

        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {categories.map((category) => (
              <div key={category.id} className="p-4 border rounded-lg">
                <h3 className="text-lg font-semibold text-[#3A0D0D]">{category.name}</h3>
                <p className="text-sm text-[#5C1A1A]/80">Serviços: {category.servicesCount}</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className={`px-2 py-1 rounded text-sm ${category.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {category.active ? 'Ativa' : 'Inativa'}
                  </span>
                  <div className="space-x-2">
                    <button className="px-3 py-1 text-sm bg-[#C58A2B] text-white rounded hover:bg-[#b87d26]">
                      Editar
                    </button>
                    <button
                      onClick={() => toggleCategory(category.id)}
                      className={`px-3 py-1 text-sm rounded ${category.active ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-green-500 text-white hover:bg-green-600'}`}
                    >
                      {category.active ? 'Desativar' : 'Ativar'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}