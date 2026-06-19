import { useState, useEffect, useMemo, useCallback } from 'react'
import type { DayStatus, DayEntry } from './types'
import { getBavarianHolidays } from './services/holidayService'
import { calculateMonthStats } from './services/workingTimeCalculator'
import { nextStatus } from './services/statusCycler'
import CalendarView from './components/CalendarView'
import MonthlyOverviewPanel from './components/MonthlyOverviewPanel'
import './App.css'

const VALID_STATUSES = new Set<string>(['home-office', 'on-site', 'absent'])
const HOURS_STEP = 0.25

type PersistedEntry = DayStatus | { status: DayStatus; hours: number }

function parseEntry(raw: unknown): DayEntry | null {
  if (typeof raw === 'string') {
    if (!VALID_STATUSES.has(raw)) return null
    return { status: raw as DayStatus, hours: 8 }
  }
  if (typeof raw === 'object' && raw !== null) {
    const obj = raw as Record<string, unknown>
    if (typeof obj.status !== 'string' || !VALID_STATUSES.has(obj.status)) return null
    if (typeof obj.hours !== 'number' || !isFinite(obj.hours)) return null
    return { status: obj.status as DayStatus, hours: obj.hours }
  }
  return null
}

function toPersistedEntry(entry: DayEntry): PersistedEntry {
  if (entry.status === 'on-site' && entry.hours !== 8) {
    return { status: 'on-site', hours: entry.hours }
  }
  return entry.status
}

function buildSavePayload(entries: Record<string, DayEntry>): Record<string, PersistedEntry> {
  const out: Record<string, PersistedEntry> = {}
  for (const [date, entry] of Object.entries(entries)) {
    out[date] = toPersistedEntry(entry)
  }
  return out
}

function App(): JSX.Element {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() + 1 }
  })
  const [dayEntries, setDayEntries] = useState<Record<string, DayEntry>>({})
  const [loaded, setLoaded] = useState(false)
  const [version, setVersion] = useState('')

  // Load persisted data on mount
  useEffect(() => {
    window.presenceAPI.loadData().then((data) => {
      const validated: Record<string, DayEntry> = {}
      for (const [date, raw] of Object.entries(data)) {
        const entry = parseEntry(raw)
        if (entry && entry.status !== 'home-office') {
          validated[date] = entry
        }
      }
      setDayEntries(validated)
      setLoaded(true)
    }).catch((err) => {
      console.error('Failed to load data:', err)
      setLoaded(true)
    })
  }, [])

  useEffect(() => {
    window.presenceAPI.getVersion().then(setVersion).catch((err) => {
      console.error('Failed to load version:', err)
    })
  }, [])

  // Compute holidays for the current year (memoized, recomputes only when year changes)
  const holidays = useMemo(
    () => getBavarianHolidays(currentMonth.year),
    [currentMonth.year]
  )

  // Compute month stats
  const stats = useMemo(
    () => calculateMonthStats(currentMonth.year, currentMonth.month, dayEntries, holidays),
    [currentMonth.year, currentMonth.month, dayEntries, holidays]
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
    setDayEntries(prev => {
      const currentEntry = prev[date]
      const currentStatus: DayStatus = currentEntry?.status ?? 'home-office'
      const newStatus = nextStatus(currentStatus)

      const updated = { ...prev }
      if (newStatus === 'home-office') {
        delete updated[date]
      } else {
        // Cycling resets hours to the default of 8
        updated[date] = { status: newStatus, hours: 8 }
      }

      window.presenceAPI.saveData(buildSavePayload(updated)).catch((err) => {
        console.error('Failed to persist data:', err)
      })

      return updated
    })
  }, [])

  const handleAdjustHours = useCallback((date: string, delta: number) => {
    setDayEntries(prev => {
      const entry = prev[date]
      if (!entry || entry.status !== 'on-site') return prev

      const rawHours = entry.hours + delta
      // Round to nearest 0.25 and clamp to [0, 24]
      const hours = Math.min(24, Math.max(0, Math.round(rawHours / HOURS_STEP) * HOURS_STEP))

      const updated = { ...prev, [date]: { ...entry, hours } }

      window.presenceAPI.saveData(buildSavePayload(updated)).catch((err) => {
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
          dayEntries={dayEntries}
          holidays={holidays}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
          onStatusChange={handleStatusChange}
          onAdjustHours={handleAdjustHours}
        />
        <MonthlyOverviewPanel stats={stats} />
      </main>
      {version && <footer className="app-footer">v{version}</footer>}
    </div>
  )
}

export default App
