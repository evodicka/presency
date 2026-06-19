export type DayStatus = 'home-office' | 'on-site' | 'absent'

export interface DayEntry {
  status: DayStatus
  hours: number
}

export interface MonthStats {
  totalWorkingDays: number
  totalWorkingHours: number
  onSiteDays: number
  homeOfficeDays: number
  absentDays: number
  onSitePercentage: number
  homeOfficePercentage: number
  onSiteHours: number
  targetOnSiteHours: number
  hoursToGoal: number
}
