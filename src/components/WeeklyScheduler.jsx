import React, { useState, useEffect } from 'react'

const DAYS_OF_WEEK = [
  'Segunda',
  'Terça',
  'Quarta',
  'Quinta',
  'Sexta',
  'Sábado',
  'Domingo'
]

const DEFAULT_START = '08:00'
const DEFAULT_END = '17:00'

export default function WeeklyScheduler({ value, onChange }) {
  const [schedules, setSchedules] = useState(() =>
    DAYS_OF_WEEK.map(day => ({
      day,
      active: day !== 'Sábado' && day !== 'Domingo', // Mon-Fri active by default
      start: DEFAULT_START,
      end: DEFAULT_END
    }))
  )
  const [initialized, setInitialized] = useState(false)

  // Parse string from Supabase back to UI (if it exists)
  useEffect(() => {
    if (value && typeof value === 'string' && !initialized) {
      try {
        const parts = value.split(' | ').filter(Boolean)
        if (parts.length > 0) {
          const parsedDict = {}
          parts.forEach(p => {
            const [dayPart, timePart] = p.split(': ')
            if (!dayPart || !timePart) return

            if (timePart.toLowerCase().includes('fech')) {
              parsedDict[dayPart.trim()] = { active: false, start: DEFAULT_START, end: DEFAULT_END }
            } else {
              const [start, end] = timePart.split(' - ')
              parsedDict[dayPart.trim()] = { active: true, start: start?.trim() || '', end: end?.trim() || '' }
            }
          })

          setSchedules(prev => prev.map(sch => {
            // Priority exactly parsed values. Or legacy group parser.
            if (parsedDict[sch.day]) {
              return { ...sch, ...parsedDict[sch.day] }
            }
            // If we reach here, maybe legacy "Dias Úteis" was parsed instead.
            // To handle extreme legacy format mismatches, fallback simply defaults unless explicit.
            return sch
          }))
        }
      } catch (e) {
        console.error("Format error parsing legacy hour string", e)
      }
      setInitialized(true)
    } else if (!initialized) {
      // Just empty value or new form
      setInitialized(true)
    }
  }, [value, initialized])

  const notifyChange = (newSchedules) => {
    if (!initialized) return
    const formatted = newSchedules
      .map(s => s.active ? `${s.day}: ${s.start} - ${s.end}` : `${s.day}: Fechado`)
      .join(' | ')
    onChange(formatted)
  }

  const toggleDay = (index) => {
    const newSch = [...schedules]
    newSch[index].active = !newSch[index].active
    setSchedules(newSch)
    notifyChange(newSch)
  }

  const updateTime = (index, field, val) => {
    const newSch = [...schedules]
    newSch[index][field] = val
    setSchedules(newSch)
    notifyChange(newSch)
  }

  return (
    <div className="bg-mimu-cream dark:bg-[#121212]/30 p-4 rounded-xl border border-mimu-cream-border dark:border-[#2A2A2A]/50 shadow-inner">
      <div className="space-y-3">
        {schedules.map((sch, i) => (
          <div key={sch.day} className={`flex flex-col sm:flex-row gap-3 items-start sm:items-center p-3 rounded-lg shadow-sm border transition-colors duration-200 ${sch.active ? 'bg-mimu-white dark:bg-[#1E1E1E] border-mimu-cream-border dark:border-[#2A2A2A]' : 'bg-mimu-white dark:bg-[#1E1E1E]/50 border-transparent opacity-80'}`}>

            <div className="flex items-center gap-3 w-full sm:w-1/3">
              <button
                type="button"
                onClick={() => toggleDay(i)}
                className={`w-12 h-6 rounded-full flex items-center transition-colors duration-300 p-1 focus:outline-none ${sch.active ? 'bg-mimu-gold' : 'bg-mimu-gray-200'}`}
              >
                <div className={`bg-mimu-white dark:bg-[#1E1E1E] w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${sch.active ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
              <span className={`text-sm font-semibold flex-1 transition-colors ${sch.active ? 'text-mimu-wine-text dark:text-white' : 'text-mimu-wine-light-text dark:text-gray-300 line-through'}`}>
                {sch.day}
              </span>
            </div>

            <div className="flex-1 flex items-center justify-end w-full sm:w-auto min-h-[40px] h-auto">
              {sch.active ? (
                <div className="flex flex-wrap justify-end items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-300">
                  <input
                    type="time"
                    value={sch.start}
                    onChange={e => updateTime(i, 'start', e.target.value)}
                    className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border-2 border-transparent bg-mimu-cream dark:bg-[#121212] focus:bg-mimu-white dark:bg-[#1E1E1E] focus:border-mimu-gold focus:outline-none text-xs sm:text-sm text-mimu-wine-text dark:text-white font-medium transition-colors"
                  />
                  <span className="text-mimu-wine-light-text dark:text-gray-300 font-semibold text-xs uppercase tracking-wider">até</span>
                  <input
                    type="time"
                    value={sch.end}
                    onChange={e => updateTime(i, 'end', e.target.value)}
                    className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border-2 border-transparent bg-mimu-cream dark:bg-[#121212] focus:bg-mimu-white dark:bg-[#1E1E1E] focus:border-mimu-gold focus:outline-none text-xs sm:text-sm text-mimu-wine-text dark:text-white font-medium transition-colors"
                  />
                </div>
              ) : (
                <span className="text-xs sm:text-sm font-bold tracking-wider uppercase text-mimu-text-muted bg-mimu-gray-100 dark:bg-[#121212] px-4 py-1.5 rounded-lg border border-mimu-border-light animate-in fade-in duration-300">Fechado</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
