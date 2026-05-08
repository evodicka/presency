// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import GoalIndicator from '../GoalIndicator'

afterEach(() => {
  cleanup()
})

const baseProps = {
  onSitePercentage: 0,
  onSiteHours: 0,
  targetOnSiteHours: 0,
  hoursToGoal: 0
}

describe('GoalIndicator', () => {
  it('renders the percentage formatted to 1 decimal place', () => {
    const { getByText } = render(
      <GoalIndicator
        {...baseProps}
        onSitePercentage={52.638}
        onSiteHours={80}
        targetOnSiteHours={64}
        hoursToGoal={0}
      />
    )
    expect(getByText('52.6%')).toBeTruthy()
  })

  it('applies goal-met class when percentage is above 40%', () => {
    const { container } = render(
      <GoalIndicator
        {...baseProps}
        onSitePercentage={50}
        onSiteHours={80}
        targetOnSiteHours={64}
        hoursToGoal={0}
      />
    )
    expect(container.firstChild).toHaveProperty('className')
    expect((container.firstChild as HTMLElement).className).toContain('goal-met')
    expect((container.firstChild as HTMLElement).className).not.toContain('goal-not-met')
  })

  it('applies goal-not-met class when percentage is below 40%', () => {
    const { container } = render(
      <GoalIndicator
        {...baseProps}
        onSitePercentage={39.9}
        onSiteHours={24}
        targetOnSiteHours={32}
        hoursToGoal={8}
      />
    )
    expect((container.firstChild as HTMLElement).className).toContain('goal-not-met')
    expect((container.firstChild as HTMLElement).className).not.toContain('goal-met')
  })

  it('applies goal-met class at exactly 40% (boundary)', () => {
    const { container } = render(
      <GoalIndicator
        {...baseProps}
        onSitePercentage={40}
        onSiteHours={32}
        targetOnSiteHours={32}
        hoursToGoal={0}
      />
    )
    expect((container.firstChild as HTMLElement).className).toContain('goal-met')
  })

  it('caps bar fill width at 100% when percentage exceeds 100', () => {
    const { container } = render(
      <GoalIndicator
        {...baseProps}
        onSitePercentage={120}
        onSiteHours={80}
        targetOnSiteHours={64}
        hoursToGoal={0}
      />
    )
    const fill = container.querySelector('.goal-bar-fill') as HTMLElement
    expect(fill.style.width).toBe('100%')
  })

  it('renders the on-site hours summary against the target', () => {
    const { getByText } = render(
      <GoalIndicator
        {...baseProps}
        onSitePercentage={30}
        onSiteHours={24}
        targetOnSiteHours={32}
        hoursToGoal={8}
      />
    )
    expect(getByText('24h of 32h on-site')).toBeTruthy()
  })

  it('renders the hours-to-goal delta when below the threshold', () => {
    const { getByText } = render(
      <GoalIndicator
        {...baseProps}
        onSitePercentage={30}
        onSiteHours={24}
        targetOnSiteHours={32}
        hoursToGoal={8}
      />
    )
    expect(getByText('8h to goal')).toBeTruthy()
  })

  it('shows "Goal met" when the threshold is reached', () => {
    const { getByText, queryByText } = render(
      <GoalIndicator
        {...baseProps}
        onSitePercentage={50}
        onSiteHours={80}
        targetOnSiteHours={64}
        hoursToGoal={0}
      />
    )
    expect(getByText('Goal met')).toBeTruthy()
    expect(queryByText(/to goal$/)).toBeNull()
  })

  it('formats fractional hours with a single decimal', () => {
    const { getByText } = render(
      <GoalIndicator
        {...baseProps}
        onSitePercentage={14.28}
        onSiteHours={16}
        targetOnSiteHours={44.8}
        hoursToGoal={28.8}
      />
    )
    expect(getByText('16h of 44.8h on-site')).toBeTruthy()
    expect(getByText('28.8h to goal')).toBeTruthy()
  })

  it('renders an em-dash placeholder when there are no effective days', () => {
    const { getByText, queryByText } = render(
      <GoalIndicator
        {...baseProps}
        onSitePercentage={0}
        onSiteHours={0}
        targetOnSiteHours={0}
        hoursToGoal={0}
      />
    )
    expect(getByText('—')).toBeTruthy()
    expect(queryByText(/on-site$/)).toBeNull()
    expect(queryByText('Goal met')).toBeNull()
  })
})
