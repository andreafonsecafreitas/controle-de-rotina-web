import { create } from 'zustand'
import { db, getPersons, getTasksForPersonAndDate, getCompletionsForPersonDate, getDailySummariesForRange } from '../db/database'
import { getDayScore, getPeriodScore, getTotalScore, getTotalCompletions, refreshDailySummary } from '../services/gamificationService'
import { calculateStreak, closeMissedDays, updateBestStreak } from '../services/streakService'
import { buildRanking } from '../services/rankingService'
import { todayStr, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from '../services/dateUtils'

const useAppStore = create((set, get) => ({
  persons: [],
  personStates: [],
  ranking: [],
  activeTab: 0,
  isLoading: true,
  lastLoadedDate: null,

  setActiveTab: (tab) => set({ activeTab: tab }),

  loadAll: async () => {
    set({ isLoading: true })
    const today = todayStr()

    try {
      const persons = await getPersons()
      if (persons.length === 0) {
        set({ isLoading: false })
        return
      }

      await Promise.all(persons.map(p => closeMissedDays(p.id)))
      await Promise.all(persons.map(p => refreshDailySummary(p.id, today)))

      const week = { start: startOfWeek(today), end: endOfWeek(today) }
      const month = { start: startOfMonth(today), end: endOfMonth(today) }

      const personStates = await Promise.all(
        persons.map(async (p) => {
          const [tasks, completions, dayScore, weekScore, monthScore, totalScore, totalCompletions, streak] =
            await Promise.all([
              getTasksForPersonAndDate(p.id, today),
              getCompletionsForPersonDate(p.id, today),
              getDayScore(p.id, today),
              getPeriodScore(p.id, week.start, week.end),
              getPeriodScore(p.id, month.start, month.end),
              getTotalScore(p.id),
              getTotalCompletions(p.id),
              updateBestStreak(p.id),
            ])

          const completedIds = new Set(completions.map(c => c.taskId))
          const tasksWithDone = tasks.map(t => ({ ...t, isDone: completedIds.has(t.id) }))
          const allDone = tasksWithDone.length > 0 && tasksWithDone.every(t => t.isDone)

          return {
            person: { ...p },
            tasks: tasksWithDone,
            dayScore,
            weekScore,
            monthScore,
            totalScore,
            totalCompletions,
            streak,
            allDone,
          }
        })
      )

      const ranking = await buildRanking()

      set({ persons, personStates, ranking, isLoading: false, lastLoadedDate: today })
    } catch (err) {
      console.error('loadAll error:', err)
      set({ isLoading: false })
    }
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
      await db.taskCompletions.where('[taskId+date]').equals([taskId, today]).delete()
    } else {
      const already = await db.taskCompletions.where('[taskId+date]').equals([taskId, today]).first()
      if (!already) {
        const task = personStates.find(ps => ps.person.id === personId)?.tasks.find(t => t.id === taskId)
        if (task) {
          await db.taskCompletions.add({
            taskId,
            personId,
            date: today,
            pointsSnapshot: task.points,
            completedAt: new Date().toISOString(),
          })
        }
      }
    }

    await refreshDailySummary(personId, today)

    const week = { start: startOfWeek(today), end: endOfWeek(today) }
    const month = { start: startOfMonth(today), end: endOfMonth(today) }

    const [completions, person, streak, totalScore, weekScore, monthScore] = await Promise.all([
      getCompletionsForPersonDate(personId, today),
      db.persons.get(personId),
      updateBestStreak(personId),
      getTotalScore(personId),
      getPeriodScore(personId, week.start, week.end),
      getPeriodScore(personId, month.start, month.end),
    ])
    const dayScore = completions.reduce((s, c) => s + c.pointsSnapshot, 0)

    const ranking = await buildRanking()

    set(state => ({
      ranking,
      personStates: state.personStates.map(ps => {
        if (ps.person.id !== personId) return ps
        return { ...ps, person: { ...ps.person, ...person }, dayScore, weekScore, monthScore, streak, totalScore }
      })
    }))
  },

  reloadPersonTasks: async (personId) => {
    const today = todayStr()
    const [tasks, completions] = await Promise.all([
      getTasksForPersonAndDate(personId, today),
      getCompletionsForPersonDate(personId, today),
    ])
    const completedIds = new Set(completions.map(c => c.taskId))
    const tasksWithDone = tasks.map(t => ({ ...t, isDone: completedIds.has(t.id) }))
    const dayScore = tasksWithDone.filter(t => t.isDone).reduce((s, t) => s + t.points, 0)
    const allDone = tasksWithDone.length > 0 && tasksWithDone.every(t => t.isDone)

    set(state => ({
      personStates: state.personStates.map(ps =>
        ps.person.id === personId ? { ...ps, tasks: tasksWithDone, dayScore, allDone } : ps
      )
    }))
  },

  reloadPersonData: async () => {
    await get().loadAll()
  },
}))

export default useAppStore
