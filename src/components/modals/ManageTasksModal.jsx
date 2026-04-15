import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Trash2, ChevronUp, ChevronDown, Calendar, Trophy } from 'lucide-react'
import { db, getTasksForPerson } from '../../db/database'
import useAppStore from '../../stores/useAppStore'

const COLORS = ['#6C63FF', '#FF6584']

const EMOJI_CATEGORIES = [
  {
    label: 'Higiene & Saúde',
    items: ['🚿','🛁','🪥','🧼','🪒','💊','🩺','🏥','🧴','💉','🩹','🧻','🪣','🫧','👁️','💆','🦷','✂️','🧖','💅'],
  },
  {
    label: 'Exercício & Esporte',
    items: ['💪','🏃','🚶','🧘','🏋️','🤸','🚴','🏊','⚽','🏀','🎾','🥊','🧗','🏄','🤾','🏇','⛹️','🤼','🥋','🎽'],
  },
  {
    label: 'Alimentação',
    items: ['🥗','🥤','💧','🍎','🥦','🍳','🥙','🍱','🥑','🍇','🥕','🫖','☕','🍵','🥞','🌮','🥜','🫐','🍓','🥝'],
  },
  {
    label: 'Estudos & Trabalho',
    items: ['📚','📖','✏️','📝','💻','🖥️','📊','📈','🔬','🎓','🏫','📐','🔭','📓','🖊️','📋','🗂️','📌','🗓️','⌨️'],
  },
  {
    label: 'Casa & Rotina',
    items: ['🧹','🧺','🍽️','🛏️','🛒','🔧','🏠','🌿','🪴','🕯️','🧹','🪟','🚪','🪑','🛋️','🪞','🗑️','🧽','🧻','🔑'],
  },
  {
    label: 'Finanças & Objetivos',
    items: ['💰','💳','📱','💼','🎯','🏆','⭐','🌟','🎖️','🥇','🏅','✅','💡','🔑','🗝️','📅','⏰','⌚','🔔','📣'],
  },
  {
    label: 'Bem-estar & Lazer',
    items: ['🎨','🎵','🎮','🎭','🎬','📷','🌅','🌄','🏖️','🌳','🎲','🎸','🎹','📚','✍️','🧩','🎯','🛀','😴','🌙'],
  },
  {
    label: 'Social & Compromissos',
    items: ['🤝','👨‍⚕️','👩‍⚕️','🏪','✈️','🚗','🚌','🚂','🏦','🏛️','⛪','🎪','🎡','🎠','💌','📞','📬','🗣️','👥','🤗'],
  },
]

const ALL_EMOJIS = EMOJI_CATEGORIES.flatMap(c => c.items)

export default function ManageTasksModal({ open, onClose, initialPersonId }) {
  const personStates = useAppStore(s => s.personStates)
  const reloadPersonTasks = useAppStore(s => s.reloadPersonTasks)
  const reloadPersonData = useAppStore(s => s.reloadPersonData)

  const [activePersonIdx, setActivePersonIdx] = useState(0)
  const [tasks, setTasks] = useState([])
  const [newTask, setNewTask] = useState({ name: '', points: 20, icon: '⭐', forBoth: false, scheduledDate: '', isGlobal: false })
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [emojiSearch, setEmojiSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeEmojiCategory, setActiveEmojiCategory] = useState(0)

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
    if (!newTask.name.trim()) return
    setLoading(true)
    const now = new Date().toISOString()

    const taskBase = {
      name: newTask.name.trim(),
      points: newTask.points,
      icon: newTask.icon,
      sortOrder: 0,
      isActive: 1,
      recurrenceDays: [],
      scheduledDate: newTask.scheduledDate || null,
      isGlobal: newTask.isGlobal ? 1 : 0,
      globalWinnerId: null,
      createdAt: now,
    }

    if (newTask.isGlobal) {
      const firstPerson = personStates[0]?.person
      if (!firstPerson) { setLoading(false); return }
      const maxOrder = await getMaxSortOrder(firstPerson.id)
      await db.tasks.add({ ...taskBase, personId: firstPerson.id, sortOrder: maxOrder })
    } else if (newTask.forBoth) {
      await Promise.all(
        personStates.map(async (ps, i) => {
          const maxOrder = await getMaxSortOrder(ps.person.id)
          await db.tasks.add({ ...taskBase, personId: ps.person.id, sortOrder: maxOrder })
        })
      )
    } else {
      if (!activePerson) { setLoading(false); return }
      const maxOrder = await getMaxSortOrder(activePerson.id)
      await db.tasks.add({ ...taskBase, personId: activePerson.id, sortOrder: maxOrder })
    }

    setNewTask({ name: '', points: 20, icon: '⭐', forBoth: false, scheduledDate: '', isGlobal: false })
    await loadTasks()
    if (newTask.isGlobal) {
      await reloadPersonData()
    } else if (newTask.forBoth) {
      await Promise.all(personStates.map(ps => reloadPersonTasks(ps.person.id)))
    } else {
      await reloadPersonTasks(activePerson.id)
    }
    setLoading(false)
  }

  async function getMaxSortOrder(personId) {
    const t = await getTasksForPerson(personId)
    return t.length > 0 ? Math.max(...t.map(x => x.sortOrder)) + 1 : 0
  }

  async function deleteTask(taskId) {
    await db.tasks.update(taskId, { isActive: 0 })
    await loadTasks()
    if (activePerson) await reloadPersonTasks(activePerson.id)
  }

  async function moveTask(taskId, direction) {
    const idx = tasks.findIndex(t => t.id === taskId)
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= tasks.length) return

    const a = tasks[idx]
    const b = tasks[swapIdx]
    const aOrder = a.sortOrder
    const bOrder = b.sortOrder

    await db.tasks.update(a.id, { sortOrder: bOrder })
    await db.tasks.update(b.id, { sortOrder: aOrder })
    await loadTasks()
    if (activePerson) await reloadPersonTasks(activePerson.id)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') addTask()
  }

  const filteredEmojis = emojiSearch.trim()
    ? ALL_EMOJIS.filter(e => e.includes(emojiSearch))
    : EMOJI_CATEGORIES[activeEmojiCategory]?.items || []

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
          style={{ maxHeight: '92vh' }}
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

          <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-0">
            {tasks.length === 0 && (
              <div className="text-center py-8 text-textsecondary text-sm">Nenhuma tarefa. Adicione abaixo.</div>
            )}
            {tasks.map((task, idx) => (
              <div
                key={task.id}
                className="flex items-center gap-2 px-3 py-2.5 rounded-md2 bg-elevated border border-border"
              >
                <div className="flex flex-col gap-0.5 flex-shrink-0">
                  <button
                    onClick={() => moveTask(task.id, 'up')}
                    disabled={idx === 0}
                    className="p-0.5 rounded hover:bg-border transition-colors cursor-pointer disabled:opacity-30"
                  >
                    <ChevronUp size={14} className="text-textsecondary" />
                  </button>
                  <button
                    onClick={() => moveTask(task.id, 'down')}
                    disabled={idx === tasks.length - 1}
                    className="p-0.5 rounded hover:bg-border transition-colors cursor-pointer disabled:opacity-30"
                  >
                    <ChevronDown size={14} className="text-textsecondary" />
                  </button>
                </div>
                <span className="text-lg flex-shrink-0">{task.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-textprimary truncate">{task.name}</span>
                    {task.isGlobal === 1 && (
                      <Trophy size={12} className="text-yellow-400 flex-shrink-0" />
                    )}
                  </div>
                  {task.scheduledDate && (
                    <span className="text-xs text-textsecondary flex items-center gap-1 mt-0.5">
                      <Calendar size={10} />
                      {new Date(task.scheduledDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                    </span>
                  )}
                </div>
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
              <div className="bg-elevated rounded-card p-3 border border-border space-y-2">
                <input
                  type="text"
                  value={emojiSearch}
                  onChange={e => setEmojiSearch(e.target.value)}
                  placeholder="Buscar emoji..."
                  className="w-full bg-background border border-border rounded-md px-2 py-1.5 text-xs text-textprimary outline-none focus:border-p1 placeholder:text-textdisabled"
                />
                {!emojiSearch && (
                  <div className="flex gap-1 flex-wrap">
                    {EMOJI_CATEGORIES.map((cat, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveEmojiCategory(i)}
                        className="text-xs px-2 py-1 rounded-md transition-colors cursor-pointer"
                        style={{
                          background: activeEmojiCategory === i ? colorHex + '30' : 'transparent',
                          color: activeEmojiCategory === i ? colorHex : '#8A8FA8',
                          border: `1px solid ${activeEmojiCategory === i ? colorHex + '60' : '#2A2E42'}`,
                        }}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                )}
                <div className="grid grid-cols-10 gap-1 max-h-32 overflow-y-auto">
                  {filteredEmojis.map(e => (
                    <button
                      key={e}
                      onClick={() => { setNewTask(p => ({ ...p, icon: e })); setShowEmojiPicker(false); setEmojiSearch('') }}
                      className="text-xl p-1 rounded-md hover:bg-border transition-colors cursor-pointer"
                    >
                      {e}
                    </button>
                  ))}
                </div>
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

            <div className="space-y-2">
              <div className="flex items-center gap-2 p-2.5 rounded-md2 bg-elevated border border-border">
                <Calendar size={14} className="text-textsecondary flex-shrink-0" />
                <span className="text-xs text-textsecondary flex-1">Aparecer em data específica</span>
                <input
                  type="date"
                  value={newTask.scheduledDate}
                  onChange={e => setNewTask(p => ({ ...p, scheduledDate: e.target.value }))}
                  className="bg-transparent text-xs text-textprimary outline-none cursor-pointer"
                  min={new Date().toISOString().slice(0, 10)}
                />
              </div>

              <div className="flex items-center gap-3">
                <label
                  onClick={() => setNewTask(p => ({ ...p, forBoth: !p.forBoth, isGlobal: false }))}
                  className="flex items-center gap-2 flex-1 p-2.5 rounded-md2 border cursor-pointer transition-all"
                  style={{
                    background: newTask.forBoth && !newTask.isGlobal ? '#6C63FF15' : 'transparent',
                    borderColor: newTask.forBoth && !newTask.isGlobal ? '#6C63FF60' : '#2A2E42',
                  }}
                >
                  <div
                    className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-all"
                    style={{
                      background: newTask.forBoth && !newTask.isGlobal ? '#6C63FF' : 'transparent',
                      border: `2px solid ${newTask.forBoth && !newTask.isGlobal ? '#6C63FF' : '#4A4F68'}`,
                    }}
                  >
                    {newTask.forBoth && !newTask.isGlobal && (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M1.5 5L4 7.5L8.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <span className="text-xs text-textsecondary">Adicionar para as duas pessoas</span>
                </label>

                <label
                  onClick={() => setNewTask(p => ({ ...p, isGlobal: !p.isGlobal, forBoth: false }))}
                  className="flex items-center gap-2 flex-1 p-2.5 rounded-md2 border cursor-pointer transition-all"
                  style={{
                    background: newTask.isGlobal ? '#FFD70015' : 'transparent',
                    borderColor: newTask.isGlobal ? '#FFD70060' : '#2A2E42',
                  }}
                >
                  <div
                    className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-all"
                    style={{
                      background: newTask.isGlobal ? '#FFD700' : 'transparent',
                      border: `2px solid ${newTask.isGlobal ? '#FFD700' : '#4A4F68'}`,
                    }}
                  >
                    {newTask.isGlobal && (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M1.5 5L4 7.5L8.5 2.5" stroke="#222" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <Trophy size={11} className="text-yellow-400 flex-shrink-0" />
                  <span className="text-xs text-textsecondary">Desafio — quem fizer primeiro ganha</span>
                </label>
              </div>
            </div>

            <button
              onClick={addTask}
              disabled={!newTask.name.trim() || loading}
              className="w-full py-3 rounded-card font-bold text-sm text-white flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              style={{ background: colorHex }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 3V13M3 8H13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Adicionar tarefa
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
