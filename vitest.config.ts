import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    include: [
      'src/**/__tests__/**/*.test.ts',
      'src/**/__tests__/**/*.test.tsx'
    ],
    coverage: {
      provider: 'v8',
      include: [
        'src/renderer/src/services/**/*.ts',
        'src/renderer/src/components/GoalIndicator.tsx',
        'src/main/persistence.ts'
      ],
      thresholds: {
        statements: 90,
        branches: 90,
        functions: 90,
        lines: 90
      }
    }
  }
})
