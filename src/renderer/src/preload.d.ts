import type { DayStatus } from './types'

type PersistedEntry = DayStatus | { status: DayStatus; hours: number }

interface Window {
  presenceAPI: {
    loadData(): Promise<Record<string, unknown>>
    saveData(data: Record<string, PersistedEntry>): Promise<void>
    getVersion(): Promise<string>
  }
}
