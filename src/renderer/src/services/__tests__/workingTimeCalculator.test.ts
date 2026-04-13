import { describe, it, expect } from 'vitest'
import { calculateMonthStats } from '../workingTimeCalculator'
import type { DayStatus } from '../../types'

describe('calculateMonthStats', () => {
  // REQ-003 AC1: 22 weekdays, 0 holidays, 0 absences = 176 hours
  it('calculates total working days for a month with no holidays or absences', () => {
    // July 2026: 23 weekdays, 0 Bavarian holidays on weekdays
    // Let's use a simpler example: we pass an empty holidays set
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
    const statuses: Record<string, DayStatus> = {
      '2026-01-05': 'absent',
      '2026-01-06': 'absent'
    }
    const stats = calculateMonthStats(2026, 1, statuses, holidays)
    // 22 weekdays - 1 holiday = 21 total working days
    // 2 absent days -> 19 effective working days
    expect(stats.totalWorkingDays).toBe(21)
    expect(stats.totalWorkingHours).toBe(152) // (22 - 1 - 2) * 8 = 19 * 8
    expect(stats.absentDays).toBe(2)
    expect(stats.homeOfficeDays).toBe(19)
  })

  // REQ-003 AC3: on-site percentage calculation
  it('calculates on-site percentage correctly', () => {
    // Create a month where we set 10 on-site, rest home-office
    // April 2026: has holidays, but use empty set for simplicity
    // Use a month with 19 weekdays and no holidays
    // February 2026: 20 weekdays. Let's set 10 on-site, 9 home-office, 1 absent
    const statuses: Record<string, DayStatus> = {
      '2026-02-02': 'on-site',
      '2026-02-03': 'on-site',
      '2026-02-04': 'on-site',
      '2026-02-05': 'on-site',
      '2026-02-06': 'on-site',
      '2026-02-09': 'on-site',
      '2026-02-10': 'on-site',
      '2026-02-11': 'on-site',
      '2026-02-12': 'on-site',
      '2026-02-13': 'on-site',
      '2026-02-16': 'absent'
    }
    const stats = calculateMonthStats(2026, 2, statuses, new Set())
    expect(stats.onSiteDays).toBe(10)
    expect(stats.homeOfficeDays).toBe(9)
    expect(stats.absentDays).toBe(1)
    // 10 / (10 + 9) * 100 = 52.63...
    expect(stats.onSitePercentage).toBeCloseTo(52.6, 1)
  })

  // REQ-003 AC5: all absent = 0%, no division by zero
  it('returns 0% when all working days are absent', () => {
    // Use a tiny month setup — February 2026 has 20 weekdays
    // Mark all as absent
    const statuses: Record<string, DayStatus> = {}
    const feb2026weekdays: string[] = []
    for (let d = 1; d <= 28; d++) {
      const date = new Date(2026, 1, d)
      if (date.getDay() !== 0 && date.getDay() !== 6) {
        const key = `2026-02-${String(d).padStart(2, '0')}`
        statuses[key] = 'absent'
        feb2026weekdays.push(key)
      }
    }
    const stats = calculateMonthStats(2026, 2, statuses, new Set())
    expect(stats.onSitePercentage).toBe(0)
    expect(stats.homeOfficePercentage).toBe(0)
  })

  // REQ-003 AC6: absent days excluded from percentage denominator
  it('excludes absent days from the percentage denominator', () => {
    // 5 on-site, 10 home-office, 4 absent in a month with 19 non-holiday weekdays
    // Use March 2026: 22 weekdays, no holidays (empty set)
    // We need exactly 19 working days, so use a month with 19 weekdays or
    // just set 5 on-site + 10 home-office + 4 absent = 19 days accounted for
    // March 2026 has 22 weekdays — set 5 on-site, 4 absent, rest home-office
    const statuses: Record<string, DayStatus> = {
      '2026-03-02': 'on-site',
      '2026-03-03': 'on-site',
      '2026-03-04': 'on-site',
      '2026-03-05': 'on-site',
      '2026-03-06': 'on-site',
      '2026-03-09': 'absent',
      '2026-03-10': 'absent',
      '2026-03-11': 'absent',
      '2026-03-12': 'absent'
    }
    const stats = calculateMonthStats(2026, 3, statuses, new Set())
    expect(stats.onSiteDays).toBe(5)
    expect(stats.absentDays).toBe(4)
    expect(stats.homeOfficeDays).toBe(13) // 22 - 5 - 4
    // Percentage: 5 / (5 + 13) * 100 = 27.78%
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
    // If a holiday falls on a weekend, total working days should not change
    // Jan 2027: Jan 1 is Friday... let's just create a synthetic case
    // Use a set with a Saturday holiday
    const holidays = new Set(['2026-01-03']) // Jan 3, 2026 is Saturday
    const stats = calculateMonthStats(2026, 1, {}, holidays)
    expect(stats.totalWorkingDays).toBe(22) // Still 22, holiday was on weekend
  })

  it('treats days not in dayStatuses as home-office (sparse model)', () => {
    const stats = calculateMonthStats(2026, 1, {}, new Set())
    expect(stats.homeOfficeDays).toBe(22) // All default to home-office
    expect(stats.onSiteDays).toBe(0)
    expect(stats.absentDays).toBe(0)
  })
})
