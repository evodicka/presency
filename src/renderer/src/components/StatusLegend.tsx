function StatusLegend(): JSX.Element {
  return (
    <div className="status-legend">
      <div className="legend-item">
        <span className="legend-color legend-home-office"></span>
        <span>Home Office</span>
      </div>
      <div className="legend-item">
        <span className="legend-color legend-on-site"></span>
        <span>On-site</span>
      </div>
      <div className="legend-item">
        <span className="legend-color legend-absent"></span>
        <span>Absent</span>
      </div>
    </div>
  )
}

export default StatusLegend
