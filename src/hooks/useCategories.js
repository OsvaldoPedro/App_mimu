import { useCategoriesContext } from '../context/CategoriesContext';

export function useCategories(includeInactive = false) {
  const { categories, loading } = useCategoriesContext();
  
  if (loading) {
    return { categories: [], loading: true };
  }

  const filteredCategories = includeInactive 
    ? categories 
    : categories.filter(c => c.isActive);

  return { categories: filteredCategories, loading: false };
}
