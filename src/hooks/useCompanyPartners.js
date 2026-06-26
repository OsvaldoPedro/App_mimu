import { useState, useCallback, useEffect } from 'react'
import { supabase } from '../config/supabaseClient'

export function useCompanyPartners(companyId) {
  const [partners, setPartners] = useState([])
  const [loading, setLoading] = useState(true)

  const loadPartners = useCallback(async () => {
    if (!companyId) {
      setLoading(false)
      return
    }
    setLoading(true)
    const { data, error } = await supabase
      .from('company_partners')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setPartners(data)
    }
    setLoading(false)
  }, [companyId])

  useEffect(() => {
    loadPartners()
  }, [loadPartners])

  const createPartner = async (partnerData) => {
    const { data, error } = await supabase
      .from('company_partners')
      .insert([{ ...partnerData, company_id: companyId }])
      .select()

    if (error) return { success: false, error: error.message }
    await loadPartners()
    return { success: true, data: data[0] }
  }

  const updatePartner = async (partnerId, updates) => {
    const { error } = await supabase
      .from('company_partners')
      .update(updates)
      .eq('id', partnerId)
      .eq('company_id', companyId)

    if (error) return { success: false, error: error.message }
    await loadPartners()
    return { success: true }
  }

  const deletePartner = async (partnerId) => {
    const { error } = await supabase
      .from('company_partners')
      .delete()
      .eq('id', partnerId)
      .eq('company_id', companyId)

    if (error) return { success: false, error: error.message }
    await loadPartners()
    return { success: true }
  }

  return { partners, loading, loadPartners, createPartner, updatePartner, deletePartner }
}
