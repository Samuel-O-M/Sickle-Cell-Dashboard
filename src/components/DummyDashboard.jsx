import { useEffect, useState, useMemo } from 'react'
import Papa from 'papaparse'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  CartesianGrid,
  ZAxis,
} from 'recharts'
import ChartCard from './ChartCard'

function Dashboard() {
  const [data, setData] = useState([])
  const [selectedIdentifiers, setSelectedIdentifiers] = useState({
    Age: false,
    Sex: false,
    Height: false,
    Weight: false,
  })
  const [measurementXAxis, setMeasurementXAxis] = useState('Age')
  const [dynamicXAxis, setDynamicXAxis] = useState('')
  const [dynamicYAxis, setDynamicYAxis] = useState('')

  useEffect(() => {
    fetch('/scd_dummy.csv')
      .then((response) => response.text())
      .then((text) => {
        const parsed = Papa.parse(text, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
        })
        setData(parsed.data)
      })
      .catch((err) => console.error('Failed to load CSV', err))
  }, [])

  const ageDistribution = useMemo(() => {
    const map = {}
    data.forEach((row) => {
      const age = row.Age
      map[age] = (map[age] || 0) + 1
    })
    return Object.entries(map).map(([age, count]) => ({
      age: Number(age),
      count,
    }))
  }, [data])

  const sexDistribution = useMemo(() => {
    let male = 0
    let female = 0
    data.forEach((row) => {
      if (row.Sex === 0) male += 1
      else female += 1
    })
    return [
      { name: 'Male', value: male },
      { name: 'Female', value: female },
    ]
  }, [data])

  const heightWeight = useMemo(() => {
    return data.map((row) => ({
      height: row.Height,
      weight: row.Weight,
    }))
  }, [data])

  const COLORS = ['#60a5fa', '#f472b6']

  const identifierOptions = ['Age', 'Sex', 'Height', 'Weight']
  const xAxisOptions = ['Age', 'Sex', 'Height', 'Weight']
  
  // Get all available columns for dynamic chart
  const allColumns = useMemo(() => {
    if (data.length === 0) return []
    return Object.keys(data[0]).filter(key => key !== '')
  }, [data])

  const measurements = [
    { key: 'Left MUAC', label: 'Left MUAC (cm)', color: '#10b981' },
    { key: 'BP_Systolic', label: 'BP Systolic (mmHg)', color: '#f97316' },
    {
      key: 'BP_Diastolic',
      label: 'BP Diastolic (mmHg)',
      color: '#ef4444',
    },
    { key: 'HR', label: 'Heart Rate (bpm)', color: '#3b82f6' },
    { key: 'SpO2', label: 'SpO2 (%)', color: '#06b6d4' },
    { key: 'HB', label: 'Hemoglobin (g/dL)', color: '#8b5cf6' },
    {
      key: 'Neutrophils',
      label: 'Neutrophils (x10^9/L)',
      color: '#6366f1',
    },
    { key: 'Blood_Transfusions', label: 'Blood Transfusions', color: '#ec4899' },
    { key: 'Hospital_Admissions', label: 'Hospital Admissions', color: '#f59e0b' },
    {
      key: 'Hydroxyurea_Dose_mg',
      label: 'Hydroxyurea Dose (mg)',
      color: '#15803d',
    },
  ]

  // Custom tooltip to display selected identifiers and feature value
  const PatientTooltip = ({ active, payload, showFeature = true }) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload
      return (
        <div className="bg-white p-2 border rounded shadow text-xs">
          <p className="font-semibold mb-1">Patient</p>
          {selectedIdentifiers.Age && <p>Age: {d.Age}</p>}
          {selectedIdentifiers.Sex && <p>Sex: {d.Sex === 0 ? 'Male' : 'Female'}</p>}
          {selectedIdentifiers.Height && <p>Height: {d.Height} cm</p>}
          {selectedIdentifiers.Weight && <p>Weight: {d.Weight} kg</p>}
          {showFeature && payload[0].name && (
            <p className="mt-1 pt-1 border-t">
              {payload[0].name}: <span className="font-medium">{payload[0].value}</span>
            </p>
          )}
        </div>
      )
    }
    return null
  }

  // Handle identifier checkbox changes
  const handleIdentifierChange = (identifier) => {
    setSelectedIdentifiers(prev => ({
      ...prev,
      [identifier]: !prev[identifier]
    }))
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Identifier Selection */}
      <div className="bg-white shadow rounded p-4 mb-6">
        <h3 className="text-lg font-semibold mb-3 text-gray-800">Select Identifiers for Tooltips</h3>
        <div className="flex flex-wrap gap-4">
          {identifierOptions.map(identifier => (
            <label key={identifier} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedIdentifiers[identifier]}
                onChange={() => handleIdentifierChange(identifier)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{identifier}</span>
            </label>
          ))}
        </div>
      </div>

      {/* X-Axis Selection for Measurement Charts */}
      <div className="bg-white shadow rounded p-4 mb-6">
        <h3 className="text-lg font-semibold mb-3 text-gray-800">Select X-Axis for Measurement Charts</h3>
        <select
          value={measurementXAxis}
          onChange={(e) => setMeasurementXAxis(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {xAxisOptions.map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Basic distributions */}
        <ChartCard title="Age Distribution">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={ageDistribution} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="age" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#4f46e5" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Sex Distribution">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={sexDistribution} dataKey="value" nameKey="name" outerRadius={80} label>
                {sexDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Height vs Weight" height="h-96" className="md:col-span-2 xl:col-span-3">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
              <CartesianGrid />
              <XAxis type="number" dataKey="height" name="Height (cm)" unit="cm" />
              <YAxis type="number" dataKey="weight" name="Weight (kg)" unit="kg" />
              <ZAxis range={[40]} />
              <Tooltip content={<PatientTooltip />} cursor={{ strokeDasharray: '3 3' }} />
              <Scatter name="Patients" data={heightWeight} fill="#34d399" />
            </ScatterChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Measurement scatter charts */}
        {measurements.map(({ key, label, color }) => (
          <ChartCard key={key} title={label}>
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
                <CartesianGrid />
                <XAxis 
                  type={measurementXAxis === 'Sex' ? 'category' : 'number'}
                  dataKey={measurementXAxis} 
                  name={measurementXAxis}
                  unit={measurementXAxis === 'Height' ? 'cm' : measurementXAxis === 'Weight' ? 'kg' : ''}
                  tickFormatter={measurementXAxis === 'Sex' ? (value) => value === 0 ? 'Male' : 'Female' : undefined}
                />
                <YAxis type="number" dataKey={key} name={label} />
                <Tooltip content={<PatientTooltip />} />
                <Scatter data={data} name={label} fill={color} />
              </ScatterChart>
            </ResponsiveContainer>
          </ChartCard>
        ))}

        {/* Complex visualization: Systolic vs Diastolic */}
        <ChartCard title="BP Systolic vs Diastolic" height="h-96" className="md:col-span-2">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
              <CartesianGrid />
              <XAxis type="number" dataKey="BP_Systolic" name="BP Systolic" unit="mmHg" />
              <YAxis type="number" dataKey="BP_Diastolic" name="BP Diastolic" unit="mmHg" />
              <Tooltip content={<PatientTooltip />} />
              <Scatter
                data={data}
                name="Patients"
                fill="#0ea5e9"
                shape="circle"
              />
            </ScatterChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Dynamic Chart */}
        <div className="md:col-span-2 xl:col-span-3">
          <ChartCard title="Dynamic Chart" height="h-96">
            <div className="mb-4 flex gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">X-Axis</label>
                <select
                  value={dynamicXAxis}
                  onChange={(e) => setDynamicXAxis(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select X-Axis</option>
                  {allColumns.map(col => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Y-Axis</label>
                <select
                  value={dynamicYAxis}
                  onChange={(e) => setDynamicYAxis(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Y-Axis</option>
                  {allColumns.map(col => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
              </div>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              {dynamicXAxis && dynamicYAxis ? (
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                  <CartesianGrid />
                  <XAxis 
                    type={dynamicXAxis === 'Sex' ? 'category' : 'number'} 
                    dataKey={dynamicXAxis} 
                    name={dynamicXAxis}
                    tickFormatter={dynamicXAxis === 'Sex' ? (value) => value === 0 ? 'Male' : 'Female' : undefined}
                  />
                  <YAxis 
                    type={dynamicYAxis === 'Sex' ? 'category' : 'number'} 
                    dataKey={dynamicYAxis} 
                    name={dynamicYAxis}
                    tickFormatter={dynamicYAxis === 'Sex' ? (value) => value === 0 ? 'Male' : 'Female' : undefined}
                  />
                  <Tooltip content={<PatientTooltip />} />
                  <Scatter
                    data={data}
                    name={`${dynamicXAxis} vs ${dynamicYAxis}`}
                    fill="#9333ea"
                  />
                </ScatterChart>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400">
                  <p>Select both X and Y axes to view chart</p>
                </div>
              )}
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>
    </div>
  )
}

export default Dashboard 