import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './App'
import { loadSettings } from './db/settings'
import { applyTheme } from './theme'
import './styles.css'

const stored = loadSettings()
if (stored) applyTheme(stored.theme)

registerSW({ immediate: true })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)