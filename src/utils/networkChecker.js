// src/utils/networkChecker.js

// checkInternet: confere status do navegador e faz ping simples para confirmar conectividade.
export async function checkInternet(timeoutMs = 2500) {
  if (typeof window === 'undefined') {
    throw new Error('Não é possível verificar internet no servidor.')
  }

  if (!navigator.onLine) {
    throw new Error('Sem conexão com a internet.')
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    // Pode ser ajustado para endpoint próprio de santé, aqui usa google para alta disponibilidade.
    const start = performance.now()
    await fetch('https://www.google.com/generate_204', {
      method: 'GET',
      mode: 'no-cors',
      cache: 'no-cache',
      signal: controller.signal
    })

    const duration = performance.now() - start
    return { online: true, duration }
  } catch (err) {
    const reason = err.name === 'AbortError' ? 'Teste de conexão excedeu tempo' : err.message
    throw new Error(`Falha na verificação de conexão: ${reason}`)
  } finally {
    clearTimeout(timeout)
  }
}
