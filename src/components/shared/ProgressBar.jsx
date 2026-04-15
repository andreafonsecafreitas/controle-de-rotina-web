import { motion } from 'framer-motion'

export default function ProgressBar({ value, max, color = '#6C63FF', height = 8, animated = true }) {
  const pct = Math.min(100, max > 0 ? (value / max) * 100 : 0)

  return (
    <div className="w-full rounded-full overflow-hidden bg-elevated" style={{ height }}>
      <motion.div
        initial={animated ? { width: 0 } : false}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="h-full rounded-full relative"
        style={{ background: `linear-gradient(90deg, ${color}, ${color}cc)`, minWidth: pct > 0 ? 8 : 0 }}
      >
        {pct >= 100 && (
          <div
            className="absolute inset-0 rounded-full"
            style={{ boxShadow: `0 0 8px ${color}88` }}
          />
        )}
      </motion.div>
    </div>
  )
}
