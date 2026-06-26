import { useEffect, useState } from "react"
import { usePWAInstall } from "../hooks/usePWAInstall"

export default function PWAInstallPrompt() {
  const { isInstallable, promptInstall, dismiss } = usePWAInstall()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!isInstallable) return
    const t = setTimeout(() => setVisible(true), 3000)
    return () => clearTimeout(t)
  }, [isInstallable])

  if (!visible || !isInstallable) return null

  const handleInstall = async () => {
    setVisible(false)
    await promptInstall()
  }

  const handleDismiss = () => {
    setVisible(false)
    dismiss()
  }

  return (
    <div className="fixed bottom-24 left-4 right-4 z-[9999] animate-slide-up" style={{ maxWidth: "420px", margin: "0 auto" }}>
      <div className="relative overflow-hidden rounded-3xl shadow-2xl border border-white/10"
        style={{ background: "linear-gradient(135deg, #1a0a00ee 0%, #2a1000f0 100%)", backdropFilter: "blur(20px)" }}>

        <div className="absolute inset-0 opacity-20 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at top left, #D4AF37 0%, transparent 60%)" }} />

        <div className="relative p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg shrink-0"
              style={{ background: "linear-gradient(135deg, #7B1D1D, #450A0A)" }}>
              <img src="/pwa-192x192.png" alt="Mimu" className="w-10 h-10 rounded-xl object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-white text-base leading-tight">Instalar App Mimu</p>
              <p className="text-white/50 text-xs mt-0.5">Experiencia nativa no teu dispositivo</p>
            </div>
            <button onClick={handleDismiss}
              className="w-7 h-7 flex items-center justify-center rounded-full bg-white/10 text-white/50 hover:text-white hover:bg-white/20 transition text-sm shrink-0">
              x
            </button>
          </div>

          <ul className="space-y-1.5 mb-5">
            {[
              { icon: "!", text: "Mais rapido - carrega instantaneamente" },
              { icon: "~", text: "Funciona offline - sem internet" },
              { icon: "*", text: "Notificacoes push em tempo real" },
              { icon: "+", text: "Acesso direto no ecra inicial" },
            ].map(b => (
              <li key={b.text} className="flex items-center gap-2">
                <span className="text-sm w-5 text-center shrink-0 text-mimu-gold font-bold">{b.icon}</span>
                <span className="text-white/70 text-xs">{b.text}</span>
              </li>
            ))}
          </ul>

          <div className="flex gap-3">
            <button onClick={handleInstall}
              className="flex-1 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 shadow-lg"
              style={{ background: "linear-gradient(135deg, #D4AF37, #92740F)", color: "#1a0a00" }}>
              Instalar Agora
            </button>
            <button onClick={handleDismiss}
              className="px-4 py-2.5 rounded-xl font-medium text-sm text-white/50 hover:text-white border border-white/10 hover:border-white/20 transition">
              Mais tarde
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
