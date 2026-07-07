import { useTranslation } from 'react-i18next'
import { useCategories } from '../hooks/useCategories'
import AngolaLocationSelect from './AngolaLocationSelect'
import DynamicIcon from './common/DynamicIcon'

export default function SearchAndFilter({ 
  selectedCategories = [], 
  onCategoryToggle,
  province, onProvinceChange,
  city, onCityChange,
  searchTerm, onSearchChange,
  sortBy, onSortChange
}) {
  const { t } = useTranslation()
  const { categories, loading: catsLoading } = useCategories()

  return (
    <div className="flex flex-col gap-4 p-5 bg-mimu-white dark:bg-[#1E1E1E] rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 border border-mimu-cream-border dark:border-[#2A2A2A]">
      
      {/* Search Input and Sort */}
      <div className="flex flex-col md:flex-row gap-4 mb-2">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="w-5 h-5 text-mimu-wine-light-text dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
          <input
            type="search"
            placeholder={t('common.searchPlaceholder', 'Pesquisar por serviços, empresas ou prestadores...')}
            className="w-full pl-10 pr-4 py-3 bg-mimu-gray-50 dark:bg-[#121212] border border-mimu-cream-border dark:border-[#2A2A2A] rounded-xl text-mimu-wine-text dark:text-white placeholder-mimu-wine-light-text dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-mimu-gold focus:border-transparent transition-all"
            value={searchTerm || ''}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
          />
        </div>
        {onSortChange && (
          <div className="w-full md:w-48 shrink-0">
            <select
              className="w-full py-3 px-4 bg-mimu-gray-50 dark:bg-[#121212] border border-mimu-cream-border dark:border-[#2A2A2A] rounded-xl text-mimu-wine-text dark:text-white focus:outline-none focus:ring-2 focus:ring-mimu-gold focus:border-transparent cursor-pointer transition-all appearance-none"
              value={sortBy || 'recent'}
              onChange={(e) => onSortChange(e.target.value)}
              style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1em' }}
            >
              <option value="recent">{t('common.sortByRecent', 'Mais recentes')}</option>
              <option value="popular">{t('listing.ratingHigh', 'Mais populares')}</option>
              <option value="rating">{t('listing.ratingHigh', 'Melhor avaliados')}</option>
              <option value="price_asc">{t('listing.priceLowHigh', 'Preço: Menor a Maior')}</option>
            </select>
          </div>
        )}
      </div>

      <div className="w-full h-px bg-mimu-cream-border/60 dark:bg-[#2A2A2A] mb-2"></div>

      {/* Quick Category Chips */}
      <div className="mb-2">
        <label className="block text-sm font-bold text-mimu-wine-text dark:text-white uppercase tracking-wide mb-3">{t('common.popularCategories', 'Categorias Populares')}</label>
        {catsLoading ? (
           <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide"><div className="w-20 h-8 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-full"></div></div>
        ) : (
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map(c => {
              const isSelected = selectedCategories.includes(c.id);
              return (
                <button
                  key={`chip-${c.id}`}
                  onClick={() => onCategoryToggle(c.id)}
                  className={`flex items-center whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                    isSelected 
                      ? 'bg-mimu-gold text-mimu-wine-text shadow-sm' 
                      : 'bg-mimu-gray-50 dark:bg-[#121212] text-mimu-wine-light-text dark:text-gray-300 border border-mimu-cream-border dark:border-[#2A2A2A] hover:border-mimu-gold hover:text-mimu-gold'
                  }`}
                >
                  <span className="mr-2 flex items-center justify-center shrink-0">
                    <DynamicIcon name={c.icon} className="w-4.5 h-4.5 text-current" />
                  </span>
                  {t(`category.${c.id}`, c.name)}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Advanced Filter Collapse Toggle */}
      <details className="group">
        <summary className="flex items-center gap-2 text-sm font-bold text-mimu-wine-text dark:text-white cursor-pointer select-none">
          {t('common.advancedFilters', 'Filtros Avançados (Localização)')}
          <svg className="w-4 h-4 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </summary>
        <div className="pt-4 mt-2 border-t border-mimu-cream-border dark:border-[#2A2A2A]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <AngolaLocationSelect 
              province={province}
              city={city}
              onProvinceChange={onProvinceChange}
              onCityChange={onCityChange}
            />
          </div>
        </div>
      </details>
    </div>
  )
}
