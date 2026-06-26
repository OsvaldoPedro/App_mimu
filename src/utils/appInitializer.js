// src/utils/appInitializer.js
import { checkInternet } from './networkChecker'
import { supabase } from '../config/supabaseClient'

async function loadRemoteConfig() {
  // Configuração remota desativada/temporária para evitar erros 404 (tabela não existe)
  return null;
}

async function validateSession() {
  try {
    const { data, error } = await supabase.auth.getSession()
    if (error) {
      throw new Error('Não foi possível validar sessão do usuário.')
    }

    const hasUser = !!data?.session?.user
    return { authenticated: hasUser, session: data?.session ?? null }
  } catch (err) {
    console.warn('Erro de validação de sessão:', err)
    return { authenticated: false, session: null }
  }
}

async function preloadEssentialData() {
  try {
    // Exemplo de dados básicos (categoria). Ajustar conforme App.
    const { data, error } = await supabase
      .from('categories')
      .select('id,name,icon')
      .order('name', { ascending: true })
      .limit(50)

    if (error) {
      console.warn('Falha ao pré-carregar categorias:', error.message)
      return null
    }

    return data || []
  } catch (err) {
    console.warn('Erro em preloadEssentialData:', err)
    return null
  }
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function initializeApp({ maxDurationMs = 2500, onProgress = () => {} } = {}) {
  const startTime = performance.now()
  const phases = [
    { key: 'connection', label: 'Verificando conexão com a internet...' },
    { key: 'remoteConfig', label: 'Carregando configurações remotas...' },
    { key: 'session', label: 'Validando sessão do usuário...' },
    { key: 'preload', label: 'Pré-carregando dados essenciais...' }
  ]

  const results = {}
  let connectionSpeed = 'normal'

  for (let i = 0; i < phases.length; i++) {
    const phase = phases[i]
    const phaseStart = performance.now()

    try {
      onProgress({ message: phase.label, percent: Math.round((i * 100) / phases.length) })

      if (phase.key === 'connection') {
        const connectionResult = await checkInternet(2000)
        results.connection = { status: 'fulfilled', value: connectionResult }
        const duration = connectionResult.duration
        if (duration < 550) connectionSpeed = 'fast'
        else if (duration > 1200) connectionSpeed = 'slow'
      } else if (phase.key === 'remoteConfig') {
        results.remoteConfig = { status: 'fulfilled', value: await loadRemoteConfig() }
      } else if (phase.key === 'session') {
        results.session = { status: 'fulfilled', value: await validateSession() }
      } else if (phase.key === 'preload') {
        results.preload = { status: 'fulfilled', value: await preloadEssentialData() }
      }
    } catch (err) {
      results[phase.key] = { status: 'rejected', reason: err }
    }

    const phaseElapsed = performance.now() - phaseStart
    const humanizedWait = connectionSpeed === 'fast' ? 0 : connectionSpeed === 'slow' ? 150 : 75
    if (phaseElapsed < humanizedWait) {
      await wait(humanizedWait - phaseElapsed)
    }

    onProgress({
      message: phase.key === 'connection' && results.connection?.status === 'rejected'
        ? 'Sem conexão com a internet.'
        : `${phase.label.replace('...', '')} concluído.`,
      percent: Math.round(((i + 1) * 100) / phases.length)
    })

    if (performance.now() - startTime >= maxDurationMs) {
      break
    }
  }

  const elapsedMs = performance.now() - startTime
  if (elapsedMs < 800) {
    await wait(800 - elapsedMs)
  }

  onProgress({ message: 'Inicialização concluída.', percent: 100 })

  const hasError = Object.values(results).some((r) => r.status === 'rejected')

  return {
    status: hasError ? 'error' : 'success',
    data: results,
    message: hasError ? 'Algumas inicializações falharam.' : 'Inicialização concluída.'
  }
}
