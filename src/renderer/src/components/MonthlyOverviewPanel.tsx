import type { MonthStats } from '../types'
import GoalIndicator from './GoalIndicator'

interface MonthlyOverviewPanelProps {
  stats: MonthStats
}

function MonthlyOverviewPanel({ stats }: MonthlyOverviewPanelProps): JSX.Element {
  return (
    <div className="overview-card">
      <h2 className="overview-title">Monthly Overview</h2>

      <GoalIndicator
        onSitePercentage={stats.onSitePercentage}
        onSiteHours={stats.onSiteHours}
        targetOnSiteHours={stats.targetOnSiteHours}
        hoursToGoal={stats.hoursToGoal}
      />

      <div className="overview-stats">
        <div className="stat-row">
          <span className="stat-label">Home Office</span>
          <span className="stat-value">{stats.homeOfficePercentage.toFixed(1)}%</span>
        </div>

        <div className="stat-divider" />

        <div className="stat-row stat-detail">
          <span className="stat-icon on-site-icon" />
          <span className="stat-count">{stats.onSiteDays}</span>
          <span className="stat-desc">on-site</span>
        </div>
        <div className="stat-row stat-detail">
          <span className="stat-icon home-office-icon" />
          <span className="stat-count">{stats.homeOfficeDays}</span>
          <span className="stat-desc">home office</span>
        </div>
        <div className="stat-row stat-detail">
          <span className="stat-icon absent-icon" />
          <span className="stat-count">{stats.absentDays}</span>
          <span className="stat-desc">absent</span>
        </div>

        <div className="stat-divider" />

        <div className="stat-row stat-total">
          <span className="stat-label">Total working days</span>
          <span className="stat-value">{stats.totalWorkingDays} days / {stats.totalWorkingHours} hrs</span>
        </div>
      </div>
    </div>
  )
}

export default MonthlyOverviewPanel
