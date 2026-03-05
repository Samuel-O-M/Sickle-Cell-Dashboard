import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import LoginButton from './components/LoginButton'
import Fundraising from './components/Fundraising'
import Main from './components/Main'
import Dashboard from './components/Dashboard'
import PatientDashboard from './components/PatientDashboard'
import EditDashboard from './components/EditDashboard'
import Donate from './components/Donate'
import './App.css'

function App() {
  const ConditionalLoginButton = () => {
    const location = useLocation();
    if (location.pathname === '/' || location.pathname === '/donate') return null;
    return <LoginButton />;
  };

  return (
    <AuthProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <ConditionalLoginButton />
        <Routes>
          <Route path="/" element={<Fundraising />} />
          <Route path="/menu" element={<Main />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/patient" element={<PatientDashboard />} />
          <Route path="/edit" element={<EditDashboard />} />
          <Route path="/donate" element={<Donate />} />
          {/* Catch-all redirect */}
          <Route path="*" element={<Fundraising />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App