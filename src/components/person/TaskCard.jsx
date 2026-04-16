import { memo, useCallback } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Check } from 'lucide-react'
import useAppStore from '../../stores/useAppStore'

const GRADIENTS = {
  '#6C63FF': {
    card: 'linear-gradient(135deg, rgba(108,99,255,0.12) 0%, rgba(108,99,255,0.04) 100%)',
    cardDone: 'linear-gradient(135deg, rgba(108,99,255,0.06) 0%, rgba(108,99,255,0.02) 100%)',
    badge: 'linear-gradient(135deg, #6C63FF, #8B85FF)',
    glow: '0 4px 20px rgba(108,99,255,0.25)',
    checkBg: 'linear-gradient(135deg, #6C63FF, #9B8CFF)',
  },
  '#FF6584': {
    card: 'linear-gradient(135deg, rgba(255,101,132,0.12) 0%, rgba(255,101,132,0.04) 100%)',
    cardDone: 'linear-gradient(135deg, rgba(255,101,132,0.06) 0%, rgba(255,101,132,0.02) 100%)',
    badge: 'linear-gradient(135deg, #FF6584, #FF85A0)',
    glow: '0 4px 20px rgba(255,101,132,0.25)',
    checkBg: 'linear-gradient(135deg, #FF6584, #FF9BAD)',
  },
}

function TaskCard({ task, personId, colorHex, subtitle }) {
  const toggleTask = useAppStore(s => s.toggleTask)
  const gradient = GRADIENTS[colorHex] || GRADIENTS['#6C63FF']

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
    opacity: isDragging ? 0.7 : 1,
  }

  const handleToggle = useCallback((e) => {
    if (e.target.closest('[data-drag-handle]')) return
    toggleTask(task.id, personId, task.isDone)
  }, [task.id, task.isDone, personId, toggleTask])

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div
        onClick={handleToggle}
        className="flex items-center gap-3 p-3.5 rounded-2xl cursor-pointer select-none transition-all duration-200"
        style={{
          background: task.isDone ? gradient.cardDone : gradient.card,
          border: `1px solid ${task.isDone ? colorHex + '15' : colorHex + '25'}`,
          boxShadow: isDragging ? gradient.glow : 'none',
        }}
      >
        <button
          data-drag-handle
          {...listeners}
          onClick={e => e.stopPropagation()}
          className="p-1 -ml-1 text-white/15 hover:text-white/40 cursor-grab active:cursor-grabbing touch-none flex-shrink-0 transition-colors duration-150"
          aria-label="Arrastar"
        >
          <GripVertical size={14} strokeWidth={2.5} />
        </button>

        <div
          className="w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center transition-all duration-300"
          style={{
            background: task.isDone ? gradient.checkBg : 'transparent',
            border: task.isDone ? 'none' : `2px solid ${colorHex}40`,
            boxShadow: task.isDone ? `0 2px 10px ${colorHex}40` : 'none',
          }}
        >
          {task.isDone && (
            <Check size={14} strokeWidth={3} color="#fff" />
          )}
        </div>

        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
          style={{
            background: `linear-gradient(135deg, ${colorHex}18, ${colorHex}08)`,
            border: `1px solid ${colorHex}20`,
          }}
        >
          {task.icon || '⭐'}
        </div>

        <div className="flex-1 min-w-0">
          <p
            className="text-sm font-semibold leading-snug break-words transition-all duration-200"
            style={{
              color: task.isDone ? 'rgba(255,255,255,0.35)' : '#EAEAEA',
              textDecoration: task.isDone ? 'line-through' : 'none',
              wordBreak: 'break-word'
            }}
          >
            {task.name}
          </p>
          {subtitle && (
            <p className="text-[10px] text-white/30 mt-0.5 truncate">{subtitle}</p>
          )}
        </div>

        <span
          className="text-xs font-extrabold flex-shrink-0 px-2.5 py-1.5 rounded-xl transition-all duration-200"
          style={{
            background: task.isDone ? `${colorHex}10` : gradient.badge,
            color: task.isDone ? `${colorHex}80` : '#fff',
            boxShadow: task.isDone ? 'none' : `0 2px 8px ${colorHex}30`,
          }}
        >
          +{task.points}
        </span>
      </div>
    </div>
  )
}

export default memo(TaskCard)
