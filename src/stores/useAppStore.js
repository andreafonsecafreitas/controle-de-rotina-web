import { create } from 'zustand'
import {
  batchLoadAll,
  getPersonById,
  getTasksForPersonAndDate,
  getCompletionsForPersonDate,
  getGlobalTasksForDate,
  updateTask,
  bulkUpdateTaskSortOrder,
  addTaskCompletion,
  deleteTaskCompletion,
  getTaskCompletionByTaskDate,
  upsertDailySummary,
  updatePerson,
} from '../db/database'
import { todayStr, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from '../services/dateUtils'
import { calculateStreakFromSummaries, closeMissedDaysFromSummaries } from '../services/streakService'
import { supabase } from '../lib/supabase'

function filterTasksForDate(tasks, personId, dateStr) {
  const date = new Date(dateStr + 'T00:00:00')
  const weekday = date.getDay() === 0 ? 7 : date.getDay()

  return tasks
    .filter(t => t.personId === personId && !t.isGlobal)
    .filter(t => {
      if (t.scheduledDate) return t.scheduledDate === dateStr
      if (!t.recurrenceDays || t.recurrenceDays.length === 0) return true
      return t.recurrenceDays.includes(weekday)
    })
}

function calcScoreFromCompletions(completions, personId, startDate, endDate) {
  return completions
    .filter(c => c.personId === personId && c.date >= startDate && c.date <= endDate)
    .reduce((s, c) => s + c.pointsSnapshot, 0)
}

const useAppStore = create((set, get) => ({
  persons: [],
  personStates: [],
  globalChallenges: [],
  ranking: [],
  activeTab: 0,
  isLoading: true,
  lastLoadedDate: null,

  setActiveTab: (tab) => set({ activeTab: tab }),

  loadAll: async () => {
    set({ isLoading: true })
    const today = todayStr()

    try {
      const { persons, tasks, completions, summaries } = await batchLoadAll(today)

      if (persons.length === 0) {
        set({ isLoading: false })
        return
      }

      const week = { start: startOfWeek(today), end: endOfWeek(today) }
      const month = { start: startOfMonth(today), end: endOfMonth(today) }

      const missingUpserts = []

      const personStates = persons.map(p => {
        const personCompletions = completions.filter(c => c.personId === p.id)
        const personSummaries = summaries.filter(s => s.personId === p.id)

        const missing = closeMissedDaysFromSummaries(p.id, p, personSummaries, personCompletions, today)
        missingUpserts.push(...missing)

        const allSummaries = [...personSummaries, ...missing.map(m => ({
          personId: m.personId,
          date: m.date,
          pointsEarned: m.pointsEarned,
          metaSnapshot: m.metaSnapshot,
          goalReached: m.goalReached,
        }))]

        const todayCompletions = personCompletions.filter(c => c.date === today)
        const todayCompletedIds = new Set(todayCompletions.map(c => c.taskId))

        const personTasks = filterTasksForDate(tasks, p.id, today)
          .map(t => ({ ...t, isDone: todayCompletedIds.has(t.id) }))

        const dayScore = todayCompletions.reduce((s, c) => s + c.pointsSnapshot, 0)
        const weekScore = calcScoreFromCompletions(completions, p.id, week.start, week.end)
        const monthScore = calcScoreFromCompletions(completions, p.id, month.start, month.end)
        const totalScore = personCompletions.reduce((s, c) => s + c.pointsSnapshot, 0)
        const totalCompletions = personCompletions.length
        const streak = calculateStreakFromSummaries(allSummaries, today)

        const todaySummary = allSummaries.find(s => s.date === today)
        if (!todaySummary) {
          const goalReached = dayScore >= p.metaPoints ? 1 : 0
          missingUpserts.push({
            personId: p.id,
            date: today,
            pointsEarned: dayScore,
            metaSnapshot: p.metaPoints,
            goalReached,
          })
        }

        const allDone = personTasks.length > 0 && personTasks.every(t => t.isDone)

        return {
          person: { ...p },
          tasks: personTasks,
          dayScore,
          weekScore,
          monthScore,
          totalScore,
          totalCompletions,
          streak,
          allDone,
        }
      })

      if (missingUpserts.length > 0) {
        const rows = missingUpserts.map(m => ({
          person_id: m.personId,
          date: m.date,
          points_earned: m.pointsEarned,
          meta_snapshot: m.metaSnapshot,
          goal_reached: m.goalReached,
        }))
        supabase.from('daily_summary').upsert(rows, { onConflict: 'person_id,date' }).then(() => {})
      }

      const bestStreakUpdates = personStates
        .filter(ps => ps.streak > (ps.person.bestStreak || 0))
        .map(ps => ({ id: ps.person.id, bestStreak: ps.streak }))

      if (bestStreakUpdates.length > 0) {
        Promise.all(
          bestStreakUpdates.map(u =>
            supabase.from('persons').update({ best_streak: u.bestStreak }).eq('id', u.id)
          )
        ).then(() => {})
      }

      const globalTasks = tasks.filter(t => t.isGlobal)
        .filter(t => {
          if (t.scheduledDate) return t.scheduledDate === today
          return true
        })
      const globalChallenges = globalTasks.map(t => ({
        ...t,
        winnerName: t.globalWinnerId
          ? persons.find(p => p.id === t.globalWinnerId)?.name || null
          : null,
      }))

      const ranking = personStates
        .map((ps, idx) => ({
          person: ps.person,
          totalScore: ps.totalScore,
          totalCompletions: ps.totalCompletions,
          streak: ps.streak,
          dayScore: ps.dayScore,
        }))
        .sort((a, b) => {
          if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore
          if (b.streak !== a.streak) return b.streak - a.streak
          if (b.totalCompletions !== a.totalCompletions) return b.totalCompletions - a.totalCompletions
          return a.person.name.localeCompare(b.person.name)
        })
        .map((item, idx) => ({ ...item, position: idx + 1 }))

      set({ persons, personStates, globalChallenges, ranking, isLoading: false, lastLoadedDate: today })
    } catch (err) {
      console.error('loadAll error:', err)
      set({ isLoading: false })
    }
  },

  claimGlobalChallenge: async (taskId, personId) => {
    const { globalChallenges, persons } = get()
    const task = globalChallenges.find(t => t.id === taskId)
    if (!task || task.globalWinnerId) return

    await updateTask(taskId, { globalWinnerId: personId })

    const today = todayStr()
    const already = await getTaskCompletionByTaskDate(taskId, today)
    if (!already) {
      await addTaskCompletion({
        taskId,
        personId,
        date: today,
        pointsSnapshot: task.points,
        completedAt: new Date().toISOString(),
      })
    }
    await upsertDailySummary(personId, today, 0, 0)

    const winnerName = persons.find(p => p.id === personId)?.name || null
    set(state => ({
      globalChallenges: state.globalChallenges.map(t =>
        t.id === taskId ? { ...t, globalWinnerId: personId, winnerName } : t
      ),
    }))

    await get().loadAll()
  },

  toggleTask: async (taskId, personId, currentlyDone) => {
    const { personStates } = get()
    const today = todayStr()

    set({
      personStates: personStates.map(ps => {
        if (ps.person.id !== personId) return ps
        const tasks = ps.tasks.map(t => t.id === taskId ? { ...t, isDone: !currentlyDone } : t)
        const dayScore = tasks.filter(t => t.isDone).reduce((s, t) => s + t.points, 0)
        const allDone = tasks.length > 0 && tasks.every(t => t.isDone)
        return { ...ps, tasks, dayScore, allDone }
      })
    })

    if (currentlyDone) {
      await deleteTaskCompletion(taskId, today)
    } else {
      const already = await getTaskCompletionByTaskDate(taskId, today)
      if (!already) {
        const task = personStates.find(ps => ps.person.id === personId)?.tasks.find(t => t.id === taskId)
        if (task) {
          await addTaskCompletion({
            taskId,
            personId,
            date: today,
            pointsSnapshot: task.points,
            completedAt: new Date().toISOString(),
          })
        }
      }
    }

    const person = await getPersonById(personId)
    if (person) {
      const completions = await getCompletionsForPersonDate(personId, today)
      const dayScore = completions.reduce((s, c) => s + c.pointsSnapshot, 0)
      const goalReached = dayScore >= person.metaPoints ? 1 : 0
      await upsertDailySummary(personId, today, dayScore, person.metaPoints)

      const week = { start: startOfWeek(today), end: endOfWeek(today) }
      const month = { start: startOfMonth(today), end: endOfMonth(today) }

      const { data: weekComps } = await supabase
        .from('task_completions').select('*')
        .eq('person_id', personId).gte('date', week.start).lte('date', week.end)
      const weekScore = (weekComps || []).reduce((s, c) => s + c.points_snapshot, 0)

      const { data: monthComps } = await supabase
        .from('task_completions').select('*')
        .eq('person_id', personId).gte('date', month.start).lte('date', month.end)
      const monthScore = (monthComps || []).reduce((s, c) => s + c.points_snapshot, 0)

      const { data: allComps } = await supabase
        .from('task_completions').select('*')
        .eq('person_id', personId)
      const totalScore = (allComps || []).reduce((s, c) => s + c.points_snapshot, 0)

      const { data: allSummaries } = await supabase
        .from('daily_summary').select('*')
        .eq('person_id', personId)
      const summariesMapped = (allSummaries || []).map(r => ({
        personId: r.person_id, date: r.date, pointsEarned: r.points_earned,
        metaSnapshot: r.meta_snapshot, goalReached: r.goal_reached,
      }))
      const streak = calculateStreakFromSummaries(summariesMapped, today)

      if (streak > (person.bestStreak || 0)) {
        await updatePerson(personId, { bestStreak: streak })
      }

      const ranking = get().personStates.map(ps => {
        const updated = ps.person.id === personId
          ? { ...ps, dayScore, weekScore, monthScore, totalScore, streak, person: { ...ps.person, ...person } }
          : ps
        return {
          person: updated.person,
          totalScore: updated.totalScore,
          totalCompletions: updated.totalCompletions,
          streak: updated.streak,
          dayScore: updated.dayScore,
        }
      })
        .sort((a, b) => {
          if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore
          if (b.streak !== a.streak) return b.streak - a.streak
          return a.person.name.localeCompare(b.person.name)
        })
        .map((item, idx) => ({ ...item, position: idx + 1 }))

      set(state => ({
        ranking,
        personStates: state.personStates.map(ps => {
          if (ps.person.id !== personId) return ps
          return { ...ps, person: { ...ps.person, ...person }, dayScore, weekScore, monthScore, streak, totalScore }
        })
      }))
    }
  },

  reloadPersonTasks: async (personId) => {
    const today = todayStr()
    const [tasks, completions] = await Promise.all([
      getTasksForPersonAndDate(personId, today),
      getCompletionsForPersonDate(personId, today),
    ])
    const completedIds = new Set(completions.map(c => c.taskId))
    const tasksWithDone = tasks
      .filter(t => !t.isGlobal)
      .map(t => ({ ...t, isDone: completedIds.has(t.id) }))
    const dayScore = tasksWithDone.filter(t => t.isDone).reduce((s, t) => s + t.points, 0)
    const allDone = tasksWithDone.length > 0 && tasksWithDone.every(t => t.isDone)

    const rawGlobals = await getGlobalTasksForDate(today)
    const { persons } = get()
    const globalChallenges = rawGlobals.map(t => ({
      ...t,
      winnerName: t.globalWinnerId
        ? persons.find(p => p.id === t.globalWinnerId)?.name || null
        : null,
    }))

    set(state => ({
      globalChallenges,
      personStates: state.personStates.map(ps =>
        ps.person.id === personId ? { ...ps, tasks: tasksWithDone, dayScore, allDone } : ps
      )
    }))
  },

  reloadPersonData: async () => {
    await get().loadAll()
  },

  reorderTasks: async (personId, orderedTaskIds) => {
    set(state => ({
      personStates: state.personStates.map(ps => {
        if (ps.person.id !== personId) return ps
        const taskMap = new Map(ps.tasks.map(t => [t.id, t]))
        const reordered = orderedTaskIds.map(id => taskMap.get(id)).filter(Boolean)
        return { ...ps, tasks: reordered }
      }),
    }))

    await bulkUpdateTaskSortOrder(
      orderedTaskIds.map((id, i) => ({ id, sortOrder: i }))
    )
  },

  deleteTask: async (taskId, personId) => {
    // 1. Atualização Otimista (UX)
    set(state => ({
      personStates: state.personStates.map(ps => {
        if (ps.person.id !== personId) return ps
        const tasks = ps.tasks.filter(t => t.id !== taskId)
        const dayScore = tasks.filter(t => t.isDone).reduce((s, t) => s + t.points, 0)
        const allDone = tasks.length > 0 && tasks.every(t => t.isDone)
        return { ...ps, tasks, dayScore, allDone }
      })
    }))

    // 2. Atualização no Banco (isActive = 0)
    try {
      await updateTask(taskId, { isActive: 0 })
      // Recarregar para garantir consistência
      await get().loadAll()
    } catch (err) {
      console.error('deleteTask error:', err)
      await get().loadAll() // Reverter em caso de erro
    }
  },
}))

export default useAppStore
