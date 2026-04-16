import {
  getPersonById,
  getCompletionsForPersonDate,
  getTaskCompletionByTaskDate,
  addTaskCompletion,
  deleteTaskCompletion,
  getCompletionsByPersonDateRange,
  getAllCompletionsByPerson,
  countCompletionsByPerson,
  upsertDailySummary,
} from '../db/database'
import { todayStr } from './dateUtils'

export async function toggleTaskCompletion(task, personId, currentlyDone) {
  const date = todayStr()
  if (currentlyDone) {
    await deleteTaskCompletion(task.id, date)
  } else {
    const already = await getTaskCompletionByTaskDate(task.id, date)
    if (!already) {
      await addTaskCompletion({
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
  const person = await getPersonById(personId)
  if (!person) return
  await upsertDailySummary(personId, dateStr, total, person.metaPoints)
}

export async function getDayScore(personId, dateStr) {
  const completions = await getCompletionsForPersonDate(personId, dateStr)
  return completions.reduce((s, c) => s + c.pointsSnapshot, 0)
}

export async function getPeriodScore(personId, startDate, endDate) {
  const completions = await getCompletionsByPersonDateRange(personId, startDate, endDate)
  return completions.reduce((s, c) => s + c.pointsSnapshot, 0)
}

export async function getTotalCompletions(personId) {
  return countCompletionsByPerson(personId)
}

export async function getTotalScore(personId) {
  const completions = await getAllCompletionsByPerson(personId)
  return completions.reduce((s, c) => s + c.pointsSnapshot, 0)
}
