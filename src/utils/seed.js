import { storage, KEYS } from './storage'

export function seedDemoUsers() {
  const users = storage.get(KEYS.USERS, [])
  const hasAdmin = users.some(u => u.role === 'admin' || u.email === 'admin@meusite.com' || u.phone === '925468252')

  const adminUser = {
    id: 'adm_geral',
    role: 'admin',
    name: 'Admin Geral',
    email: 'admin@meusite.com',
    phone: '925468252',
    password: '12345678',
    status: 'active'
  }

  // Garante que o Super Admin existe mesmo em instalações já em uso.
  if (!hasAdmin) {
    storage.set(KEYS.USERS, [...users, adminUser])
  }

  // Se já existirem utilizadores, não volta a semear demos.
  if (users.length > 0) return

  const demoUsers = [
    { id: 'cmp_demo', role: 'company', companyName: 'Empresa Demo', email: 'empresa@demo.ao', phone: '+244 900 000 001', password: '123456', status: 'active' },
    { id: 'prv_demo', role: 'provider', name: 'Prestador Demo', email: 'prestador@demo.ao', phone: '+244 900 000 002', password: '123456', status: 'active', categoryId: 'beleza', serviceTypes: ['Spa', 'Massagens'], basePrice: 35000, province: 'Luanda' },
    { id: 'usr_demo', role: 'client', name: 'Cliente Demo', email: 'cliente@demo.ao', phone: '+244 900 000 003', password: '123456' }
  ]
  storage.set(KEYS.USERS, [...storage.get(KEYS.USERS, []), ...demoUsers])
}
