import ProgressBar from '../shared/ProgressBar'

export default function PersonHeader({ personState, colorHex }) {
  const { person, dayScore, streak } = personState
  const pct = Math.round(Math.min(100, (dayScore / person.metaPoints) * 100))

  return (
    <div className="mb-4">
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center text-base font-extrabold flex-shrink-0"
          style={{
            background: `linear-gradient(135deg, ${colorHex}, ${colorHex}aa)`,
            color: '#fff',
            boxShadow: `0 6px 20px ${colorHex}40`,
          }}
        >
          {person.name[0]?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-extrabold text-base text-white leading-tight truncate">{person.name}</h2>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[11px] font-semibold" style={{ color: colorHex }}>
              {dayScore} pts hoje
            </span>
            {streak > 0 && (
              <>
                <span className="text-white/20">·</span>
                <span className="flex items-center gap-1 text-[11px] font-semibold text-orange-400">
                  🔥 {streak}d
                </span>
              </>
            )}
          </div>
        </div>
        <div
          className="rounded-xl px-2.5 py-1.5 text-center min-w-[48px]"
          style={{ background: `${colorHex}18`, border: `1px solid ${colorHex}35` }}
        >
          <div className="font-extrabold text-sm leading-none" style={{ color: colorHex }}>{pct}%</div>
          <div className="text-[9px] text-white/40 mt-0.5 uppercase tracking-wider">meta</div>
        </div>
      </div>

      <div>
        <ProgressBar value={dayScore} max={person.metaPoints} color={colorHex} height={6} />
        <div className="flex justify-between text-[10px] text-white/35 mt-1.5">
          <span>{dayScore} pts</span>
          <span>meta: {person.metaPoints}</span>
        </div>
      </div>
    </div>
  )
}
