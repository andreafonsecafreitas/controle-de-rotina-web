import { supabase } from '../lib/supabase'

function personFromDb(row) {
  return {
    id: row.id,
    name: row.name,
    metaPoints: row.meta_points,
    bestStreak: row.best_streak,
    createdAt: row.created_at,
  }
}

function taskFromDb(row) {
  return {
    id: row.id,
    personId: row.person_id,
    name: row.name,
    points: row.points,
    icon: row.icon,
    sortOrder: row.sort_order,
    isActive: row.is_active,
    recurrenceDays: row.recurrence_days || [],
    scheduledDate: row.scheduled_date || null,
    isGlobal: row.is_global,
    globalWinnerId: row.global_winner_id,
    createdAt: row.created_at,
  }
}

function completionFromDb(row) {
  return {
    id: row.id,
    taskId: row.task_id,
    personId: row.person_id,
    date: row.date,
    pointsSnapshot: row.points_snapshot,
    completedAt: row.completed_at,
  }
}

function summaryFromDb(row) {
  return {
    id: row.id,
    personId: row.person_id,
    date: row.date,
    pointsEarned: row.points_earned,
    metaSnapshot: row.meta_snapshot,
    goalReached: row.goal_reached,
  }
}

export async function isSetupDone() {
  const { count } = await supabase
    .from('persons')
    .select('*', { count: 'exact', head: true })
  return (count || 0) >= 2
}

export async function getPersons() {
  const { data } = await supabase
    .from('persons')
    .select('*')
    .order('id', { ascending: true })
  return (data || []).map(personFromDb)
}

export async function addPerson(data) {
  const { data: rows, error } = await supabase
    .from('persons')
    .insert({
      name: data.name,
      meta_points: data.metaPoints,
      best_streak: data.bestStreak ?? 0,
    })
    .select()
  if (error) throw error
  return rows[0].id
}

export async function getPersonById(id) {
  const { data } = await supabase
    .from('persons')
    .select('*')
    .eq('id', id)
    .single()
  return data ? personFromDb(data) : null
}

export async function updatePerson(id, data) {
  const row = {}
  if (data.bestStreak !== undefined) row.best_streak = data.bestStreak
  if (data.metaPoints !== undefined) row.meta_points = data.metaPoints
  if (data.name !== undefined) row.name = data.name
  await supabase.from('persons').update(row).eq('id', id)
}

export async function getTasksForPerson(personId) {
  const { data } = await supabase
    .from('tasks')
    .select('*')
    .eq('person_id', personId)
    .eq('is_active', 1)
    .order('sort_order', { ascending: true })
  return (data || []).map(taskFromDb)
}

export async function getTasksForPersonAndDate(personId, dateStr) {
  const date = new Date(dateStr + 'T00:00:00')
  const weekday = date.getDay() === 0 ? 7 : date.getDay()

  const { data } = await supabase
    .from('tasks')
    .select('*')
    .eq('person_id', personId)
    .eq('is_active', 1)
    .order('sort_order', { ascending: true })

  return (data || []).map(taskFromDb).filter(t => {
    if (t.scheduledDate) return t.scheduledDate === dateStr
    if (!t.recurrenceDays || t.recurrenceDays.length === 0) return true
    return t.recurrenceDays.includes(weekday)
  })
}

export async function getGlobalTasksForDate(dateStr) {
  const { data } = await supabase
    .from('tasks')
    .select('*')
    .eq('is_active', 1)
    .eq('is_global', 1)
    .order('sort_order', { ascending: true })

  return (data || []).map(taskFromDb).filter(t => {
    if (t.scheduledDate) return t.scheduledDate === dateStr
    return true
  })
}

export async function addTask(data) {
  const { data: rows, error } = await supabase
    .from('tasks')
    .insert({
      person_id: data.personId,
      name: data.name,
      points: data.points,
      icon: data.icon,
      sort_order: data.sortOrder ?? 0,
      is_active: data.isActive ?? 1,
      recurrence_days: data.recurrenceDays ?? [],
      scheduled_date: data.scheduledDate ?? null,
      is_global: data.isGlobal ?? 0,
      global_winner_id: data.globalWinnerId ?? null,
    })
    .select()
  if (error) throw error
  return rows[0].id
}

export async function bulkAddTasks(tasks) {
  const rows = tasks.map(t => ({
    person_id: t.personId,
    name: t.name,
    points: t.points,
    icon: t.icon,
    sort_order: t.sortOrder ?? 0,
    is_active: t.isActive ?? 1,
    recurrence_days: t.recurrenceDays ?? [],
    scheduled_date: t.scheduledDate ?? null,
    is_global: t.isGlobal ?? 0,
    global_winner_id: t.globalWinnerId ?? null,
  }))
  const { error } = await supabase.from('tasks').insert(rows)
  if (error) throw error
}

export async function updateTask(id, data) {
  const row = {}
  if (data.name !== undefined) row.name = data.name
  if (data.points !== undefined) row.points = data.points
  if (data.icon !== undefined) row.icon = data.icon
  if (data.sortOrder !== undefined) row.sort_order = data.sortOrder
  if (data.isActive !== undefined) row.is_active = data.isActive
  if (data.recurrenceDays !== undefined) row.recurrence_days = data.recurrenceDays
  if (data.scheduledDate !== undefined) row.scheduled_date = data.scheduledDate
  if (data.isGlobal !== undefined) row.is_global = data.isGlobal
  if (data.globalWinnerId !== undefined) row.global_winner_id = data.globalWinnerId
  await supabase.from('tasks').update(row).eq('id', id)
}

export async function bulkUpdateTaskSortOrder(updates) {
  await Promise.all(
    updates.map(({ id, sortOrder }) =>
      supabase.from('tasks').update({ sort_order: sortOrder }).eq('id', id)
    )
  )
}

export async function getCompletionsForPersonDate(personId, dateStr) {
  const { data } = await supabase
    .from('task_completions')
    .select('*')
    .eq('person_id', personId)
    .eq('date', dateStr)
  return (data || []).map(completionFromDb)
}

export async function getTaskCompletionByTaskDate(taskId, dateStr) {
  const { data } = await supabase
    .from('task_completions')
    .select('*')
    .eq('task_id', taskId)
    .eq('date', dateStr)
    .maybeSingle()
  return data ? completionFromDb(data) : null
}

export async function addTaskCompletion(data) {
  const { error } = await supabase.from('task_completions').insert({
    task_id: data.taskId,
    person_id: data.personId,
    date: data.date,
    points_snapshot: data.pointsSnapshot,
    completed_at: data.completedAt ?? new Date().toISOString(),
  })
  if (error && error.code !== '23505') throw error
}

export async function deleteTaskCompletion(taskId, dateStr) {
  await supabase
    .from('task_completions')
    .delete()
    .eq('task_id', taskId)
    .eq('date', dateStr)
}

export async function getCompletionsByPersonDateRange(personId, startDate, endDate) {
  const { data } = await supabase
    .from('task_completions')
    .select('*')
    .eq('person_id', personId)
    .gte('date', startDate)
    .lte('date', endDate)
  return (data || []).map(completionFromDb)
}

export async function getAllCompletionsByPerson(personId) {
  const { data } = await supabase
    .from('task_completions')
    .select('*')
    .eq('person_id', personId)
  return (data || []).map(completionFromDb)
}

export async function getOldestCompletionsByPerson(personId) {
  const { data } = await supabase
    .from('task_completions')
    .select('*')
    .eq('person_id', personId)
    .order('date', { ascending: true })
  return (data || []).map(completionFromDb)
}

export async function countCompletionsByPerson(personId) {
  const { count } = await supabase
    .from('task_completions')
    .select('*', { count: 'exact', head: true })
    .eq('person_id', personId)
  return count || 0
}

export async function getDailySummary(personId, dateStr) {
  const { data } = await supabase
    .from('daily_summary')
    .select('*')
    .eq('person_id', personId)
    .eq('date', dateStr)
    .maybeSingle()
  return data ? summaryFromDb(data) : null
}

export async function getDailySummariesForRange(personId, startDate, endDate) {
  const { data } = await supabase
    .from('daily_summary')
    .select('*')
    .eq('person_id', personId)
    .gte('date', startDate)
    .lte('date', endDate)
  return (data || []).map(summaryFromDb)
}

export async function upsertDailySummary(personId, dateStr, pointsEarned, metaSnapshot) {
  const goalReached = pointsEarned >= metaSnapshot ? 1 : 0
  await supabase.from('daily_summary').upsert({
    person_id: personId,
    date: dateStr,
    points_earned: pointsEarned,
    meta_snapshot: metaSnapshot,
    goal_reached: goalReached,
  }, { onConflict: 'person_id,date' })
}

export async function batchLoadAll(today) {
  const [
    { data: persons },
    { data: allTasks },
    { data: allCompletions },
    { data: allSummaries },
  ] = await Promise.all([
    supabase.from('persons').select('*').order('id', { ascending: true }),
    supabase.from('tasks').select('*').eq('is_active', 1).order('sort_order', { ascending: true }),
    supabase.from('task_completions').select('*'),
    supabase.from('daily_summary').select('*'),
  ])

  return {
    persons: (persons || []).map(personFromDb),
    tasks: (allTasks || []).map(taskFromDb),
    completions: (allCompletions || []).map(completionFromDb),
    summaries: (allSummaries || []).map(summaryFromDb),
  }
}

export async function exportAllData() {
  const [
    { data: persons },
    { data: tasks },
    { data: completions },
    { data: summaries },
  ] = await Promise.all([
    supabase.from('persons').select('*'),
    supabase.from('tasks').select('*'),
    supabase.from('task_completions').select('*'),
    supabase.from('daily_summary').select('*'),
  ])
  return {
    persons: (persons || []).map(personFromDb),
    tasks: (tasks || []).map(taskFromDb),
    completions: (completions || []).map(completionFromDb),
    summaries: (summaries || []).map(summaryFromDb),
    exportedAt: new Date().toISOString(),
    version: 3,
  }
}

export async function importAllData(data) {
  await supabase.from('daily_summary').delete().neq('id', 0)
  await supabase.from('task_completions').delete().neq('id', 0)
  await supabase.from('tasks').delete().neq('id', 0)
  await supabase.from('persons').delete().neq('id', 0)

  if (data.persons?.length) {
    await supabase.from('persons').insert(
      data.persons.map(p => ({
        id: p.id,
        name: p.name,
        meta_points: p.metaPoints,
        best_streak: p.bestStreak ?? 0,
        created_at: p.createdAt,
      }))
    )
  }
  if (data.tasks?.length) {
    await supabase.from('tasks').insert(
      data.tasks.map(t => ({
        id: t.id,
        person_id: t.personId,
        name: t.name,
        points: t.points,
        icon: t.icon,
        sort_order: t.sortOrder ?? 0,
        is_active: t.isActive ?? 1,
        recurrence_days: t.recurrenceDays ?? [],
        scheduled_date: t.scheduledDate ?? null,
        is_global: t.isGlobal ?? 0,
        global_winner_id: t.globalWinnerId ?? null,
        created_at: t.createdAt,
      }))
    )
  }
  if (data.completions?.length) {
    await supabase.from('task_completions').insert(
      data.completions.map(c => ({
        id: c.id,
        task_id: c.taskId,
        person_id: c.personId,
        date: c.date,
        points_snapshot: c.pointsSnapshot,
        completed_at: c.completedAt,
      }))
    )
  }
  if (data.summaries?.length) {
    await supabase.from('daily_summary').insert(
      data.summaries.map(s => ({
        id: s.id,
        person_id: s.personId,
        date: s.date,
        points_earned: s.pointsEarned,
        meta_snapshot: s.metaSnapshot,
        goal_reached: s.goalReached,
      }))
    )
  }
}

export async function resetAllProgress() {
  await supabase.from('daily_summary').delete().neq('id', 0)
  await supabase.from('task_completions').delete().neq('id', 0)
  await supabase.from('tasks').update({ global_winner_id: null }).neq('id', 0)
  await supabase.from('persons').update({ best_streak: 0 }).neq('id', 0)
}

export async function getFullHistory() {
  const [{ data: completions }, { data: tasks }, { data: persons }] = await Promise.all([
    supabase.from('task_completions').select('*').order('date', { ascending: false }).order('completed_at', { ascending: false }),
    supabase.from('tasks').select('id, name, icon, is_global'),
    supabase.from('persons').select('id, name'),
  ])

  const taskMap = new Map((tasks || []).map(t => [t.id, t]))
  const personMap = new Map((persons || []).map(p => [p.id, p]))

  return (completions || []).map(c => ({
    id: c.id,
    taskId: c.task_id,
    personId: c.person_id,
    date: c.date,
    points: c.points_snapshot,
    completedAt: c.completed_at,
    taskName: taskMap.get(c.task_id)?.name || 'Tarefa removida',
    taskIcon: taskMap.get(c.task_id)?.icon || '⭐',
    isGlobal: taskMap.get(c.task_id)?.is_global === 1,
    personName: personMap.get(c.person_id)?.name || '?',
  }))
}

export async function deleteCompletion(completionId) {
  await supabase.from('task_completions').delete().eq('id', completionId)
}
