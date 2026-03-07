import React from 'react'
import AdminSidebar from '../../components/AdminSidebar'
import { storage, KEYS } from '../../utils/storage'

export default function AdminUsersPage() {
  const users = storage.get(KEYS.USERS, [])

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#F4E8D8]">
      <AdminSidebar />
      <div className="flex-1 p-4 sm:p-6 md:p-8 w-full">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#3A0D0D] mb-4">Utilizadores</h1>
        <p className="mb-6 text-[#5C1A1A] text-sm sm:text-base">Total: {users.length}</p>

        <div className="overflow-x-auto -mx-4 sm:mx-0 sm:overflow-visible">
          <table className="w-full text-left bg-white rounded-lg shadow-md text-sm sm:text-base min-w-max sm:min-w-0">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-4 sm:px-4 py-3 font-semibold text-[#3A0D0D]">Nome</th>
                <th className="px-4 sm:px-4 py-3 font-semibold text-[#3A0D0D] hidden sm:table-cell">Email</th>
                <th className="px-4 sm:px-4 py-3 font-semibold text-[#3A0D0D]">Função</th>
                <th className="px-4 sm:px-4 py-3 font-semibold text-[#3A0D0D]">Estado</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-4 sm:px-4 py-3 text-[#5C1A1A]">{u.name || u.fullName || '-'}</td>
                  <td className="px-4 sm:px-4 py-3 text-[#5C1A1A] hidden sm:table-cell text-xs sm:text-sm">{u.email || u.username || '-'}</td>
                  <td className="px-4 sm:px-4 py-3 text-[#5C1A1A] capitalize text-xs sm:text-sm">{u.role}</td>
                  <td className="px-4 sm:px-4 py-3 capitalize">
                    <span className="text-xs sm:text-sm px-2 py-1 rounded bg-gray-100 text-gray-800 inline-block">{u.status || 'active'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}