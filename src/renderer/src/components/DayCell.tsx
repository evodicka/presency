import type { DayStatus } from '../types'

interface DayCellProps {
  date: string
  dayNumber: number
  status: DayStatus
  isWeekend: boolean
  isHoliday: boolean
  isAdjacentMonth: boolean
  onStatusChange: (date: string) => void
}

function DayCell({ date, dayNumber, status, isWeekend, isHoliday, isAdjacentMonth, onStatusChange }: DayCellProps): JSX.Element {
  const isInteractive = !isWeekend && !isHoliday && !isAdjacentMonth

  const handleClick = (): void => {
    onStatusChange(date)
  }

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

  return (
    <div className={className} onClick={isInteractive ? handleClick : undefined}>
      <span className="day-number">{dayNumber}</span>
    </div>
  )
}

export default DayCell
