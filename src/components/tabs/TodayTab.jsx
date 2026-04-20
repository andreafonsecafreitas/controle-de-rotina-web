import { useState } from 'react'
import PersonColumn from '../person/PersonColumn'
import GlobalChallengesSection from '../shared/GlobalChallengesSection'
import useAppStore from '../../stores/useAppStore'

const COLORS = ['#6C63FF', '#FF6584']

export default function TodayTab({ onManageTasks }) {
  const personStates = useAppStore(s => s.personStates)
  const [activePerson, setActivePerson] = useState(0)

  if (personStates.length === 0) return null

  return (
    <>
      <div className="hidden tablet:flex tablet:flex-col h-full gap-4">
        <GlobalChallengesSection />
        <div className="grid grid-cols-2 gap-3 lg:gap-5 flex-1">
          {personStates.map((ps, i) => (
            <div
              key={ps.person.id}
              className="bg-[#121520] rounded-3xl p-3 lg:p-5 border"
              style={{ borderColor: COLORS[i] + '26' }}
            >
            <PersonColumn
              personState={ps}
              index={i}
              onManageTasks={onManageTasks}
            />
            </div>
          ))}
        </div>
      </div>

      <div className="tablet:hidden flex flex-col h-full">
        <GlobalChallengesSection />
        <div className="flex mb-4 bg-white/[0.03] rounded-full p-1.5 gap-1 border border-white/5">
          {personStates.map((ps, i) => (
            <button
              key={ps.person.id}
              onClick={() => setActivePerson(i)}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-full text-base font-bold transition-all duration-200 cursor-pointer"
              style={{
                background: activePerson === i ? COLORS[i] : 'transparent',
                color: activePerson === i ? '#fff' : 'rgba(255,255,255,0.4)',
                boxShadow: activePerson === i ? `0 4px 16px ${COLORS[i]}50` : 'none',
              }}
            >
              <span
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold"
                style={{
                  background: activePerson === i ? 'rgba(255,255,255,0.25)' : COLORS[i] + '35',
                  color: activePerson === i ? '#fff' : COLORS[i],
                }}
              >
                {ps.person.name[0]?.toUpperCase()}
              </span>
              {ps.person.name}
            </button>
          ))}
        </div>

        <div
          className="flex-1 bg-[#121520] rounded-3xl p-5 border overflow-hidden"
          style={{ borderColor: COLORS[activePerson] + '26' }}
        >
          <PersonColumn
            personState={personStates[activePerson]}
            index={activePerson}
            onManageTasks={onManageTasks}
          />
        </div>
      </div>
    </>
  )
}
