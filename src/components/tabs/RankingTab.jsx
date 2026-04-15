import { motion } from 'framer-motion'
import { useShallow } from 'zustand/react/shallow'
import useAppStore from '../../stores/useAppStore'
import { getAchievements } from '../../services/rankingService'
import ProgressBar from '../shared/ProgressBar'

const COLORS = ['#6C63FF', '#FF6584']
const POSITION_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32']

export default function RankingTab() {
  const { ranking, personStates } = useAppStore(useShallow(s => ({ ranking: s.ranking, personStates: s.personStates })))

  if (ranking.length === 0) return null

  const leader = ranking[0]
  const runner = ranking[1]

  const getColorForPerson = (personId) => {
    const idx = personStates.findIndex(ps => ps.person.id === personId)
    return COLORS[idx] ?? COLORS[0]
  }

  return (
    <div className="flex flex-col gap-5">
      {ranking.length >= 2 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-card p-5 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #6C63FF18, #FF658418)', border: '1px solid #2A2E42' }}
        >
          <p className="text-xs font-bold uppercase tracking-widest text-textdisabled mb-4">Duelo</p>
          <div className="flex items-center gap-3">
            <div className="flex-1 text-center">
              <div className="font-extrabold text-base" style={{ color: getColorForPerson(leader.person.id) }}>
                {leader.person.name}
              </div>
              <div className="text-2xl font-extrabold text-textprimary mt-1">{leader.totalScore}</div>
              <div className="text-xs text-textsecondary">pontos</div>
            </div>

            <div className="flex flex-col items-center px-2">
              <span className="text-2xl">⚔️</span>
              {leader.totalScore > runner.totalScore && (
                <span className="text-xs text-gold font-bold mt-1">
                  +{leader.totalScore - runner.totalScore}
                </span>
              )}
            </div>

            <div className="flex-1 text-center">
              <div className="font-extrabold text-base" style={{ color: getColorForPerson(runner.person.id) }}>
                {runner.person.name}
              </div>
              <div className="text-2xl font-extrabold text-textprimary mt-1">{runner.totalScore}</div>
              <div className="text-xs text-textsecondary">pontos</div>
            </div>
          </div>

          <div className="mt-4 flex gap-1 items-center">
            <div
              className="h-2 rounded-l-full transition-all duration-700"
              style={{
                flex: leader.totalScore || 1,
                background: getColorForPerson(leader.person.id),
              }}
            />
            <div
              className="h-2 rounded-r-full transition-all duration-700"
              style={{
                flex: runner.totalScore || 1,
                background: getColorForPerson(runner.person.id),
              }}
            />
          </div>
        </motion.div>
      )}

      <div className="flex flex-col gap-3">
        <p className="text-xs font-bold uppercase tracking-widest text-textdisabled">Classificação</p>

        {ranking.map((item, idx) => {
          const achievements = getAchievements(item, ranking)
          const colorHex = getColorForPerson(item.person.id)
          const maxScore = ranking[0].totalScore || 1

          return (
            <motion.div
              key={item.person.id}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-surface rounded-card p-4 border"
              style={{ borderColor: colorHex + '33' }}
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-lg flex-shrink-0"
                  style={{
                    background: POSITION_COLORS[idx] + '22',
                    color: POSITION_COLORS[idx] ?? colorHex,
                    border: `2px solid ${POSITION_COLORS[idx] ?? colorHex}66`,
                  }}
                >
                  {idx + 1}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-extrabold text-base text-textprimary truncate">{item.person.name}</h3>
                    <span className="font-extrabold text-base ml-2 flex-shrink-0" style={{ color: colorHex }}>
                      {item.totalScore} pts
                    </span>
                  </div>

                  <ProgressBar value={item.totalScore} max={maxScore} color={colorHex} height={5} animated />

                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-xs text-textsecondary">
                      🔥 <span className="text-streak font-semibold">{item.streak}</span> streak
                    </span>
                    <span className="text-xs text-textsecondary">
                      ✅ <span className="font-semibold text-textprimary">{item.totalCompletions}</span> conclusões
                    </span>
                    <span className="text-xs text-textsecondary">
                      hoje: <span className="font-semibold" style={{ color: colorHex }}>{item.dayScore}</span>
                    </span>
                  </div>

                  {achievements.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {achievements.map(a => (
                        <span
                          key={a.key}
                          className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: colorHex + '20', color: colorHex }}
                        >
                          {a.icon} {a.label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {ranking.map((item, idx) => {
          const colorHex = getColorForPerson(item.person.id)
          return (
            <div
              key={item.person.id}
              className="bg-surface rounded-card p-4 border"
              style={{ borderColor: colorHex + '33' }}
            >
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: colorHex }}>
                {item.person.name}
              </p>
              <div className="space-y-2">
                <StatRow label="Total de pontos" value={item.totalScore} color={colorHex} />
                <StatRow label="Melhor streak" value={`🔥 ${item.person.bestStreak ?? 0} dias`} color="#FF9F43" />
                <StatRow label="Streak atual" value={`${item.streak} dias`} color="#FF9F43" />
                <StatRow label="Total concluído" value={`${item.totalCompletions}x`} color={colorHex} />
                <StatRow label="Pontos hoje" value={item.dayScore} color={colorHex} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function StatRow({ label, value, color }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-textsecondary">{label}</span>
      <span className="text-xs font-bold" style={{ color }}>{value}</span>
    </div>
  )
}
