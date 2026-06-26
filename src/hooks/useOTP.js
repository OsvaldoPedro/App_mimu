import { supabase } from '../config/supabaseClient'

/**
 * Pede um novo código OTP que será enviado via SMS
 * @param {string} phone Formato: 244XXXXXXXXX
 */
export const requestOTP = async (phone) => {
  try {
    const { data, error } = await supabase.functions.invoke('send_otp', {
      body: { phone }
    })

    if (error) throw error
    if (data?.error) throw new Error(data.error)
    return { success: true, message: data?.message || "Código enviado." }
  } catch (err) {
    console.error("requestOTP error:", err)
    return { success: false, error: err.message || "Erro ao pedir OTP" }
  }
}

/**
 * Verifica um código OTP introduzido
 * @param {string} phone Formato: 244XXXXXXXXX
 * @param {string} code Código de 6 dígitos
 */
export const verifyOTP = async (phone, code) => {
  try {
    const { data, error } = await supabase.functions.invoke('verify_otp', {
      body: { phone, code }
    })

    if (error) throw error
    if (data?.error) throw new Error(data.error)
    return { success: true, message: data?.message || "Código verificado." }
  } catch (err) {
    console.error("verifyOTP error:", err)
    return { success: false, error: err.message || "Erro ao verificar OTP" }
  }
}

/**
 * Redefine a palavra-passe recorrendo à verificação de um OTP válido
 * @param {string} phone Formato: 244XXXXXXXXX
 * @param {string} code Código OTP SMS de 6 dígitos
 * @param {string} newPassword Nova palavra-passe
 */
export const resetPassword = async (phone, code, newPassword) => {
  try {
    // A nossa edge function 'verify_otp' está programada para atualizar a password 
    // se o novo campo 'newPassword' for injetado aquando da verificação do OTP.
    const { data, error } = await supabase.functions.invoke('verify_otp', {
      body: { phone, code, newPassword }
    })

    if (error) throw error
    if (data?.error) throw new Error(data.error)
    
    // Assinamos o utilizador fora e forçamos a limpeza da sessão
    await supabase.auth.signOut()
    
    return { success: true, message: data?.message || "Password alterada com sucesso." }
  } catch (err) {
    console.error("resetPassword error:", err)
    return { success: false, error: err.message || "Erro ao validar reposição de segurança." }
  }
}
