import type { DayStatus } from '../types'

const cycle: Record<DayStatus, DayStatus> = {
  'home-office': 'on-site',
  'on-site': 'absent',
  'absent': 'home-office'
}

export function nextStatus(current: DayStatus): DayStatus {
  return cycle[current]
}
