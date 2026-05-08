import { useState, useEffect, useMemo, useCallback } from 'react'
import type { DayStatus, MonthStats } from './types'
import { getBavarianHolidays } from './services/holidayService'
import { calculateMonthStats } from './services/workingTimeCalculator'
import { nextStatus } from './services/statusCycler'
import CalendarView from './components/CalendarView'
import MonthlyOverviewPanel from './components/MonthlyOverviewPanel'
import './App.css'

const VALID_STATUSES = new Set<string>(['home-office', 'on-site', 'absent'])

function App(): JSX.Element {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() + 1 }
  })
  const [dayStatuses, setDayStatuses] = useState<Record<string, DayStatus>>({})
  const [loaded, setLoaded] = useState(false)

  // Load persisted data on mount
  useEffect(() => {
    window.presenceAPI.loadData().then((data) => {
      const validated: Record<string, DayStatus> = {}
      for (const [date, value] of Object.entries(data)) {
        if (VALID_STATUSES.has(value)) {
          validated[date] = value as DayStatus
        }
      }
      setDayStatuses(validated)
      setLoaded(true)
    }).catch((err) => {
      console.error('Failed to load data:', err)
      setLoaded(true)
    })
  }, [])

  // Compute holidays for the current year (memoized, recomputes only when year changes)
  const holidays = useMemo(
    () => getBavarianHolidays(currentMonth.year),
    [currentMonth.year]
  )

  // Compute month stats
  const stats: MonthStats = useMemo(
    () => calculateMonthStats(currentMonth.year, currentMonth.month, dayStatuses, holidays),
    [currentMonth.year, currentMonth.month, dayStatuses, holidays]
  )

  const handlePrevMonth = useCallback(() => {
    setCurrentMonth(prev => {
      if (prev.month === 1) return { year: prev.year - 1, month: 12 }
      return { year: prev.year, month: prev.month - 1 }
    })
  }, [])

  const handleNextMonth = useCallback(() => {
    setCurrentMonth(prev => {
      if (prev.month === 12) return { year: prev.year + 1, month: 1 }
      return { year: prev.year, month: prev.month + 1 }
    })
  }, [])

  const handleStatusChange = useCallback((date: string) => {
    setDayStatuses(prev => {
      const currentStatus: DayStatus = prev[date] || 'home-office'
      const newStatus = nextStatus(currentStatus)

      const updated = { ...prev }
      if (newStatus === 'home-office') {
        delete updated[date]
      } else {
        updated[date] = newStatus
      }

      // Persist asynchronously
      window.presenceAPI.saveData(updated).catch((err) => {
        console.error('Failed to persist data:', err)
      })

      return updated
    })
  }, [])

  if (!loaded) {
    return <div className="app-loading">Loading...</div>
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">Presency</h1>
        <p className="app-subtitle">Hybrid Work Planner</p>
      </header>
      <main className="app-main">
        <CalendarView
          year={currentMonth.year}
          month={currentMonth.month}
          dayStatuses={dayStatuses}
          holidays={holidays}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
          onStatusChange={handleStatusChange}
        />
        <MonthlyOverviewPanel stats={stats} />
      </main>
    </div>
  )
}

export default App
