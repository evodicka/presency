import type { DayStatus } from './types'

interface Window {
  presenceAPI: {
    loadData(): Promise<Record<string, DayStatus>>
    saveData(data: Record<string, DayStatus>): Promise<void>
    getVersion(): Promise<string>
  }
}
