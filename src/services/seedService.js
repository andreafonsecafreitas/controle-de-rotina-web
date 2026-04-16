import { bulkAddTasks } from '../db/database'

const DEFAULT_TASKS = [
  { name: 'Exercício físico', points: 30, icon: '💪', recurrenceDays: [] },
  { name: 'Leitura', points: 20, icon: '📚', recurrenceDays: [] },
  { name: 'Beber água', points: 10, icon: '💧', recurrenceDays: [] },
  { name: 'Meditação', points: 20, icon: '🧘', recurrenceDays: [] },
  { name: 'Organizar ambiente', points: 15, icon: '🧹', recurrenceDays: [] },
]

const DEFAULT_TASKS_2 = [
  { name: 'Caminhada', points: 25, icon: '🚶', recurrenceDays: [] },
  { name: 'Estudo', points: 30, icon: '📝', recurrenceDays: [] },
  { name: 'Alimentação saudável', points: 20, icon: '🥗', recurrenceDays: [] },
  { name: 'Sono regulado', points: 15, icon: '🛏️', recurrenceDays: [] },
  { name: 'Hidratação', points: 10, icon: '🤸', recurrenceDays: [] },
]

export async function seedDefaultTasks(person1Id, person2Id) {
  const tasks1 = DEFAULT_TASKS.map((t, i) => ({
    ...t,
    personId: person1Id,
    sortOrder: i,
    isActive: 1,
  }))

  const tasks2 = DEFAULT_TASKS_2.map((t, i) => ({
    ...t,
    personId: person2Id,
    sortOrder: i,
    isActive: 1,
  }))

  await bulkAddTasks([...tasks1, ...tasks2])
}
