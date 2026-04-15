import ProgressBar from '../shared/ProgressBar'
import useAppStore from '../../stores/useAppStore'
import { todayStr, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from '../../services/dateUtils'

const COLORS = ['#6C63FF', '#FF6584']

function PeriodCard({ personState, index, score, label, days }) {
  const colorHex = COLORS[index]
  const metaTotal = personState.person.metaPoints * days
  const pct = Math.round(Math.min(100, metaTotal > 0 ? (score / metaTotal) * 100 : 0))

  return (
    <div
      className="bg-surface rounded-card p-5 border flex-1"
      style={{ borderColor: colorHex + '33' }}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-extrabold text-lg text-textprimary">{personState.person.name}</h3>
          <p className="text-textsecondary text-xs mt-0.5">{label}</p>
        </div>
        <div
          className="rounded-card px-3 py-2 text-center"
          style={{ background: colorHex + '18', border: `1px solid ${colorHex}44` }}
        >
          <div className="font-extrabold text-xl" style={{ color: colorHex }}>{pct}%</div>
          <div className="text-xs text-textsecondary">meta</div>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-xs text-textsecondary mb-1.5">
            <span>Pontos</span>
            <span className="font-semibold" style={{ color: colorHex }}>{score} / {metaTotal}</span>
          </div>
          <ProgressBar value={score} max={metaTotal} color={colorHex} height={8} animated />
        </div>

        <div className="grid grid-cols-3 gap-2 pt-1">
          <StatChip label="Pontos hoje" value={personState.dayScore} color={colorHex} />
          <StatChip label="Streak" value={`🔥 ${personState.streak}`} color="#FF9F43" />
          <StatChip label="Total geral" value={personState.totalScore} color="#8A8FA8" />
        </div>
      </div>
    </div>
  )
}

function StatChip({ label, value, color }) {
  return (
    <div className="bg-elevated rounded-md2 p-2.5 text-center">
      <div className="font-bold text-sm" style={{ color }}>{value}</div>
      <div className="text-xs text-textdisabled mt-0.5 leading-tight">{label}</div>
    </div>
  )
}

export default function PeriodTab({ mode }) {
  const personStates = useAppStore(s => s.personStates)
  const today = todayStr()

  let label, days, score0, score1

  if (mode === 'week') {
    const start = startOfWeek(today)
    const end = endOfWeek(today)
    const d0 = new Date(start + 'T00:00:00')
    const d1 = new Date(end + 'T00:00:00')
    days = Math.round((d1 - d0) / 86400000) + 1
    label = `Semana: ${formatDate(start)} – ${formatDate(end)}`
    score0 = personStates[0]?.weekScore ?? 0
    score1 = personStates[1]?.weekScore ?? 0
  } else {
    const start = startOfMonth(today)
    const end = endOfMonth(today)
    const d0 = new Date(start + 'T00:00:00')
    const d1 = new Date(end + 'T00:00:00')
    days = Math.round((d1 - d0) / 86400000) + 1
    label = `Mês: ${formatDate(start)} – ${formatDate(end)}`
    score0 = personStates[0]?.monthScore ?? 0
    score1 = personStates[1]?.monthScore ?? 0
  }

  if (personStates.length === 0) return null
  const scores = [score0, score1]

  const winner = scores[0] > scores[1] ? 0 : scores[1] > scores[0] ? 1 : -1

  return (
    <div className="flex flex-col gap-4 h-full">
      {winner >= 0 && (
        <div
          className="rounded-card px-4 py-3 flex items-center gap-3"
          style={{ background: COLORS[winner] + '15', border: `1px solid ${COLORS[winner]}44` }}
        >
          <span className="text-2xl">👑</span>
          <p className="text-sm font-semibold" style={{ color: COLORS[winner] }}>
            {personStates[winner].person.name} está na frente com {scores[winner]} pts
          </p>
        </div>
      )}

      <div className="flex flex-col tablet:flex-row gap-4 flex-1">
        {personStates.map((ps, i) => (
          <PeriodCard key={ps.person.id} personState={ps} index={i} score={scores[i]} label={label} days={days} />
        ))}
      </div>
    </div>
  )
}

function formatDate(dateStr) {
  const [, m, d] = dateStr.split('-')
  return `${d}/${m}`
}
