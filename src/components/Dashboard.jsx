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

  useEffect(() => {
    fetch('/sickle_cell_dummy_data.csv')
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

  const measurements = [
    { key: 'Left MUAC', label: 'Left MUAC (cm)', color: '#10b981' },
    { key: 'BP_Systolic', label: 'BP Systolic (mmHg)', color: '#f97316' },
    {
      key: 'BP_Diastolic',
      label: 'BP Diastolic (mmHg)',
      color: '#ef4444',
      tooltip: true,
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

  // Custom tooltip to display core patient info
  const PatientTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload
      return (
        <div className="bg-white p-2 border rounded shadow text-xs">
          <p className="font-semibold mb-1">Patient</p>
          <p>Age: {d.Age}</p>
          <p>Sex: {d.Sex === 0 ? 'Male' : 'Female'}</p>
          <p>Height: {d.Height} cm</p>
          <p>Weight: {d.Weight} kg</p>
          <p>
            {payload[0].name}: <span className="font-medium">{payload[0].value}</span>
          </p>
        </div>
      )
    }
    return null
  }

  return (
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
      {measurements.map(({ key, label, color, tooltip }) => (
        <ChartCard key={key} title={label}>
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
              <CartesianGrid />
              <XAxis type="number" dataKey="Age" name="Age" />
              <YAxis type="number" dataKey={key} name={label} />
              <Tooltip content={tooltip ? <PatientTooltip /> : undefined} />
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
    </div>
  )
}

export default Dashboard 