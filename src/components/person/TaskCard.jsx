import { memo, useCallback } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Check, Trash2 } from 'lucide-react'
import useAppStore from '../../stores/useAppStore'
import './TaskCard.css'

function TaskCard({ task, personId, colorHex, subtitle }) {
  const toggleTask = useAppStore(s => s.toggleTask)
  const deleteTask = useAppStore(s => s.deleteTask)
  
  const isPurple = colorHex === '#6C63FF'
  const variantClass = isPurple ? 'task-card-purple' : 'task-card-pink'

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const dndStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const handleToggle = useCallback((e) => {
    if (e.target.closest('.no-toggle')) return
    toggleTask(task.id, personId, task.isDone)
  }, [task.id, task.isDone, personId, toggleTask])

  const handleDelete = useCallback((e) => {
    e.stopPropagation()
    if (confirm(`Excluir a tarefa "${task.name}"?`)) {
      deleteTask(task.id, personId)
    }
  }, [task.id, task.name, personId, deleteTask])

  return (
    <div 
      ref={setNodeRef} 
      style={dndStyle} 
      {...attributes}
      className={isDragging ? 'task-card-dragging' : ''}
    >
      <div
        onClick={handleToggle}
        className={`task-card-container ${variantClass} ${task.isDone ? 'task-card-is-done' : ''}`}
        style={{
          background: task.isDone ? 'var(--bg-done)' : 'var(--bg)',
          border: `1px solid ${task.isDone ? 'var(--border-done)' : 'var(--border)'}`,
        }}
      >
        <button
          className="task-card-drag-handle no-toggle"
          {...listeners}
          onClick={e => e.stopPropagation()}
          aria-label="Arrastar"
        >
          <GripVertical size={14} strokeWidth={2.5} />
        </button>

        <div
          className="task-card-check-wrapper"
          style={{
            background: task.isDone ? 'var(--check-bg)' : 'transparent',
            border: task.isDone ? 'none' : `2px solid var(--accent)40`,
            boxShadow: task.isDone ? `0 2px 10px var(--accent)40` : 'none',
          }}
        >
          {task.isDone && <Check size={14} strokeWidth={3} color="#fff" />}
        </div>

        <div
          className="task-card-icon-box"
          style={{
            background: `linear-gradient(135deg, ${colorHex}18, ${colorHex}08)`,
            borderColor: `${colorHex}20`,
          }}
        >
          {task.icon || '⭐'}
        </div>

        <div className="task-card-content">
          <p 
            className="task-card-name"
            style={{ color: task.isDone ? 'rgba(255,255,255,0.35)' : '#EAEAEA' }}
          >
            {task.name}
          </p>
          {subtitle && <p className="task-card-subtitle">{subtitle}</p>}
        </div>

        <span
          className="task-card-points"
          style={{
            background: task.isDone ? `${colorHex}10` : 'var(--badge)',
            color: task.isDone ? `${colorHex}80` : '#fff',
            boxShadow: task.isDone ? 'none' : `0 2px 8px ${colorHex}30`,
          }}
        >
          +{task.points}
        </span>

        <button
          onClick={handleDelete}
          className="task-card-delete-btn no-toggle"
          aria-label="Excluir tarefa"
        >
          <Trash2 size={16} strokeWidth={2} />
        </button>
      </div>
    </div>
  )
}

export default memo(TaskCard)
