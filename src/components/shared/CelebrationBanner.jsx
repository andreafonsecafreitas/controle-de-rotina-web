import { motion, AnimatePresence } from 'framer-motion'

export default function CelebrationBanner({ show, color = '#6C63FF', name }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 18 }}
          className="rounded-card px-4 py-3 flex items-center gap-3 mb-3"
          style={{ background: `${color}20`, border: `1px solid ${color}55` }}
        >
          <span className="text-2xl">🔥</span>
          <div>
            <p className="font-bold text-sm" style={{ color }}>Tudo feito!</p>
            <p className="text-textsecondary text-xs">{name} completou todas as tarefas de hoje!</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
