export function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

export function toDateStr(date) {
  return date.toISOString().slice(0, 10)
}

export function startOfWeek(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return toDateStr(d)
}

export function endOfWeek(dateStr) {
  const start = new Date(startOfWeek(dateStr) + 'T00:00:00')
  start.setDate(start.getDate() + 6)
  return toDateStr(start)
}

export function startOfMonth(dateStr) {
  return dateStr.slice(0, 7) + '-01'
}

export function endOfMonth(dateStr) {
  const d = new Date(dateStr.slice(0, 7) + '-01T00:00:00')
  d.setMonth(d.getMonth() + 1)
  d.setDate(0)
  return toDateStr(d)
}

export function subtractDays(dateStr, n) {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() - n)
  return toDateStr(d)
}

export function daysBetween(start, end) {
  const a = new Date(start + 'T00:00:00')
  const b = new Date(end + 'T00:00:00')
  return Math.round((b - a) / 86400000)
}
