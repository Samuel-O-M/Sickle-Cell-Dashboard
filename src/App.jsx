import { useEffect, useState } from 'react'
import Fundraising from './components/Fundraising'
import Main from './components/Main'
import Dashboard from './components/Dashboard'
import PatientDashboard from './components/PatientDashboard'
import Donate from './components/Donate'
import './App.css'

function App() {

  const [currentPath, setCurrentPath] = useState(window.location.pathname)

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname)
    }

    window.addEventListener('popstate', handleLocationChange)
    return () => window.removeEventListener('popstate', handleLocationChange)
  }, [])

  switch (currentPath) {
    case '/menu':
      return <Main />
    case '/dashboard':
      return <Dashboard />
    case '/patient':
      return <PatientDashboard />
    case '/donate':
      return <Donate />
    case '/':
    default:
      return <Fundraising />
  }
}

export default App