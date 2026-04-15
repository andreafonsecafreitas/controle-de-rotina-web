import { motion } from 'framer-motion'
import useAppStore from '../../stores/useAppStore'

export default function TaskCard({ task, personId, colorHex }) {
  const toggleTask = useAppStore(s => s.toggleTask)

  function handleToggle() {
    toggleTask(task.id, personId, task.isDone)
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      onClick={handleToggle}
      className="flex items-center gap-3 px-4 py-3 rounded-md2 cursor-pointer transition-all duration-200 select-none"
      style={{
        background: task.isDone ? `${colorHex}14` : '#22263A',
        border: `1px solid ${task.isDone ? colorHex + '55' : '#2A2E42'}`,
        opacity: task.isDone ? 0.85 : 1,
      }}
    >
      <div
        className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center transition-all duration-200"
        style={{
          background: task.isDone ? colorHex : 'transparent',
          border: `2px solid ${task.isDone ? colorHex : '#4A4F68'}`,
        }}
      >
        {task.isDone && (
          <motion.svg
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            width="12" height="12" viewBox="0 0 12 12" fill="none"
          >
            <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </motion.svg>
        )}
      </div>

      <span className="text-xl flex-shrink-0">{task.icon || '✅'}</span>

      <span
        className="flex-1 text-sm font-medium leading-snug transition-all duration-200"
        style={{
          color: task.isDone ? '#8A8FA8' : '#EAEAEA',
          textDecoration: task.isDone ? 'line-through' : 'none',
        }}
      >
        {task.name}
      </span>

      <span
        className="text-xs font-bold flex-shrink-0 px-2 py-0.5 rounded-full"
        style={{
          color: task.isDone ? colorHex : '#8A8FA8',
          background: task.isDone ? `${colorHex}20` : '#2A2E42',
        }}
      >
        +{task.points}
      </span>
    </motion.div>
  )
}
