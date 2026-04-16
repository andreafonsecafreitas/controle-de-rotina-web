import { useState, useEffect, useCallback, memo, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Trash2, Calendar, Trophy, Pencil, Search } from 'lucide-react'
import { getTasksForPerson, addTask, updateTask } from '../../db/database'
import useAppStore from '../../stores/useAppStore'

const COLORS = ['#6C63FF', '#FF6584']

const WEEKDAYS = [
  { num: 1, short: 'S', label: 'Segunda' },
  { num: 2, short: 'T', label: 'Terça' },
  { num: 3, short: 'Q', label: 'Quarta' },
  { num: 4, short: 'Q', label: 'Quinta' },
  { num: 5, short: 'S', label: 'Sexta' },
  { num: 6, short: 'S', label: 'Sábado' },
  { num: 7, short: 'D', label: 'Domingo' },
]

const EMOJI_CATEGORIES = [
  { label: 'Higiene', items: ['🚿','🛁','🪥','🧼','🪒','💊','🩺','🏥','🧴','💉','🩹','🧻','👁️','💆','🦷','✂️','🧖','💅','🧽','🪮'] },
  { label: 'Esporte', items: ['💪','🏃','🚶','🧘','🏋️','🤸','🚴','🏊','⚽','🏀','🎾','🥊','🧗','🏄','🤾','🏇','⛹️','🤼','🥋','🎽'] },
  { label: 'Comida', items: ['🥗','🥤','💧','🍎','🥦','🍳','🥙','🍱','🥑','葡萄','🥕','🫖','☕','🍵','🥞','🌮','🥜','🫐','🍓','🥝'] },
  { label: 'Estudo', items: ['📚','📖','✏️','📝','💻','🖥️','📊','📈','🔬','🎓','🏫','📐','🔭','📓','🖊️','📋','🗂️','📌','🗓️','⌨️'] },
  { label: 'Casa', items: ['🧹','🧺','🍽️','🛏️','🛒','🔧','🏠','🌿','🪴','🕯️','🪟','🚪','🪑','🛋️','🪞','🗑️','🧻','🔑','🧼','🧯'] },
  { label: 'Objetivos', items: ['💰','💳','📱','💼','🎯','🏆','⭐','🌟','🎖️','🥇','🏅','✅','💡','🗝️','📅','⏰','⌚','🔔','📣','🚀'] },
  { label: 'Lazer', items: ['🎨','🎵','🎮','🎭','🎬','📷','🌅','🌄','🏖️','🌳','🎲','🎸','🎹','✍️','🧩','🛀','😴','🌙','🎪','🎡'] },
  { label: 'Social', items: ['🤝','👨‍⚕️','👩‍⚕️','🏪','✈️','🚗','🚌','🚂','🏦','🏛️','⛪','💌','📞','📬','🗣️','👥','🤗','🎁','🎉','🥂'] },
]
const ALL_EMOJIS = EMOJI_CATEGORIES.flatMap(c => c.items)

export default function ManageTasksModal({ open, onClose, initialPersonId }) {
  const personStates = useAppStore(s => s.personStates)
  const reloadPersonTasks = useAppStore(s => s.reloadPersonTasks)
  const reloadPersonData = useAppStore(s => s.reloadPersonData)

  const [activePersonIdx, setActivePersonIdx] = useState(0)
  const [tasks, setTasks] = useState([])
  const [editingTask, setEditingTask] = useState(null)
  const [showNew, setShowNew] = useState(false)

  const activePerson = personStates[activePersonIdx]?.person
  const colorHex = COLORS[activePersonIdx]

  useEffect(() => {
    if (open && initialPersonId) {
      const idx = personStates.findIndex(ps => ps.person.id === initialPersonId)
      if (idx >= 0) setActivePersonIdx(idx)
    }
  }, [open, initialPersonId, personStates])

  useEffect(() => {
    if (open && activePerson) loadTasks()
  }, [open, activePersonIdx, activePerson?.id])

  useEffect(() => {
    if (!open) {
      setShowNew(false)
      setEditingTask(null)
    }
  }, [open])

  async function loadTasks() {
    if (!activePerson) return
    const t = await getTasksForPerson(activePerson.id)
    setTasks(t)
  }

  const openNew = useCallback(() => {
    setEditingTask(null)
    setShowNew(true)
  }, [])

  const openEdit = useCallback((task) => {
    setEditingTask(task)
    setShowNew(true)
  }, [])

  const closeForm = useCallback(() => {
    setShowNew(false)
    setEditingTask(null)
  }, [])

  async function getMaxSortOrder(personId) {
    const t = await getTasksForPerson(personId)
    return t.length > 0 ? Math.max(...t.map(x => x.sortOrder)) + 1 : 0
  }

  const handleSaveTask = useCallback(async (form) => {
    if (!form.name.trim()) return

    if (editingTask) {
      await updateTask(editingTask.id, {
        name: form.name.trim(),
        points: form.points,
        icon: form.icon,
        recurrenceDays: form.recurrenceDays,
        scheduledDate: form.scheduledDate || null,
      })
    } else {
      const base = {
        name: form.name.trim(),
        points: form.points,
        icon: form.icon,
        isActive: 1,
        recurrenceDays: form.recurrenceDays,
        scheduledDate: form.scheduledDate || null,
        isGlobal: form.isGlobal ? 1 : 0,
        globalWinnerId: null,
      }

      if (form.isGlobal) {
        const firstPerson = personStates[0]?.person
        if (firstPerson) {
          const maxOrder = await getMaxSortOrder(firstPerson.id)
          await addTask({ ...base, personId: firstPerson.id, sortOrder: maxOrder })
        }
      } else if (form.forBoth) {
        await Promise.all(
          personStates.map(async (ps) => {
            const maxOrder = await getMaxSortOrder(ps.person.id)
            await addTask({ ...base, personId: ps.person.id, sortOrder: maxOrder })
          })
        )
      } else if (activePerson) {
        const maxOrder = await getMaxSortOrder(activePerson.id)
        await addTask({ ...base, personId: activePerson.id, sortOrder: maxOrder })
      }
    }

    await loadTasks()
    if (form.isGlobal || form.forBoth) {
      await reloadPersonData()
    } else if (activePerson) {
      await reloadPersonTasks(activePerson.id)
    }
    closeForm()
  }, [editingTask, personStates, activePerson, closeForm, reloadPersonData, reloadPersonTasks])

  const deleteTask = useCallback(async (taskId) => {
    await updateTask(taskId, { isActive: 0 })
    await loadTasks()
    if (activePerson) await reloadPersonTasks(activePerson.id)
  }, [activePerson])

  if (!open) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end tablet:items-center justify-center bg-black/70 backdrop-blur-md px-0 tablet:px-4"
        onClick={e => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ y: 60, opacity: 0, scale: 0.98 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 60, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 280, damping: 28 }}
          className="bg-[#151826] w-full tablet:max-w-2xl rounded-t-[28px] tablet:rounded-[24px] border border-white/5 flex flex-col shadow-2xl"
          style={{ maxHeight: '92vh' }}
        >
          <div className="flex items-center justify-between p-5 border-b border-white/5 flex-shrink-0">
            <div>
              <h2 className="font-extrabold text-lg text-white">Gerenciar Tarefas</h2>
              <p className="text-xs text-white/50 mt-0.5">{tasks.length} {tasks.length === 1 ? 'tarefa' : 'tarefas'}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={openNew}
                className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold text-white transition-all cursor-pointer hover:opacity-90"
                style={{ background: `linear-gradient(135deg, ${COLORS[0]}, ${COLORS[1]})` }}
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M8 3V13M3 8H13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Nova Tarefa
              </button>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-white/5 transition-colors cursor-pointer">
                <X size={18} className="text-white/60" />
              </button>
            </div>
          </div>

          <div className="flex p-4 gap-2 flex-shrink-0 border-b border-white/5">
            {personStates.map((ps, i) => (
              <button
                key={ps.person.id}
                onClick={() => setActivePersonIdx(i)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-sm font-bold transition-all duration-200 cursor-pointer"
                style={{
                  background: activePersonIdx === i ? COLORS[i] : 'rgba(255,255,255,0.04)',
                  color: activePersonIdx === i ? '#fff' : '#8A8FA8',
                  boxShadow: activePersonIdx === i ? `0 4px 16px ${COLORS[i]}50` : 'none',
                }}
              >
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold"
                  style={{
                    background: activePersonIdx === i ? 'rgba(255,255,255,0.25)' : COLORS[i] + '40',
                    color: activePersonIdx === i ? '#fff' : COLORS[i],
                  }}
                >
                  {ps.person.name[0]?.toUpperCase()}
                </span>
                {ps.person.name}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-0">
            {tasks.length === 0 && (
              <div className="text-center py-12 text-white/40 text-sm">
                <div className="text-4xl mb-3 opacity-50">📋</div>
                <p>Nenhuma tarefa ainda.</p>
                <p className="text-xs mt-1">Toque em "Nova Tarefa" para começar.</p>
              </div>
            )}
            {tasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                colorHex={colorHex}
                onEdit={openEdit}
                onDelete={deleteTask}
              />
            ))}
          </div>

          <AnimatePresence>
            {showNew && (
              <NewTaskSheet
                initialTask={editingTask}
                personStates={personStates}
                activePersonIdx={activePersonIdx}
                onSave={handleSaveTask}
                onCancel={closeForm}
                colorHex={colorHex}
              />
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

function getRecurrenceLabel(task) {
  if (task.scheduledDate) {
    const d = new Date(task.scheduledDate + 'T00:00:00')
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  }
  if (!task.recurrenceDays || task.recurrenceDays.length === 0) return 'Todos os dias'
  if (task.recurrenceDays.length === 7) return 'Todos os dias'
  if (task.recurrenceDays.length === 5 && task.recurrenceDays.every(d => d <= 5)) return 'Dias úteis'
  if (task.recurrenceDays.length === 2 && task.recurrenceDays.includes(6) && task.recurrenceDays.includes(7)) return 'Fim de semana'
  return task.recurrenceDays
    .map(d => WEEKDAYS.find(w => w.num === d)?.label.slice(0, 3))
    .join(', ')
}

const TaskRow = memo(function TaskRow({ task, colorHex, onEdit, onDelete }) {
  const isGlobal = task.isGlobal === 1
  const iconBg = isGlobal ? '#FFD70015' : colorHex + '15'
  const iconBorder = isGlobal ? '#FFD70040' : colorHex + '35'
  const recurrenceLabel = useMemo(() => getRecurrenceLabel(task), [task.recurrenceDays, task.scheduledDate])

  return (
    <div className="group flex items-center gap-3 p-3 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all">
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-xl border"
        style={{ background: iconBg, borderColor: iconBorder }}
      >
        {task.icon || '⭐'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-semibold text-white truncate">{task.name}</p>
          {isGlobal && <Trophy size={11} className="text-yellow-400 flex-shrink-0" />}
        </div>
        <p className="text-xs text-white/40 mt-0.5">{recurrenceLabel}</p>
      </div>
      <span
        className="text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0"
        style={{ color: isGlobal ? '#FFD700' : colorHex, background: isGlobal ? '#FFD70015' : colorHex + '15' }}
      >
        +{task.points} pts
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onEdit(task)}
          className="p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
        >
          <Pencil size={14} className="text-white/50" />
        </button>
        <button
          onClick={() => onDelete(task.id)}
          className="p-2 rounded-lg hover:bg-red-500/10 transition-colors cursor-pointer"
        >
          <Trash2 size={14} className="text-red-400/70" />
        </button>
      </div>
    </div>
  )
})

const EmojiPicker = memo(function EmojiPicker({ formIcon, colorHex, setIcon }) {
  const [search, setSearch] = useState('')
  const [catIdx, setCatIdx] = useState(0)

  const filtered = useMemo(() => {
    return search.trim() ? ALL_EMOJIS : EMOJI_CATEGORIES[catIdx]?.items || []
  }, [search, catIdx])

  return (
    <div className="bg-white/[0.02] border border-white/10 rounded-xl p-3 space-y-3">
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar ícone..."
          className="w-full bg-black/20 border border-white/5 rounded-lg pl-9 pr-2 py-2 text-xs text-white outline-none focus:border-white/20 placeholder:text-white/25"
        />
      </div>
      {!search && (
        <div className="flex gap-1 flex-wrap">
          {EMOJI_CATEGORIES.map((cat, i) => (
            <button
              key={cat.label}
              onClick={() => setCatIdx(i)}
              className="text-[10px] px-2.5 py-1 rounded-full transition-colors cursor-pointer font-bold"
              style={{
                background: catIdx === i ? colorHex + '25' : 'rgba(255,255,255,0.03)',
                color: catIdx === i ? colorHex : '#8A8FA8',
                border: `1px solid ${catIdx === i ? colorHex + '50' : 'rgba(255,255,255,0.05)'}`,
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>
      )}
      <div className="grid grid-cols-8 gap-1 max-h-[112px] overflow-y-auto">
        {filtered.map(emoji => (
          <button
            key={emoji}
            onClick={() => setIcon(emoji)}
            className="aspect-square flex items-center justify-center text-xl rounded-lg transition-all cursor-pointer"
            style={{
              background: formIcon === emoji ? colorHex + '25' : 'transparent',
              border: `1px solid ${formIcon === emoji ? colorHex + '60' : 'transparent'}`,
            }}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  )
})

function NewTaskSheet({ initialTask, personStates, activePersonIdx, onSave, onCancel, colorHex }) {
  const [form, setForm] = useState(() => {
    if (initialTask) {
      return {
        name: initialTask.name,
        points: initialTask.points,
        icon: initialTask.icon || '⭐',
        recurrenceDays: initialTask.recurrenceDays || [],
        scheduledDate: initialTask.scheduledDate || '',
        isGlobal: initialTask.isGlobal === 1,
        forBoth: false,
      }
    }
    return {
      name: '', points: 20, icon: '⭐', recurrenceDays: [], scheduledDate: '', isGlobal: false, forBoth: false
    }
  })
  const [loading, setLoading] = useState(false)

  const toggleDay = useCallback((dayNum) => {
    setForm(f => ({
      ...f,
      recurrenceDays: f.recurrenceDays.includes(dayNum)
        ? f.recurrenceDays.filter(d => d !== dayNum)
        : [...f.recurrenceDays, dayNum].sort((a, b) => a - b),
    }))
  }, [])

  const handleSave = async () => {
    setLoading(true)
    await onSave(form)
    setLoading(false)
  }

  const setIcon = useCallback((icon) => {
    setForm(f => ({ ...f, icon }))
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-10 bg-black/60 backdrop-blur-sm flex flex-col justify-end tablet:items-center tablet:justify-center p-0 tablet:p-4"
      onClick={e => e.target === e.currentTarget && onCancel()}
    >
      <motion.div
        initial={{ y: 20, opacity: 0, scale: 0.97 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 20, opacity: 0, scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="w-full max-w-md bg-[#1A1D2E] rounded-t-3xl tablet:rounded-3xl border border-white/10 shadow-2xl flex flex-col"
        style={{ maxHeight: '85vh' }}
      >
        <div className="flex items-center justify-between p-5 border-b border-white/5 flex-shrink-0">
          <h3 className="font-extrabold text-base text-white">{initialTask ? 'Editar Tarefa' : 'Nova Tarefa'}</h3>
          <button onClick={onCancel} className="p-1.5 rounded-full hover:bg-white/5 cursor-pointer">
            <X size={16} className="text-white/50" />
          </button>
        </div>

        <div className="overflow-y-auto p-5 space-y-5 min-h-0">
          {!initialTask && (
            <div className="flex gap-2">
              {personStates.map((ps, i) => (
                <button
                  key={ps.person.id}
                  onClick={() => setForm(f => ({ ...f, forBoth: false, isGlobal: false }))}
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-full text-xs font-bold transition-all cursor-pointer"
                  style={{
                    background: (!form.forBoth && !form.isGlobal && activePersonIdx === i) ? COLORS[i] : 'rgba(255,255,255,0.04)',
                    color: (!form.forBoth && !form.isGlobal && activePersonIdx === i) ? '#fff' : '#8A8FA8',
                    opacity: (!form.forBoth && !form.isGlobal && activePersonIdx !== i) ? 0.4 : 1,
                  }}
                >
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold"
                    style={{
                      background: (!form.forBoth && !form.isGlobal && activePersonIdx === i) ? 'rgba(255,255,255,0.25)' : COLORS[i] + '40',
                      color: (!form.forBoth && !form.isGlobal && activePersonIdx === i) ? '#fff' : COLORS[i],
                    }}
                  >
                    {ps.person.name[0]?.toUpperCase()}
                  </span>
                  {ps.person.name}
                </button>
              ))}
            </div>
          )}

          <div>
            <label className="text-[10px] font-bold tracking-widest text-white/40 uppercase mb-1.5 block">Nome</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Ex: Beber 2L de água"
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-3.5 py-3 text-sm text-white outline-none focus:border-white/25 transition-colors placeholder:text-white/25"
              autoFocus
            />
          </div>

          <div>
            <label className="text-[10px] font-bold tracking-widest text-white/40 uppercase mb-1.5 block">
              Pontos · <span style={{ color: colorHex }} className="font-bold">{form.points}</span>
            </label>
            <input
              type="range" min={5} max={100} step={5}
              value={form.points}
              onChange={e => setForm(f => ({ ...f, points: Number(e.target.value) }))}
              className="w-full h-1.5"
              style={{ accentColor: colorHex }}
            />
          </div>

          <div>
            <label className="text-[10px] font-bold tracking-widest text-white/40 uppercase mb-1.5 block">Ícone</label>
            <EmojiPicker formIcon={form.icon} colorHex={colorHex} setIcon={setIcon} />
          </div>

          <div>
            <label className="text-[10px] font-bold tracking-widest text-white/40 uppercase mb-1.5 block">Repetição</label>
            <div className="bg-white/[0.02] border border-white/10 rounded-xl p-3 space-y-3">
              <p className="text-xs text-white/50">
                {form.recurrenceDays.length === 0 || form.recurrenceDays.length === 7
                  ? 'Todos os dias'
                  : form.recurrenceDays.length === 5 && form.recurrenceDays.every(d => d <= 5)
                    ? 'Dias úteis'
                    : `${form.recurrenceDays.length} ${form.recurrenceDays.length === 1 ? 'dia' : 'dias'}`}
              </p>
              <div className="flex gap-1.5 justify-between">
                {WEEKDAYS.map(day => {
                  const active = form.recurrenceDays.includes(day.num)
                  return (
                    <button
                      key={day.num}
                      onClick={() => toggleDay(day.num)}
                      className="flex-1 aspect-square rounded-xl text-sm font-bold transition-all cursor-pointer"
                      style={{
                        background: active ? colorHex : 'rgba(255,255,255,0.03)',
                        color: active ? '#fff' : '#8A8FA8',
                        border: `1px solid ${active ? colorHex : 'rgba(255,255,255,0.08)'}`,
                        boxShadow: active ? `0 4px 12px ${colorHex}40` : 'none',
                      }}
                      aria-label={day.label}
                    >
                      {day.short}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold tracking-widest text-white/40 uppercase mb-1.5 block">Data específica (opcional)</label>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/[0.02] border border-white/10">
              <Calendar size={14} className="text-white/40" />
              <input
                type="date"
                value={form.scheduledDate}
                onChange={e => setForm(f => ({ ...f, scheduledDate: e.target.value }))}
                className="flex-1 bg-transparent text-xs text-white outline-none cursor-pointer"
                min={new Date().toISOString().slice(0, 10)}
              />
              {form.scheduledDate && (
                <button
                  onClick={() => setForm(f => ({ ...f, scheduledDate: '' }))}
                  className="text-xs text-white/50 cursor-pointer hover:text-white"
                >
                  Limpar
                </button>
              )}
            </div>
            {form.scheduledDate && (
              <p className="text-[10px] text-white/40 mt-1.5">Aparece apenas neste dia específico.</p>
            )}
          </div>

          {!initialTask && (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setForm(f => ({ ...f, forBoth: !f.forBoth, isGlobal: false }))}
                className="flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all"
                style={{
                  background: form.forBoth ? '#6C63FF15' : 'rgba(255,255,255,0.02)',
                  borderColor: form.forBoth ? '#6C63FF60' : 'rgba(255,255,255,0.08)',
                }}
              >
                <div
                  className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
                  style={{
                    background: form.forBoth ? '#6C63FF' : 'transparent',
                    border: `2px solid ${form.forBoth ? '#6C63FF' : '#4A4F68'}`,
                  }}
                >
                  {form.forBoth && (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M1.5 5L4 7.5L8.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <span className="text-[11px] text-white/70 leading-tight text-left">Para as duas pessoas</span>
              </button>

              <button
                onClick={() => setForm(f => ({ ...f, isGlobal: !f.isGlobal, forBoth: false }))}
                className="flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all"
                style={{
                  background: form.isGlobal ? '#FFD70015' : 'rgba(255,255,255,0.02)',
                  borderColor: form.isGlobal ? '#FFD70060' : 'rgba(255,255,255,0.08)',
                }}
              >
                <div
                  className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
                  style={{
                    background: form.isGlobal ? '#FFD700' : 'transparent',
                    border: `2px solid ${form.isGlobal ? '#FFD700' : '#4A4F68'}`,
                  }}
                >
                  {form.isGlobal && (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M1.5 5L4 7.5L8.5 2.5" stroke="#222" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <Trophy size={11} className="text-yellow-400 flex-shrink-0" />
                <span className="text-[11px] text-white/70 leading-tight text-left">Desafio (quem fizer 1º ganha)</span>
              </button>
            </div>
          )}
        </div>

        <div className="flex gap-2 p-4 border-t border-white/5 flex-shrink-0">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl font-bold text-sm text-white/60 border border-white/10 hover:bg-white/5 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!form.name.trim() || loading}
            className="flex-1 py-3 rounded-xl font-bold text-sm text-white transition-all cursor-pointer disabled:opacity-40"
            style={{ background: `linear-gradient(135deg, ${colorHex}, ${colorHex}dd)`, boxShadow: `0 6px 20px ${colorHex}40` }}
          >
            {loading ? 'Salvando...' : initialTask ? 'Salvar' : 'Adicionar'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
