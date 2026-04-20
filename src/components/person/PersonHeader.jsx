import { memo } from 'react'
import ProgressBar from '../shared/ProgressBar'

const GRADIENTS = {
  '#6C63FF': 'linear-gradient(135deg, #6C63FF, #9B8CFF)',
  '#FF6584': 'linear-gradient(135deg, #FF6584, #FF9BAD)',
}

function PersonHeader({ personState, colorHex }) {
  const { person, dayScore, streak } = personState
  const pct = Math.round(Math.min(100, (dayScore / person.metaPoints) * 100))

  return (
    <div className="mb-5">
      <div className="flex items-center gap-3.5 mb-4">
        <div
          className="w-13 h-13 rounded-full flex items-center justify-center text-xl font-extrabold flex-shrink-0"
          style={{
            width: '56px',
            height: '56px',
            background: GRADIENTS[colorHex] || GRADIENTS['#6C63FF'],
            color: '#fff',
            boxShadow: `0 6px 20px ${colorHex}45`,
          }}
        >
          {person.name[0]?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-extrabold text-xl lg:text-2xl text-white leading-tight truncate">{person.name}</h2>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-[14px] font-semibold" style={{ color: colorHex }}>
              {dayScore} pts hoje
            </span>
            {streak > 0 && (
              <>
                <span className="text-white/20">·</span>
                <span className="flex items-center gap-1 text-[14px] font-semibold text-orange-400">
                  {streak}d seguidos
                </span>
              </>
            )}
          </div>
        </div>
        <div
          className="rounded-xl px-3 py-2 text-center min-w-[64px]"
          style={{
            background: `linear-gradient(135deg, ${colorHex}20, ${colorHex}08)`,
            border: `1px solid ${colorHex}35`,
          }}
        >
          <div className="font-extrabold text-lg leading-none" style={{ color: colorHex }}>{pct}%</div>
          <div className="text-[11px] text-white/40 mt-1 uppercase tracking-wider font-semibold">meta</div>
        </div>
      </div>

      <div>
        <ProgressBar value={dayScore} max={person.metaPoints} color={colorHex} height={12} />
        <div className="flex justify-between text-[13px] text-white/40 mt-2.5 font-medium">
          <span>{dayScore} pts</span>
          <span>meta: {person.metaPoints}</span>
        </div>
      </div>
    </div>
  )
}

export default memo(PersonHeader)
