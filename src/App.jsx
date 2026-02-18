import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Fundraising from './components/Fundraising'
import Main from './components/Main'
import Dashboard from './components/Dashboard'
import PatientDashboard from './components/PatientDashboard'
import Donate from './components/Donate'
import './App.css'

function App() {
  return (
    // import.meta.env.BASE_URL reads the "base" value from your vite.config.js
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/" element={<Fundraising />} />
        <Route path="/menu" element={<Main />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/patient" element={<PatientDashboard />} />
        <Route path="/donate" element={<Donate />} />
        {/* Catch-all redirect */}
        <Route path="*" element={<Fundraising />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App