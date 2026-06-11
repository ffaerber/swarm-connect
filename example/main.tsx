import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { SwarmConnectProvider } from '../src'
import { App } from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SwarmConnectProvider>
      <App />
    </SwarmConnectProvider>
  </StrictMode>,
)
