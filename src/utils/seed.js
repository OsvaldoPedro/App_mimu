import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Import local data
import { angolaLocations } from '../constants/angolaLocations.js';
import { categories } from '../data/categories.js';

// Parse .env.local
const envContent = fs.readFileSync(path.resolve('.env.local'), 'utf-8');
const VITE_SUPABASE_URL = envContent.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const VITE_SUPABASE_ANON_KEY = envContent.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim();

const supabase = createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY);

async function seed() {
  console.log('Starting Supabase Seeding...');

  console.log('Seeding Provinces and Municipalities...');
  for (const [provinceName, municipalities] of Object.entries(angolaLocations)) {
    let { data: provinceData } = await supabase.from('provinces').select('id').eq('name', provinceName).maybeSingle();
    let provId;
    if (!provinceData) {
      const { data, error } = await supabase.from('provinces').insert({ name: provinceName }).select('id').single();
      if (error) { 
        console.error('Error inserting province HTTP:', error); 
        continue; 
      }
      provId = data.id;
    } else {
      provId = provinceData.id;
    }

    const munsToInsert = municipalities.map(m => ({
      province_id: provId,
      name: m
    }));
    
    const { error: munErr } = await supabase.from('municipalities').upsert(munsToInsert, { onConflict: 'province_id, name' });
    if (munErr) console.error(`Error inserting municipalities for ${provinceName}:`, munErr);
  }

  console.log('Seeding Categories...');
  for (const cat of categories) {
     const { id, name, icon, color, bgClass, textClass, services } = cat;
     const { error: catErr } = await supabase.from('categories').upsert({
       id, name, icon, color, bg_class: bgClass, text_class: textClass
     }, { onConflict: 'id' });
     if (catErr) console.error(`Error inserting category ${id}:`, catErr);

     const srvsToInsert = services.map(s => ({
       category_id: id,
       name: s
     }));
     
     await supabase.from('category_services').delete().eq('category_id', id);
     await supabase.from('category_services').insert(srvsToInsert);
  }
  
  console.log('Seeding completed successfully!');
}

seed().catch(console.error);
