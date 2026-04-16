import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Download, Upload } from 'lucide-react'
import { updatePerson, exportAllData, importAllData } from '../../db/database'
import { useShallow } from 'zustand/react/shallow'
import useAppStore from '../../stores/useAppStore'

const COLORS = ['#6C63FF', '#FF6584']

export default function SettingsModal({ open, onClose }) {
  const { personStates, loadAll } = useAppStore(useShallow(s => ({
    personStates: s.personStates,
    loadAll: s.loadAll,
  })))
  const [fields, setFields] = useState([])
  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importMsg, setImportMsg] = useState(null)
  const fileRef = useRef(null)

  useEffect(() => {
    if (open && personStates.length > 0) {
      setFields(personStates.map(ps => ({
        id: ps.person.id,
        name: ps.person.name,
        metaPoints: ps.person.metaPoints,
      })))
    }
  }, [open, personStates])

  async function handleSave() {
    setSaving(true)
    for (const f of fields) {
      if (!f.name.trim()) continue
      await updatePerson(f.id, { name: f.name.trim(), metaPoints: f.metaPoints })
    }
    await loadAll()
    setSaving(false)
    onClose()
  }

  async function handleExport() {
    setExporting(true)
    try {
      const data = await exportAllData()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `controle-rotina-backup-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }

  async function handleImport(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    setImportMsg(null)
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      if (!data.persons || !data.tasks) throw new Error('Arquivo inválido')
      await importAllData(data)
      await loadAll()
      setImportMsg({ type: 'success', text: 'Dados importados com sucesso!' })
    } catch {
      setImportMsg({ type: 'error', text: 'Erro ao importar. Verifique o arquivo.' })
    } finally {
      setImporting(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  if (!open) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end tablet:items-center justify-center bg-black/85 px-0 tablet:px-4"
        onClick={e => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 60, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 280, damping: 28 }}
          className="bg-surface w-full tablet:max-w-md rounded-t-[24px] tablet:rounded-card border border-border overflow-y-auto"
          style={{ maxHeight: '90vh' }}
        >
          <div className="flex items-center justify-between p-5 border-b border-border">
            <h2 className="font-extrabold text-lg text-textprimary">Configurações</h2>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-elevated transition-colors cursor-pointer">
              <X size={20} className="text-textsecondary" />
            </button>
          </div>

          <div className="p-5 space-y-5">
            {fields.map((f, i) => (
              <div key={f.id} className="rounded-card p-4 border" style={{ borderColor: COLORS[i] + '44' }}>
                <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: COLORS[i] }}>
                  Pessoa {i + 1}
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-textsecondary block mb-1">Nome</label>
                    <input
                      type="text"
                      value={f.name}
                      onChange={e => setFields(prev => prev.map((x, j) => j === i ? { ...x, name: e.target.value } : x))}
                      className="w-full bg-elevated border border-border rounded-md2 px-3 py-2.5 text-sm text-textprimary outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-textsecondary block mb-1">
                      Meta diária: <span className="font-bold" style={{ color: COLORS[i] }}>{f.metaPoints} pts</span>
                    </label>
                    <input
                      type="range" min={50} max={500} step={10}
                      value={f.metaPoints}
                      onChange={e => setFields(prev => prev.map((x, j) => j === i ? { ...x, metaPoints: Number(e.target.value) } : x))}
                      className="w-full h-1.5"
                      style={{ accentColor: COLORS[i] }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="px-5 pb-2 space-y-2">
            <p className="text-xs font-bold uppercase tracking-widest text-textdisabled">Backup de dados</p>
            <div className="flex gap-2">
              <button
                onClick={handleExport}
                disabled={exporting}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-card border border-border text-sm font-semibold text-textsecondary hover:bg-elevated transition-all cursor-pointer disabled:opacity-60"
              >
                <Download size={15} />
                {exporting ? 'Exportando...' : 'Exportar backup'}
              </button>
              <button
                onClick={() => fileRef.current?.click()}
                disabled={importing}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-card border border-border text-sm font-semibold text-textsecondary hover:bg-elevated transition-all cursor-pointer disabled:opacity-60"
              >
                <Upload size={15} />
                {importing ? 'Importando...' : 'Importar backup'}
              </button>
              <input ref={fileRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
            </div>
            {importMsg && (
              <p className={`text-xs font-medium px-3 py-2 rounded-md ${importMsg.type === 'success' ? 'text-green-400 bg-green-400/10' : 'text-red-400 bg-red-400/10'}`}>
                {importMsg.text}
              </p>
            )}
          </div>

          <div className="p-5 border-t border-border mt-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-3.5 rounded-card font-bold text-white transition-all cursor-pointer disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #6C63FF, #FF6584)' }}
            >
              {saving ? 'Salvando...' : 'Salvar configurações'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
