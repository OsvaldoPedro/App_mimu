import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../config/supabaseClient';
import { categories as staticCategories } from '../data/categories';

const CategoriesContext = createContext(null);

export function CategoriesProvider({ children }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Define fetchCats outside useEffect so we can call it on realtime updates
  const fetchCats = async () => {
    try {
      const { data: cats, error } = await supabase
        .from('categories')
        .select('*, category_services(name, id)');
        
      if (error) throw error;

      if (cats) {
        const formatted = cats.map(c => {
          const staticCat = staticCategories.find(sc => sc.id === c.id);
          return {
            id: c.id,
            name: c.name,
            icon: c.icon,
            color: c.color,
            bgClass: c.bg_class,
            textClass: c.text_class,
            isActive: c.is_active,
            imageUrl: staticCat?.imageUrl || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500&q=80',
            services: c.category_services ? c.category_services.map(s => s.name) : [],
            raw_services: c.category_services || []
          };
        });
        setCategories(formatted);
      }
    } catch (err) {
      console.error('Error fetching categories (globally):', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    
    // Initial fetch
    if (isMounted) {
      fetchCats();
    }

    // Supabase Realtime Subscriptions
    const channel = supabase
      .channel('categories-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'categories' },
        (payload) => {
          console.log('Categories changed!', payload);
          fetchCats(); // Refresh
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'category_services' },
        (payload) => {
          console.log('Category services changed!', payload);
          fetchCats(); // Refresh
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    }
  }, []);

  return (
    <CategoriesContext.Provider value={{ categories, loading, refetch: fetchCats }}>
      {children}
    </CategoriesContext.Provider>
  );
}

export function useCategoriesContext() {
  const context = useContext(CategoriesContext);
  if (!context) {
    throw new Error('useCategoriesContext must be used within a CategoriesProvider');
  }
  return context;
}
