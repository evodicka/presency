import type { DayStatus } from '../types'
import MonthNavigator from './MonthNavigator'
import DayCell from './DayCell'
import StatusLegend from './StatusLegend'

interface CalendarViewProps {
  year: number
  month: number // 1-indexed
  dayStatuses: Record<string, DayStatus>
  holidays: Set<string>
  onPrevMonth: () => void
  onNextMonth: () => void
  onStatusChange: (date: string) => void
}

interface DayInfo {
  date: string
  dayNumber: number
  isWeekend: boolean
  isHoliday: boolean
  isAdjacentMonth: boolean
  status: DayStatus
}

const DAY_HEADERS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function formatDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function buildCalendarGrid(
  year: number,
  month: number,
  dayStatuses: Record<string, DayStatus>,
  holidays: Set<string>
): DayInfo[][] {
  const firstDay = new Date(year, month - 1, 1)
  const daysInMonth = new Date(year, month, 0).getDate()

  // ISO weekday: Monday=0, Sunday=6
  let startDow = firstDay.getDay() - 1
  if (startDow < 0) startDow = 6

  const weeks: DayInfo[][] = []
  let currentWeek: DayInfo[] = []

  // Fill leading days from previous month
  if (startDow > 0) {
    const prevMonth = month === 1 ? 12 : month - 1
    const prevYear = month === 1 ? year - 1 : year
    const daysInPrevMonth = new Date(prevYear, prevMonth, 0).getDate()

    for (let i = startDow - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i
      const dateStr = formatDateStr(prevYear, prevMonth, day)
      const dow = new Date(prevYear, prevMonth - 1, day).getDay()
      currentWeek.push({
        date: dateStr,
        dayNumber: day,
        isWeekend: dow === 0 || dow === 6,
        isHoliday: holidays.has(dateStr),
        isAdjacentMonth: true,
        status: 'home-office'
      })
    }
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = formatDateStr(year, month, day)
    const dow = new Date(year, month - 1, day).getDay()
    const isWeekend = dow === 0 || dow === 6
    const isHoliday = holidays.has(dateStr)
    const status: DayStatus = dayStatuses[dateStr] || 'home-office'

    currentWeek.push({
      date: dateStr,
      dayNumber: day,
      isWeekend,
      isHoliday,
      isAdjacentMonth: false,
      status
    })

    if (currentWeek.length === 7) {
      weeks.push(currentWeek)
      currentWeek = []
    }
  }

  // Fill trailing days from next month
  if (currentWeek.length > 0) {
    const nextMonth = month === 12 ? 1 : month + 1
    const nextYear = month === 12 ? year + 1 : year
    let day = 1
    while (currentWeek.length < 7) {
      const dateStr = formatDateStr(nextYear, nextMonth, day)
      const dow = new Date(nextYear, nextMonth - 1, day).getDay()
      currentWeek.push({
        date: dateStr,
        dayNumber: day,
        isWeekend: dow === 0 || dow === 6,
        isHoliday: holidays.has(dateStr),
        isAdjacentMonth: true,
        status: 'home-office'
      })
      day++
    }
    weeks.push(currentWeek)
  }

  return weeks
}

function CalendarView({ year, month, dayStatuses, holidays, onPrevMonth, onNextMonth, onStatusChange }: CalendarViewProps): JSX.Element {
  const weeks = buildCalendarGrid(year, month, dayStatuses, holidays)

  return (
    <div className="calendar-card">
      <MonthNavigator year={year} month={month} onPrevMonth={onPrevMonth} onNextMonth={onNextMonth} />
      <StatusLegend />
      <div className="calendar-grid">
        <div className="day-headers">
          {DAY_HEADERS.map(day => (
            <div key={day} className="day-header">{day}</div>
          ))}
        </div>
        {weeks.map((week) => (
          <div key={week[0].date} className="calendar-week">
            {week.map(day => (
              <DayCell
                key={day.date}
                date={day.date}
                dayNumber={day.dayNumber}
                status={day.status}
                isWeekend={day.isWeekend}
                isHoliday={day.isHoliday}
                isAdjacentMonth={day.isAdjacentMonth}
                onStatusChange={onStatusChange}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export default CalendarView
