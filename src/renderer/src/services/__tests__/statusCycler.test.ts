import { describe, it, expect } from 'vitest'
import { nextStatus } from '../statusCycler'

describe('StatusCycler', () => {
  it('cycles home-office to on-site', () => {
    expect(nextStatus('home-office')).toBe('on-site')
  })

  it('cycles on-site to absent', () => {
    expect(nextStatus('on-site')).toBe('absent')
  })

  it('cycles absent to home-office', () => {
    expect(nextStatus('absent')).toBe('home-office')
  })
})
