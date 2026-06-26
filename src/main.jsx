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
