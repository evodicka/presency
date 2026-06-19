// Calendar tile: "8:00", "7:15", "6:30"
export function formatHoursTime(hours: number): string {
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  return `${h}:${String(m).padStart(2, '0')}`
}

// Overview panel: "8h", "7.5h", "8.25h" (up to 2 decimals, no trailing zeros)
export function formatHours(hours: number): string {
  return `${parseFloat(hours.toFixed(2))}h`
}
