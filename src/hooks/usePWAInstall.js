import { useState, useEffect } from "react"

/**
 * Hook para capturar o evento beforeinstallprompt e gerir a instalacao do PWA.
 * Retorna:
 *   - isInstallable: boolean — se o banner de instalacao pode ser mostrado
 *   - isInstalled: boolean — se o PWA ja esta instalado (standalone)
 *   - promptInstall: funcao — mostra o prompt de instalacao nativo
 *   - dismiss: funcao — descarta o banner permanentemente (LocalStorage)
 */
export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [isInstallable, setIsInstallable] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Verificar se ja esta em modo standalone (instalado)
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true
    setIsInstalled(standalone)

    // Verificar se o utilizador ja dispensou o banner
    const wasDismissed = localStorage.getItem("mimu-pwa-dismissed") === "true"
    setDismissed(wasDismissed)

    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setIsInstallable(true)
    }

    window.addEventListener("beforeinstallprompt", handler)

    // Detectar instalacao concluida
    window.addEventListener("appinstalled", () => {
      setIsInstalled(true)
      setIsInstallable(false)
      setDeferredPrompt(null)
    })

    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, [])

  const promptInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === "accepted") {
      setIsInstalled(true)
      setIsInstallable(false)
    }
    setDeferredPrompt(null)
  }

  const dismiss = () => {
    localStorage.setItem("mimu-pwa-dismissed", "true")
    setDismissed(true)
    setIsInstallable(false)
  }

  return {
    isInstallable: isInstallable && !dismissed && !isInstalled,
    isInstalled,
    promptInstall,
    dismiss
  }
}
