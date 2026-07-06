import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "As variáveis de ambiente do Supabase não estão configuradas. Verifique o ficheiro .env e as Environment Variables da Vercel."
  );
}
// Provide a custom lock implementation to bypass `navigator.locks`
// This solves the known issue: "AbortError: Lock broken by another request with the 'steal' option"
// The signature can be (name, acquire) or (name, options, acquire) depending on the version.
const customLock = (...args) => {
  const acquire = args[args.length - 1];
  if (typeof acquire === 'function') {
    return acquire();
  }
  return Promise.resolve();
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    lock: customLock,
  }
})
