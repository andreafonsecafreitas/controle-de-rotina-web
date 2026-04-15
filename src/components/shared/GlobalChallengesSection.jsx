import { motion } from 'framer-motion'
import { Trophy } from 'lucide-react'
import useAppStore from '../../stores/useAppStore'

const COLORS = ['#6C63FF', '#FF6584']

export default function GlobalChallengesSection() {
  const globalChallenges = useAppStore(s => s.globalChallenges)
  const personStates = useAppStore(s => s.personStates)
  const claimGlobalChallenge = useAppStore(s => s.claimGlobalChallenge)

  if (!globalChallenges || globalChallenges.length === 0) return null

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2">
        <Trophy size={14} className="text-yellow-400" />
        <p className="text-xs font-bold uppercase tracking-widest text-yellow-400">Desafios — Quem fizer primeiro ganha</p>
      </div>
      <div className="space-y-2">
        {globalChallenges.map(task => (
          <GlobalChallengeCard
            key={task.id}
            task={task}
            personStates={personStates}
            onClaim={claimGlobalChallenge}
          />
        ))}
      </div>
    </div>
  )
}

function GlobalChallengeCard({ task, personStates, onClaim }) {
  const isWon = !!task.globalWinnerId
  const winnerIdx = personStates.findIndex(ps => ps.person.id === task.globalWinnerId)
  const winnerColor = winnerIdx >= 0 ? COLORS[winnerIdx] : '#FFD700'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-md2 border overflow-hidden"
      style={{
        background: isWon ? `${winnerColor}10` : '#22263A',
        borderColor: isWon ? winnerColor + '50' : '#FFD70040',
      }}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <span className="text-xl flex-shrink-0">{task.icon}</span>
        <div className="flex-1 min-w-0">
          <p
            className="text-sm font-medium leading-snug"
            style={{ color: isWon ? '#8A8FA8' : '#EAEAEA', textDecoration: isWon ? 'line-through' : 'none' }}
          >
            {task.name}
          </p>
          {isWon && (
            <p className="text-xs mt-0.5" style={{ color: winnerColor }}>
              🏆 {task.winnerName} completou primeiro!
            </p>
          )}
        </div>
        <span
          className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
          style={{ color: '#FFD700', background: '#FFD70020' }}
        >
          +{task.points}
        </span>
      </div>

      {!isWon && (
        <div className="flex border-t border-yellow-500/20">
          {personStates.map((ps, i) => (
            <button
              key={ps.person.id}
              onClick={() => onClaim(task.id, ps.person.id)}
              className="flex-1 py-2 text-xs font-bold transition-all cursor-pointer"
              style={{
                color: COLORS[i],
                background: 'transparent',
                borderRight: i === 0 ? '1px solid rgba(255,215,0,0.2)' : 'none',
              }}
              onMouseEnter={e => e.currentTarget.style.background = COLORS[i] + '20'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {ps.person.name} fez!
            </button>
          ))}
        </div>
      )}
    </motion.div>
  )
}
