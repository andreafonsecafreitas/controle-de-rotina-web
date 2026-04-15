import { useEffect, useState, useCallback } from 'react'
import { Settings, RefreshCw } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import useAppStore from '../stores/useAppStore'
import TodayTab from '../components/tabs/TodayTab'
import PeriodTab from '../components/tabs/PeriodTab'
import RankingTab from '../components/tabs/RankingTab'
import ManageTasksModal from '../components/modals/ManageTasksModal'
import SettingsModal from '../components/modals/SettingsModal'
import { todayStr } from '../services/dateUtils'

const TABS = [
  { label: 'Hoje', icon: '📅' },
  { label: 'Semana', icon: '📆' },
  { label: 'Mês', icon: '🗓️' },
  { label: 'Ranking', icon: '🏆' },
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

  const today = new Date().toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      <header className="flex items-center justify-between px-4 pt-4 pb-3 flex-shrink-0">
        <div>
          <h1 className="font-extrabold text-lg text-textprimary leading-tight">Controle de Rotina</h1>
          <p className="text-xs text-textsecondary capitalize">{today}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadAll()}
            className="p-2 rounded-full hover:bg-surface transition-colors cursor-pointer"
            title="Atualizar"
          >
            <RefreshCw size={18} className={`text-textsecondary ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => openManageTasks(null)}
            className="p-2 rounded-full hover:bg-surface transition-colors cursor-pointer"
            title="Adicionar tarefa"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-textsecondary">
              <path d="M9 3V15M3 9H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            onClick={() => setSettingsOpen(true)}
            className="p-2 rounded-full hover:bg-surface transition-colors cursor-pointer"
            title="Configurações"
          >
            <Settings size={18} className="text-textsecondary" />
          </button>
        </div>
      </header>

      <nav className="flex px-4 gap-1 mb-3 flex-shrink-0">
        {TABS.map((tab, i) => (
          <button
            key={tab.label}
            onClick={() => setActiveTab(i)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md2 text-xs font-bold transition-all duration-200 cursor-pointer"
            style={{
              background: activeTab === i ? '#22263A' : 'transparent',
              color: activeTab === i ? '#EAEAEA' : '#4A4F68',
              borderBottom: activeTab === i ? '2px solid #6C63FF' : '2px solid transparent',
            }}
          >
            <span className="hidden tablet:inline text-sm">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>

      <main className="flex-1 overflow-y-auto px-4 pb-6 min-h-0">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-p1 border-t-transparent rounded-full animate-spin" />
              <p className="text-textsecondary text-sm">Carregando...</p>
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

      <ManageTasksModal
        open={manageOpen}
        onClose={() => setManageOpen(false)}
        initialPersonId={managePersonId}
      />
      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  )
}
