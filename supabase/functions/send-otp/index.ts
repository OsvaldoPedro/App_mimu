import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { phone, code } = await req.json()

    if (!phone || !code) {
      throw new Error('Telefone e código (OTP) são obrigatórios.')
    }

    // TODO: TELCOSMS API INTEGRATION
    // Substiua pelo seu Provider GSM (Msg91, Twilio, TelcoSMS, etc)
    console.log(`[SIMULATED SMS] A enviar OTP: ${code} para o número: ${phone}`)

    // Exemplo de chamda fetch genérica para o seu Gateway TelcoSMS:
    /*
    const response = await fetch('https://api.telcosms.com/send', {
      method: 'POST',
      headers: {
         'Authorization': `Bearer ${Deno.env.get('TELCOSMS_API_KEY')}`,
         'Content-Type': 'application/json'
      },
      body: JSON.stringify({
         to: phone,
         message: `O seu código de verificação MIMU é: ${code}. Válido por 5 minutos.`
      })
    })
    
    if (!response.ok) {
        throw new Error('Falha no envio SMS através da TelcoSMS');
    }
    */

    return new Response(
      JSON.stringify({ success: true, message: 'SMS enviado com sucesso (simulado).' }),
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
