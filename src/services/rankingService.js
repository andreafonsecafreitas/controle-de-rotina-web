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
