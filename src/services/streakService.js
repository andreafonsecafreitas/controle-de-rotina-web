import { db, getDailySummary, upsertDailySummary } from '../db/database'
import { todayStr, subtractDays } from './dateUtils'

export async function closeMissedDays(personId) {
  const today = todayStr()
  const person = await db.persons.get(personId)
  if (!person) return

  const oldest = await db.taskCompletions
    .where('personId').equals(personId)
    .sortBy('date')
  if (oldest.length === 0) return

  const startDate = oldest[0].date
  let cur = startDate
  while (cur < today) {
    const existing = await getDailySummary(personId, cur)
    if (!existing) {
      await upsertDailySummary(personId, cur, 0, person.metaPoints)
    }
    const next = new Date(cur + 'T00:00:00')
    next.setDate(next.getDate() + 1)
    cur = next.toISOString().slice(0, 10)
  }
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
  const person = await db.persons.get(personId)
  if (!person) return current

  if (current > (person.bestStreak || 0)) {
    await db.persons.update(personId, { bestStreak: current })
  }

  return current
}
