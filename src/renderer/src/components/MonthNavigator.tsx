interface MonthNavigatorProps {
  year: number
  month: number // 1-indexed
  onPrevMonth: () => void
  onNextMonth: () => void
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

function MonthNavigator({ year, month, onPrevMonth, onNextMonth }: MonthNavigatorProps): JSX.Element {
  return (
    <div className="month-navigator">
      <button className="nav-button" onClick={onPrevMonth} aria-label="Previous month">&lt;</button>
      <h2 className="month-title">{MONTH_NAMES[month - 1]} {year}</h2>
      <button className="nav-button" onClick={onNextMonth} aria-label="Next month">&gt;</button>
    </div>
  )
}

export default MonthNavigator
