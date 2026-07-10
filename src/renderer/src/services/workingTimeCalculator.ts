import type { DayEntry, MonthStats } from '../types'

export const GOAL_THRESHOLD_PERCENT = 40
export const HOURS_PER_WORKING_DAY = 8

export function calculateMonthStats(
  year: number,
  month: number, // 1-indexed: 1 = January
  dayEntries: Record<string, DayEntry>,
  holidays: Set<string>
): MonthStats {
  const daysInMonth = new Date(year, month, 0).getDate()

  let totalWorkingDays = 0
  let onSiteDays = 0
  let homeOfficeDays = 0
  let absentDays = 0
  let onSiteHours = 0

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day)
    const dayOfWeek = date.getDay()
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`

    // Skip weekends
    if (dayOfWeek === 0 || dayOfWeek === 6) continue

    // Skip holidays
    if (holidays.has(dateStr)) continue

    totalWorkingDays++

    const entry = dayEntries[dateStr]
    const status = entry?.status ?? 'home-office'

    switch (status) {
      case 'on-site':
        onSiteDays++
        onSiteHours += entry?.hours ?? HOURS_PER_WORKING_DAY
        break
      case 'absent':
        absentDays++
        break
      case 'home-office':
        homeOfficeDays++
        break
    }
  }

  // Fixed baseline of expected hours: 40% goal and percentage are both computed
  // against this, so the target never moves when a day's actual hours are edited.
  const baselineHours = (totalWorkingDays - absentDays) * HOURS_PER_WORKING_DAY
  const homeOfficeHours = homeOfficeDays * HOURS_PER_WORKING_DAY
  const onSitePercentage = baselineHours > 0 ? (onSiteHours / baselineHours) * 100 : 0
  const homeOfficePercentage = baselineHours > 0 ? (homeOfficeHours / baselineHours) * 100 : 0

  const targetOnSiteHours = (GOAL_THRESHOLD_PERCENT / 100) * baselineHours
  const hoursToGoal = Math.max(0, targetOnSiteHours - onSiteHours)

  return {
    totalWorkingDays,
    totalWorkingHours: totalWorkingDays * HOURS_PER_WORKING_DAY,
    onSiteDays,
    homeOfficeDays,
    absentDays,
    onSitePercentage,
    homeOfficePercentage,
    onSiteHours,
    targetOnSiteHours,
    hoursToGoal
  }
}
