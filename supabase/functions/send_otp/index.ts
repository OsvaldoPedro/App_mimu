import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const TELCO_API_KEY = "prd903bf44e4db9fbd51c70bb6f4a";
// We default to a widely generic TelcoSMS Angolan rest API endpoint.
const TELCO_URL = "https://api.telcosms.co.ao/api/v1/send";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { phone } = await req.json();

    if (!phone || !phone.match(/^244\d{9}$/)) {
      return new Response(JSON.stringify({ error: "Formato de telefone inválido. Use 244XXXXXXXXX" }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      });
    }

    // Initialize Supabase Admin using Edge Function environment variables
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Rate Limit: 1 request per minute
    const { data: recentOtp } = await supabaseAdmin
      .from('otp_codes')
      .select('created_at')
      .eq('phone', phone)
      .order('created_at', { ascending: false })
      .limit(1)

    if (recentOtp && recentOtp.length > 0) {
      const lastCreated = new Date(recentOtp[0].created_at).getTime()
      const now = new Date().getTime()
      if (now - lastCreated < 60000) {
        return new Response(JSON.stringify({ error: "Rate limit: Aguarde 1 minuto para pedir outro código." }), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 429 
        });
      }
    }

    // Generate 6 digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString()

    // Hash the code (SHA-256) before storing
    const codeBuffer = new TextEncoder().encode(code)
    const hashBuffer = await crypto.subtle.digest('SHA-256', codeBuffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashedCode = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

    // Clear previous OTPs for this number
    await supabaseAdmin.from('otp_codes').delete().eq('phone', phone)

    // Set expiration to 5 mins
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + 5)

    // Save to database
    const { error: dbError } = await supabaseAdmin.from('otp_codes').insert({
      phone,
      code: hashedCode,
      expires_at: expiresAt.toISOString()
    })

    if (dbError) throw dbError;

    // Send SMS via TelcoSMS API
    const telcoRes = await fetch(TELCO_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${TELCO_API_KEY}`
      },
      body: JSON.stringify({
        to: phone,
        message: `[Mimu App] O seu codigo de verificacao e: ${code}`
      })
    })

    const telcoData = await telcoRes.text();
    console.log("TelcoSMS response:", telcoData);

    return new Response(JSON.stringify({ success: true, message: "Código SMS enviado." }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200 
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500 
    })
  }
})
