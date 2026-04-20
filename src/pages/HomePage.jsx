import { useEffect, useState, useCallback, lazy, Suspense } from 'react'
import { Settings, RefreshCw } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import useAppStore from '../stores/useAppStore'
import TodayTab from '../components/tabs/TodayTab'
import PeriodTab from '../components/tabs/PeriodTab'
import RankingTab from '../components/tabs/RankingTab'
import { todayStr } from '../services/dateUtils'

const ManageTasksModal = lazy(() => import('../components/modals/ManageTasksModal'))
const SettingsModal = lazy(() => import('../components/modals/SettingsModal'))

const TABS = [
  { label: 'Hoje' },
  { label: 'Semana' },
  { label: 'Mês' },
  { label: 'Ranking' },
]

export default function HomePage() {
  const { loadAll, isLoading, activeTab, setActiveTab, lastLoadedDate } = useAppStore(
    useShallow(s => ({
      loadAll: s.loadAll,
      isLoading: s.isLoading,
      activeTab: s.activeTab,
      setActiveTab: s.setActiveTab,
      lastLoadedDate: s.lastLoadedDate,
    }))
  )
  const [manageOpen, setManageOpen] = useState(false)
  const [managePersonId, setManagePersonId] = useState(null)
  const [settingsOpen, setSettingsOpen] = useState(false)

  useEffect(() => {
    loadAll()
  }, [])

  useEffect(() => {
    function handleVisibility() {
      if (!document.hidden) {
        const today = todayStr()
        if (lastLoadedDate && lastLoadedDate !== today) {
          loadAll()
        }
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [lastLoadedDate])

  const openManageTasks = useCallback((personId) => {
    setManagePersonId(personId)
    setManageOpen(true)
  }, [])

  const today = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'short' })

  return (
    <div className="flex justify-center bg-[#0B0D14] h-screen overflow-hidden">
      <div className="flex flex-col w-full max-w-6xl h-full relative">
        <div className="absolute inset-0 pointer-events-none opacity-40 mx-auto max-w-6xl w-full" style={{
          background: 'radial-gradient(circle at 20% 0%, rgba(108,99,255,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 100%, rgba(255,101,132,0.12) 0%, transparent 50%)',
        }} />

        <header className="relative flex items-center justify-between px-5 pt-6 pb-5 flex-shrink-0">
        <div>
          <h1 className="font-extrabold text-3xl lg:text-4xl text-white leading-tight tracking-tight">Rotina</h1>
          <p className="text-sm lg:text-base text-white/45 capitalize mt-1">{today}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadAll()}
            className="w-11 h-11 lg:w-12 lg:h-12 rounded-full flex items-center justify-center bg-white/[0.04] hover:bg-white/[0.08] transition-colors cursor-pointer"
            title="Atualizar"
          >
            <RefreshCw size={20} className={`text-white/60 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => openManageTasks(null)}
            className="w-11 h-11 lg:w-12 lg:h-12 rounded-full flex items-center justify-center bg-white/[0.04] hover:bg-white/[0.08] transition-colors cursor-pointer"
            title="Adicionar tarefa"
          >
            <svg width="20" height="20" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white/70">
              <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            onClick={() => setSettingsOpen(true)}
            className="w-11 h-11 lg:w-12 lg:h-12 rounded-full flex items-center justify-center bg-white/[0.04] hover:bg-white/[0.08] transition-colors cursor-pointer"
            title="Configurações"
          >
            <Settings size={20} className="text-white/60" />
          </button>
        </div>
      </header>

      <nav className="relative flex px-5 gap-1 mb-4 flex-shrink-0">
        <div className="flex-1 flex bg-white/[0.03] rounded-full p-1.5 gap-1 border border-white/5">
          {TABS.map((tab, i) => (
            <button
              key={tab.label}
              onClick={() => setActiveTab(i)}
              className="flex-1 py-3 lg:py-3.5 rounded-full text-sm lg:text-base font-bold transition-all duration-200 cursor-pointer"
              style={{
                background: activeTab === i ? 'rgba(255,255,255,0.08)' : 'transparent',
                color: activeTab === i ? '#fff' : 'rgba(255,255,255,0.4)',
                boxShadow: activeTab === i ? '0 2px 8px rgba(0,0,0,0.2)' : 'none',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      <main className="relative flex-1 overflow-y-auto px-5 pb-6 min-h-0">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-p1 border-t-transparent rounded-full animate-spin" />
              <p className="text-white/50 text-sm">Carregando...</p>
            </div>
          </div>
        ) : (
          <>
            {activeTab === 0 && <TodayTab onManageTasks={openManageTasks} />}
            {activeTab === 1 && <PeriodTab mode="week" />}
            {activeTab === 2 && <PeriodTab mode="month" />}
            {activeTab === 3 && <RankingTab />}
          </>
        )}
      </main>

      <Suspense fallback={null}>
        {manageOpen && (
          <ManageTasksModal
            open={manageOpen}
            onClose={() => setManageOpen(false)}
            initialPersonId={managePersonId}
          />
        )}
      </Suspense>
      <Suspense fallback={null}>
        {settingsOpen && (
          <SettingsModal
            open={settingsOpen}
            onClose={() => setSettingsOpen(false)}
          />
        )}
      </Suspense>
    </div>
  </div>
  )
}
