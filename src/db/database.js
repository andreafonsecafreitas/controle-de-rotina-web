import Dexie from 'dexie'

export const db = new Dexie('controleDeRotina')

db.version(1).stores({
  persons: '++id, name, metaPoints, bestStreak, createdAt',
  tasks: '++id, personId, name, points, icon, sortOrder, isActive, recurrenceDays, createdAt, [personId+isActive]',
  taskCompletions: '++id, taskId, personId, date, pointsSnapshot, completedAt, [taskId+date], [personId+date]',
  dailySummary: '++id, personId, date, pointsEarned, metaSnapshot, goalReached, [personId+date]',
})

db.version(2).stores({
  persons: '++id, name, metaPoints, bestStreak, createdAt',
  tasks: '++id, personId, name, points, icon, sortOrder, isActive, recurrenceDays, scheduledDate, isGlobal, globalWinnerId, createdAt, [personId+isActive]',
  taskCompletions: '++id, taskId, personId, date, pointsSnapshot, completedAt, [taskId+date], [personId+date]',
  dailySummary: '++id, personId, date, pointsEarned, metaSnapshot, goalReached, [personId+date]',
}).upgrade(tx => {
  return tx.table('tasks').toCollection().modify(task => {
    if (task.scheduledDate === undefined) task.scheduledDate = null
    if (task.isGlobal === undefined) task.isGlobal = 0
    if (task.globalWinnerId === undefined) task.globalWinnerId = null
  })
})

export async function isSetupDone() {
  const count = await db.persons.count()
  return count >= 2
}

export async function getPersons() {
  return db.persons.orderBy('id').toArray()
}

export async function getTasksForPerson(personId) {
  return db.tasks.where({ personId, isActive: 1 }).sortBy('sortOrder')
}

export async function getTasksForPersonAndDate(personId, dateStr) {
  const date = new Date(dateStr)
  const weekday = date.getDay() === 0 ? 7 : date.getDay()

  const tasks = await db.tasks.where({ personId, isActive: 1 }).sortBy('sortOrder')

  return tasks.filter(t => {
    if (t.scheduledDate) {
      return t.scheduledDate === dateStr
    }
    if (!t.recurrenceDays || t.recurrenceDays.length === 0) return true
    return t.recurrenceDays.includes(weekday)
  })
}

export async function getGlobalTasksForDate(dateStr) {
  const allTasks = await db.tasks.where({ isActive: 1, isGlobal: 1 }).sortBy('sortOrder')
  return allTasks.filter(t => {
    if (t.scheduledDate) return t.scheduledDate === dateStr
    return true
  })
}

export async function getCompletionsForPersonDate(personId, dateStr) {
  return db.taskCompletions.where('[personId+date]').equals([personId, dateStr]).toArray()
}

export async function getDailySummary(personId, dateStr) {
  return db.dailySummary.where('[personId+date]').equals([personId, dateStr]).first()
}

export async function getDailySummariesForRange(personId, startDate, endDate) {
  return db.dailySummary
    .where('personId').equals(personId)
    .and(s => s.date >= startDate && s.date <= endDate)
    .toArray()
}

export async function upsertDailySummary(personId, dateStr, pointsEarned, metaSnapshot) {
  const goalReached = pointsEarned >= metaSnapshot ? 1 : 0
  const existing = await getDailySummary(personId, dateStr)
  if (existing) {
    await db.dailySummary.update(existing.id, { pointsEarned, goalReached })
  } else {
    await db.dailySummary.add({ personId, date: dateStr, pointsEarned, metaSnapshot, goalReached })
  }
}

export async function exportAllData() {
  const [persons, tasks, completions, summaries] = await Promise.all([
    db.persons.toArray(),
    db.tasks.toArray(),
    db.taskCompletions.toArray(),
    db.dailySummary.toArray(),
  ])
  return { persons, tasks, completions, summaries, exportedAt: new Date().toISOString(), version: 2 }
}

export async function importAllData(data) {
  await db.transaction('rw', db.persons, db.tasks, db.taskCompletions, db.dailySummary, async () => {
    await db.persons.clear()
    await db.tasks.clear()
    await db.taskCompletions.clear()
    await db.dailySummary.clear()

    if (data.persons?.length) await db.persons.bulkAdd(data.persons)
    if (data.tasks?.length) await db.tasks.bulkAdd(data.tasks)
    if (data.completions?.length) await db.taskCompletions.bulkAdd(data.completions)
    if (data.summaries?.length) await db.dailySummary.bulkAdd(data.summaries)
  })
}
