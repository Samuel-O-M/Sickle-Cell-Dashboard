import { useState } from 'react'
import Dashboard from './Dashboard'
import DummyDashboard from './DummyDashboard'
import PatientDashboard from './PatientDashboard'

function Main() {
  const [currentView, setCurrentView] = useState('menu')

  if (currentView === 'dashboard') {
    return (
      <div>
        <button
          onClick={() => setCurrentView('menu')}
          className="mb-6 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
        >
          ← Back to Menu
        </button>
        <Dashboard />
      </div>
    )
  }

  if (currentView === 'dummy') {
    return (
      <div>
        <button
          onClick={() => setCurrentView('menu')}
          className="mb-6 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
        >
          ← Back to Menu
        </button>
        <DummyDashboard />
      </div>
    )
  }

  if (currentView === 'patient') {
    return (
      <div>
        <button
          onClick={() => setCurrentView('menu')}
          className="mb-6 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
        >
          ← Back to Menu
        </button>
        <PatientDashboard />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="text-4xl font-bold text-gray-800 mb-4">
          Sickle Cell Dashboard
        </h2>
        <p className="text-lg text-gray-600 mb-8">
          Choose a dashboard to explore the clinical data and insights
        </p>
        <p className="text-sm text-gray-500 mb-8">
          Version 0.4.0
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div 
            onClick={() => setCurrentView('dashboard')}
            className="bg-white rounded-lg shadow-lg p-8 cursor-pointer hover:shadow-xl transform hover:scale-105 transition-all duration-200 border-2 border-transparent hover:border-blue-500"
          >
            <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">Full Dataset Dashboard</h3>
            <p className="text-gray-600 mb-4">
              Comprehensive analysis of the complete sickle cell dataset with 880+ patient records
            </p>
            {/* <ul className="text-sm text-gray-500 text-left">
              <li>• Longitudinal patient tracking</li>
              <li>• Treatment effectiveness analysis</li>
              <li>• Clinical event monitoring</li>
              <li>• Advanced correlations</li>
            </ul> */}
          </div>

          <div 
            onClick={() => setCurrentView('dummy')}
            className="bg-white rounded-lg shadow-lg p-8 cursor-pointer hover:shadow-xl transform hover:scale-105 transition-all duration-200 border-2 border-transparent hover:border-green-500"
          >
            <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">Sample Dashboard</h3>
            <p className="text-gray-600 mb-4">
              Interactive demo dashboard using a smaller sample dataset (102 records)
            </p>
            {/* <ul className="text-sm text-gray-500 text-left">
              <li>• Basic demographics visualization</li>
              <li>• Interactive measurement charts</li>
              <li>• Dynamic chart builder</li>
              <li>• Patient identification tooltips</li>
            </ul> */}
          </div>

          <div 
            onClick={() => setCurrentView('patient')}
            className="bg-white rounded-lg shadow-lg p-8 cursor-pointer hover:shadow-xl transform hover:scale-105 transition-all duration-200 border-2 border-transparent hover:border-purple-500"
          >
            <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">Patient Dashboard</h3>
            <p className="text-gray-600 mb-4">
              Look up individual patients by ID and track their clinical evolution
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}

export default Main
