import { readFile, writeFile } from 'fs/promises'

export async function loadData(filePath: string): Promise<Record<string, string>> {
  try {
    const raw = await readFile(filePath, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

export async function saveData(filePath: string, data: Record<string, string>): Promise<void> {
  await writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8')
}
