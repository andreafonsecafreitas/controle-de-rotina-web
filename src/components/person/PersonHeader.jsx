import ProgressBar from '../shared/ProgressBar'

export default function PersonHeader({ personState, color, colorHex }) {
  const { person, dayScore, streak } = personState
  const pct = Math.round(Math.min(100, (dayScore / person.metaPoints) * 100))

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="font-extrabold text-xl text-textprimary leading-tight">{person.name}</h2>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs font-semibold" style={{ color: colorHex }}>
              {dayScore} pts hoje
            </span>
            {streak > 0 && (
              <span className="flex items-center gap-1 text-xs font-semibold text-streak">
                🔥 {streak} dias
              </span>
            )}
          </div>
        </div>
        <div
          className="rounded-card px-3 py-2 text-center min-w-[56px]"
          style={{ background: `${colorHex}18`, border: `1px solid ${colorHex}44` }}
        >
          <div className="font-extrabold text-lg leading-none" style={{ color: colorHex }}>{pct}%</div>
          <div className="text-xs text-textsecondary mt-0.5">meta</div>
        </div>
      </div>

      <div>
        <ProgressBar value={dayScore} max={person.metaPoints} color={colorHex} height={7} />
        <div className="flex justify-between text-xs text-textdisabled mt-1">
          <span>{dayScore} pts</span>
          <span>meta: {person.metaPoints}</span>
        </div>
      </div>
    </div>
  )
}
