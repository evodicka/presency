// month is 0-indexed (same convention as the JS Date constructor: 0 = January, 11 = December).
// formatDate adds 1 internally before formatting to produce the ISO YYYY-MM-DD string.
function formatDate(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

/**
 * Computes Easter Sunday for a given year using the Anonymous Gregorian Computus algorithm.
 */
export function computeEaster(year: number): Date {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(year, month - 1, day)
}

export function getBavarianHolidays(year: number): Set<string> {
  const easter = computeEaster(year)
  const holidays = new Set<string>()

  // Fixed holidays — month arguments are 0-indexed (Jan=0 … Dec=11)
  holidays.add(formatDate(year, 0, 1))   // Jan  1  — New Year's Day
  holidays.add(formatDate(year, 0, 6))   // Jan  6  — Epiphany
  holidays.add(formatDate(year, 4, 1))   // May  1  — Labour Day
  holidays.add(formatDate(year, 7, 15))  // Aug 15  — Assumption of Mary
  holidays.add(formatDate(year, 9, 3))   // Oct  3  — German Unity Day
  holidays.add(formatDate(year, 10, 1))  // Nov  1  — All Saints' Day
  holidays.add(formatDate(year, 11, 25)) // Dec 25  — Christmas Day
  holidays.add(formatDate(year, 11, 26)) // Dec 26  — St. Stephen's Day

  // Moveable holidays (offsets from Easter Sunday)
  const goodFriday = addDays(easter, -2)
  const easterMonday = addDays(easter, 1)
  const ascension = addDays(easter, 39)
  const whitMonday = addDays(easter, 50)
  const corpusChristi = addDays(easter, 60)

  holidays.add(formatDate(goodFriday.getFullYear(), goodFriday.getMonth(), goodFriday.getDate()))
  holidays.add(formatDate(easterMonday.getFullYear(), easterMonday.getMonth(), easterMonday.getDate()))
  holidays.add(formatDate(ascension.getFullYear(), ascension.getMonth(), ascension.getDate()))
  holidays.add(formatDate(whitMonday.getFullYear(), whitMonday.getMonth(), whitMonday.getDate()))
  holidays.add(formatDate(corpusChristi.getFullYear(), corpusChristi.getMonth(), corpusChristi.getDate()))

  return holidays
}
