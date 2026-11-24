import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initializePoki } from './game/poki'
import { IS_POKI } from './game/platform'

if (IS_POKI) {
  document.documentElement.classList.add('poki-build')
  window.addEventListener('keydown', (event) => {
    if (event.target instanceof HTMLInputElement) return
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(event.key)) event.preventDefault()
  })
  window.addEventListener('wheel', (event) => event.preventDefault(), { passive: false })
}

await initializePoki()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
