import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ServicesProvider } from './context/ServicesContext'
import { NetworkProvider } from './context/NetworkContext'
import { seedDemoUsers } from './utils/seed'
import './i18n'
import './index.css'
import App from './App.jsx'

seedDemoUsers()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <NetworkProvider>
        <AuthProvider>
          <ServicesProvider>
            <App />
          </ServicesProvider>
        </AuthProvider>
      </NetworkProvider>
    </BrowserRouter>
  </StrictMode>,
)
