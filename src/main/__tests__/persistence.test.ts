import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { readFile, writeFile, mkdir, rm } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'
import { loadData, saveData } from '../persistence'

describe('PersistenceHandler', () => {
  let testDir: string
  let dataPath: string

  beforeEach(async () => {
    testDir = join(tmpdir(), `presence-test-${Date.now()}`)
    await mkdir(testDir, { recursive: true })
    dataPath = join(testDir, 'presence-data.json')
  })

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true })
  })

  it('returns empty object when file does not exist', async () => {
    const data = await loadData(dataPath)
    expect(data).toEqual({})
  })

  it('loads valid JSON data', async () => {
    const testData = { '2026-04-07': 'on-site', '2026-04-15': 'absent' }
    await writeFile(dataPath, JSON.stringify(testData), 'utf-8')

    const data = await loadData(dataPath)
    expect(data).toEqual(testData)
  })

  it('returns empty object for corrupt JSON', async () => {
    await writeFile(dataPath, 'not valid json{{{', 'utf-8')

    const data = await loadData(dataPath)
    expect(data).toEqual({})
  })

  it('saves data as formatted JSON', async () => {
    const testData = { '2026-04-07': 'on-site', '2026-04-15': 'absent' }
    await saveData(dataPath, testData)

    const raw = await readFile(dataPath, 'utf-8')
    expect(JSON.parse(raw)).toEqual(testData)
  })

  it('roundtrips data correctly', async () => {
    const testData = { '2026-04-07': 'on-site', '2026-04-15': 'absent' }
    await saveData(dataPath, testData)
    const loaded = await loadData(dataPath)
    expect(loaded).toEqual(testData)
  })

  it('saves empty object when no non-default statuses', async () => {
    await saveData(dataPath, {})
    const loaded = await loadData(dataPath)
    expect(loaded).toEqual({})
  })
})
