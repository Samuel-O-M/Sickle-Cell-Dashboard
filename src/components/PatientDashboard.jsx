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
  BarChart,
  Bar,
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
    fetch('/clinical.csv')
      .then((response) => response.text())
      .then((text) => {
        const parsed = Papa.parse(text, {
          header: true,
          dynamicTyping: false,
          skipEmptyLines: true,
        })
        const validData = parsed.data.filter(row => 
          row['Main ID#'] && row['Main ID#'].toString().trim() !== ''
        )
        console.log('Loaded patient data:', validData.length, 'records')
        setData(validData)
        setLoading(false)
      })
      .catch((err) => {
        console.error('Failed to load CSV', err)
        setLoading(false)
      })
  }, [])

  // ... (All helper functions and logic remain exactly the same: parseNumber, uniquePatientIds, useEffect for filtering, vitalSignsData, labValuesData, anthropometricData, treatmentHistory, visitTimeline, patientSummary, handleSearch, handleKeyPress, CHART_COLORS) ...
  // Repasting for completeness:

  const parseNumber = (value) => {
    if (!value || value === '') return null
    const num = parseFloat(value.toString().replace(/[^0-9.-]/g, ''))
    return isNaN(num) ? null : num
  }

  const uniquePatientIds = useMemo(() => {
    const ids = new Set()
    data.forEach(row => {
      if (row['Main ID#']) {
        ids.add(String(row['Main ID#']))
      }
    })
    return Array.from(ids).sort()
  }, [data])

  useEffect(() => {
    if (patientId && data.length > 0) {
      const patientRecords = data.filter(row => 
        String(row['Main ID#']) === patientId
      ).sort((a, b) => {
        const dateA = new Date(a['Visit Date'] || '1900-01-01')
        const dateB = new Date(b['Visit Date'] || '1900-01-01')
        return dateA - dateB
      })
      console.log(`Found ${patientRecords.length} records for patient ${patientId}`)
      setPatientData(patientRecords)
    } else {
      setPatientData(null)
    }
  }, [patientId, data])

  const vitalSignsData = useMemo(() => {
    if (!patientData || patientData.length === 0) return []
    
    return patientData.map((record, index) => {
      const bp = record.BP ? record.BP.toString() : ''
      let systolic = null, diastolic = null
      if (bp.includes('/')) {
        const bpParts = bp.split('/')
        systolic = parseNumber(bpParts[0])
        diastolic = parseNumber(bpParts[1])
      }

      return {
        visit: `Visit ${index + 1}`,
        date: record['Visit Date'] || '',
        HR: parseNumber(record.HR),
        'BP Systolic': systolic,
        'BP Diastolic': diastolic,
        'SpO2': parseNumber(record['O2 Sat']),
        'Temperature': parseNumber(record['Temp C']),
      }
    })
  }, [patientData])

  const labValuesData = useMemo(() => {
    if (!patientData || patientData.length === 0) return []
    
    return patientData.map((record, index) => ({
      visit: `Visit ${index + 1}`,
      date: record['Visit Date'] || '',
      'Hemoglobin': parseNumber(record['Hb (g/dl)']),
      'WBC': parseNumber(record['WBC x10^9/L']),
      'Neutrophils': parseNumber(record['Neutrophils x10^9/L']),
      'Platelets': parseNumber(record['Platelets x10^9/L']),
      'MCV': parseNumber(record['MCV (fL)']),
    }))
  }, [patientData])

  const anthropometricData = useMemo(() => {
    if (!patientData || patientData.length === 0) return []
    
    return patientData.map((record, index) => {
      const height = parseNumber(record['Height(cm)'])
      const weight = parseNumber(record['Weight(kg)'])
      const muac = parseNumber(record['Left MUAC...mm'])
      
      let bmi = null
      if (height && weight && height > 0) {
        bmi = parseFloat((weight / Math.pow(height / 100, 2)).toFixed(1))
      }

      return {
        visit: `Visit ${index + 1}`,
        date: record['Visit Date'] || '',
        'Height': height,
        'Weight': weight,
        'BMI': bmi,
        'MUAC': muac ? (muac / 10) : null,
      }
    })
  }, [patientData])

  const treatmentHistory = useMemo(() => {
    if (!patientData || patientData.length === 0) return []
    
    return patientData.map((record, index) => {
      const huStatus = record['Hydroxyurea Status at Visit'] || ''
      const isOnHU = huStatus.toString().toLowerCase().includes('given') ? 1 : 0
      
      return {
        visit: `Visit ${index + 1}`,
        date: record['Visit Date'] || '',
        hydroxyurea: isOnHU,
        dosage: parseNumber(record['Hydroxyurea Dosage(mg)']) || 0,
        painCrises: parseNumber(record['Pain Crises in Last Month']) || 0,
        transfusions: parseNumber(record['Blood Transfusions in Last Month']) || 0,
        hospitalVisits: parseNumber(record['Hospital Visits in Last Month']) || 0,
      }
    })
  }, [patientData])

  const visitTimeline = useMemo(() => {
    if (!patientData || patientData.length === 0) return []
    
    return patientData.map((record, index) => ({
      visit: index + 1,
      date: record['Visit Date'] || '',
      reason: record['Main Reason for Visit'] || 'Unknown',
      status: record['General State'] || 'Unknown',
      hydroxyurea: record['Hydroxyurea Status at Visit'] || 'Unknown',
    }))
  }, [patientData])

  const patientSummary = useMemo(() => {
    if (!patientData || patientData.length === 0) return null
    const latestRecord = patientData[patientData.length - 1]
    const firstRecord = patientData[0]
    const huStatus = latestRecord['Hydroxyurea Status at Visit'] || ''
    const isOnHU = huStatus.toString().toLowerCase().includes('given')
    
    return {
      id: patientId,
      totalVisits: patientData.length,
      firstVisit: firstRecord['Visit Date'] || 'Unknown',
      lastVisit: latestRecord['Visit Date'] || 'Unknown',
      currentStatus: latestRecord['General State'] || 'Unknown',
      onHydroxyurea: isOnHU,
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

  const CHART_COLORS = {
    primary: '#3b82f6',
    secondary: '#8b5cf6',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#06b6d4',
  }

  const renderPatientContent = () => (
    <div style={styles.container}>
      <style>{inlineStyles}</style>
      
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.mainTitle}>Patient Dashboard</h1>
          <p style={styles.subtitle}>
            Individual patient analysis and clinical evolution tracking
          </p>
        </div>
      </header>

      <main style={styles.main}>
        <div style={styles.searchCard}>
          <div style={styles.searchContent}>
            <div style={styles.searchInputGroup}>
              <label style={styles.searchLabel}>Patient ID</label>
              <input
                type="text"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter patient ID (e.g., 1001, 1002, 1003...)"
                style={styles.searchInput}
                list="patient-ids"
              />
              <datalist id="patient-ids">
                {uniquePatientIds.slice(0, 50).map(id => (
                  <option key={id} value={id} />
                ))}
              </datalist>
            </div>
            <button onClick={handleSearch} style={styles.searchButton}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Search
            </button>
          </div>
          <p style={styles.searchHint}>
            {uniquePatientIds.length} patients available in database
          </p>
        </div>

        {patientData && patientData.length > 0 && (
          <>
            {patientSummary && (
              <div style={styles.summarySection}>
                <h2 style={styles.sectionTitle}>Patient Summary</h2>
                <div style={styles.summaryGrid}>
                  <div style={styles.summaryCard}>
                    <div style={{...styles.summaryIcon, ...styles.iconBlue}}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                      </svg>
                    </div>
                    <div>
                      <p style={styles.summaryCardLabel}>Patient ID</p>
                      <p style={styles.summaryCardValue}>{patientSummary.id}</p>
                    </div>
                  </div>

                  <div style={styles.summaryCard}>
                    <div style={{...styles.summaryIcon, ...styles.iconPurple}}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                    </div>
                    <div>
                      <p style={styles.summaryCardLabel}>Total Visits</p>
                      <p style={styles.summaryCardValue}>{patientSummary.totalVisits}</p>
                    </div>
                  </div>

                  <div style={styles.summaryCard}>
                    <div style={{...styles.summaryIcon, ...styles.iconGreen}}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p style={styles.summaryCardLabel}>Current Status</p>
                      <p style={styles.summaryCardValue}>{patientSummary.currentStatus}</p>
                    </div>
                  </div>

                  <div style={styles.summaryCard}>
                    <div style={{...styles.summaryIcon, ...styles.iconOrange}}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                      </svg>
                    </div>
                    <div>
                      <p style={styles.summaryCardLabel}>Hydroxyurea</p>
                      <p style={styles.summaryCardValue}>{patientSummary.onHydroxyurea ? 'Yes' : 'No'}</p>
                    </div>
                  </div>
                </div>

                <div style={styles.dateRangeGrid}>
                  <div style={styles.dateItem}>
                    <p style={styles.dateLabel}>First Visit</p>
                    <p style={styles.dateValue}>{patientSummary.firstVisit}</p>
                  </div>
                  <div style={styles.dateItem}>
                    <p style={styles.dateLabel}>Last Visit</p>
                    <p style={styles.dateValue}>{patientSummary.lastVisit}</p>
                  </div>
                </div>
              </div>
            )}

            <div style={styles.metricSelector}>
              {[
                { key: 'vitals', label: 'Vital Signs' },
                { key: 'labs', label: 'Lab Values' },
                { key: 'anthropometric', label: 'Growth Metrics' },
                { key: 'treatment', label: 'Treatment History' },
                { key: 'timeline', label: 'Visit Timeline' }
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setSelectedMetric(key)}
                  style={{
                    ...styles.metricButton,
                    ...(selectedMetric === key ? styles.metricButtonActive : {})
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {selectedMetric === 'vitals' && vitalSignsData.length > 0 && (
              <div style={styles.chartsGrid}>
                <ChartCard title="Blood Pressure Trends">
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={vitalSignsData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="visit" tick={{ fontSize: 12, fill: '#6b7280' }} tickMargin={8} />
                      <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
                      <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px' }} />
                      <Legend />
                      <Line type="monotone" dataKey="BP Systolic" stroke={CHART_COLORS.danger} strokeWidth={2.5} name="Systolic" dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="BP Diastolic" stroke={CHART_COLORS.primary} strokeWidth={2.5} name="Diastolic" dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Heart Rate & Oxygen Saturation">
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={vitalSignsData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="visit" tick={{ fontSize: 12, fill: '#6b7280' }} tickMargin={8} />
                      <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
                      <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px' }} />
                      <Legend />
                      <Line type="monotone" dataKey="HR" stroke={CHART_COLORS.warning} strokeWidth={2.5} name="Heart Rate" dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="SpO2" stroke={CHART_COLORS.info} strokeWidth={2.5} name="SpO2 (%)" dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>
            )}

            {selectedMetric === 'labs' && labValuesData.length > 0 && (
              <div style={styles.chartsGrid}>
                <ChartCard title="Hemoglobin Levels">
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={labValuesData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="visit" tick={{ fontSize: 12, fill: '#6b7280' }} tickMargin={8} />
                      <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
                      <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px' }} />
                      <Line type="monotone" dataKey="Hemoglobin" stroke={CHART_COLORS.danger} strokeWidth={3} name="Hemoglobin (g/dl)" dot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Blood Cell Counts">
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={labValuesData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="visit" tick={{ fontSize: 12, fill: '#6b7280' }} tickMargin={8} />
                      <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
                      <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px' }} />
                      <Legend />
                      <Line type="monotone" dataKey="WBC" stroke={CHART_COLORS.secondary} strokeWidth={2.5} name="WBC" dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="Neutrophils" stroke={CHART_COLORS.info} strokeWidth={2.5} name="Neutrophils" dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="Platelets" stroke={CHART_COLORS.success} strokeWidth={2.5} name="Platelets" dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>
            )}

            {selectedMetric === 'anthropometric' && anthropometricData.length > 0 && (
              <div style={styles.chartsGrid}>
                <ChartCard title="Height & Weight Progression">
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={anthropometricData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="visit" tick={{ fontSize: 12, fill: '#6b7280' }} tickMargin={8} />
                      <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
                      <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px' }} />
                      <Legend />
                      <Line type="monotone" dataKey="Height" stroke={CHART_COLORS.primary} strokeWidth={2.5} name="Height (cm)" dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="Weight" stroke={CHART_COLORS.success} strokeWidth={2.5} name="Weight (kg)" dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="BMI Trends">
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={anthropometricData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="visit" tick={{ fontSize: 12, fill: '#6b7280' }} tickMargin={8} />
                      <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
                      <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px' }} />
                      <Line type="monotone" dataKey="BMI" stroke={CHART_COLORS.warning} strokeWidth={3} name="BMI" dot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>
            )}

            {selectedMetric === 'treatment' && treatmentHistory.length > 0 && (
              <div style={styles.chartsGrid}>
                <ChartCard title="Hydroxyurea Dosage Over Time">
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={treatmentHistory}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="visit" tick={{ fontSize: 12, fill: '#6b7280' }} tickMargin={8} />
                      <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
                      <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px' }} />
                      <Line type="monotone" dataKey="dosage" stroke={CHART_COLORS.primary} strokeWidth={3} name="Dosage (mg)" dot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Clinical Events (Monthly)">
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={treatmentHistory}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="visit" tick={{ fontSize: 12, fill: '#6b7280' }} tickMargin={8} />
                      <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
                      <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px' }} />
                      <Legend />
                      <Bar dataKey="painCrises" fill={CHART_COLORS.danger} name="Pain Crises" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="transfusions" fill={CHART_COLORS.warning} name="Transfusions" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="hospitalVisits" fill={CHART_COLORS.secondary} name="Hospital Visits" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>
            )}

            {selectedMetric === 'timeline' && visitTimeline.length > 0 && (
              <div style={styles.timelineCard}>
                <h2 style={styles.timelineTitle}>Visit Timeline</h2>
                <div style={styles.timelineContainer}>
                  {visitTimeline.map((visit, index) => (
                    <div key={index} style={styles.timelineItem}>
                      <div style={styles.timelineBadge}>{visit.visit}</div>
                      <div style={styles.timelineContent}>
                        <div style={styles.timelineHeader}>
                          <h3 style={styles.timelineVisitTitle}>Visit {visit.visit}</h3>
                          <span style={{
                            ...styles.timelineStatus,
                            ...(visit.status === 'Good' || visit.status === 'GOOD' ? styles.statusGood :
                               visit.status === 'MILDLY ILL' || visit.status === 'Mildly Ill' || visit.status === 'MILDILY ILL' ? styles.statusMild :
                               styles.statusUnknown)
                          }}>
                            {visit.status}
                          </span>
                        </div>
                        <p style={styles.timelineDate}>{visit.date}</p>
                        <p style={styles.timelineReason}>{visit.reason || 'Routine visit'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {searchId && patientId && (!patientData || patientData.length === 0) && (
          <div style={styles.alertWarning}>
            <div style={styles.alertContent}>
              <h3 style={styles.alertTitle}>No Data Found</h3>
              <p style={styles.alertText}>
                No records found for patient ID: {patientId}
              </p>
              <p style={styles.alertHint}>
                Please check the ID and try again
              </p>
            </div>
          </div>
        )}

        {!patientId && (
          <div style={styles.alertInfo}>
            <div style={styles.alertContent}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={styles.alertIcon}>
                <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <h3 style={styles.alertTitle}>Select a Patient</h3>
              <p style={styles.alertText}>
                Enter a patient ID above to view their clinical data and trends
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  )

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingContent}>
          <div style={styles.spinner}></div>
          <p style={styles.loadingText}>Loading patient data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <button
            onClick={() => window.location.href = '/menu'}
            className="inline-flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            ← Back to Menu
          </button>
        </div>
        {renderPatientContent()}
    </div>
  )
}

const styles = {
  // ... (The styles object from your original PatientDashboard code remains EXACTLY the same here) ...
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
  },
  headerContent: {
    maxWidth: '1400px',
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
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '32px',
  },
  searchCard: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '24px',
    marginBottom: '32px',
  },
  searchContent: {
    display: 'flex',
    gap: '16px',
    alignItems: 'flex-end',
  },
  searchInputGroup: {
    flex: 1,
  },
  searchLabel: {
    display: 'block',
    fontSize: '13px',
    fontWeight: '500',
    color: '#64748b',
    marginBottom: '8px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  searchInput: {
    width: '100%',
    padding: '12px 16px',
    fontSize: '15px',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    outline: 'none',
    transition: 'all 0.2s',
    fontFamily: 'inherit',
  },
  searchButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 24px',
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '15px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    fontFamily: 'inherit',
  },
  searchHint: {
    marginTop: '12px',
    fontSize: '13px',
    color: '#64748b',
  },
  summarySection: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '24px',
    marginBottom: '24px',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#0f172a',
    margin: '0 0 20px 0',
    letterSpacing: '-0.01em',
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  summaryCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px',
    backgroundColor: '#f8fafc',
    borderRadius: '6px',
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
  summaryCardLabel: {
    fontSize: '12px',
    color: '#64748b',
    margin: '0 0 4px 0',
    fontWeight: '500',
  },
  summaryCardValue: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#0f172a',
    margin: 0,
  },
  dateRangeGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    paddingTop: '16px',
    borderTop: '1px solid #e2e8f0',
  },
  dateItem: {
    padding: '8px 0',
  },
  dateLabel: {
    fontSize: '13px',
    color: '#64748b',
    margin: '0 0 4px 0',
    fontWeight: '500',
  },
  dateValue: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#0f172a',
    margin: 0,
  },
  metricSelector: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '24px',
  },
  metricButton: {
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: '500',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    backgroundColor: '#f1f5f9',
    color: '#475569',
    fontFamily: 'inherit',
  },
  metricButtonActive: {
    backgroundColor: '#3b82f6',
    color: '#ffffff',
  },
  chartsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
    gap: '24px',
  },
  timelineCard: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '24px',
  },
  timelineTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#0f172a',
    margin: '0 0 20px 0',
    letterSpacing: '-0.01em',
  },
  timelineContainer: {
    maxHeight: '600px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  timelineItem: {
    display: 'flex',
    gap: '16px',
    padding: '16px',
    backgroundColor: '#f8fafc',
    borderRadius: '6px',
  },
  timelineBadge: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: '700',
    flexShrink: 0,
  },
  timelineContent: {
    flex: 1,
  },
  timelineHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '8px',
  },
  timelineVisitTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#0f172a',
    margin: 0,
  },
  timelineStatus: {
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '500',
  },
  statusGood: {
    backgroundColor: '#dcfce7',
    color: '#166534',
  },
  statusMild: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
  },
  statusUnknown: {
    backgroundColor: '#f1f5f9',
    color: '#475569',
  },
  timelineDate: {
    fontSize: '13px',
    color: '#64748b',
    margin: '0 0 4px 0',
  },
  timelineReason: {
    fontSize: '14px',
    color: '#475569',
    margin: 0,
  },
  alertWarning: {
    backgroundColor: '#fef3c7',
    border: '1px solid #fde68a',
    borderRadius: '8px',
    padding: '32px',
  },
  alertInfo: {
    backgroundColor: '#dbeafe',
    border: '1px solid #bfdbfe',
    borderRadius: '8px',
    padding: '48px 32px',
  },
  alertContent: {
    textAlign: 'center',
  },
  alertIcon: {
    color: '#3b82f6',
    margin: '0 auto 16px',
  },
  alertTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#0f172a',
    margin: '0 0 8px 0',
  },
  alertText: {
    fontSize: '15px',
    color: '#475569',
    margin: '0 0 4px 0',
  },
  alertHint: {
    fontSize: '13px',
    color: '#64748b',
    margin: 0,
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

  input[type="text"]:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  button:hover {
    opacity: 0.9;
  }

  button:active {
    transform: translateY(1px);
  }
`

export default PatientDashboard