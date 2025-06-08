import './App.css'
import Dashboard from './components/Dashboard'

function App() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 text-gray-900">
      <header className="fixed top-0 left-0 right-0 bg-white shadow z-10">
        <div className="max-w-screen-2xl mx-auto px-4 md:px-6 py-4">
          <h1 className="text-2xl font-bold tracking-tight">Sickle Cell - Dashboard 0.2.0</h1>
        </div>
      </header>
      <main className="flex-1 pt-20 px-4 md:px-6 pb-10 w-full max-w-screen-2xl mx-auto overflow-y-auto">
        <Dashboard />
      </main>
    </div>
  )
}

export default App
