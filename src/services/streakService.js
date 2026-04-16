import {
  getPersonById,
  updatePerson,
  getDailySummary,
  upsertDailySummary,
  getOldestCompletionsByPerson,
} from '../db/database'
import { todayStr, subtractDays } from './dateUtils'

export function calculateStreakFromSummaries(summaries, todayDate) {
  const summaryMap = new Map()
  for (const s of summaries) {
    summaryMap.set(s.date, s)
  }

  let streak = 0
  let cur = todayDate

  const todaySummary = summaryMap.get(cur)
  if (!todaySummary || todaySummary.goalReached !== 1) {
    cur = subtractDays(todayDate, 1)
    const prev = summaryMap.get(cur)
    if (!prev || prev.goalReached !== 1) return 0
    streak++
    cur = subtractDays(cur, 1)
  } else {
    streak++
    cur = subtractDays(cur, 1)
  }

  while (cur >= '2020-01-01') {
    const s = summaryMap.get(cur)
    if (!s || s.goalReached !== 1) break
    streak++
    cur = subtractDays(cur, 1)
  }

  return streak
}

export function closeMissedDaysFromSummaries(personId, person, summaries, completions, todayDate) {
  if (completions.length === 0) return []

  const dates = completions.map(c => c.date)
  const minDate = dates.reduce((a, b) => (a < b ? a : b))

  const summarySet = new Set(summaries.map(s => s.date))
  const missing = []

  let cur = minDate
  while (cur < todayDate) {
    if (!summarySet.has(cur)) {
      missing.push({
        personId,
        date: cur,
        pointsEarned: 0,
        metaSnapshot: person.metaPoints,
        goalReached: 0,
      })
    }
    const next = new Date(cur + 'T00:00:00')
    next.setDate(next.getDate() + 1)
    cur = next.toISOString().slice(0, 10)
  }

  return missing
}

export async function calculateStreak(personId) {
  const today = todayStr()
  let streak = 0
  let cur = today

  while (true) {
    const summary = await getDailySummary(personId, cur)
    if (!summary || summary.goalReached !== 1) {
      if (cur === today) {
        cur = subtractDays(today, 1)
        const prev = await getDailySummary(personId, cur)
        if (!prev || prev.goalReached !== 1) break
        streak++
        cur = subtractDays(cur, 1)
      } else {
        break
      }
    } else {
      streak++
      cur = subtractDays(cur, 1)
    }
    if (cur < '2020-01-01') break
  }

  return streak
}

export async function updateBestStreak(personId) {
  const current = await calculateStreak(personId)
  const person = await getPersonById(personId)
  if (!person) return current

  if (current > (person.bestStreak || 0)) {
    await updatePerson(personId, { bestStreak: current })
  }

  return current
}
