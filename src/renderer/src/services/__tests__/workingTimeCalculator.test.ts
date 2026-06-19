import { describe, it, expect } from 'vitest'
import { calculateMonthStats } from '../workingTimeCalculator'
import type { DayEntry } from '../../types'

function entry(status: 'on-site' | 'absent', hours = 8): DayEntry {
  return { status, hours }
}

describe('calculateMonthStats', () => {
  // REQ-003 AC1: 22 weekdays, 0 holidays, 0 absences = 176 hours
  it('calculates total working days for a month with no holidays or absences', () => {
    // January 2026 has 22 weekdays (starts Thursday)
    const stats = calculateMonthStats(2026, 1, {}, new Set())
    expect(stats.totalWorkingDays).toBe(22)
    expect(stats.totalWorkingHours).toBe(176) // 22 * 8
    expect(stats.homeOfficeDays).toBe(22)
    expect(stats.onSiteDays).toBe(0)
    expect(stats.absentDays).toBe(0)
  })

  // REQ-003 AC2: holidays and absences reduce working time
  it('excludes holidays and absences from total working time', () => {
    // January 2026: 22 weekdays
    // 1 holiday (Jan 1 is a Thursday = weekday), 2 absences
    const holidays = new Set(['2026-01-01'])
    const entries: Record<string, DayEntry> = {
      '2026-01-05': entry('absent'),
      '2026-01-06': entry('absent')
    }
    const stats = calculateMonthStats(2026, 1, entries, holidays)
    // 22 weekdays - 1 holiday = 21 total working days
    // 2 absent days -> 19 effective working days
    expect(stats.totalWorkingDays).toBe(21)
    expect(stats.totalWorkingHours).toBe(168) // (22 - 1) * 8 = 21 * 8
    expect(stats.absentDays).toBe(2)
    expect(stats.homeOfficeDays).toBe(19)
  })

  // REQ-003 AC3: on-site percentage calculation (hours-based)
  it('calculates on-site percentage correctly', () => {
    // February 2026: 20 weekdays. 10 on-site, 9 home-office, 1 absent
    const entries: Record<string, DayEntry> = {
      '2026-02-02': entry('on-site'),
      '2026-02-03': entry('on-site'),
      '2026-02-04': entry('on-site'),
      '2026-02-05': entry('on-site'),
      '2026-02-06': entry('on-site'),
      '2026-02-09': entry('on-site'),
      '2026-02-10': entry('on-site'),
      '2026-02-11': entry('on-site'),
      '2026-02-12': entry('on-site'),
      '2026-02-13': entry('on-site'),
      '2026-02-16': entry('absent')
    }
    const stats = calculateMonthStats(2026, 2, entries, new Set())
    expect(stats.onSiteDays).toBe(10)
    expect(stats.homeOfficeDays).toBe(9)
    expect(stats.absentDays).toBe(1)
    // hours-based: (10*8) / (10*8 + 9*8) * 100 = 80 / 152 * 100 = 52.63...
    expect(stats.onSitePercentage).toBeCloseTo(52.6, 1)
  })

  // REQ-003 AC5: all absent = 0%, no division by zero
  it('returns 0% when all working days are absent', () => {
    const entries: Record<string, DayEntry> = {}
    for (let d = 1; d <= 28; d++) {
      const date = new Date(2026, 1, d)
      if (date.getDay() !== 0 && date.getDay() !== 6) {
        const key = `2026-02-${String(d).padStart(2, '0')}`
        entries[key] = entry('absent')
      }
    }
    const stats = calculateMonthStats(2026, 2, entries, new Set())
    expect(stats.onSitePercentage).toBe(0)
    expect(stats.homeOfficePercentage).toBe(0)
  })

  // REQ-003 AC6: absent days excluded from percentage denominator
  it('excludes absent days from the percentage denominator', () => {
    // March 2026 has 22 weekdays — set 5 on-site, 4 absent, rest home-office
    const entries: Record<string, DayEntry> = {
      '2026-03-02': entry('on-site'),
      '2026-03-03': entry('on-site'),
      '2026-03-04': entry('on-site'),
      '2026-03-05': entry('on-site'),
      '2026-03-06': entry('on-site'),
      '2026-03-09': entry('absent'),
      '2026-03-10': entry('absent'),
      '2026-03-11': entry('absent'),
      '2026-03-12': entry('absent')
    }
    const stats = calculateMonthStats(2026, 3, entries, new Set())
    expect(stats.onSiteDays).toBe(5)
    expect(stats.absentDays).toBe(4)
    expect(stats.homeOfficeDays).toBe(13) // 22 - 5 - 4
    // hours-based: (5*8) / (5*8 + 13*8) * 100 = 40 / 144 * 100 ≈ 27.78%
    expect(stats.onSitePercentage).toBeCloseTo(27.8, 1)
  })

  it('handles holidays correctly in calculations', () => {
    // April 2026: 22 weekdays
    // Good Friday Apr 3 is a Friday (weekday holiday)
    // Easter Monday Apr 6 is a Monday (weekday holiday)
    const holidays = new Set(['2026-04-03', '2026-04-06'])
    const stats = calculateMonthStats(2026, 4, {}, holidays)
    expect(stats.totalWorkingDays).toBe(20) // 22 - 2 holidays
    expect(stats.homeOfficeDays).toBe(20)
  })

  it('does not count weekend holidays as reducing working days', () => {
    const holidays = new Set(['2026-01-03']) // Jan 3, 2026 is Saturday
    const stats = calculateMonthStats(2026, 1, {}, holidays)
    expect(stats.totalWorkingDays).toBe(22) // Still 22, holiday was on weekend
  })

  it('treats days not in dayEntries as home-office (sparse model)', () => {
    const stats = calculateMonthStats(2026, 1, {}, new Set())
    expect(stats.homeOfficeDays).toBe(22) // All default to home-office
    expect(stats.onSiteDays).toBe(0)
    expect(stats.absentDays).toBe(0)
  })

  // Hours-to-goal: 30% on 10 effective days → target 32h, hoursToGoal 8h
  it('reports onSiteHours, targetOnSiteHours, and hoursToGoal when below the goal', () => {
    // February 2026: 20 weekdays. 3 on-site, 10 absent → 7 home-office, 10 effective.
    const entries: Record<string, DayEntry> = {
      '2026-02-02': entry('on-site'),
      '2026-02-03': entry('on-site'),
      '2026-02-04': entry('on-site'),
      '2026-02-05': entry('absent'),
      '2026-02-06': entry('absent'),
      '2026-02-09': entry('absent'),
      '2026-02-10': entry('absent'),
      '2026-02-11': entry('absent'),
      '2026-02-12': entry('absent'),
      '2026-02-13': entry('absent'),
      '2026-02-16': entry('absent'),
      '2026-02-17': entry('absent'),
      '2026-02-18': entry('absent')
    }
    const stats = calculateMonthStats(2026, 2, entries, new Set())
    expect(stats.onSiteDays).toBe(3)
    expect(stats.homeOfficeDays).toBe(7)
    expect(stats.absentDays).toBe(10)
    expect(stats.onSitePercentage).toBe(30) // 24 / (24+56) * 100 = 30
    expect(stats.onSiteHours).toBe(24) // 3 * 8
    expect(stats.targetOnSiteHours).toBe(32) // 0.4 * 80 = 32
    expect(stats.hoursToGoal).toBe(8)
  })

  it('reports a fractional target when 40% does not land on a whole day', () => {
    // February 2026: 2 on-site, 13 absent → 5 home-office, 7 effective.
    // effectiveHours = 2*8 + 5*8 = 56. target = 0.4 * 56 = 22.4h. current: 16h. hoursToGoal: 6.4h.
    const entries: Record<string, DayEntry> = {
      '2026-02-02': entry('on-site'),
      '2026-02-03': entry('on-site'),
      '2026-02-04': entry('absent'),
      '2026-02-05': entry('absent'),
      '2026-02-06': entry('absent'),
      '2026-02-09': entry('absent'),
      '2026-02-10': entry('absent'),
      '2026-02-11': entry('absent'),
      '2026-02-12': entry('absent'),
      '2026-02-13': entry('absent'),
      '2026-02-16': entry('absent'),
      '2026-02-17': entry('absent'),
      '2026-02-18': entry('absent'),
      '2026-02-19': entry('absent'),
      '2026-02-20': entry('absent')
    }
    const stats = calculateMonthStats(2026, 2, entries, new Set())
    expect(stats.onSiteDays).toBe(2)
    expect(stats.homeOfficeDays).toBe(5)
    expect(stats.absentDays).toBe(13)
    expect(stats.onSiteHours).toBe(16)
    expect(stats.targetOnSiteHours).toBeCloseTo(22.4, 5)
    expect(stats.hoursToGoal).toBeCloseTo(6.4, 5)
  })

  it('clamps hoursToGoal to 0 once the goal is exceeded', () => {
    // 10 on-site, 9 home-office, 1 absent → 19 effective.
    // effectiveHours = 19*8 = 152. target = 0.4*152 = 60.8h. onSiteHours = 80h. hoursToGoal: 0.
    const entries: Record<string, DayEntry> = {
      '2026-02-02': entry('on-site'),
      '2026-02-03': entry('on-site'),
      '2026-02-04': entry('on-site'),
      '2026-02-05': entry('on-site'),
      '2026-02-06': entry('on-site'),
      '2026-02-09': entry('on-site'),
      '2026-02-10': entry('on-site'),
      '2026-02-11': entry('on-site'),
      '2026-02-12': entry('on-site'),
      '2026-02-13': entry('on-site'),
      '2026-02-16': entry('absent')
    }
    const stats = calculateMonthStats(2026, 2, entries, new Set())
    expect(stats.onSiteHours).toBe(80)
    expect(stats.targetOnSiteHours).toBeCloseTo(60.8, 5)
    expect(stats.hoursToGoal).toBe(0)
  })

  it('reports a 44.8h target for 14 effective days (112 working hours)', () => {
    // March 2026: 22 weekdays, no holidays. 8 weekdays absent → 14 effective.
    // effectiveHours = 14*8 = 112. target = 0.4*112 = 44.8h.
    const entries: Record<string, DayEntry> = {
      '2026-03-02': entry('absent'),
      '2026-03-03': entry('absent'),
      '2026-03-04': entry('absent'),
      '2026-03-05': entry('absent'),
      '2026-03-06': entry('absent'),
      '2026-03-09': entry('absent'),
      '2026-03-10': entry('absent'),
      '2026-03-11': entry('absent')
    }
    const stats = calculateMonthStats(2026, 3, entries, new Set())
    const effectiveDays = stats.onSiteDays + stats.homeOfficeDays
    expect(effectiveDays).toBe(14)
    expect(stats.targetOnSiteHours).toBeCloseTo(44.8, 5)
  })

  it('returns zero hour fields when there are no effective days', () => {
    // All weekdays of February 2026 marked absent → effectiveHours = 0.
    const entries: Record<string, DayEntry> = {}
    for (let d = 1; d <= 28; d++) {
      const date = new Date(2026, 1, d)
      if (date.getDay() !== 0 && date.getDay() !== 6) {
        entries[`2026-02-${String(d).padStart(2, '0')}`] = entry('absent')
      }
    }
    const stats = calculateMonthStats(2026, 2, entries, new Set())
    expect(stats.onSiteHours).toBe(0)
    expect(stats.targetOnSiteHours).toBe(0)
    expect(stats.hoursToGoal).toBe(0)
  })

  // --- New tests for per-day custom hours ---

  it('uses actual on-site hours instead of 8 when a custom value is set', () => {
    // February 2026: 1 on-site day at 6h, 19 home-office → effectiveHours = 6 + 19*8 = 158
    const entries: Record<string, DayEntry> = {
      '2026-02-02': { status: 'on-site', hours: 6 }
    }
    const stats = calculateMonthStats(2026, 2, entries, new Set())
    expect(stats.onSiteHours).toBe(6)
    expect(stats.onSiteDays).toBe(1)
    // percentage: 6 / (6 + 19*8) * 100 = 6/158 * 100 ≈ 3.797%
    expect(stats.onSitePercentage).toBeCloseTo((6 / 158) * 100, 4)
  })

  it('handles a 0-hour on-site day without division errors', () => {
    // February 2026: 1 on-site day at 0h, 19 home-office → effectiveHours = 0 + 152 = 152
    const entries: Record<string, DayEntry> = {
      '2026-02-02': { status: 'on-site', hours: 0 }
    }
    const stats = calculateMonthStats(2026, 2, entries, new Set())
    expect(stats.onSiteHours).toBe(0)
    expect(stats.onSiteDays).toBe(1)
    expect(stats.onSitePercentage).toBe(0)
    // hoursToGoal: 0.4 * 152 = 60.8h
    expect(stats.targetOnSiteHours).toBeCloseTo(60.8, 5)
    expect(stats.hoursToGoal).toBeCloseTo(60.8, 5)
  })

  it('computes hours-based percentage correctly with mixed custom-hours on-site days', () => {
    // February 2026: 1 day at 6h, 1 day at 10h, rest home-office
    // onSiteHours = 16, homeOfficeHours = 18*8 = 144, effectiveHours = 160
    const entries: Record<string, DayEntry> = {
      '2026-02-02': { status: 'on-site', hours: 6 },
      '2026-02-03': { status: 'on-site', hours: 10 }
    }
    const stats = calculateMonthStats(2026, 2, entries, new Set())
    expect(stats.onSiteHours).toBe(16)
    expect(stats.onSiteDays).toBe(2)
    expect(stats.onSitePercentage).toBeCloseTo((16 / 160) * 100, 4)
    expect(stats.targetOnSiteHours).toBeCloseTo(0.4 * 160, 5)
    expect(stats.hoursToGoal).toBeCloseTo(0.4 * 160 - 16, 5)
  })
})
