import { db, getCompletionsForPersonDate, upsertDailySummary } from '../db/database'
import { todayStr } from './dateUtils'

export async function toggleTaskCompletion(task, personId, currentlyDone) {
  const date = todayStr()

  if (currentlyDone) {
    await db.taskCompletions
      .where('[taskId+date]')
      .equals([task.id, date])
      .delete()
  } else {
    const already = await db.taskCompletions
      .where('[taskId+date]')
      .equals([task.id, date])
      .first()
    if (!already) {
      await db.taskCompletions.add({
        taskId: task.id,
        personId,
        date,
        pointsSnapshot: task.points,
        completedAt: new Date().toISOString(),
      })
    }
  }

  await refreshDailySummary(personId, date)
}

export async function refreshDailySummary(personId, dateStr) {
  const completions = await getCompletionsForPersonDate(personId, dateStr)
  const total = completions.reduce((s, c) => s + c.pointsSnapshot, 0)

  const person = await db.persons.get(personId)
  if (!person) return

  await upsertDailySummary(personId, dateStr, total, person.metaPoints)
}

export async function getDayScore(personId, dateStr) {
  const completions = await getCompletionsForPersonDate(personId, dateStr)
  return completions.reduce((s, c) => s + c.pointsSnapshot, 0)
}

export async function getPeriodScore(personId, startDate, endDate) {
  const completions = await db.taskCompletions
    .where('personId').equals(personId)
    .and(c => c.date >= startDate && c.date <= endDate)
    .toArray()
  return completions.reduce((s, c) => s + c.pointsSnapshot, 0)
}

export async function getTotalCompletions(personId) {
  return db.taskCompletions.where('personId').equals(personId).count()
}

export async function getTotalScore(personId) {
  const completions = await db.taskCompletions.where('personId').equals(personId).toArray()
  return completions.reduce((s, c) => s + c.pointsSnapshot, 0)
}
