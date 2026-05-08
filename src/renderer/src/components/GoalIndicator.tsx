import { GOAL_THRESHOLD_PERCENT } from '../services/workingTimeCalculator'

interface GoalIndicatorProps {
  onSitePercentage: number
  onSiteHours: number
  targetOnSiteHours: number
  hoursToGoal: number
}

function formatHours(hours: number): string {
  return `${hours.toFixed(1).replace(/\.0$/, '')}h`
}

function GoalIndicator({
  onSitePercentage,
  onSiteHours,
  targetOnSiteHours,
  hoursToGoal
}: GoalIndicatorProps): JSX.Element {
  const meetsGoal = onSitePercentage >= GOAL_THRESHOLD_PERCENT
  const colorClass = meetsGoal ? 'goal-met' : 'goal-not-met'
  const hasEffectiveDays = targetOnSiteHours > 0 || onSiteHours > 0

  return (
    <div className={`goal-indicator ${colorClass}`}>
      <div className="goal-percentage">{onSitePercentage.toFixed(1)}%</div>
      <div className="goal-label">On-site Presence</div>
      <div className="goal-bar-track">
        <div
          className="goal-bar-fill"
          style={{ width: `${Math.min(onSitePercentage, 100)}%` }}
        />
        <div className="goal-bar-target" style={{ left: `${GOAL_THRESHOLD_PERCENT}%` }} />
      </div>
      <div className="goal-threshold-label">{GOAL_THRESHOLD_PERCENT}% goal</div>
      {hasEffectiveDays ? (
        <>
          <div className="goal-hours-summary">
            {formatHours(onSiteHours)} of {formatHours(targetOnSiteHours)} on-site
          </div>
          <div className="goal-hours-delta">
            {meetsGoal ? 'Goal met' : `${formatHours(hoursToGoal)} to goal`}
          </div>
        </>
      ) : (
        <div className="goal-hours-summary goal-hours-empty">—</div>
      )}
    </div>
  )
}

export default GoalIndicator
