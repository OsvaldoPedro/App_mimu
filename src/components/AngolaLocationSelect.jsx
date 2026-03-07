import { useEffect, useState } from 'react'
import angolaLocations from '../constants/angolaLocations'

/**
 * Dual dropdown for selecting an Angolan province and its municipalities.
 * Props:
 *  - province: current selected province value
 *  - city: current selected city value
 *  - onProvinceChange: callback(newProvince)
 *  - onCityChange: callback(newCity)
 *  - error: optional string shown beneath the controls
 */
export default function AngolaLocationSelect({
  province = '',
  city = '',
  onProvinceChange = () => {},
  onCityChange = () => {},
  error = ''
}) {
  const [cities, setCities] = useState([])

  useEffect(() => {
    if (province && angolaLocations[province]) {
      setCities(angolaLocations[province])
    } else {
      setCities([])
    }
    // reset city whenever province changes
    onCityChange('')
  }, [province])

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-[#3A0D0D] mb-2">Província</label>
        <select
          value={province}
          onChange={e => onProvinceChange(e.target.value)}
          required
          className="w-full px-4 py-3 rounded-xl border-2 border-[#F4E8D8] focus:border-[#C58A2B] focus:outline-none"
        >
          <option value="">Escolher...</option>
          {Object.keys(angolaLocations).map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-[#3A0D0D] mb-2">Município</label>
        <select
          value={city}
          onChange={e => onCityChange(e.target.value)}
          required
          disabled={!province}
          className="w-full px-4 py-3 rounded-xl border-2 border-[#F4E8D8] focus:border-[#C58A2B] focus:outline-none disabled:opacity-50"
        >
          <option value="">Escolher...</option>
          {cities.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
    </div>
  )
}
