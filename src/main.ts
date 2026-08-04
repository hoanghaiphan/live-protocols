import './styles.css'
import { renderApp } from './ui'
import { getActiveEntries, getHabits, getOverviewWeek, setOverviewWeek } from './state'
import { isoWeekKey } from './weeks'

if (!localStorage.getItem('lp:overviewWeek') && !localStorage.getItem('lp:activeWeek')) {
  setOverviewWeek(isoWeekKey())
}

const root = document.querySelector<HTMLElement>('#app')
if (!root) throw new Error('#app not found')

console.info(
  `Life Protocols · ${getHabits().length} habits · ${getActiveEntries().length} active · week ${getOverviewWeek()}`,
)
renderApp(root)
