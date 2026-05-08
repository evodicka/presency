import type { DayStatus, MonthStats } from '../types'

export const GOAL_THRESHOLD_PERCENT = 40
export const HOURS_PER_WORKING_DAY = 8

export function calculateMonthStats(
  year: number,
  month: number, // 1-indexed: 1 = January
  dayStatuses: Record<string, DayStatus>,
  holidays: Set<string>
): MonthStats {
  const daysInMonth = new Date(year, month, 0).getDate()

  let totalWorkingDays = 0
  let onSiteDays = 0
  let homeOfficeDays = 0
  let absentDays = 0

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day)
    const dayOfWeek = date.getDay()
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`

    // Skip weekends
    if (dayOfWeek === 0 || dayOfWeek === 6) continue

    // Skip holidays
    if (holidays.has(dateStr)) continue

    totalWorkingDays++

    const status: DayStatus = dayStatuses[dateStr] || 'home-office'

    switch (status) {
      case 'on-site':
        onSiteDays++
        break
      case 'absent':
        absentDays++
        break
      case 'home-office':
        homeOfficeDays++
        break
    }
  }

  const effectiveDays = onSiteDays + homeOfficeDays
  const onSitePercentage = effectiveDays > 0 ? (onSiteDays / effectiveDays) * 100 : 0
  const homeOfficePercentage = effectiveDays > 0 ? (homeOfficeDays / effectiveDays) * 100 : 0

  const onSiteHours = onSiteDays * HOURS_PER_WORKING_DAY
  const targetOnSiteHours =
    (GOAL_THRESHOLD_PERCENT / 100) * effectiveDays * HOURS_PER_WORKING_DAY
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
