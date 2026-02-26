import { storage, KEYS } from '../utils/storage'

// Serviços mock para demonstração - imagens Unsplash alta qualidade
export const services = [
  // Estadia
  {
    id: 'hotel-1',
    categoryId: 'estadia',
    companyId: 'cmp_demo',
    name: 'Hotel Miramar Luanda',
    description: 'Hotel 5 estrelas com vista para o mar. Piscina, spa, restaurante gourmet e quartos com todas as comodidades.',
    price: 85000,
    currency: 'AOA',
    priceType: 'perNight',
    rating: 4.8,
    reviewCount: 324,
    location: 'Luanda, Angola',
    images: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80',
      'https://images.unsplash.com/photo-1582719478250-c89c6d9cba20?w=1200&q=80',
      'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=1200&q=80'
    ],
    amenities: ['Wi-Fi', 'Piscina', 'Spa', 'Restaurante', 'Estacionamento', 'Ar condicionado']
  },
  {
    id: 'hotel-2',
    categoryId: 'estadia',
    name: 'Lodge Kalandula Falls',
    description: 'Glamping junto às majestosas quedas de Kalandula. Experiência única em contacto com a natureza.',
    price: 45000,
    currency: 'AOA',
    priceType: 'perNight',
    rating: 4.9,
    reviewCount: 156,
    location: 'Malanje, Angola',
    images: [
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1200&q=80',
      'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1200&q=80'
    ],
    amenities: ['Wi-Fi', 'Restaurante', 'Tour guiado', 'Estacionamento']
  },
  {
    id: 'hotel-3',
    categoryId: 'estadia',
    name: 'Guest House Benguela Bay',
    description: 'Casa de hóspedes acolhedora com vista para a baía. Ambiente familiar e descontraído.',
    price: 25000,
    currency: 'AOA',
    priceType: 'perNight',
    rating: 4.6,
    reviewCount: 89,
    location: 'Benguela, Angola',
    images: [
      'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=1200&q=80',
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=1200&q=80'
    ],
    amenities: ['Wi-Fi', 'Pequeno-almoço', 'Cozinha partilhada']
  },
  // Comer
  {
    id: 'rest-1',
    categoryId: 'comer',
    companyId: 'cmp_demo',
    name: 'Restaurante Tamarindo',
    description: 'Cozinha angolana e internacional. Ambiente elegante com esplanada e vista para o mar.',
    price: 8500,
    currency: 'AOA',
    priceType: 'perPerson',
    rating: 4.7,
    reviewCount: 412,
    location: 'Luanda, Marginal',
    images: [
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=80',
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=80',
      'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1200&q=80'
    ],
    amenities: ['Terraço', 'Vinhos', 'Música ao vivo', 'Estacionamento']
  },
  {
    id: 'rest-2',
    categoryId: 'comer',
    name: 'Casa do Mar — Eventos',
    description: 'Espaço para eventos, festas e celebrações. Capacidade até 200 pessoas.',
    price: 120000,
    currency: 'AOA',
    priceType: 'event',
    rating: 4.8,
    reviewCount: 67,
    location: 'Luanda, Ilha',
    images: [
      'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&q=80',
      'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=1200&q=80'
    ],
    amenities: ['Jardim', 'Palco', 'Catering', 'Som e luz']
  },
  {
    id: 'rest-3',
    categoryId: 'comer',
    name: 'Tour gastronómico Lobito',
    description: 'Experiência de 4 horas com degustação em 4 restaurantes locais.',
    price: 15000,
    currency: 'AOA',
    priceType: 'perPerson',
    rating: 4.9,
    reviewCount: 134,
    location: 'Lobito, Angola',
    images: [
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&q=80',
      'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&q=80'
    ],
    amenities: ['Guia', 'Transporte', 'Degustação', 'Fotos']
  },
  // Mobilidade
  {
    id: 'mob-1',
    categoryId: 'mobilidade',
    name: 'Angola Rent-a-Car',
    description: 'Aluguer de viaturas. Frota moderna com seguros incluídos.',
    price: 25000,
    currency: 'AOA',
    priceType: 'perDay',
    rating: 4.5,
    reviewCount: 278,
    location: 'Luanda, Aeroporto',
    images: [
      'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=1200&q=80',
      'https://images.unsplash.com/photo-1489824904134-891ab64532f1?w=1200&q=80'
    ],
    amenities: ['Seguro incluído', 'Entrega no aeroporto', 'GPS', 'Suporte 24h']
  },
  {
    id: 'mob-2',
    categoryId: 'mobilidade',
    name: 'Bilhetes TAAG — Luanda-Lisboa',
    description: 'Voos diretos Luanda-Lisboa. Melhores tarifas e horários flexíveis.',
    price: 450000,
    currency: 'AOA',
    priceType: 'perPerson',
    rating: 4.3,
    reviewCount: 892,
    location: 'Voos internacionais',
    images: [
      'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1200&q=80',
      'https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=1200&q=80'
    ],
    amenities: ['Bagagem', 'Refeição', 'Entretenimento']
  },
  // Beleza
  {
    id: 'beleza-1',
    categoryId: 'beleza',
    providerId: 'prv_demo',
    name: 'Spa Serenity Luanda',
    description: 'Spa completo: massagens, tratamentos faciais, manicure e pedicure.',
    price: 35000,
    currency: 'AOA',
    priceType: 'session',
    rating: 4.9,
    reviewCount: 203,
    location: 'Luanda, Belas',
    images: [
      'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=1200&q=80',
      'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1200&q=80'
    ],
    amenities: ['Massagem', 'Sauna', 'Piscina', 'Chá e fruta']
  },
  {
    id: 'beleza-2',
    categoryId: 'beleza',
    name: 'Clínica Saúde Total',
    description: 'Consultas de medicina geral e especialidades. Horário flexível.',
    price: 15000,
    currency: 'AOA',
    priceType: 'consultation',
    rating: 4.7,
    reviewCount: 445,
    location: 'Luanda, Ingombota',
    images: [
      'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200&q=80',
      'https://images.unsplash.com/photo-1551076805-e1869033e561?w=1200&q=80'
    ],
    amenities: ['Laboratório', 'Imagiologia', 'Farmácia', 'Seguros']
  },
  // Casa
  {
    id: 'casa-1',
    categoryId: 'casa',
    name: 'Oficina Auto Pro',
    description: 'Mecânica automóvel. Reparações, inspeção e manutenção.',
    price: 5000,
    currency: 'AOA',
    priceType: 'service',
    rating: 4.6,
    reviewCount: 189,
    location: 'Luanda, Kilamba',
    images: [
      'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=1200&q=80',
      'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=1200&q=80'
    ],
    amenities: ['Diagnóstico', 'Peças originais', 'Garantia', 'Levantar em casa']
  },
  {
    id: 'casa-2',
    categoryId: 'casa',
    name: 'Consultoria Empresarial Mimu',
    description: 'Consultoria em contabilidade, impostos e gestão empresarial.',
    price: 25000,
    currency: 'AOA',
    priceType: 'session',
    rating: 4.8,
    reviewCount: 78,
    location: 'Luanda, Centro',
    images: [
      'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1200&q=80'
    ],
    amenities: ['Online', 'Presencial', 'Relatórios', 'Suporte']
  }
]

function getCompanyServicesList() {
  return storage.get(KEYS.COMPANY_SERVICES, [])
}

function getProviderServicesList() {
  return storage.get(KEYS.PROVIDER_SERVICES, [])
}

function getUsersList() {
  return storage.get(KEYS.USERS, [])
}

function isOwnerApproved(service, usersById) {
  const ownerId = service.companyId || service.providerId
  if (!ownerId) return true
  const owner = usersById.get(ownerId)
  if (!owner) return true
  if (owner.role === 'company' || owner.role === 'provider') return owner.status === 'active'
  return true
}

function isServicePublic(service) {
  // Compatibilidade: serviços sem status são tratados como já aprovados
  const status = service.status || 'approved'
  return status === 'approved'
}

export function getAllServices() {
  const companyServices = getCompanyServicesList()
  const providerServices = getProviderServicesList()
  return [...services, ...companyServices, ...providerServices]
}

export const getServicesByCategory = (categoryId, { publicOnly = true } = {}) => {
  if (!categoryId) return []
  const all = getAllServices()
  if (!publicOnly) return all.filter(s => s.categoryId === categoryId)

  const usersById = new Map(getUsersList().map(u => [u.id, u]))
  return all.filter(s => s.categoryId === categoryId && isServicePublic(s) && isOwnerApproved(s, usersById))
}

export const getServiceById = (id, { publicOnly = true } = {}) => {
  const fromMock = services.find(s => s.id === id)
  if (fromMock) {
    if (!publicOnly) return fromMock
    const usersById = new Map(getUsersList().map(u => [u.id, u]))
    return isServicePublic(fromMock) && isOwnerApproved(fromMock, usersById) ? fromMock : null
  }
  const companyServices = getCompanyServicesList()
  const providerServices = getProviderServicesList()
  const service = companyServices.find(s => s.id === id) || providerServices.find(s => s.id === id) || null
  if (!service) return null
  if (!publicOnly) return service
  const usersById = new Map(getUsersList().map(u => [u.id, u]))
  return isServicePublic(service) && isOwnerApproved(service, usersById) ? service : null
}
