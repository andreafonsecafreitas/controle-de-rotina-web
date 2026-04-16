import { memo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import useAppStore from '../../stores/useAppStore'

function TaskCard({ task, personId, colorHex, subtitle }) {
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
  }

  const handleToggle = useCallback((e) => {
    if (e.target.closest('[data-drag-handle]')) return
    toggleTask(task.id, personId, task.isDone)
  }, [task.id, task.isDone, personId, toggleTask])

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.15 }}
      className="group"
    >
      <div
        onClick={handleToggle}
        className="flex items-center gap-2.5 p-3.5 rounded-2xl cursor-pointer transition-all duration-150 select-none hover:bg-white/[0.04] border border-white/5 hover:border-white/10"
        style={{
          background: task.isDone ? colorHex + '08' : 'transparent',
        }}
      >
        <button
          data-drag-handle
          {...listeners}
          onClick={e => e.stopPropagation()}
          className="p-1.5 -ml-1 text-white/20 hover:text-white/60 cursor-grab active:cursor-grabbing touch-none flex-shrink-0 transition-colors"
          aria-label="Arrastar"
        >
          <GripVertical size={14} strokeWidth={2.5} />
        </button>

        <div
          className="w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center font-bold flex-center transition-all duration-200 border-2"
          style={{
            background: task.isDone ? colorHex : 'transparent',
            borderColor: task.isDone ? colorHex : colorHex + '50',
            color: task.isDone ? '#fff' : colorHex,
          }}
        >
          {task.isDone ? (
            <motion.svg
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              width="14" height="14" viewBox="0 0 14 14" fill="none"
            >
              <path d="M3 7L6 10L11 3" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </motion.svg>
          ) : null}
        </div>

        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 text-lg border"
          style={{
            background: colorHex + '12',
            borderColor: colorHex + '30',
          }}
        >
          {task.icon || '⭐'}
        </div>

        <div className="flex-1 min-w-0">
          <p
            className="text-sm font-medium leading-snug truncate transition-all duration-150"
            style={{
              color: task.isDone ? 'rgba(255,255,255,0.45)' : '#EAEAEA',
              textDecoration: task.isDone ? 'line-through' : 'none',
            }}
          >
            {task.name}
          </p>
          {subtitle && (
            <p className="text-[10px] text-white/35 mt-0.5 truncate">{subtitle}</p>
          )}
        </div>

        <motion.span
          whileHover={{ scale: 1.05 }}
          className="text-xs font-bold flex-shrink-0 px-2.5 py-1.5 rounded-lg transition-all duration-150"
          style={{
            color: colorHex,
            background: colorHex + '18',
            border: `1px solid ${colorHex}30`,
          }}
        >
          +{task.points}
        </motion.span>
      </div>
    </motion.div>
  )
}

export default memo(TaskCard)
