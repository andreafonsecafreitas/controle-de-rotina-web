import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Trash2, GripVertical } from 'lucide-react'
import { db, getTasksForPerson } from '../../db/database'
import useAppStore from '../../stores/useAppStore'

const EMOJIS = ['⭐', '📚', '💪', '🧘', '🥗', '💻', '📝', '🚶', '🏃', '🤸', '✨', '🎨', '🎵', '🛏️', '💧', '🦷', '🏋️', '🥤', '🧹', '🎯', '📖', '🌅', '🏊', '🚴']
const COLORS = ['#6C63FF', '#FF6584']

export default function ManageTasksModal({ open, onClose, initialPersonId }) {
  const personStates = useAppStore(s => s.personStates)
  const reloadPersonTasks = useAppStore(s => s.reloadPersonTasks)
  const [activePersonIdx, setActivePersonIdx] = useState(0)
  const [tasks, setTasks] = useState([])
  const [newTask, setNewTask] = useState({ name: '', points: 20, icon: '⭐' })
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [loading, setLoading] = useState(false)

  const activePerson = personStates[activePersonIdx]?.person
  const colorHex = COLORS[activePersonIdx]

  useEffect(() => {
    if (open && initialPersonId) {
      const idx = personStates.findIndex(ps => ps.person.id === initialPersonId)
      if (idx >= 0) setActivePersonIdx(idx)
    }
  }, [open, initialPersonId])

  useEffect(() => {
    if (open && activePerson) loadTasks()
  }, [open, activePersonIdx, activePerson])

  async function loadTasks() {
    if (!activePerson) return
    const t = await getTasksForPerson(activePerson.id)
    setTasks(t)
  }

  async function addTask() {
    if (!newTask.name.trim() || !activePerson) return
    setLoading(true)
    const maxOrder = tasks.length > 0 ? Math.max(...tasks.map(t => t.sortOrder)) + 1 : 0
    await db.tasks.add({
      personId: activePerson.id,
      name: newTask.name.trim(),
      points: newTask.points,
      icon: newTask.icon,
      sortOrder: maxOrder,
      isActive: 1,
      recurrenceDays: [],
      createdAt: new Date().toISOString(),
    })
    setNewTask({ name: '', points: 20, icon: '⭐' })
    await loadTasks()
    await reloadPersonTasks(activePerson.id)
    setLoading(false)
  }

  async function deleteTask(taskId) {
    await db.tasks.update(taskId, { isActive: 0 })
    await loadTasks()
    await reloadPersonTasks(activePerson.id)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') addTask()
  }

  if (!open) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end tablet:items-center justify-center bg-black/60 backdrop-blur-sm px-0 tablet:px-4"
        onClick={e => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 60, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 280, damping: 28 }}
          className="bg-surface w-full tablet:max-w-xl rounded-t-[24px] tablet:rounded-card border border-border flex flex-col"
          style={{ maxHeight: '88vh' }}
        >
          <div className="flex items-center justify-between p-5 border-b border-border flex-shrink-0">
            <h2 className="font-extrabold text-lg text-textprimary">Gerenciar Tarefas</h2>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-elevated transition-colors cursor-pointer">
              <X size={20} className="text-textsecondary" />
            </button>
          </div>

          <div className="flex p-4 gap-2 flex-shrink-0 border-b border-border">
            {personStates.map((ps, i) => (
              <button
                key={ps.person.id}
                onClick={() => setActivePersonIdx(i)}
                className="flex-1 py-2 rounded-md2 text-sm font-bold transition-all duration-200 cursor-pointer"
                style={{
                  background: activePersonIdx === i ? COLORS[i] : 'transparent',
                  color: activePersonIdx === i ? '#fff' : '#8A8FA8',
                  border: `1px solid ${activePersonIdx === i ? COLORS[i] : '#2A2E42'}`,
                }}
              >
                {ps.person.name}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {tasks.length === 0 && (
              <div className="text-center py-8 text-textsecondary text-sm">Nenhuma tarefa. Adicione abaixo.</div>
            )}
            {tasks.map(task => (
              <div
                key={task.id}
                className="flex items-center gap-3 px-3 py-3 rounded-md2 bg-elevated border border-border"
              >
                <GripVertical size={16} className="text-textdisabled flex-shrink-0" />
                <span className="text-lg">{task.icon}</span>
                <span className="flex-1 text-sm font-medium text-textprimary">{task.name}</span>
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                  style={{ color: colorHex, background: colorHex + '20' }}
                >
                  +{task.points}
                </span>
                <button
                  onClick={() => deleteTask(task.id)}
                  className="p-1.5 rounded-md hover:bg-red-500/20 transition-colors cursor-pointer flex-shrink-0"
                >
                  <Trash2 size={15} className="text-red-400" />
                </button>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-border flex-shrink-0 space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-textdisabled">Nova tarefa</p>

            <div className="flex gap-2">
              <button
                onClick={() => setShowEmojiPicker(p => !p)}
                className="text-2xl px-3 py-2 bg-elevated rounded-md2 border border-border cursor-pointer hover:border-p1 transition-colors flex-shrink-0"
              >
                {newTask.icon}
              </button>
              <input
                type="text"
                value={newTask.name}
                onChange={e => setNewTask(p => ({ ...p, name: e.target.value }))}
                onKeyDown={handleKeyDown}
                placeholder="Nome da tarefa"
                className="flex-1 bg-elevated border border-border rounded-md2 px-3 py-2 text-sm text-textprimary outline-none focus:border-p1 transition-colors placeholder:text-textdisabled"
              />
            </div>

            {showEmojiPicker && (
              <div className="bg-elevated rounded-card p-3 border border-border grid grid-cols-8 gap-1.5">
                {EMOJIS.map(e => (
                  <button
                    key={e}
                    onClick={() => { setNewTask(p => ({ ...p, icon: e })); setShowEmojiPicker(false) }}
                    className="text-xl p-1.5 rounded-md hover:bg-border transition-colors cursor-pointer"
                  >
                    {e}
                  </button>
                ))}
              </div>
            )}

            <div>
              <div className="flex justify-between text-xs text-textsecondary mb-1">
                <span>Pontos por conclusão</span>
                <span className="font-bold" style={{ color: colorHex }}>{newTask.points} pts</span>
              </div>
              <input
                type="range" min={5} max={100} step={5}
                value={newTask.points}
                onChange={e => setNewTask(p => ({ ...p, points: Number(e.target.value) }))}
                className="w-full h-1.5"
                style={{ accentColor: colorHex }}
              />
            </div>

            <button
              onClick={addTask}
              disabled={!newTask.name.trim() || loading}
              className="w-full py-3 rounded-card font-bold text-sm text-white flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              style={{ background: colorHex }}
            >
              <Plus size={16} />
              Adicionar tarefa
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
