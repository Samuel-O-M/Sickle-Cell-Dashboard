import { useEffect, useState, useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'

const ITEMS_PER_PAGE = 20

function EditDashboard() {
  const { isAuthenticated, fetchData, updateData, username } = useAuth()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saveStatus, setSaveStatus] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [editedCells, setEditedCells] = useState({}) // { rowIndex_columnName: newValue }

  // Fetch data on mount and auth change
  useEffect(() => {
    if (!isAuthenticated) {
      setData([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError('')
    fetchData()
      .then((jsonData) => {
        setData(jsonData)
        setLoading(false)
      })
      .catch((err) => {
        setError('Failed to load data: ' + err.message)
        setLoading(false)
      })
  }, [isAuthenticated, fetchData])

  const columns = useMemo(() => {
    if (data.length === 0) return []
    // Use first row to determine columns, but exclude some internal fields if needed
    const sample = data[0]
    return Object.keys(sample).filter(key => !key.startsWith('_'))
  }, [data])

  const totalPages = Math.ceil(data.length / ITEMS_PER_PAGE)
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE
  const pageData = data.slice(startIdx, startIdx + ITEMS_PER_PAGE)

  const handleCellChange = (rowIndex, colName, value) => {
    const key = `${startIdx + rowIndex}_${colName}`
    setEditedCells(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    if (!isAuthenticated) {
      setError('Not authenticated')
      return
    }
    if (Object.keys(editedCells).length === 0) {
      setSaveStatus('No changes to save')
      return
    }
    setSaveStatus('Saving...')
    setError('')
    // Apply edits to a copy of data
    const updatedData = [...data]
    Object.entries(editedCells).forEach(([key, value]) => {
      const [idxStr, col] = key.split('_')
      const idx = parseInt(idxStr, 10)
      if (idx >= 0 && idx < updatedData.length) {
        updatedData[idx] = { ...updatedData[idx], [col]: value }
      }
    })
    try {
      await updateData(updatedData)
      setData(updatedData)
      setEditedCells({})
      setSaveStatus('Saved successfully')
      setTimeout(() => setSaveStatus(''), 3000)
    } catch (err) {
      setError('Failed to save: ' + err.message)
      setSaveStatus('')
    }
  }

  const handleRevert = () => {
    setEditedCells({})
    setSaveStatus('')
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-700 mb-4">Authentication Required</h2>
          <p className="text-gray-600">Please log in to access the editing dashboard.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-700">Loading clinical data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg max-w-md">
            <h3 className="font-bold">Error</h3>
            <p>{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Clinical Data Editor</h1>
          <p className="text-gray-600 mt-2">
            Logged in as <span className="font-semibold">{username}</span>. Edit cells directly and save changes to the server.
          </p>
          <div className="flex flex-wrap items-center gap-4 mt-4">
            <button
              onClick={handleSave}
              disabled={Object.keys(editedCells).length === 0}
              className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save Changes ({Object.keys(editedCells).length} cells modified)
            </button>
            <button
              onClick={handleRevert}
              disabled={Object.keys(editedCells).length === 0}
              className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Revert Changes
            </button>
            <span className="text-sm text-gray-500">
              {data.length} total records, showing {startIdx + 1}-{Math.min(startIdx + ITEMS_PER_PAGE, data.length)} (page {currentPage} of {totalPages})
            </span>
            {saveStatus && (
              <span className={`px-3 py-1 rounded-full text-sm ${saveStatus.includes('Saved') ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                {saveStatus}
              </span>
            )}
          </div>
        </header>

        <div className="bg-white rounded-xl shadow overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Row
                  </th>
                  {columns.map(col => (
                    <th key={col} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {pageData.map((row, rowIndex) => (
                  <tr key={startIdx + rowIndex} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 border-r">
                      {startIdx + rowIndex + 1}
                    </td>
                    {columns.map(col => {
                      const cellKey = `${startIdx + rowIndex}_${col}`
                      const isEdited = editedCells.hasOwnProperty(cellKey)
                      const value = isEdited ? editedCells[cellKey] : (row[col] || '')
                      return (
                        <td key={col} className="px-4 py-3 border-r">
                          <input
                            type="text"
                            value={value}
                            onChange={(e) => handleCellChange(rowIndex, col, e.target.value)}
                            className={`w-full px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${isEdited ? 'bg-yellow-50 border-yellow-300' : 'bg-white border-gray-300'}`}
                            placeholder="(empty)"
                          />
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-8">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-700">
              Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
            >
              Next
            </button>
            <select
              value={currentPage}
              onChange={(e) => setCurrentPage(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            >
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <option key={page} value={page}>{page}</option>
              ))}
            </select>
          </div>
        )}

        <div className="mt-8 text-sm text-gray-500">
          <p><strong>Note:</strong> Changes are saved to the server and will be reflected in the clinical dashboard and patient lookup after reload.</p>
          <p className="mt-1">Editing large datasets may affect performance; consider downloading the CSV for bulk edits.</p>
        </div>
      </div>
    </div>
  )
}

export default EditDashboard