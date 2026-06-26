import { useEffect, useRef } from 'react'
import { useLocations } from '../hooks/useLocations'

/**
 * Dual dropdown for selecting an Angolan province and its municipalities from Supabase.
 */
export default function AngolaLocationSelect({
  province = '',
  city = '',
  onProvinceChange = () => {},
  onCityChange = () => {},
  error = ''
}) {
  const { provinces, municipalities, loading } = useLocations()
  const prevProvinceRef = useRef(province)

  const provObj = province ? provinces.find(p => p.id === province || p.name === province) : null;
  const cities = provObj ? municipalities.filter(m => m.province_id === provObj.id) : [];

  useEffect(() => {
    if (prevProvinceRef.current !== province) {
        onCityChange('')
        prevProvinceRef.current = province
    }
  }, [province, onCityChange])

  if (loading) {
    return <p className="text-sm text-mimu-wine-light-text dark:text-gray-300/60">A carregar locais...</p>
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-mimu-wine-text dark:text-white mb-2">Província</label>
        <select
          value={province}
          onChange={e => onProvinceChange(e.target.value)}
          required
          className="w-full px-4 py-3 rounded-xl border-2 border-mimu-cream-border dark:border-[#2A2A2A] focus:border-mimu-gold focus:outline-none bg-mimu-white dark:bg-[#1E1E1E]"
        >
          <option value="">Escolher...</option>
          {provinces.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-mimu-wine-text dark:text-white mb-2">Município</label>
        <select
          value={city}
          onChange={e => onCityChange(e.target.value)}
          required
          disabled={!province || cities.length === 0}
          className="w-full px-4 py-3 rounded-xl border-2 border-mimu-cream-border dark:border-[#2A2A2A] focus:border-mimu-gold focus:outline-none bg-mimu-white dark:bg-[#1E1E1E] disabled:opacity-50"
        >
          <option value="">Escolher...</option>
          {cities.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
      {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
    </div>
  )
}
