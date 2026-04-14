import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, waitFor, fireEvent, cleanup } from '@testing-library/react'
import App from '../App'

type PresenceAPI = {
  loadData: ReturnType<typeof vi.fn>
  saveData: ReturnType<typeof vi.fn>
}

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

function mockPresenceAPI(
  loadResult: Record<string, string> = {},
  options: { loadFails?: boolean } = {}
): PresenceAPI {
  const loadData = options.loadFails
    ? vi.fn().mockRejectedValue(new Error('load failed'))
    : vi.fn().mockResolvedValue(loadResult)
  const saveData = vi.fn().mockResolvedValue(undefined)
  ;(window as unknown as { presenceAPI: PresenceAPI }).presenceAPI = { loadData, saveData }
  return { loadData, saveData }
}

async function renderAppAt(year: number, month: number): Promise<void> {
  // Set system time so App's useState initializer picks up the right month, then
  // restore real timers before any async operations to avoid blocking waitFor.
  vi.useFakeTimers()
  vi.setSystemTime(new Date(year, month - 1, 15))
  render(<App />)
  vi.useRealTimers()
  await waitFor(() => expect(screen.queryByText('Loading...')).toBeNull())
}

describe('App integration', () => {
  it('shows main UI after loadData resolves', async () => {
    mockPresenceAPI()
    render(<App />)
    await waitFor(() => screen.getByText('Presence Planner'))
    expect(screen.queryByText('Loading...')).toBeNull()
  })

  it('renders main UI even when loadData rejects', async () => {
    mockPresenceAPI({}, { loadFails: true })
    render(<App />)
    await waitFor(() => screen.getByText('Presence Planner'))
  })

  it('filters out invalid status values from loaded data', async () => {
    // Feb 2 2026 = Monday (first interactive weekday in Feb 2026)
    // Load it with an invalid status — App must discard it and treat it as home-office.
    // If filtering works: clicking Feb 2 cycles home-office → on-site.
    // If filtering fails: the cell would not be home-office and the saveData payload would differ.
    const { saveData } = mockPresenceAPI({
      '2026-02-02': 'not-a-valid-status',
      '2026-02-03': 'on-site',
    })
    await renderAppAt(2026, 2)

    const feb2Cell = document.querySelector('.day-cell.status-home-office')!
    fireEvent.click(feb2Cell)

    expect(saveData).toHaveBeenLastCalledWith(
      expect.objectContaining({ '2026-02-02': 'on-site' })
    )
  })

  it('calls saveData with updated status after clicking a day cell', async () => {
    const { saveData } = mockPresenceAPI()
    await renderAppAt(2026, 2)

    // Feb 2 2026 = Monday, first interactive weekday
    fireEvent.click(document.querySelector('.day-cell.status-home-office')!)

    expect(saveData).toHaveBeenCalledWith(
      expect.objectContaining({ '2026-02-02': 'on-site' })
    )
  })

  it('removes key from saved data when status cycles back to home-office (sparse model)', async () => {
    const { saveData } = mockPresenceAPI()
    await renderAppAt(2026, 2)

    fireEvent.click(document.querySelector('.day-cell.status-home-office')!)  // → on-site
    fireEvent.click(document.querySelector('.day-cell.status-on-site')!)       // → absent
    fireEvent.click(document.querySelector('.day-cell.status-absent')!)        // → home-office

    const lastPayload = saveData.mock.lastCall?.[0] as Record<string, string>
    expect(lastPayload).not.toHaveProperty('2026-02-02')
  })

  it('navigating prev from January wraps to December of the previous year', async () => {
    mockPresenceAPI()
    await renderAppAt(2026, 1)

    expect(screen.getByText('January 2026')).toBeTruthy()
    fireEvent.click(screen.getByLabelText('Previous month'))
    expect(screen.getByText('December 2025')).toBeTruthy()
  })

  it('navigating next from December wraps to January of the next year', async () => {
    mockPresenceAPI()
    await renderAppAt(2026, 12)

    expect(screen.getByText('December 2026')).toBeTruthy()
    fireEvent.click(screen.getByLabelText('Next month'))
    expect(screen.getByText('January 2027')).toBeTruthy()
  })
})
