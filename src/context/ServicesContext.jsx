import { createContext, useContext, useCallback } from 'react'
import { supabase } from '../config/supabaseClient'

const ServicesContext = createContext(null)

export function ServicesProvider({ children }) {

  const uploadImages = async (userId, imagesArray) => {
    if (!imagesArray || imagesArray.length === 0) return []
    const urls = []
    const uploadTasks = []
    
    for (let i = 0; i < imagesArray.length; i++) {
        const file = imagesArray[i]
        if (!file) continue;
        if (typeof file === 'string') {
            urls[i] = file
            continue
        }
        
        console.log(`[UPLOAD] Starting upload for image ${i+1}/${imagesArray.length}...`);
        
        const ext = file.name ? file.name.split('.').pop() : 'jpg'
        const path = `user_${userId}/img_${i}_${Date.now()}.${ext}`
        
        let fileToUpload = file;
        if (file.type && file.type.startsWith('image/')) {
            try {
                const imageCompression = (await import('browser-image-compression')).default;
                fileToUpload = await imageCompression(file, { maxSizeMB: 0.8, maxWidthOrHeight: 1200, useWebWorker: true });
            } catch (err) {
                console.warn('Compression failed for service image', err);
            }
        }
        
        const uploadPromise = supabase.storage.from('service-images').upload(path, fileToUpload, { upsert: true })
              .then(({ error }) => {
                  if (error) {
                      console.error(`[UPLOAD ERROR] Image ${i+1} failed:`, error);
                      throw error;
                  }
                  const { data } = supabase.storage.from('service-images').getPublicUrl(path)
                  console.log(`[UPLOAD SUCCESS] Image ${i+1} at ${data.publicUrl}`);
                  urls[i] = data.publicUrl
              })
              .catch(err => {
                  console.error(`[UPLOAD CATCH] Error uploading image ${i+1}:`, err)
                  throw new Error(`Falha no upload da imagem ${i+1}: ` + (err.message || 'Erro desconhecido'))
              });

        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => { reject(new Error('Tempo limite excedido no upload (15s)')) }, 15000)
        });

        uploadTasks.push(Promise.race([uploadPromise, timeoutPromise]))
    }
    
    console.log('[UPLOAD] Awaiting all image upload tasks...');
    await Promise.all(uploadTasks)
    console.log('[UPLOAD] All images processed successfully.');
    return urls.filter(Boolean)
  }

  const getCompanyServices = useCallback(async (companyId, page = 0, pageSize = 20) => {
    if (!companyId) return []
    const from = page * pageSize;
    const to = from + pageSize - 1;
    const { data } = await supabase.from('services').select('*').eq('owner_id', companyId).order('created_at', { ascending: false }).range(from, to)
    return data || []
  }, [])

  const getProviderServices = useCallback(async (providerId, page = 0, pageSize = 20) => {
    if (!providerId) return []
    const from = page * pageSize;
    const to = from + pageSize - 1;
    const { data } = await supabase.from('services').select('*').eq('owner_id', providerId).order('created_at', { ascending: false }).range(from, to)
    return data || []
  }, [])

  const createServiceBase = async (serviceData, ownerId) => {
    try {
        console.log(`[CREATE SERVICE] Starting for owner: ${ownerId}`);
        const rawImages = Array.isArray(serviceData.images) ? serviceData.images : [serviceData.images].filter(Boolean)
        const placeholderImage = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80'
        
        let imageUrls = await uploadImages(ownerId, rawImages)
        if (imageUrls.length === 0) imageUrls = [placeholderImage]

        const service = {
            owner_id: ownerId,
            category_id: serviceData.categoryId,
            service_type: serviceData.serviceType || null,
            name: serviceData.name,
            description: serviceData.description || '',
            price: Number(serviceData.price) || 0,
            currency: serviceData.currency || 'AOA',
            price_type: serviceData.priceType || 'service',
            booking_type: serviceData.bookingType || 'standard',
            location: serviceData.location || '',
            province_id: serviceData.province || null,
            municipality_id: serviceData.city || null,
            images: imageUrls,
            amenities: Array.isArray(serviceData.amenities) ? serviceData.amenities : [],
            status: 'pending', // As requested: guaranteed status 'pending'
            promocao_activa: serviceData.promocao_activa || false,
            desconto: serviceData.promocao_activa ? (Number(serviceData.desconto) || null) : null,
            preco_promocional: serviceData.promocao_activa ? (Number(serviceData.preco_promocional) || null) : null,
            data_inicio_promocao: serviceData.promocao_activa && serviceData.data_inicio_promocao ? serviceData.data_inicio_promocao : null,
            data_fim_promocao: serviceData.promocao_activa && serviceData.data_fim_promocao ? serviceData.data_fim_promocao : null,
            data_promocao_inicio: serviceData.promocao_activa && serviceData.data_inicio_promocao ? serviceData.data_inicio_promocao : null,
            data_promocao_fim: serviceData.promocao_activa && serviceData.data_fim_promocao ? serviceData.data_fim_promocao : null,
            novo_servico: serviceData.novo_servico || false,
            novidade: serviceData.novo_servico || false
        }

        console.log('[CREATE SERVICE] Sending insert to Supabase: services', JSON.stringify(service))
        const { data, error } = await supabase.from('services').insert(service).select().single()
        
        if (error) {
            console.error('[CREATE SERVICE] Supabase insert error:', JSON.stringify(error))
            throw new Error(error.message || 'Ocorreu um erro no servidor ao guardar as alterações.')
        }
        
        console.log('[CREATE SERVICE] Service created successfully. ID:', data.id)
        return { success: true, service: data }
    } catch(err) {
        console.error('[CREATE SERVICE FAIL] Caught error:', err)
        return { success: false, error: err.message || 'Falha ao processar o formulário ou comunicar com o serviço.' }
    }
  }

  const createService = useCallback(async (serviceData) => {
    if (!serviceData.companyId) return { success: false, error: 'Empresa não identificada.' }
    return createServiceBase(serviceData, serviceData.companyId)
  }, [])

  const createProviderService = useCallback(async (serviceData) => {
    if (!serviceData.providerId) return { success: false, error: 'Prestador não identificado.' }
    return createServiceBase(serviceData, serviceData.providerId)
  }, [])

  const updateServiceBase = async (serviceId, updates) => {
    try {
        const formatted = { ...updates }
        
        if (formatted.price !== undefined) formatted.price = Number(formatted.price)
        if (formatted.categoryId) {
            formatted.category_id = formatted.categoryId;
            delete formatted.categoryId
        }
        if (formatted.serviceType) {
            formatted.service_type = formatted.serviceType;
            delete formatted.serviceType
        }
        if (formatted.priceType) {
            formatted.price_type = formatted.priceType;
            delete formatted.priceType
        }
        if (formatted.bookingType) {
            formatted.booking_type = formatted.bookingType;
            delete formatted.bookingType
        }
        if (formatted.province) {
            formatted.province_id = formatted.province;
            delete formatted.province;
        }
        if (formatted.city) {
            formatted.municipality_id = formatted.city;
            delete formatted.city;
        }
        
        // Handle dual-write and synchronization for promotions and new services
        if (formatted.novo_servico !== undefined) {
            formatted.novidade = formatted.novo_servico;
        } else if (formatted.novidade !== undefined) {
            formatted.novo_servico = formatted.novidade;
        }
        if (formatted.data_inicio_promocao !== undefined) {
            formatted.data_promocao_inicio = formatted.data_inicio_promocao;
        } else if (formatted.data_promocao_inicio !== undefined) {
            formatted.data_inicio_promocao = formatted.data_promocao_inicio;
        }
        if (formatted.data_fim_promocao !== undefined) {
            formatted.data_promocao_fim = formatted.data_fim_promocao;
        } else if (formatted.data_promocao_fim !== undefined) {
            formatted.data_fim_promocao = formatted.data_promocao_fim;
        }
        
        // Handle images update
        if (formatted.images !== undefined) {
             const { data: currentSrv } = await supabase.from('services').select('owner_id, images').eq('id', serviceId).single()
             const rawImages = Array.isArray(formatted.images) ? formatted.images : [formatted.images].filter(Boolean)
             const uploaded = await uploadImages(currentSrv?.owner_id || 'unknown', rawImages)
             if (uploaded.length > 0) {
                 formatted.images = uploaded
                 // Remove old deleted images from storage
                 if (currentSrv?.images) {
                     const oldPaths = currentSrv.images
                         .filter(img => typeof img === 'string' && !uploaded.includes(img))
                         .map(img => img.split('/service-images/').pop())
                         .filter(Boolean)
                     if (oldPaths.length > 0) {
                         await supabase.storage.from('service-images').remove(oldPaths)
                     }
                 }
             } else {
                 delete formatted.images 
             }
        }

        console.log('Sending update to Supabase: services', serviceId, formatted)
        const { data, error } = await supabase.from('services').update(formatted).eq('id', serviceId).select().single()
        
        if (error) {
            console.error('Supabase update error in updateServiceBase:', error)
            throw error
        }
        
        console.log('Service updated successfully:', data.id)
        return { success: true, service: data }
    } catch(err) {
         console.error('updateServiceBase error:', err)
         return { success: false, error: err.message }
    }
  }

  const updateService = useCallback(async (serviceId, updates) => {
     return updateServiceBase(serviceId, updates)
  }, [])

  const updateProviderService = useCallback(async (serviceId, updates) => {
     return updateServiceBase(serviceId, updates)
  }, [])

  const deleteServiceBase = async (serviceId) => {
      try {
          const { data: currentSrv } = await supabase.from('services').select('images').eq('id', serviceId).single()
          
          if (currentSrv?.images && currentSrv.images.length > 0) {
              const filePaths = currentSrv.images.map(img => img.split('/service-images/').pop()).filter(Boolean);
              if (filePaths.length > 0) {
                  await supabase.storage.from('service-images').remove(filePaths);
              }
          }

          const { error } = await supabase.from('services').delete().eq('id', serviceId)
          if (error) throw error
          return { success: true }
      } catch(err) {
          return { success: false, error: err.message }
      }
  }

  const deleteService = useCallback(deleteServiceBase, [])
  const deleteProviderService = useCallback(deleteServiceBase, [])

  const value = {
    getCompanyServices,
    createService,
    updateService,
    deleteService,
    getProviderServices,
    createProviderService,
    updateProviderService,
    deleteProviderService
  }

  return <ServicesContext.Provider value={value}>{children}</ServicesContext.Provider>
}

export function useServices() {
  const ctx = useContext(ServicesContext)
  if (!ctx) throw new Error('useServices must be used within ServicesProvider')
  return ctx
}
