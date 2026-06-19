import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, waitFor, fireEvent, cleanup } from '@testing-library/react'
import App from '../App'

type PresenceAPI = {
  loadData: ReturnType<typeof vi.fn>
  saveData: ReturnType<typeof vi.fn>
  getVersion: ReturnType<typeof vi.fn>
}

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

function mockPresenceAPI(
  loadResult: Record<string, unknown> = {},
  options: { loadFails?: boolean } = {}
): PresenceAPI {
  const loadData = options.loadFails
    ? vi.fn().mockRejectedValue(new Error('load failed'))
    : vi.fn().mockResolvedValue(loadResult)
  const saveData = vi.fn().mockResolvedValue(undefined)
  const getVersion = vi.fn().mockResolvedValue('0.0.1')
  ;(window as unknown as { presenceAPI: PresenceAPI }).presenceAPI = { loadData, saveData, getVersion }
  return { loadData, saveData, getVersion }
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
    await waitFor(() => screen.getByText('Presency'))
    expect(screen.queryByText('Loading...')).toBeNull()
  })

  it('renders main UI even when loadData rejects', async () => {
    mockPresenceAPI({}, { loadFails: true })
    render(<App />)
    await waitFor(() => screen.getByText('Presency'))
  })

  it('filters out invalid status values from loaded data', async () => {
    // Feb 2 2026 = Monday (first interactive weekday in Feb 2026)
    // Load it with an invalid status — App must discard it and treat it as home-office.
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

    const lastPayload = saveData.mock.lastCall?.[0] as Record<string, unknown>
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

  it('loads a legacy bare-string fixture and treats on-site days as 8h', async () => {
    // Legacy format: { '2026-02-02': 'on-site' } (plain string, no hours field)
    const { saveData } = mockPresenceAPI({ '2026-02-02': 'on-site' })
    await renderAppAt(2026, 2)

    // The on-site cell should render with controls showing 8:00
    const onSiteCell = document.querySelector('.day-cell.status-on-site')
    expect(onSiteCell).not.toBeNull()
    expect(onSiteCell?.querySelector('.day-hours-value')?.textContent).toBe('8:00')

    // Adjusting by +0.25 should save the object form
    const plusBtn = onSiteCell?.querySelectorAll('.day-hours-btn')[1]!
    fireEvent.click(plusBtn)

    expect(saveData).toHaveBeenLastCalledWith(
      expect.objectContaining({ '2026-02-02': { status: 'on-site', hours: 8.25 } })
    )
  })

  it('saves bare on-site string when hours remain at default 8', async () => {
    const { saveData } = mockPresenceAPI()
    await renderAppAt(2026, 2)

    // Click a home-office day to mark it on-site (8h default)
    fireEvent.click(document.querySelector('.day-cell.status-home-office')!)

    const lastPayload = saveData.mock.lastCall?.[0] as Record<string, unknown>
    expect(lastPayload['2026-02-02']).toBe('on-site')
  })

  it('saves object form when on-site hours are adjusted away from 8', async () => {
    const { saveData } = mockPresenceAPI()
    await renderAppAt(2026, 2)

    // Mark Feb 2 as on-site
    fireEvent.click(document.querySelector('.day-cell.status-home-office')!)

    // Click the − button to reduce hours
    const minusBtn = document.querySelector('.day-cell.status-on-site .day-hours-btn')!
    fireEvent.click(minusBtn)

    const lastPayload = saveData.mock.lastCall?.[0] as Record<string, unknown>
    expect(lastPayload['2026-02-02']).toEqual({ status: 'on-site', hours: 7.75 })
  })

  it('cycling an on-site day to absent and back resets hours to 8', async () => {
    const { saveData } = mockPresenceAPI({ '2026-02-02': { status: 'on-site', hours: 6 } })
    await renderAppAt(2026, 2)

    // Verify the day loaded at 6:00
    expect(document.querySelector('.day-hours-value')?.textContent).toBe('6:00')

    // Cycle: on-site → absent → home-office → on-site (3 clicks)
    fireEvent.click(document.querySelector('.day-cell.status-on-site')!)  // → absent
    fireEvent.click(document.querySelector('.day-cell.status-absent')!)   // → home-office
    fireEvent.click(document.querySelector('.day-cell.status-home-office')!) // → on-site

    // Should now show 8:00 (reset to default)
    expect(document.querySelector('.day-hours-value')?.textContent).toBe('8:00')

    // And the saved payload should use the bare string form (hours = 8)
    const lastPayload = saveData.mock.lastCall?.[0] as Record<string, unknown>
    expect(lastPayload['2026-02-02']).toBe('on-site')
  })

  it('adjusting hours updates the on-site hours display in the monthly overview', async () => {
    const { saveData: _saveData } = mockPresenceAPI()
    await renderAppAt(2026, 2)

    // Mark Feb 2 as on-site
    fireEvent.click(document.querySelector('.day-cell.status-home-office')!)

    // Decrease by 0.25 twice → 7.5h
    const minusBtn = document.querySelector('.day-cell.status-on-site .day-hours-btn')!
    fireEvent.click(minusBtn)
    fireEvent.click(minusBtn)

    // The overview should reflect 7.5h on-site
    expect(screen.getByText(/7\.5h of/)).toBeTruthy()
  })
})
