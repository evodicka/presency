import { describe, it, expect } from 'vitest'
import { computeEaster, getBavarianHolidays } from '../holidayService'

describe('computeEaster', () => {
  it('returns correct Easter Sunday for 2024', () => {
    const easter = computeEaster(2024)
    expect(easter).toEqual(new Date(2024, 2, 31)) // March 31
  })

  it('returns correct Easter Sunday for 2025', () => {
    const easter = computeEaster(2025)
    expect(easter).toEqual(new Date(2025, 3, 20)) // April 20
  })

  it('returns correct Easter Sunday for 2026', () => {
    const easter = computeEaster(2026)
    expect(easter).toEqual(new Date(2026, 3, 5)) // April 5
  })

  it('returns correct Easter Sunday for 2027', () => {
    const easter = computeEaster(2027)
    expect(easter).toEqual(new Date(2027, 2, 28)) // March 28
  })
})

describe('getBavarianHolidays', () => {
  it('returns exactly 13 holidays for any year', () => {
    expect(getBavarianHolidays(2024).size).toBe(13)
    expect(getBavarianHolidays(2025).size).toBe(13)
    expect(getBavarianHolidays(2026).size).toBe(13)
  })

  it('contains all fixed-date holidays for 2026', () => {
    const holidays = getBavarianHolidays(2026)
    expect(holidays.has('2026-01-01')).toBe(true) // New Year
    expect(holidays.has('2026-01-06')).toBe(true) // Epiphany
    expect(holidays.has('2026-05-01')).toBe(true) // Labour Day
    expect(holidays.has('2026-08-15')).toBe(true) // Assumption
    expect(holidays.has('2026-10-03')).toBe(true) // German Unity
    expect(holidays.has('2026-11-01')).toBe(true) // All Saints
    expect(holidays.has('2026-12-25')).toBe(true) // Christmas
    expect(holidays.has('2026-12-26')).toBe(true) // St Stephen
  })

  it('contains all moveable holidays for 2026 (Easter = April 5)', () => {
    const holidays = getBavarianHolidays(2026)
    expect(holidays.has('2026-04-03')).toBe(true) // Good Friday (Easter -2)
    expect(holidays.has('2026-04-06')).toBe(true) // Easter Monday (Easter +1)
    expect(holidays.has('2026-05-14')).toBe(true) // Ascension (Easter +39)
    expect(holidays.has('2026-05-25')).toBe(true) // Whit Monday (Easter +50)
    expect(holidays.has('2026-06-04')).toBe(true) // Corpus Christi (Easter +60)
  })

  it('computes moveable holidays correctly for 2025 (Easter = April 20)', () => {
    const holidays = getBavarianHolidays(2025)
    expect(holidays.has('2025-04-18')).toBe(true) // Good Friday
    expect(holidays.has('2025-04-21')).toBe(true) // Easter Monday
    expect(holidays.has('2025-05-29')).toBe(true) // Ascension
    expect(holidays.has('2025-06-09')).toBe(true) // Whit Monday
    expect(holidays.has('2025-06-19')).toBe(true) // Corpus Christi
  })

  it('returns YYYY-MM-DD formatted strings', () => {
    const holidays = getBavarianHolidays(2026)
    for (const date of holidays) {
      expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })
})
