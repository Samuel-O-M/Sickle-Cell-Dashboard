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
  LineChart,
  Line,
  AreaChart,
  Area,
  Legend,
  ComposedChart,
} from 'recharts'
import ChartCard from './ChartCard'

function Dashboard() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

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
        setData(parsed.data.filter(row => row['Main ID#'])) // Filter out empty rows
        setLoading(false)
      })
      .catch((err) => {
        console.error('Failed to load CSV', err)
        setLoading(false)
      })
  }, [])

  // Demographics Analysis
  const ageDistribution = useMemo(() => {
    const validAges = data.filter(row => row.Age && !isNaN(row.Age))
    const ageGroups = {
      '0-5': 0, '6-10': 0, '11-15': 0, '16-20': 0, '21-25': 0, '26-30': 0, '30+': 0
    }
    validAges.forEach(row => {
      const age = row.Age
      if (age <= 5) ageGroups['0-5']++
      else if (age <= 10) ageGroups['6-10']++
      else if (age <= 15) ageGroups['11-15']++
      else if (age <= 20) ageGroups['16-20']++
      else if (age <= 25) ageGroups['21-25']++
      else if (age <= 30) ageGroups['26-30']++
      else ageGroups['30+']++
    })
    return Object.entries(ageGroups).map(([range, count]) => ({ range, count }))
  }, [data])

  const sexDistribution = useMemo(() => {
    const sexCounts = data.reduce((acc, row) => {
      if (row.Sex === 'M' || row.Sex === 'Male') acc.Male++
      else if (row.Sex === 'F' || row.Sex === 'Female') acc.Female++
      return acc
    }, { Male: 0, Female: 0 })
    
    return [
      { name: 'Male', value: sexCounts.Male },
      { name: 'Female', value: sexCounts.Female }
    ]
  }, [data])

  // Patient Status Distribution
  const patientStatusDistribution = useMemo(() => {
    const statusCounts = data.reduce((acc, row) => {
      const status = row['Patient Status'] || 'Unknown'
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {})
    
    return Object.entries(statusCounts).map(([status, count]) => ({ status, count }))
  }, [data])

  // Visit Patterns
  const visitPatterns = useMemo(() => {
    const monthlyVisits = data.reduce((acc, row) => {
      if (row.Visit_Month && row.Visit_Year) {
        const key = `${row.Visit_Year}-${row.Visit_Month}`
        acc[key] = (acc[key] || 0) + 1
      }
      return acc
    }, {})

    return Object.entries(monthlyVisits)
      .map(([period, count]) => ({ period, count }))
      .sort((a, b) => a.period.localeCompare(b.period))
      .slice(-24) // Last 24 months
  }, [data])

  // Clinical Measurements
  const vitalSigns = useMemo(() => {
    return data.filter(row => row.HR || row.RR || row['O2 Sat']).map(row => ({
      id: row['Main ID#'],
      visit: row['Visit #'],
      age: row.Age,
      hr: row.HR,
      rr: row.RR,
      o2sat: row['O2 Sat'],
      temp: row['Temp C']
    }))
  }, [data])

  const bloodPressureData = useMemo(() => {
    return data.filter(row => row.BP && typeof row.BP === 'string' && row.BP.includes('/')).map(row => {
      const [systolic, diastolic] = row.BP.split('/').map(v => parseInt(v))
      return {
        id: row['Main ID#'],
        visit: row['Visit #'],
        age: row.Age,
        systolic: systolic,
        diastolic: diastolic
      }
    })
  }, [data])

  const labValues = useMemo(() => {
    return data.filter(row => row['Hb (g/dl)'] || row['Neutrophils x10^9/L']).map(row => ({
      id: row['Main ID#'],
      visit: row['Visit #'],
      age: row.Age,
      hb: row['Hb (g/dl)'],
      neutrophils: row['Neutrophils x10^9/L'],
      platelets: row['Platelets x10^9/L']
    }))
  }, [data])

  // Treatment Analysis
  const hydroxyureaUsage = useMemo(() => {
    const usage = data.reduce((acc, row) => {
      const hu = row.Hydroxyurea
      if (hu === 'Yes') acc.Yes++
      else if (hu === 'No') acc.No++
      else acc.Unknown++
      return acc
    }, { Yes: 0, No: 0, Unknown: 0 })

    return [
      { name: 'On Hydroxyurea', value: usage.Yes },
      { name: 'Not on Hydroxyurea', value: usage.No },
      { name: 'Unknown', value: usage.Unknown }
    ]
  }, [data])

  const dosageDistribution = useMemo(() => {
    const dosages = data.filter(row => 
      row['Hydroxyurea Dosage(mg)'] && 
      !isNaN(row['Hydroxyurea Dosage(mg)'])
    ).map(row => row['Hydroxyurea Dosage(mg)'])

    const dosageRanges = {
      '0-500mg': 0, '501-1000mg': 0, '1001-1500mg': 0, 
      '1501-2000mg': 0, '2001-2500mg': 0, '2500mg+': 0
    }

    dosages.forEach(dose => {
      if (dose <= 500) dosageRanges['0-500mg']++
      else if (dose <= 1000) dosageRanges['501-1000mg']++
      else if (dose <= 1500) dosageRanges['1001-1500mg']++
      else if (dose <= 2000) dosageRanges['1501-2000mg']++
      else if (dose <= 2500) dosageRanges['2001-2500mg']++
      else dosageRanges['2500mg+']++
    })

    return Object.entries(dosageRanges).map(([range, count]) => ({ range, count }))
  }, [data])

  // Clinical Events
  const clinicalEvents = useMemo(() => {
    const events = {
      'Pain Crises': 0,
      'Hospital Admissions': 0,
      'Blood Transfusions': 0
    }

    data.forEach(row => {
      if (row['Pain Crises Last Month'] > 0) events['Pain Crises']++
      if (row['Hospital Last Month'] > 0) events['Hospital Admissions']++
      if (row['Blood Transfusions Last Month'] > 0) events['Blood Transfusions']++
    })

    return Object.entries(events).map(([event, count]) => ({ event, count }))
  }, [data])

  // General State Analysis
  const generalStateDistribution = useMemo(() => {
    const states = data.reduce((acc, row) => {
      const state = row['General State'] || 'Unknown'
      acc[state] = (acc[state] || 0) + 1
      return acc
    }, {})

    return Object.entries(states).map(([state, count]) => ({ state, count }))
  }, [data])

  const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316']

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading clinical data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg p-6 shadow">
          <h3 className="text-2xl font-bold text-blue-600">{data.length}</h3>
          <p className="text-gray-600">Total Records</p>
        </div>
        <div className="bg-white rounded-lg p-6 shadow">
          <h3 className="text-2xl font-bold text-green-600">
            {new Set(data.map(row => row['Main ID#'])).size}
          </h3>
          <p className="text-gray-600">Unique Patients</p>
        </div>
        <div className="bg-white rounded-lg p-6 shadow">
          <h3 className="text-2xl font-bold text-orange-600">
            {new Set(data.map(row => `${row.Visit_Year}-${row.Visit_Month}`)).size}
          </h3>
          <p className="text-gray-600">Reporting Periods</p>
        </div>
        <div className="bg-white rounded-lg p-6 shadow">
          <h3 className="text-2xl font-bold text-purple-600">
            {Math.round((data.filter(row => row.Hydroxyurea === 'Yes').length / data.length) * 100)}%
          </h3>
          <p className="text-gray-600">On Hydroxyurea</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        
        {/* Demographics Section */}
        <ChartCard title="Age Group Distribution">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={ageDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#0ea5e9" />
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
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Patient Status">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={patientStatusDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="status" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Visit Patterns */}
        <ChartCard title="Monthly Visit Trends" className="md:col-span-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={visitPatterns}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="General Health State">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={generalStateDistribution} dataKey="count" nameKey="state" outerRadius={80} label>
                {generalStateDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Clinical Measurements */}
        <ChartCard title="Heart Rate vs Age" className="md:col-span-2">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart data={vitalSigns.filter(d => d.hr && d.age)}>
              <CartesianGrid />
              <XAxis type="number" dataKey="age" name="Age" unit="years" />
              <YAxis type="number" dataKey="hr" name="Heart Rate" unit="bpm" />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter data={vitalSigns.filter(d => d.hr && d.age)} fill="#ef4444" />
            </ScatterChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Oxygen Saturation">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart data={vitalSigns.filter(d => d.o2sat && d.age)}>
              <CartesianGrid />
              <XAxis type="number" dataKey="age" name="Age" unit="years" />
              <YAxis type="number" dataKey="o2sat" name="O2 Sat" unit="%" />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter data={vitalSigns.filter(d => d.o2sat && d.age)} fill="#06b6d4" />
            </ScatterChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Blood Pressure Analysis */}
        <ChartCard title="Blood Pressure (Systolic vs Diastolic)" className="md:col-span-2">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart data={bloodPressureData}>
              <CartesianGrid />
              <XAxis type="number" dataKey="systolic" name="Systolic" unit="mmHg" />
              <YAxis type="number" dataKey="diastolic" name="Diastolic" unit="mmHg" />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter data={bloodPressureData} fill="#f59e0b" />
            </ScatterChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Hemoglobin Levels">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart data={labValues.filter(d => d.hb && d.age)}>
              <CartesianGrid />
              <XAxis type="number" dataKey="age" name="Age" unit="years" />
              <YAxis type="number" dataKey="hb" name="Hemoglobin" unit="g/dl" />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter data={labValues.filter(d => d.hb && d.age)} fill="#8b5cf6" />
            </ScatterChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Treatment Analysis */}
        <ChartCard title="Hydroxyurea Usage">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={hydroxyureaUsage} dataKey="value" nameKey="name" outerRadius={80} label>
                {hydroxyureaUsage.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Hydroxyurea Dosage Distribution">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dosageDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Clinical Events (Last Month)">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={clinicalEvents}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="event" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Lab Values Correlation */}
        <ChartCard title="Hemoglobin vs Neutrophils" className="md:col-span-2 xl:col-span-3">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart data={labValues.filter(d => d.hb && d.neutrophils)}>
              <CartesianGrid />
              <XAxis type="number" dataKey="hb" name="Hemoglobin" unit="g/dl" />
              <YAxis type="number" dataKey="neutrophils" name="Neutrophils" unit="x10^9/L" />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter data={labValues.filter(d => d.hb && d.neutrophils)} fill="#84cc16" />
            </ScatterChart>
          </ResponsiveContainer>
        </ChartCard>

      </div>
    </div>
  )
}

export default Dashboard
