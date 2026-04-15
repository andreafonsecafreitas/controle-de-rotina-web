import PersonHeader from './PersonHeader'
import TaskCard from './TaskCard'
import CelebrationBanner from '../shared/CelebrationBanner'
import EmptyState from '../shared/EmptyState'

const COLORS = ['#6C63FF', '#FF6584']

export default function PersonColumn({ personState, index, onManageTasks }) {
  const colorHex = COLORS[index]
  const pending = personState.tasks.filter(t => !t.isDone)
  const done = personState.tasks.filter(t => t.isDone)

  return (
    <div className="flex flex-col h-full">
      <PersonHeader personState={personState} colorHex={colorHex} />

      <CelebrationBanner show={personState.allDone} color={colorHex} name={personState.person.name} />

      <div className="flex-1 overflow-y-auto space-y-2 pr-0.5" style={{ maxHeight: 'calc(100vh - 320px)' }}>
        {personState.tasks.length === 0 ? (
          <EmptyState
            icon="📋"
            title="Nenhuma tarefa hoje"
            subtitle="Adicione tarefas para começar"
            action={
              <button
                onClick={onManageTasks}
                className="text-xs font-semibold px-4 py-2 rounded-full cursor-pointer transition-colors"
                style={{ background: `${colorHex}20`, color: colorHex }}
              >
                Gerenciar tarefas
              </button>
            }
          />
        ) : (
          <>
            {pending.length > 0 && (
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-textdisabled mb-2 px-1">
                  Pendentes · {pending.length}
                </p>
                <div className="space-y-1.5">
                  {pending.map(t => (
                    <TaskCard key={t.id} task={t} personId={personState.person.id} colorHex={colorHex} />
                  ))}
                </div>
              </div>
            )}
            {done.length > 0 && (
              <div className={pending.length > 0 ? 'mt-4' : ''}>
                <p className="text-xs font-bold uppercase tracking-widest text-textdisabled mb-2 px-1">
                  Concluídas · {done.length}
                </p>
                <div className="space-y-1.5">
                  {done.map(t => (
                    <TaskCard key={t.id} task={t} personId={personState.person.id} colorHex={colorHex} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
