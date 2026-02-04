/**
 * Trainingsdoelen die klanten kunnen kiezen. Gedeeld door ClientInput, Admin en Landing.
 */

export const TRAINING_GOALS = [
  { value: 'marathon', label: 'Marathon', tip: 'Trainen voor een marathon. Opbouw duurvolume, lange duurlopen en taper naar de dag.', category: 'sport' },
  { value: 'hyrox', label: 'Hyrox', tip: 'Trainen voor Hyrox: combinatie van hardlopen en kracht/functional work. Duur en metabolisch.', category: 'sport' },
  { value: 'sportevenement', label: 'Sportevenement / wedstrijd', tip: 'Doel op een datum (wedstrijd, etc.). We bouwen daar naartoe met focus en taper.', category: 'sport' },
  { value: 'kracht_endurance', label: 'Kracht + uithouding', tip: 'Combinatie van krachttraining en duur (bijv. hardlopen, fietsen).', category: 'algemeen' },
  { value: 'fit_vanaf_nul', label: 'Fit worden vanaf nul', tip: 'Weinig tot geen ervaring. Basis full body, rustig opbouwen.', category: 'algemeen' },
  { value: 'vetverlies', label: 'Vetverlies', tip: 'Afvallen met behoud van spiermassa.', category: 'algemeen' },
  { value: 'prestatie', label: 'Prestatie verbeteren', tip: 'Sterker of sneller worden. Meer volume en intensiteit.', category: 'algemeen' },
  { value: 'onderhoud', label: 'Onderhoud', tip: 'Conditie en kracht op peil houden.', category: 'algemeen' },
]

export const TRAINING_GOAL_CATEGORIES = {
  sport: 'Sport & wedstrijd',
  algemeen: 'Algemeen doel',
}

/** Voor dropdown in ClientInput (zelfde volgorde en structuur als voorheen) */
export function getTrainingGoalsForInput() {
  return TRAINING_GOALS.map(({ value, label, tip }) => ({ value, label, tip }))
}
