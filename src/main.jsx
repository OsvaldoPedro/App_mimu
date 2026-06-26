import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { ServicesProvider } from './context/ServicesContext'
import { NetworkProvider } from './context/NetworkContext'
import { CategoriesProvider } from './context/CategoriesContext'
import './i18n'
import './index.css'
import App from './App.jsx'
// Registo automático do Service Worker (gerado pelo vite-plugin-pwa)
import { registerSW } from 'virtual:pwa-register'

// Regista o service worker — atualiza silenciosamente em background
const updateSW = registerSW({
  onNeedRefresh() {
    // Actualização disponível — aplica imediatamente em modo autoUpdate
    updateSW(true)
  },
  onOfflineReady() {
    console.log('[Mimu PWA] Pronto para funcionar offline.')
  }
})


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <NetworkProvider>
        <AuthProvider>
          <ThemeProvider>
            <CategoriesProvider>
              <ServicesProvider>
                <App />
              </ServicesProvider>
            </CategoriesProvider>
          </ThemeProvider>
        </AuthProvider>
      </NetworkProvider>
    </BrowserRouter>
  </StrictMode>,
)
