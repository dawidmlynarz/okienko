import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { startScreen } from './store/useDomek'
import './styles/index.css'

startScreen()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
