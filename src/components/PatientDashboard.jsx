import { useEffect, useState, useMemo } from 'react'
import Papa from 'papaparse'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  AreaChart,
  Area,
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ScatterChart,
  Scatter,
  Cell
} from 'recharts'
import ChartCard from './ChartCard'

function PatientDashboard() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [patientId, setPatientId] = useState('')
  const [searchId, setSearchId] = useState('')
  const [patientData, setPatientData] = useState(null)
  const [selectedMetric, setSelectedMetric] = useState('vitals')

  useEffect(() => {
    setLoading(true)
    fetch('/scd.csv')
      .then((response) => response.text())
      .then((text) => {
        const parsed = Papa.parse(text, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
        })
        setData(parsed.data.filter(row => row['Main ID#']))
        setLoading(false)
      })
      .catch((err) => {
        console.error('Failed to load CSV', err)
        setLoading(false)
      })
  }, [])

  // Get unique patient IDs for suggestions
  const uniquePatientIds = useMemo(() => {
    const ids = new Set()
    data.forEach(row => {
      if (row['Main ID#']) {
        ids.add(String(row['Main ID#']))
      }
    })
    return Array.from(ids).sort()
  }, [data])

  // Filter data for selected patient
  useEffect(() => {
    if (patientId && data.length > 0) {
      const patientRecords = data.filter(row => 
        String(row['Main ID#']) === patientId
      ).sort((a, b) => {
        // Sort by visit number or date
        if (a['Visit #'] && b['Visit #']) {
          return a['Visit #'] - b['Visit #']
        }
        const dateA = new Date(a['Visit Date'])
        const dateB = new Date(b['Visit Date'])
        return dateA - dateB
      })
      setPatientData(patientRecords)
    } else {
      setPatientData(null)
    }
  }, [patientId, data])

  // Process vital signs over time
  const vitalSignsData = useMemo(() => {
    if (!patientData || patientData.length === 0) return []
    
    return patientData.map(record => ({
      visit: `Visit ${record['Visit #'] || 'N/A'}`,
      date: record['Visit Date'] || '',
      HR: record.HR || null,
      'BP Systolic': record.BP ? parseInt(record.BP.split('/')[0]) : null,
      'BP Diastolic': record.BP ? parseInt(record.BP.split('/')[1]) : null,
      'SpO2': record['O2 Sat'] || null,
      'Temperature': record['Temp C'] || null,
    })).filter(record => record.visit !== 'Visit N/A')
  }, [patientData])

  // Process lab values over time
  const labValuesData = useMemo(() => {
    if (!patientData || patientData.length === 0) return []
    
    return patientData.map(record => ({
      visit: `Visit ${record['Visit #'] || 'N/A'}`,
      date: record['Visit Date'] || '',
      'Hemoglobin': record['Hb (g/dl)'] || null,
      'WBC': record['WBC x10^9/L'] || null,
      'Neutrophils': record['Neutrophils x10^9/L'] || null,
      'Platelets': record['Platelets x10^9/L'] || null,
      'MCV': record['MCV (fL)'] || null,
    })).filter(record => record.visit !== 'Visit N/A')
  }, [patientData])

  // Process anthropometric data
  const anthropometricData = useMemo(() => {
    if (!patientData || patientData.length === 0) return []
    
    return patientData.map(record => ({
      visit: `Visit ${record['Visit #'] || 'N/A'}`,
      date: record['Visit Date'] || '',
      'Height': record['Height(cm)'] || null,
      'Weight': record['Weight(kg)'] || null,
      'BMI': record['Height(cm)'] && record['Weight(kg)'] 
        ? (record['Weight(kg)'] / Math.pow(record['Height(cm)'] / 100, 2)).toFixed(1) 
        : null,
      'MUAC': record['Left MUAC...mm'] ? record['Left MUAC...mm'] / 10 : null, // Convert to cm
    })).filter(record => record.visit !== 'Visit N/A')
  }, [patientData])

  // Process treatment history
  const treatmentHistory = useMemo(() => {
    if (!patientData || patientData.length === 0) return []
    
    return patientData.map(record => ({
      visit: `Visit ${record['Visit #'] || 'N/A'}`,
      date: record['Visit Date'] || '',
      hydroxyurea: record.Hydroxyurea === 'Yes' ? 1 : 0,
      dosage: record['Hydroxyurea Dosage(mg)'] || 0,
      duration: record['Hydroxyurea Duration(months)'] || 0,
      painCrises: record['Pain Crises Last Month'] || 0,
      transfusions: record['Blood Transfusions Last Month'] || 0,
      hospitalVisits: record['Hospital Last Month'] || 0,
    })).filter(record => record.visit !== 'Visit N/A')
  }, [patientData])

  // Visit timeline
  const visitTimeline = useMemo(() => {
    if (!patientData || patientData.length === 0) return []
    
    return patientData.map(record => ({
      visit: record['Visit #'] || 'N/A',
      date: record['Visit Date'] || '',
      reason: record['Main Reason for Visit'] || 'Unknown',
      status: record['General State'] || record['Patient Status'] || 'Unknown',
      hydroxyurea: record.Hydroxyurea || 'Unknown',
    })).filter(record => record.visit !== 'N/A')
  }, [patientData])

  // Patient summary
  const patientSummary = useMemo(() => {
    if (!patientData || patientData.length === 0) return null
    
    const latestRecord = patientData[patientData.length - 1]
    const firstRecord = patientData[0]
    
    return {
      id: patientId,
      age: latestRecord.Age || firstRecord.Age || 'Unknown',
      sex: latestRecord.Sex === 'M' || latestRecord.Sex === 'Male' ? 'Male' : 
           latestRecord.Sex === 'F' || latestRecord.Sex === 'Female' ? 'Female' : 'Unknown',
      totalVisits: patientData.length,
      firstVisit: firstRecord['Visit Date'] || 'Unknown',
      lastVisit: latestRecord['Visit Date'] || 'Unknown',
      currentStatus: latestRecord['Patient Status'] || 'Unknown',
      onHydroxyurea: latestRecord.Hydroxyurea === 'Yes',
      hydroxyureaDuration: latestRecord['Hydroxyurea Duration(months)'] || 0,
    }
  }, [patientData, patientId])

  const handleSearch = () => {
    setPatientId(searchId)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading patient data...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Patient Dashboard
          </h1>
          <p className="text-gray-600">
            Look up individual patients and track their clinical evolution over time
          </p>
        </div>

        {/* Search Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Patient ID
              </label>
              <input
                type="text"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter patient ID (e.g., 1001, 1002, 1003...)"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                list="patient-ids"
              />
              <datalist id="patient-ids">
                {uniquePatientIds.slice(0, 20).map(id => (
                  <option key={id} value={id} />
                ))}
              </datalist>
            </div>
            <button
              onClick={handleSearch}
              className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
            >
              Search Patient
            </button>
          </div>
          {uniquePatientIds.length > 0 && (
            <p className="mt-2 text-sm text-gray-500">
              {uniquePatientIds.length} patients available in the database
            </p>
          )}
        </div>

        {/* Patient Data Display */}
        {patientData && patientData.length > 0 && (
          <>
            {/* Patient Summary Card */}
            {patientSummary && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Patient Summary</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Patient ID</p>
                    <p className="text-lg font-semibold">{patientSummary.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Age / Sex</p>
                    <p className="text-lg font-semibold">
                      {patientSummary.age} years / {patientSummary.sex}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Visits</p>
                    <p className="text-lg font-semibold">{patientSummary.totalVisits}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Current Status</p>
                    <p className="text-lg font-semibold">{patientSummary.currentStatus}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">First Visit</p>
                    <p className="text-lg font-semibold">{patientSummary.firstVisit}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Last Visit</p>
                    <p className="text-lg font-semibold">{patientSummary.lastVisit}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Hydroxyurea</p>
                    <p className="text-lg font-semibold">
                      {patientSummary.onHydroxyurea ? 
                        `Yes (${patientSummary.hydroxyureaDuration} months)` : 'No'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Metric Selector */}
            <div className="bg-white rounded-lg shadow-md p-4 mb-8">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedMetric('vitals')}
                  className={`px-4 py-2 rounded-md transition-colors ${
                    selectedMetric === 'vitals' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Vital Signs
                </button>
                <button
                  onClick={() => setSelectedMetric('labs')}
                  className={`px-4 py-2 rounded-md transition-colors ${
                    selectedMetric === 'labs' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Lab Values
                </button>
                <button
                  onClick={() => setSelectedMetric('anthropometric')}
                  className={`px-4 py-2 rounded-md transition-colors ${
                    selectedMetric === 'anthropometric' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Anthropometric
                </button>
                <button
                  onClick={() => setSelectedMetric('treatment')}
                  className={`px-4 py-2 rounded-md transition-colors ${
                    selectedMetric === 'treatment' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Treatment History
                </button>
                <button
                  onClick={() => setSelectedMetric('timeline')}
                  className={`px-4 py-2 rounded-md transition-colors ${
                    selectedMetric === 'timeline' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Visit Timeline
                </button>
              </div>
            </div>

            {/* Charts based on selected metric */}
            {selectedMetric === 'vitals' && vitalSignsData.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartCard title="Blood Pressure Trends">
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={vitalSignsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="visit" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="BP Systolic" 
                        stroke="#ef4444" 
                        strokeWidth={2}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="BP Diastolic" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Heart Rate & SpO2">
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={vitalSignsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="visit" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Legend />
                      <Line 
                        yAxisId="left"
                        type="monotone" 
                        dataKey="HR" 
                        stroke="#f97316" 
                        strokeWidth={2}
                        name="Heart Rate (bpm)"
                      />
                      <Line 
                        yAxisId="right"
                        type="monotone" 
                        dataKey="SpO2" 
                        stroke="#06b6d4" 
                        strokeWidth={2}
                        name="SpO2 (%)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>
            )}

            {selectedMetric === 'labs' && labValuesData.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartCard title="Hemoglobin Levels">
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={labValuesData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="visit" />
                      <YAxis />
                      <Tooltip />
                      <Area 
                        type="monotone" 
                        dataKey="Hemoglobin" 
                        stroke="#dc2626" 
                        fill="#fca5a5"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Blood Cell Counts">
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={labValuesData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="visit" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="WBC" 
                        stroke="#8b5cf6" 
                        strokeWidth={2}
                        name="WBC (x10^9/L)"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="Neutrophils" 
                        stroke="#06b6d4" 
                        strokeWidth={2}
                        name="Neutrophils (x10^9/L)"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="Platelets" 
                        stroke="#10b981" 
                        strokeWidth={2}
                        name="Platelets (x10^9/L)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>
            )}

            {selectedMetric === 'anthropometric' && anthropometricData.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartCard title="Height & Weight Evolution">
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={anthropometricData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="visit" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Legend />
                      <Line 
                        yAxisId="left"
                        type="monotone" 
                        dataKey="Height" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        name="Height (cm)"
                      />
                      <Line 
                        yAxisId="right"
                        type="monotone" 
                        dataKey="Weight" 
                        stroke="#10b981" 
                        strokeWidth={2}
                        name="Weight (kg)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="BMI & MUAC Trends">
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={anthropometricData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="visit" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="BMI" 
                        stroke="#f97316" 
                        strokeWidth={2}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="MUAC" 
                        stroke="#8b5cf6" 
                        strokeWidth={2}
                        name="MUAC (cm)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>
            )}

            {selectedMetric === 'treatment' && treatmentHistory.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartCard title="Hydroxyurea Treatment">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={treatmentHistory}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="visit" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="dosage" fill="#3b82f6" name="Dosage (mg)" />
                      <Bar dataKey="duration" fill="#10b981" name="Duration (months)" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Clinical Events">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={treatmentHistory}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="visit" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="painCrises" fill="#ef4444" name="Pain Crises" />
                      <Bar dataKey="transfusions" fill="#f97316" name="Transfusions" />
                      <Bar dataKey="hospitalVisits" fill="#8b5cf6" name="Hospital Visits" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>
            )}

            {selectedMetric === 'timeline' && visitTimeline.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Visit Timeline</h2>
                <div className="space-y-4">
                  {visitTimeline.map((visit, index) => (
                    <div key={index} className="flex items-start">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center font-semibold">
                          {visit.visit}
                        </div>
                      </div>
                      <div className="ml-4 flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-gray-900">
                            Visit {visit.visit} - {visit.date}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            visit.status === 'Good' || visit.status === 'GOOD' 
                              ? 'bg-green-100 text-green-800'
                              : visit.status === 'Fair' || visit.status === 'FAIR'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {visit.status}
                          </span>
                        </div>
                        <p className="text-gray-600 mt-1">
                          Reason: {visit.reason || 'Not specified'}
                        </p>
                        <p className="text-gray-600">
                          Hydroxyurea: {visit.hydroxyurea}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* No patient selected or found */}
        {searchId && patientId && (!patientData || patientData.length === 0) && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex items-center">
              <svg className="w-6 h-6 text-yellow-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="text-lg font-semibold text-yellow-800">No Data Found</h3>
                <p className="text-yellow-700">
                  No records found for patient ID: {patientId}. Please check the ID and try again.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default PatientDashboard