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
  CartesianGrid,
  LineChart,
  Line,
  Legend,
} from 'recharts'
import ChartCard from './ChartCard'

function Dashboard() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch('/clinical.csv')
      .then((response) => response.text())
      .then((text) => {
        const parsed = Papa.parse(text, {
          header: true,
          dynamicTyping: false,
          skipEmptyLines: true,
        })
        const validData = parsed.data.filter(row => 
          row['Main ID#'] && 
          row['Main ID#'].toString().trim() !== ''
        )
        console.log('Loaded clinical data:', validData.length, 'records')
        setData(validData)
        setLoading(false)
      })
      .catch((err) => {
        console.error('Failed to load CSV', err)
        setLoading(false)
      })
  }, [])

  // ... (All helper functions and useMemos remain exactly the same as your code: parseNumber, visitPatterns, patientStatusDistribution, hydroxyureaUsage, dosageDistribution, clinicalEvents, labValuesSummary, vitalSignsSummary, summaryStats, CHART_COLORS, PIE_COLORS) ...
  // Re-pasting them below for completeness as requested:

  const parseNumber = (value) => {
    if (!value || value === '') return null
    const num = parseFloat(value.toString().replace(/[^0-9.-]/g, ''))
    return isNaN(num) ? null : num
  }

  const visitPatterns = useMemo(() => {
    const monthlyVisits = data.reduce((acc, row) => {
      const year = row['Visit Year']
      const month = row['Visit Month']
      if (year && month) {
        const key = `${year}-${month}`
        acc[key] = (acc[key] || 0) + 1
      }
      return acc
    }, {})

    return Object.entries(monthlyVisits)
      .map(([period, count]) => ({ period, count }))
      .sort((a, b) => a.period.localeCompare(b.period))
      .slice(-24) 
  }, [data])

  const patientStatusDistribution = useMemo(() => {
    const statusCounts = data.reduce((acc, row) => {
      const status = row['General State'] || 'Unknown'
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {})
    
    return Object.entries(statusCounts)
      .map(([status, count]) => ({ status, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)
  }, [data])

  const hydroxyureaUsage = useMemo(() => {
    const usage = data.reduce((acc, row) => {
      const huStatus = row['Hydroxyurea Status at Visit'] || ''
      if (huStatus.toString().toLowerCase().includes('given')) {
        acc.Given++
      } else if (huStatus.toString().toLowerCase().includes('missing')) {
        acc.Missing++
      } else if (huStatus.toString().toLowerCase().includes('stopped')) {
        acc.Stopped++
      } else {
        acc.Unknown++
      }
      return acc
    }, { Given: 0, Missing: 0, Stopped: 0, Unknown: 0 })

    return [
      { name: 'Given', value: usage.Given },
      { name: 'Missing Data', value: usage.Missing },
      { name: 'Stopped', value: usage.Stopped },
      { name: 'Unknown', value: usage.Unknown }
    ].filter(item => item.value > 0)
  }, [data])

  const dosageDistribution = useMemo(() => {
    const dosages = data.filter(row => {
      const dosage = parseNumber(row['Hydroxyurea Dosage(mg)'])
      return dosage && dosage > 0
    }).map(row => parseNumber(row['Hydroxyurea Dosage(mg)']))

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

    return Object.entries(dosageRanges)
      .map(([range, count]) => ({ range, count }))
      .filter(item => item.count > 0)
  }, [data])

  const clinicalEvents = useMemo(() => {
    const events = {
      'Pain Crises': 0,
      'Hospital Visits': 0,
      'Blood Transfusions': 0
    }

    data.forEach(row => {
      const painCrises = parseNumber(row['Pain Crises in Last Month'])
      const hospitalVisits = parseNumber(row['Hospital Visits in Last Month'])
      const transfusions = parseNumber(row['Blood Transfusions in Last Month'])
      
      if (painCrises && painCrises > 0) events['Pain Crises']++
      if (hospitalVisits && hospitalVisits > 0) events['Hospital Visits']++
      if (transfusions && transfusions > 0) events['Blood Transfusions']++
    })

    return Object.entries(events).map(([event, count]) => ({ event, count }))
  }, [data])

  const labValuesSummary = useMemo(() => {
    const hbValues = data.filter(row => parseNumber(row['Hb (g/dl)'])).length
    const wbcValues = data.filter(row => parseNumber(row['WBC x10^9/L'])).length
    const plateletsValues = data.filter(row => parseNumber(row['Platelets x10^9/L'])).length
    const neutrophilsValues = data.filter(row => parseNumber(row['Neutrophils x10^9/L'])).length

    return { hbValues, wbcValues, plateletsValues, neutrophilsValues }
  }, [data])

  const vitalSignsSummary = useMemo(() => {
    const hrRecords = data.filter(row => parseNumber(row.HR)).length
    const o2satRecords = data.filter(row => parseNumber(row['O2 Sat'])).length
    const bpRecords = data.filter(row => row.BP && row.BP.toString().includes('/')).length
    const tempRecords = data.filter(row => parseNumber(row['Temp C'])).length

    return { hrRecords, o2satRecords, bpRecords, tempRecords }
  }, [data])

  const summaryStats = useMemo(() => {
    const uniquePatients = new Set(data.map(row => row['Main ID#'])).size
    const totalRecords = data.length
    const uniquePeriods = new Set(data.map(row => `${row['Visit Year']}-${row['Visit Month']}`)).size
    const patientsOnHU = data.filter(row => {
      const huStatus = row['Hydroxyurea Status at Visit'] || ''
      return huStatus.toString().toLowerCase().includes('given')
    }).length

    return {
      uniquePatients,
      totalRecords,
      uniquePeriods,
      patientsOnHU,
      huPercentage: totalRecords > 0 ? Math.round((patientsOnHU / totalRecords) * 100) : 0
    }
  }, [data])

  const CHART_COLORS = {
    primary: '#3b82f6',
    secondary: '#8b5cf6',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#06b6d4',
    accent: '#ec4899'
  }

  const PIE_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#14b8a6']

  // Render content
  const renderDashboardContent = () => (
    <div style={styles.container}>
      <style>{inlineStyles}</style>
      
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div>
            <h1 style={styles.mainTitle}>Clinical Data Dashboard</h1>
            <p style={styles.subtitle}>
              Analysis of {summaryStats.totalRecords.toLocaleString()} clinical records from {summaryStats.uniquePatients} patients
            </p>
          </div>
        </div>
      </header>

      <main style={styles.main}>
        <div style={styles.summaryGrid}>
          <div style={styles.summaryCard}>
            <div style={styles.summaryIcon} className="icon-blue">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div style={styles.summaryContent}>
              <p style={styles.summaryLabel}>Total Records</p>
              <p style={styles.summaryValue}>{summaryStats.totalRecords.toLocaleString()}</p>
            </div>
          </div>

          <div style={styles.summaryCard}>
            <div style={{...styles.summaryIcon, ...styles.iconPurple}}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div style={styles.summaryContent}>
              <p style={styles.summaryLabel}>Unique Patients</p>
              <p style={styles.summaryValue}>{summaryStats.uniquePatients}</p>
            </div>
          </div>

          <div style={styles.summaryCard}>
            <div style={{...styles.summaryIcon, ...styles.iconGreen}}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div style={styles.summaryContent}>
              <p style={styles.summaryLabel}>Reporting Periods</p>
              <p style={styles.summaryValue}>{summaryStats.uniquePeriods}</p>
            </div>
          </div>

          <div style={styles.summaryCard}>
            <div style={{...styles.summaryIcon, ...styles.iconOrange}}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div style={styles.summaryContent}>
              <p style={styles.summaryLabel}>On Hydroxyurea</p>
              <p style={styles.summaryValue}>{summaryStats.huPercentage}%</p>
            </div>
          </div>
        </div>

        <div style={styles.chartsGrid}>
          {/* Visit Trends */}
          <ChartCard title="Monthly Visit Trends">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={visitPatterns}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="period" 
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  tickMargin={8}
                />
                <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '13px'
                  }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke={CHART_COLORS.primary} 
                  strokeWidth={2.5}
                  dot={{ fill: CHART_COLORS.primary, r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Visits"
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Patient Status */}
          <ChartCard title="Patient General Status">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={patientStatusDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="status" 
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  tickMargin={8}
                />
                <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '13px'
                  }} 
                />
                <Bar dataKey="count" fill={CHART_COLORS.success} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Hydroxyurea Treatment Status */}
          <ChartCard title="Hydroxyurea Treatment Status">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie 
                  data={hydroxyureaUsage} 
                  dataKey="value" 
                  nameKey="name" 
                  cx="50%" 
                  cy="50%" 
                  outerRadius={90}
                  label={({name, percent}) => percent > 0.05 ? `${name} (${(percent * 100).toFixed(0)}%)` : ''}
                  labelStyle={{ fontSize: '12px', fontWeight: '500' }}
                >
                  {hydroxyureaUsage.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '13px'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Hydroxyurea Dosage Distribution */}
          <ChartCard title="Hydroxyurea Dosage Distribution">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={dosageDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="range" 
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  tickMargin={8}
                />
                <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '13px'
                  }} 
                />
                <Bar dataKey="count" fill={CHART_COLORS.secondary} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Clinical Events */}
          <ChartCard title="Clinical Events (Last Month)">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={clinicalEvents}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="event" 
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  tickMargin={8}
                />
                <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '13px'
                  }} 
                />
                <Bar dataKey="count" fill={CHART_COLORS.danger} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Vital Signs Summary */}
          <ChartCard title="Vital Signs Records">
            <div style={styles.statsGrid}>
              <div style={styles.statItem}>
                <div style={{...styles.statBadge, backgroundColor: '#dbeafe', color: '#1e40af'}}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <div>
                  <p style={styles.statValue}>{vitalSignsSummary.hrRecords}</p>
                  <p style={styles.statLabel}>Heart Rate</p>
                </div>
              </div>
              <div style={styles.statItem}>
                <div style={{...styles.statBadge, backgroundColor: '#dcfce7', color: '#166534'}}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <p style={styles.statValue}>{vitalSignsSummary.o2satRecords}</p>
                  <p style={styles.statLabel}>O2 Saturation</p>
                </div>
              </div>
              <div style={styles.statItem}>
                <div style={{...styles.statBadge, backgroundColor: '#fed7aa', color: '#9a3412'}}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <p style={styles.statValue}>{vitalSignsSummary.bpRecords}</p>
                  <p style={styles.statLabel}>Blood Pressure</p>
                </div>
              </div>
              <div style={styles.statItem}>
                <div style={{...styles.statBadge, backgroundColor: '#fce7f3', color: '#9f1239'}}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <p style={styles.statValue}>{vitalSignsSummary.tempRecords}</p>
                  <p style={styles.statLabel}>Temperature</p>
                </div>
              </div>
            </div>
          </ChartCard>

          {/* Lab Values Summary */}
          <ChartCard title="Laboratory Test Records">
            <div style={styles.statsGrid}>
              <div style={styles.statItem}>
                <div style={{...styles.statBadge, backgroundColor: '#f3e8ff', color: '#6b21a8'}}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                </div>
                <div>
                  <p style={styles.statValue}>{labValuesSummary.hbValues}</p>
                  <p style={styles.statLabel}>Hemoglobin</p>
                </div>
              </div>
              <div style={styles.statItem}>
                <div style={{...styles.statBadge, backgroundColor: '#e0e7ff', color: '#3730a3'}}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                </div>
                <div>
                  <p style={styles.statValue}>{labValuesSummary.wbcValues}</p>
                  <p style={styles.statLabel}>WBC Counts</p>
                </div>
              </div>
              <div style={styles.statItem}>
                <div style={{...styles.statBadge, backgroundColor: '#cffafe', color: '#164e63'}}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                </div>
                <div>
                  <p style={styles.statValue}>{labValuesSummary.neutrophilsValues}</p>
                  <p style={styles.statLabel}>Neutrophils</p>
                </div>
              </div>
              <div style={styles.statItem}>
                <div style={{...styles.statBadge, backgroundColor: '#d1fae5', color: '#065f46'}}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                </div>
                <div>
                  <p style={styles.statValue}>{labValuesSummary.plateletsValues}</p>
                  <p style={styles.statLabel}>Platelets</p>
                </div>
              </div>
            </div>
          </ChartCard>
        </div>
      </main>
    </div>
  )

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingContent}>
          <div style={styles.spinner}></div>
          <p style={styles.loadingText}>Loading clinical data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
        <button
          onClick={() => window.location.href = '/menu'}
          style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            zIndex: 50,
            padding: '8px 16px',
            backgroundColor: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            color: '#475569',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
          }}
        >
          ← Back to Menu
        </button>
        {renderDashboardContent()}
    </div>
  )
}

const styles = {
  // ... (The styles object from your original Dashboard code remains EXACTLY the same here) ...
  container: {
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  loadingContainer: {
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContent: {
    textAlign: 'center',
  },
  spinner: {
    width: '48px',
    height: '48px',
    border: '4px solid #e2e8f0',
    borderTopColor: '#3b82f6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 16px',
  },
  loadingText: {
    color: '#64748b',
    fontSize: '15px',
    fontWeight: '500',
  },
  header: {
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e2e8f0',
    padding: '24px 32px',
    paddingTop: '64px', // Added padding to account for the back button
  },
  headerContent: {
    margin: '0 auto',
  },
  mainTitle: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#0f172a',
    margin: '0 0 8px 0',
    letterSpacing: '-0.025em',
  },
  subtitle: {
    fontSize: '15px',
    color: '#64748b',
    margin: 0,
  },
  main: {
    margin: '0 auto',
    padding: '32px',
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '20px',
    marginBottom: '32px',
  },
  summaryCard: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    transition: 'box-shadow 0.2s ease',
    cursor: 'default',
  },
  summaryIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconBlue: {
    backgroundColor: '#dbeafe',
    color: '#1e40af',
  },
  iconPurple: {
    backgroundColor: '#f3e8ff',
    color: '#6b21a8',
  },
  iconGreen: {
    backgroundColor: '#dcfce7',
    color: '#166534',
  },
  iconOrange: {
    backgroundColor: '#fed7aa',
    color: '#9a3412',
  },
  summaryContent: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#64748b',
    margin: '0 0 4px 0',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  summaryValue: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#0f172a',
    margin: 0,
    lineHeight: 1,
  },
  chartsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
    gap: '24px',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px',
    padding: '8px 0',
  },
  statItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    backgroundColor: '#f8fafc',
    borderRadius: '6px',
  },
  statBadge: {
    width: '40px',
    height: '40px',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  statValue: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#0f172a',
    margin: '0 0 2px 0',
    lineHeight: 1,
  },
  statLabel: {
    fontSize: '12px',
    color: '#64748b',
    margin: 0,
    fontWeight: '500',
  },
}

const inlineStyles = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .chart-card {
    background-color: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 24px;
    transition: box-shadow 0.2s ease;
  }

  .chart-card:hover {
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
  }

  .chart-title {
    font-size: 16px;
    font-weight: 600;
    color: #0f172a;
    margin: 0 0 20px 0;
    letter-spacing: -0.01em;
  }

  .chart-content {
    width: 100%;
  }

  .icon-blue {
    background-color: #dbeafe;
    color: #1e40af;
  }
`

export default Dashboard