// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, fireEvent, cleanup } from '@testing-library/react'
import DayCell from '../DayCell'

afterEach(() => {
  cleanup()
})

const noop = (): void => {}

function renderCell(overrides: Partial<Parameters<typeof DayCell>[0]> = {}): ReturnType<typeof render> {
  const props = {
    date: '2026-02-02',
    dayNumber: 2,
    status: 'home-office' as const,
    hours: 8,
    isWeekend: false,
    isHoliday: false,
    isAdjacentMonth: false,
    onStatusChange: noop,
    onAdjustHours: noop,
    ...overrides
  }
  return render(<DayCell {...props} />)
}

describe('DayCell', () => {
  it('renders the day number', () => {
    const { getByText } = renderCell({ dayNumber: 15 })
    expect(getByText('15')).toBeTruthy()
  })

  it('does not show hours controls for a home-office day', () => {
    const { container } = renderCell({ status: 'home-office' })
    expect(container.querySelector('.day-hours-controls')).toBeNull()
  })

  it('does not show hours controls for an absent day', () => {
    const { container } = renderCell({ status: 'absent' })
    expect(container.querySelector('.day-hours-controls')).toBeNull()
  })

  it('shows hours controls for an interactive on-site day', () => {
    const { container } = renderCell({ status: 'on-site', hours: 8 })
    expect(container.querySelector('.day-hours-controls')).not.toBeNull()
    expect(container.querySelector('.day-hours-value')?.textContent).toBe('8:00')
  })

  it('formats quarter-hour increments as HH:MM', () => {
    const { container } = renderCell({ status: 'on-site', hours: 7.25 })
    expect(container.querySelector('.day-hours-value')?.textContent).toBe('7:15')
  })

  it('formats half-hour as HH:MM', () => {
    const { container } = renderCell({ status: 'on-site', hours: 7.5 })
    expect(container.querySelector('.day-hours-value')?.textContent).toBe('7:30')
  })

  it('formats whole hours as HH:00', () => {
    const { container } = renderCell({ status: 'on-site', hours: 6 })
    expect(container.querySelector('.day-hours-value')?.textContent).toBe('6:00')
  })

  it('calls onAdjustHours with +0.25 when + button is clicked', () => {
    const onAdjustHours = vi.fn()
    const { container } = renderCell({ status: 'on-site', hours: 8, onAdjustHours })
    const buttons = container.querySelectorAll('.day-hours-btn')
    const plusBtn = buttons[1] // second button is +
    fireEvent.click(plusBtn)
    expect(onAdjustHours).toHaveBeenCalledWith('2026-02-02', 0.25)
  })

  it('calls onAdjustHours with -0.25 when − button is clicked', () => {
    const onAdjustHours = vi.fn()
    const { container } = renderCell({ status: 'on-site', hours: 8, onAdjustHours })
    const buttons = container.querySelectorAll('.day-hours-btn')
    const minusBtn = buttons[0] // first button is −
    fireEvent.click(minusBtn)
    expect(onAdjustHours).toHaveBeenCalledWith('2026-02-02', -0.25)
  })

  it('does not fire onStatusChange when + button is clicked', () => {
    const onStatusChange = vi.fn()
    const { container } = renderCell({ status: 'on-site', hours: 8, onStatusChange })
    const plusBtn = container.querySelectorAll('.day-hours-btn')[1]
    fireEvent.click(plusBtn)
    expect(onStatusChange).not.toHaveBeenCalled()
  })

  it('does not fire onStatusChange when − button is clicked', () => {
    const onStatusChange = vi.fn()
    const { container } = renderCell({ status: 'on-site', hours: 8, onStatusChange })
    const minusBtn = container.querySelectorAll('.day-hours-btn')[0]
    fireEvent.click(minusBtn)
    expect(onStatusChange).not.toHaveBeenCalled()
  })

  it('does not show hours controls for an on-site day in an adjacent month', () => {
    const { container } = renderCell({ status: 'on-site', isAdjacentMonth: true })
    expect(container.querySelector('.day-hours-controls')).toBeNull()
  })

  it('does not show hours controls for an on-site holiday', () => {
    const { container } = renderCell({ status: 'on-site', isHoliday: true })
    expect(container.querySelector('.day-hours-controls')).toBeNull()
  })

  it('does not show hours controls for an on-site weekend', () => {
    const { container } = renderCell({ status: 'on-site', isWeekend: true })
    expect(container.querySelector('.day-hours-controls')).toBeNull()
  })
})
