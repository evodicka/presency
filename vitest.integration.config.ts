import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    include: ['src/**/__integration__/**/*.test.tsx'],
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      include: ['src/renderer/src/**/*.{ts,tsx}'],
      exclude: [
        'src/renderer/src/main.tsx',
        'src/renderer/src/types.ts',
        'src/renderer/src/preload.d.ts',
        'src/**/__tests__/**',
        'src/**/__integration__/**'
      ],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80
      }
    }
  }
})
