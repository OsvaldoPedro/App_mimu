import { supabase } from '../config/supabaseClient'

// DB driven service fetches

export async function getAllServices() {
  const { data, error } = await supabase
    .from('services')
    .select('*, profiles(name, company_name, phone, avatar_url, logo_url, status, role)')
    .eq('status', 'approved')

  if (error) {
    console.error('Erro ao buscar serviços no Supabase:', error)
    return []
  }

  // Map DB fields to frontend expected fields
  return data.map(dbToFrontendService)
}

export async function getServicesByCategory(categoryId, { publicOnly = true } = {}) {
  let query = supabase.from('services').select('*, profiles(name, company_name, phone, avatar_url, logo_url, status, role)').eq('category_id', categoryId)

  if (publicOnly) {
    query = query.eq('status', 'approved')
  }

  const { data, error } = await query
  if (error) return []

  return data.map(dbToFrontendService)
}

export async function getServiceById(id, { publicOnly = true } = {}) {
  let query = supabase.from('services').select('*, profiles(name, company_name, phone, avatar_url, logo_url, status, role)').eq('id', id)

  if (publicOnly) {
    query = query.eq('status', 'approved')
  }

  const { data, error } = await query.single()

  if (error || !data) {
    if (import.meta.env.DEV) {
      console.warn(`[getServiceById] Serviço ${id} não encontrado ou erro:`, error?.message)
    }
    return null
  }

  return dbToFrontendService(data)
}

// Helper to map Supabase snake_case to React camelCase
function dbToFrontendService(s) {
  return {
    ...s,
    categoryId: s.new_category_id || s.category_id,
    provinceId: s.province_id,
    municipalityId: s.municipality_id,
    companyId: s.owner_id, // We assume owner is company/provider
    providerId: s.owner_id,
    priceType: s.price_type,
    bookingType: s.booking_type || 'standard',
    reviewCount: s.review_count,
    type: s.service_type,
    providerData: s.profiles ? {
      name: s.profiles.company_name || s.profiles.name || 'Prestador',
      phone: s.profiles.phone || null,
      avatar: s.profiles.avatar_url || s.profiles.logo_url || null,
      role: s.profiles.role,
      status: s.profiles.status
    } : null
  }
}

export const getServiceProvider = async (service) => {
  if (!service) return null
  const ownerId = service.companyId || service.providerId
  if (!ownerId) return null

  const { data: provider, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', ownerId)
    .single()

  if (error || !provider) return null

  return {
    id: provider.id,
    name: provider.name || provider.company_name,
    phone: provider.phone,
    role: provider.role,
    status: provider.status,
    avatar: provider.avatar_url || provider.logo_url
  }
}

export async function searchServicesPaginated({ term, categoryIds, provinceId, cityId, sortBy, page, limit = 20, tab = 'geral' }) {
  let query = supabase
    .from('services')
    .select('*, profiles!inner(name, company_name, phone, avatar_url, logo_url, status, role)', { count: 'exact' })
    .eq('status', 'approved')

  if (tab === 'promocoes') {
    query = query.eq('promocao_activa', true)
  } else if (tab === 'novos_servicos' || tab === 'novidades') {
    query = query.or('novo_servico.eq.true,novidade.eq.true')
  }

  // Text search on service name, description, or provider name
  if (term) {
    // We use inner join on profiles above to be able to filter by profile name if we wanted to.
    // Supabase allows filtering joined tables: profiles.name.ilike.%term%
    // However, an OR condition across joined tables requires a specific syntax or RPC.
    // For simplicity, we'll search service name and description.
    query = query.or(`name.ilike.%${term}%,description.ilike.%${term}%`)
  }

  if (categoryIds && categoryIds.length > 0) {
    query = query.in('category_id', categoryIds)
  }

  if (provinceId) {
    query = query.eq('province_id', provinceId)
  }

  if (cityId) {
    query = query.eq('municipality_id', cityId)
  }

  // Sorting
  if (sortBy === 'price_asc') {
    query = query.order('price', { ascending: true })
  } else if (sortBy === 'rating') {
    query = query.order('rating', { ascending: false })
  } else if (sortBy === 'popular') {
    query = query.order('review_count', { ascending: false })
  } else {
    // default: recent
    query = query.order('created_at', { ascending: false })
  }

  // Pagination
  const from = page * limit
  const to = from + limit - 1
  query = query.range(from, to)

  const { data, error, count } = await query

  if (error) {
    console.error('Erro na pesquisa paginada:', error)
    return { data: [], count: 0 }
  }

  return {
    data: data.map(dbToFrontendService),
    count
  }
}
