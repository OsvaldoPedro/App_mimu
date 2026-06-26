import { useState, useEffect } from 'react';
import { supabase } from '../config/supabaseClient';

let _cache = null
let _fetchPromise = null

const CACHE_KEY = 'mimu_locations_cache_v2';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

function loadCache() {
  if (_cache) return _cache;
  try {
    const stored = localStorage.getItem(CACHE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Ensure data exists and is not expired
      if (parsed.data && (Date.now() - parsed.timestamp < CACHE_EXPIRY)) {
        _cache = parsed.data;
        return _cache;
      }
    }
  } catch (e) {
    console.error('Error reading locations from localStorage', e);
  }
  return null;
}

function saveCache(data) {
  _cache = data;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      timestamp: Date.now(),
      data
    }));
  } catch (e) {
    console.error('Error saving locations to localStorage', e);
  }
}

export function useLocations() {
  const initialCache = loadCache();
  const [provinces, setProvinces] = useState(initialCache ? initialCache.provs : [])
  const [municipalities, setMunicipalities] = useState(initialCache ? initialCache.muns : [])
  const [loading, setLoading] = useState(!initialCache)

  useEffect(() => {
    let active = true
    if (initialCache) return

    async function fetchDocs() {
      try {
        if (!_fetchPromise) {
          _fetchPromise = Promise.all([
            supabase.from('provinces').select('*').order('name'),
            supabase.from('municipalities').select('*').order('name')
          ])
        }
        
        const [pRes, mRes] = await _fetchPromise
        
        if (pRes.error) throw pRes.error
        if (mRes.error) throw mRes.error
        
        const freshData = { provs: pRes.data || [], muns: mRes.data || [] }
        saveCache(freshData)
        
        if (active) {
          setProvinces(freshData.provs)
          setMunicipalities(freshData.muns)
        }
      } catch (err) {
        _fetchPromise = null // reset so it can try again
        console.error('Error fetching locations:', err)
      } finally {
        if (active) setLoading(false)
      }
    }
    
    fetchDocs()
    
    return () => { active = false }
  }, [])

  return { provinces, municipalities, loading }
}
