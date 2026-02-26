import { useTranslation } from 'react-i18next'

export default function SearchAndFilter({ search, onSearch, sortBy, onSortBy }) {
  const { t } = useTranslation()

  const sortOptions = [
    { value: 'price_asc', label: t('listing.priceLowHigh') },
    { value: 'price_desc', label: t('listing.priceHighLow') },
    { value: 'rating', label: t('listing.ratingHigh') }
  ]

  return (
    <div className="flex flex-col sm:flex-row gap-4 p-4 bg-white rounded-2xl shadow-md border border-[#F4E8D8]">
      <div className="flex-1 relative">
        <input
          type="search"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder={t('nav.search')}
          className="w-full px-5 py-3 rounded-xl border border-[#F4E8D8] focus:outline-none focus:ring-2 focus:ring-[#C58A2B] focus:border-transparent text-[#3A0D0D]"
        />
        <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#5C1A1A]/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[#5C1A1A]/80 text-sm font-medium whitespace-nowrap">{t('listing.sortBy')}:</span>
        <select
          value={sortBy}
          onChange={(e) => onSortBy(e.target.value)}
          className="px-4 py-3 rounded-xl border border-[#F4E8D8] bg-white text-[#3A0D0D] focus:outline-none focus:ring-2 focus:ring-[#C58A2B] font-medium"
        >
          {sortOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
    </div>
  )
}
