import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../db/database'
import { seedDefaultTasks } from '../services/seedService'
import { motion } from 'framer-motion'

export default function SetupPage() {
  const navigate = useNavigate()
  const [names, setNames] = useState(['', ''])
  const [metas, setMetas] = useState([200, 200])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState(['', ''])

  function validate() {
    const errs = names.map(n => n.trim().length < 2 ? 'Nome deve ter ao menos 2 caracteres' : '')
    setErrors(errs)
    return errs.every(e => e === '')
  }

  async function handleStart() {
    if (!validate()) return
    setLoading(true)
    try {
      const now = new Date().toISOString()
      const id1 = await db.persons.add({ name: names[0].trim(), metaPoints: metas[0], bestStreak: 0, createdAt: now })
      const id2 = await db.persons.add({ name: names[1].trim(), metaPoints: metas[1], bestStreak: 0, createdAt: now })
      await seedDefaultTasks(id1, id2)
      navigate('/home')
    } catch (err) {
      console.error(err)
      setLoading(false)
    }
  }

  const colors = ['p1', 'p2']
  const colorMap = {
    p1: { border: 'border-p1', ring: 'focus:ring-p1', text: 'text-p1', bg: 'bg-p1dim', btn: 'bg-p1 hover:bg-p1light' },
    p2: { border: 'border-p2', ring: 'focus:ring-p2', text: 'text-p2', bg: 'bg-p2dim', btn: 'bg-p2 hover:bg-p2light' },
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg"
      >
        <div className="text-center mb-10">
          <div className="text-5xl mb-4">🏆</div>
          <h1 className="text-3xl font-extrabold text-textprimary mb-2">Controle de Rotina</h1>
          <p className="text-textsecondary text-sm">Defina os nomes e metas diárias para começar a competição.</p>
        </div>

        <div className="flex flex-col gap-5">
          {[0, 1].map(i => {
            const c = colorMap[colors[i]]
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: i === 0 ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 * (i + 1) }}
                className={`bg-surface border ${c.border} border-opacity-40 rounded-card p-5`}
              >
                <div className={`text-xs font-bold uppercase tracking-widest mb-3 ${c.text}`}>
                  Pessoa {i + 1}
                </div>

                <div className="mb-4">
                  <label className="block text-textsecondary text-xs mb-1">Nome</label>
                  <input
                    type="text"
                    value={names[i]}
                    onChange={e => {
                      const n = [...names]; n[i] = e.target.value; setNames(n)
                      const err = [...errors]; err[i] = ''; setErrors(err)
                    }}
                    placeholder={`Nome da pessoa ${i + 1}`}
                    className={`w-full bg-elevated border border-border rounded-md2 px-4 py-3 text-textprimary text-sm outline-none focus:ring-2 ${c.ring} focus:border-transparent transition-all placeholder:text-textdisabled`}
                  />
                  {errors[i] && <p className="text-red-400 text-xs mt-1">{errors[i]}</p>}
                </div>

                <div>
                  <label className="block text-textsecondary text-xs mb-1">
                    Meta diária: <span className={`font-bold ${c.text}`}>{metas[i]} pts</span>
                  </label>
                  <input
                    type="range"
                    min={50}
                    max={500}
                    step={10}
                    value={metas[i]}
                    onChange={e => { const m = [...metas]; m[i] = Number(e.target.value); setMetas(m) }}
                    className="w-full accent-current h-1.5"
                    style={{ accentColor: i === 0 ? '#6C63FF' : '#FF6584' }}
                  />
                  <div className="flex justify-between text-xs text-textdisabled mt-1">
                    <span>50</span><span>500</span>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          onClick={handleStart}
          disabled={loading}
          className="w-full mt-8 py-4 rounded-card text-white font-bold text-base transition-all cursor-pointer disabled:opacity-60"
          style={{ background: 'linear-gradient(135deg, #6C63FF, #FF6584)' }}
        >
          {loading ? 'Iniciando...' : 'Começar a competição'}
        </motion.button>
      </motion.div>
    </div>
  )
}
