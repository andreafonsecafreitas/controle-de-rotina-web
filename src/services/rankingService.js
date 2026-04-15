import { getPersons } from '../db/database'
import { getTotalScore, getTotalCompletions, getDayScore } from './gamificationService'
import { calculateStreak } from './streakService'
import { todayStr } from './dateUtils'

export async function buildRanking() {
  const persons = await getPersons()
  const today = todayStr()

  const items = await Promise.all(
    persons.map(async (p) => {
      const [totalScore, totalCompletions, streak, dayScore] = await Promise.all([
        getTotalScore(p.id),
        getTotalCompletions(p.id),
        calculateStreak(p.id),
        getDayScore(p.id, today),
      ])
      return { person: p, totalScore, totalCompletions, streak, dayScore }
    })
  )

  items.sort((a, b) => {
    if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore
    if (b.streak !== a.streak) return b.streak - a.streak
    if (b.totalCompletions !== a.totalCompletions) return b.totalCompletions - a.totalCompletions
    return a.person.name.localeCompare(b.person.name)
  })

  return items.map((item, idx) => ({ ...item, position: idx + 1 }))
}

export function getAchievements(item, ranking) {
  const achievements = []
  const leader = ranking[0]
  const isFirst = item.position === 1

  if (item.streak >= 7) achievements.push({ key: 'streak7', label: '7 dias seguidos', icon: '🏅' })
  else if (item.streak >= 3) achievements.push({ key: 'streak3', label: '3 dias seguidos', icon: '⚡' })

  if (isFirst && ranking.length > 1) {
    const diff = item.totalScore - ranking[1].totalScore
    if (diff >= 50) achievements.push({ key: 'domination', label: 'Dominação', icon: '💀' })
    if (item.dayScore > ranking[1].dayScore) {
      achievements.push({ key: 'leader', label: 'Líder absoluto', icon: '👑' })
    }
  }

  if (!isFirst && ranking.length > 1) {
    if (item.dayScore > leader.dayScore) {
      achievements.push({ key: 'comeback', label: 'Virada em curso', icon: '⚡' })
    }
  }

  return achievements
}
