import { memo, useCallback, useMemo } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import PersonHeader from './PersonHeader'
import TaskCard from './TaskCard'
import CelebrationBanner from '../shared/CelebrationBanner'
import EmptyState from '../shared/EmptyState'
import useAppStore from '../../stores/useAppStore'

const COLORS = ['#6C63FF', '#FF6584']

const WEEKDAY_LABELS = {
  1: 'Seg', 2: 'Ter', 3: 'Qua', 4: 'Qui', 5: 'Sex', 6: 'Sáb', 7: 'Dom',
}

function getTaskSubtitle(task) {
  if (task.scheduledDate) {
    return new Date(task.scheduledDate + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  }
  if (!task.recurrenceDays || task.recurrenceDays.length === 0) return 'Todos os dias'
  if (task.recurrenceDays.length === 7) return 'Todos os dias'
  if (task.recurrenceDays.length === 5 && task.recurrenceDays.every(d => d <= 5)) return 'Dias úteis'
  if (task.recurrenceDays.length === 2 && task.recurrenceDays.includes(6) && task.recurrenceDays.includes(7)) return 'Fim de semana'
  return task.recurrenceDays.map(d => WEEKDAY_LABELS[d]).join(', ')
}

function PersonColumn({ personState, index, onManageTasks }) {
  const colorHex = COLORS[index]
  const reorderTasks = useAppStore(s => s.reorderTasks)

  const pending = useMemo(() => personState.tasks.filter(t => !t.isDone), [personState.tasks])
  const done = useMemo(() => personState.tasks.filter(t => t.isDone), [personState.tasks])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleDragEnd = useCallback((event) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = personState.tasks.findIndex(t => t.id === active.id)
    const newIndex = personState.tasks.findIndex(t => t.id === over.id)
    if (oldIndex < 0 || newIndex < 0) return

    const reordered = arrayMove(personState.tasks, oldIndex, newIndex)
    reorderTasks(personState.person.id, reordered.map(t => t.id))
  }, [personState.tasks, personState.person.id, reorderTasks])

  return (
    <div className="flex flex-col h-full">
      <PersonHeader personState={personState} colorHex={colorHex} />

      <CelebrationBanner show={personState.allDone} color={colorHex} name={personState.person.name} />

      <div className="flex-1 overflow-y-auto space-y-3 pr-0.5" style={{ maxHeight: 'calc(100vh - 320px)' }}>
        {personState.tasks.length === 0 ? (
          <EmptyState
            icon="📋"
            title="Nenhuma tarefa hoje"
            subtitle="Adicione tarefas para começar"
            action={
              <button
                onClick={() => onManageTasks(personState.person.id)}
                className="text-xs font-semibold px-4 py-2 rounded-full cursor-pointer transition-colors"
                style={{ background: `${colorHex}20`, color: colorHex }}
              >
                Adicionar tarefa
              </button>
            }
          />
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            {pending.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-2.5 px-1 flex items-center gap-2">
                  Pendentes
                  <span className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-extrabold" style={{ background: colorHex + '20', color: colorHex }}>
                    {pending.length}
                  </span>
                </p>
                <SortableContext
                  items={pending.map(t => t.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {pending.map(t => (
                      <TaskCard
                        key={t.id}
                        task={t}
                        personId={personState.person.id}
                        colorHex={colorHex}
                        subtitle={getTaskSubtitle(t)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </div>
            )}
            {done.length > 0 && (
              <div className={pending.length > 0 ? 'mt-5' : ''}>
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-2.5 px-1 flex items-center gap-2">
                  Concluídas
                  <span className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-extrabold" style={{ background: '#2ECC7120', color: '#2ECC71' }}>
                    {done.length}
                  </span>
                </p>
                <SortableContext
                  items={done.map(t => t.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {done.map(t => (
                      <TaskCard
                        key={t.id}
                        task={t}
                        personId={personState.person.id}
                        colorHex={colorHex}
                        subtitle={getTaskSubtitle(t)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </div>
            )}
          </DndContext>
        )}
      </div>
    </div>
  )
}

export default memo(PersonColumn)
