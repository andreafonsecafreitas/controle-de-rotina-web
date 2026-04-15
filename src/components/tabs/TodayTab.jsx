import { useState } from 'react'
import PersonColumn from '../person/PersonColumn'
import useAppStore from '../../stores/useAppStore'

const COLORS = ['#6C63FF', '#FF6584']

export default function TodayTab({ onManageTasks }) {
  const personStates = useAppStore(s => s.personStates)
  const [activePerson, setActivePerson] = useState(0)

  if (personStates.length === 0) return null

  return (
    <>
      <div className="hidden tablet:grid tablet:grid-cols-2 tablet:gap-4 h-full">
        {personStates.map((ps, i) => (
          <div
            key={ps.person.id}
            className="bg-surface rounded-card p-4 border"
            style={{ borderColor: COLORS[i] + '33' }}
          >
            <PersonColumn
              personState={ps}
              index={i}
              onManageTasks={() => onManageTasks(ps.person.id)}
            />
          </div>
        ))}
      </div>

      <div className="tablet:hidden flex flex-col h-full">
        <div className="flex mb-4 bg-surface rounded-card p-1 gap-1">
          {personStates.map((ps, i) => (
            <button
              key={ps.person.id}
              onClick={() => setActivePerson(i)}
              className="flex-1 py-2.5 rounded-md2 text-sm font-bold transition-all duration-200 cursor-pointer"
              style={{
                background: activePerson === i ? COLORS[i] : 'transparent',
                color: activePerson === i ? '#fff' : '#8A8FA8',
              }}
            >
              {ps.person.name}
            </button>
          ))}
        </div>

        <div
          className="flex-1 bg-surface rounded-card p-4 border overflow-hidden"
          style={{ borderColor: COLORS[activePerson] + '33' }}
        >
          <PersonColumn
            personState={personStates[activePerson]}
            index={activePerson}
            onManageTasks={() => onManageTasks(personStates[activePerson].person.id)}
          />
        </div>
      </div>
    </>
  )
}
