import type { DayStatus } from '../types'
import { formatHoursTime } from '../utils/formatHours'

interface DayCellProps {
  date: string
  dayNumber: number
  status: DayStatus
  hours: number
  isWeekend: boolean
  isHoliday: boolean
  isAdjacentMonth: boolean
  onStatusChange: (date: string) => void
  onAdjustHours: (date: string, delta: number) => void
}

function DayCell({ date, dayNumber, status, hours, isWeekend, isHoliday, isAdjacentMonth, onStatusChange, onAdjustHours }: DayCellProps): JSX.Element {
  const isInteractive = !isWeekend && !isHoliday && !isAdjacentMonth

  const handleClick = (): void => {
    onStatusChange(date)
  }

  const handleDecrement = (e: React.MouseEvent): void => {
    e.stopPropagation()
    onAdjustHours(date, -0.25)
  }

  const handleIncrement = (e: React.MouseEvent): void => {
    e.stopPropagation()
    onAdjustHours(date, 0.25)
  }

  const showControls = isInteractive && status === 'on-site'

  let className = 'day-cell'
  if (isAdjacentMonth) {
    className += ' adjacent'
  } else if (isWeekend) {
    className += ' weekend'
  } else if (isHoliday) {
    className += ' holiday'
  } else {
    className += ` status-${status}`
  }
  if (showControls) {
    className += ' has-hours-controls'
  }

  return (
    <div className={className} onClick={isInteractive ? handleClick : undefined}>
      <span className="day-number">{dayNumber}</span>
      {showControls && (
        <div className="day-hours-controls">
          <button className="day-hours-btn" onClick={handleDecrement} aria-label="Decrease hours">−</button>
          <span className="day-hours-value">{formatHoursTime(hours)}</span>
          <button className="day-hours-btn" onClick={handleIncrement} aria-label="Increase hours">+</button>
        </div>
      )}
    </div>
  )
}

export default DayCell
