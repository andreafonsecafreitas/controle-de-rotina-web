import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Scale, Trash2, ChevronDown, ChevronUp, Trophy } from 'lucide-react'
import { getFullHistory, deleteCompletion, upsertDailySummary } from '../../db/database'
import useAppStore from '../../stores/useAppStore'

const COLORS = { 1: '#6C63FF', 2: '#FF6584' }

function groupByDate(items) {
  const map = new Map()
  for (const item of items) {
    if (!map.has(item.date)) map.set(item.date, [])
    map.get(item.date).push(item)
  }
  return map
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })
}

function isToday(dateStr) {
  const today = new Date()
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset())
  return today.toISOString().slice(0, 10) === dateStr
}

function DaySection({ date, entries, onNullify }) {
  const [open, setOpen] = useState(isToday(date))
  const totalPoints = entries.reduce((s, e) => s + e.points, 0)

  return (
    <div className="rounded-2xl border border-white/[0.06] overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3.5 bg-white/[0.03] hover:bg-white/[0.05] transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3">
          {isToday(date) && (
            <span className="text-[10px] font-extrabold bg-p1/20 text-p1 px-2 py-0.5 rounded-full uppercase tracking-wider">Hoje</span>
          )}
          <span className="text-sm font-semibold text-white capitalize">{formatDate(date)}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-white/40">{entries.length} tarefa{entries.length !== 1 ? 's' : ''} · <span className="text-white/60">+{totalPoints} pts</span></span>
          {open ? <ChevronUp size={14} className="text-white/30" /> : <ChevronDown size={14} className="text-white/30" />}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="divide-y divide-white/[0.04]">
              {entries.map(entry => (
                <EntryRow key={entry.id} entry={entry} onNullify={onNullify} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function EntryRow({ entry, onNullify }) {
  const [confirming, setConfirming] = useState(false)
  const [nullified, setNullified] = useState(false)
  const color = COLORS[entry.personId] || '#6C63FF'

  async function handleNullify() {
    if (!confirming) {
      setConfirming(true)
      setTimeout(() => setConfirming(false), 3000)
      return
    }
    setNullified(true)
    await onNullify(entry)
  }

  return (
    <AnimatePresence>
      {!nullified && (
        <motion.div
          exit={{ opacity: 0, x: -20, height: 0 }}
          transition={{ duration: 0.25 }}
          className="flex items-center gap-3 px-4 py-3"
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-base"
            style={{ background: `linear-gradient(135deg, ${color}18, ${color}08)`, border: `1px solid ${color}20` }}
          >
            {entry.taskIcon}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-semibold text-white/90 truncate">{entry.taskName}</p>
              {entry.isGlobal && <Trophy size={11} className="text-yellow-400 flex-shrink-0" />}
            </div>
            <p className="text-[11px] text-white/35 mt-0.5">{entry.personName}</p>
          </div>

          <span
            className="text-xs font-extrabold px-2.5 py-1 rounded-xl flex-shrink-0"
            style={{ background: `${color}18`, color: color }}
          >
            +{entry.points}
          </span>

          <button
            onClick={handleNullify}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex-shrink-0 ${
              confirming
                ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                : 'bg-white/[0.04] text-white/30 hover:bg-red-500/10 hover:text-red-400 border border-transparent'
            }`}
          >
            {confirming ? (
              <>
                <Scale size={12} />
                Anular?
              </>
            ) : (
              <Trash2 size={12} />
            )}
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default function HistoryTab() {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const loadAll = useAppStore(s => s.loadAll)

  const load = useCallback(async () => {
    setLoading(true)
    const data = await getFullHistory()
    setHistory(data)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function handleNullify(entry) {
    await deleteCompletion(entry.id)
    await upsertDailySummary(entry.personId, entry.date, 0, 0)
    setHistory(prev => prev.filter(e => e.id !== entry.id))
    loadAll()
  }

  const grouped = groupByDate(history)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="flex flex-col items-center gap-3">
          <div className="w-7 h-7 border-2 border-p1 border-t-transparent rounded-full animate-spin" />
          <p className="text-white/40 text-sm">Carregando histórico...</p>
        </div>
      </div>
    )
  }

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 gap-3 text-center">
        <div className="text-4xl opacity-30">📋</div>
        <p className="text-white/40 text-sm">Nenhum histórico ainda.</p>
        <p className="text-white/25 text-xs">Comece a marcar tarefas como concluídas.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2 pb-4">
      <div className="flex items-center gap-2 mb-4">
        <Scale size={16} className="text-white/40" />
        <p className="text-xs text-white/40 leading-relaxed">
          Toque uma vez em <span className="text-white/60 font-semibold">🗑</span> para sinalizar, toque de novo para <span className="text-red-400 font-semibold">Anular</span> e remover os pontos.
        </p>
      </div>

      {[...grouped.entries()].map(([date, entries]) => (
        <DaySection
          key={date}
          date={date}
          entries={entries}
          onNullify={handleNullify}
        />
      ))}
    </div>
  )
}
