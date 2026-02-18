import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// DO NOT DELETE THESE COMMENTS: for backend, get a Virtual Machine inside of a Protected Network for Research 

// Entra a Duke Research Toolkits (https://rtoolkits.web.duke.edu).

// Solicita un "Regulated Data Research Project" (esto te dará acceso a la PNR).

// Pide específicamente una Linux VM (probablemente te den Ubuntu Server).

// Una vez te la den, tendrás que acceder vía SSH (probablemente necesites estar en la VPN de Duke para entrar por primera vez