// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import GoalIndicator from '../GoalIndicator'

describe('GoalIndicator', () => {
  it('renders the percentage formatted to 1 decimal place', () => {
    const { getByText } = render(<GoalIndicator onSitePercentage={52.638} />)
    expect(getByText('52.6%')).toBeTruthy()
  })

  it('applies goal-met class when percentage is above 40%', () => {
    const { container } = render(<GoalIndicator onSitePercentage={50} />)
    expect(container.firstChild).toHaveProperty('className')
    expect((container.firstChild as HTMLElement).className).toContain('goal-met')
    expect((container.firstChild as HTMLElement).className).not.toContain('goal-not-met')
  })

  it('applies goal-not-met class when percentage is below 40%', () => {
    const { container } = render(<GoalIndicator onSitePercentage={39.9} />)
    expect((container.firstChild as HTMLElement).className).toContain('goal-not-met')
    expect((container.firstChild as HTMLElement).className).not.toContain('goal-met')
  })

  it('applies goal-met class at exactly 40% (boundary)', () => {
    const { container } = render(<GoalIndicator onSitePercentage={40} />)
    expect((container.firstChild as HTMLElement).className).toContain('goal-met')
  })

  it('caps bar fill width at 100% when percentage exceeds 100', () => {
    const { container } = render(<GoalIndicator onSitePercentage={120} />)
    const fill = container.querySelector('.goal-bar-fill') as HTMLElement
    expect(fill.style.width).toBe('100%')
  })
})
