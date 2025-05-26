function ChartCard({ title, children, height = 'h-80', className = '' }) {
  return (
    <div className={`bg-white shadow rounded p-4 ${height} ${className}`}>
      <h2 className="text-lg font-semibold mb-2 text-gray-800">{title}</h2>
      {children}
    </div>
  )
}

export default ChartCard 