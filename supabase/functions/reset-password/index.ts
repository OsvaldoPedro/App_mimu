import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.99.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { phone, newPassword } = await req.json()

    if (!phone || !newPassword) {
      throw new Error('Telefone e Nova Palavra-passe são obrigatórios.')
    }

    // Initialize Supabase Admin Client using the Service Role Key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // 1. Find the user ID by querying the auth.users or profiles securely 
    // We will query the public.profiles table since it contains the phone string exactly
    const { data: profiles, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('phone', phone)

    if (profileError || !profiles || profiles.length === 0) {
      throw new Error('Conta não encontrada para este telefone.')
    }

    const userId = profiles[0].id

    // 2. Safely Update the User's Password via Admin Auth API
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: newPassword
    })

    if (updateError) {
      throw new Error(`Erro ao redefinir a palavra-passe: ${updateError.message}`)
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Palavra-passe alterada com sucesso.' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
