import { memo } from 'react'

function ProgressBar({ value, max, color = '#6C63FF', height = 8 }) {
  const pct = Math.min(100, max > 0 ? (value / max) * 100 : 0)

  return (
    <div className="w-full rounded-full overflow-hidden bg-elevated" style={{ height }}>
      <div
        className="h-full rounded-full relative transition-all duration-700 ease-out"
        style={{
          width: `${pct}%`,
          background: `linear-gradient(90deg, ${color}, ${color}cc)`,
          minWidth: pct > 0 ? 8 : 0,
        }}
      >
        {pct >= 100 && (
          <div
            className="absolute inset-0 rounded-full"
            style={{ boxShadow: `0 0 8px ${color}88` }}
          />
        )}
      </div>
    </div>
  )
}

export default memo(ProgressBar)
