import { useState, useCallback } from 'react'
import { supabase } from '../config/supabaseClient'

export function useReviews(filterId = null, filterType = null) {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // fetch reviews. filterType = 'provider', 'service', or 'client'
  const fetchReviews = useCallback(async () => {
    if (!filterId || !filterType) {
      setReviews([])
      return
    }

    setLoading(true)
    setError(null)
    try {
      let query = supabase
        .from('reviews')
        .select(`
          id, rating, comment, created_at,
          client:client_id (id, name, avatar_url),
          service:service_id (id, name)
        `)
        .order('created_at', { ascending: false })

      if (filterType === 'provider') {
        query = query.eq('provider_id', filterId)
      } else if (filterType === 'service') {
        query = query.eq('service_id', filterId)
      } else if (filterType === 'client') {
        query = query.eq('client_id', filterId)
      }

      const { data, error: err } = await query

      if (err) throw err
      setReviews(data || [])
    } catch (err) {
      console.error('Error fetching reviews:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [filterId, filterType])

  const addReview = async ({ orderId, serviceId, providerId, clientId, rating, comment }) => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: err } = await supabase
        .from('reviews')
        .insert([
          {
            order_id: orderId,
            service_id: serviceId,
            provider_id: providerId,
            client_id: clientId,
            rating,
            comment
          }
        ])
        .select()
        .single()

      if (err) {
        // Handle duplicate review error
        if (err.code === '23505') {
          throw new Error('Já avaliaste este pedido anteriomente.')
        }
        throw err
      }
      
      // Update local state if it's the current context
      setReviews(prev => [data, ...prev])
      return { success: true, data }
    } catch (err) {
      console.error('Error adding review:', err)
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }

  const checkIfOrderReviewed = async (orderId) => {
    try {
      const { count, error } = await supabase
        .from('reviews')
        .select('*', { count: 'exact', head: true })
        .eq('order_id', orderId)

      if (error) throw error
      return count > 0
    } catch (err) {
      console.error('Error checking review status:', err)
      return false
    }
  }

  return {
    reviews,
    loading,
    error,
    fetchReviews,
    addReview,
    checkIfOrderReviewed
  }
}
