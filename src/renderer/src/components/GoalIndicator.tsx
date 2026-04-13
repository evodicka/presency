const GOAL_THRESHOLD_PERCENT = 40

interface GoalIndicatorProps {
  onSitePercentage: number
}

function GoalIndicator({ onSitePercentage }: GoalIndicatorProps): JSX.Element {
  const meetsGoal = onSitePercentage >= GOAL_THRESHOLD_PERCENT
  const colorClass = meetsGoal ? 'goal-met' : 'goal-not-met'

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
    </div>
  )
}

export default GoalIndicator
