import { motion } from 'framer-motion'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import useAppStore from '../../stores/useAppStore'

export default function TaskCard({ task, personId, colorHex, subtitle }) {
  const toggleTask = useAppStore(s => s.toggleTask)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.5 : 1,
  }

  function handleToggle(e) {
    if (e.target.closest('[data-drag-handle]')) return
    toggleTask(task.id, personId, task.isDone)
  }

  const iconBg = task.isDone ? colorHex + '20' : colorHex + '18'
  const iconBorder = task.isDone ? colorHex + '55' : colorHex + '30'

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: isDragging ? 0.5 : 1, y: 0 }}
      transition={{ duration: 0.2 }}
      onClick={handleToggle}
      {...attributes}
      className="flex items-center gap-2.5 p-3 rounded-2xl cursor-pointer transition-all duration-200 select-none"
    >
      <button
        data-drag-handle
        {...listeners}
        onClick={e => e.stopPropagation()}
        className="p-1 -ml-1 text-white/15 hover:text-white/50 cursor-grab active:cursor-grabbing touch-none flex-shrink-0"
        aria-label="Arrastar"
      >
        <GripVertical size={15} />
      </button>

      <div
        className="flex-1 flex items-center gap-3 p-3 rounded-2xl transition-colors duration-200"
        style={{
          background: task.isDone ? colorHex + '0d' : 'rgba(255,255,255,0.025)',
          border: `1px solid ${task.isDone ? colorHex + '40' : 'rgba(255,255,255,0.06)'}`,
        }}
      >
        <div
          className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center transition-all duration-200"
          style={{
            background: task.isDone ? colorHex : 'transparent',
            border: `2px solid ${task.isDone ? colorHex : 'rgba(255,255,255,0.18)'}`,
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

        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xl border"
          style={{ background: iconBg, borderColor: iconBorder }}
        >
          {task.icon || '⭐'}
        </div>

        <div className="flex-1 min-w-0">
          <p
            className="text-sm font-semibold leading-tight truncate"
            style={{
              color: task.isDone ? 'rgba(255,255,255,0.5)' : '#EAEAEA',
              textDecoration: task.isDone ? 'line-through' : 'none',
            }}
          >
            {task.name}
          </p>
          {subtitle && (
            <p className="text-[11px] text-white/40 mt-0.5 truncate">{subtitle}</p>
          )}
        </div>

        <span
          className="text-xs font-bold flex-shrink-0 px-2.5 py-1 rounded-full"
          style={{
            color: colorHex,
            background: task.isDone ? colorHex + '22' : colorHex + '14',
          }}
        >
          +{task.points}
        </span>
      </div>
    </motion.div>
  )
}
