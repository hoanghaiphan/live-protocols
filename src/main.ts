import './styles.css'
import { renderApp } from './ui'
import { getActiveWeek, getHabits, setActiveWeek } from './state'
import { isoWeekKey } from './weeks'

// Ensure active week defaults to current ISO week on first load
if (!localStorage.getItem('lp:activeWeek')) {
  setActiveWeek(isoWeekKey())
}

const root = document.querySelector<HTMLElement>('#app')
if (!root) throw new Error('#app not found')

console.info(
  `Life Protocols · ${getHabits().length} habits · week ${getActiveWeek()}`,
)
renderApp(root)
