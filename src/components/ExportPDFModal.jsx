import { useState } from 'react'
import styles from './ExportPDFModal.module.css'

const BRAND_FONT = "'Plus Jakarta Sans', system-ui, sans-serif"
const BRAND_ACCENT = '#1a7f37'

function buildPrintHtml(type, plan, weekOption) {
  const weeks = plan?.weeks ?? []
  const toPrint = weekOption === 'all' ? weeks : weeks.filter((_, i) => (i + 1) === Number(weekOption))
  const docTitle = type === 'nutrition' ? 'Voedingsschema' : 'Trainingsschema'
  const isBook = weekOption === 'all' && toPrint.length > 1

  let body = ''
  if (isBook) {
    body += `<div class="cover">
      <h1 class="brand">TrainLogic</h1>
      <h2 class="subtitle">${docTitle}</h2>
      <p class="meta">${toPrint.length} weken · Plan</p>
    </div>`
  }
  toPrint.forEach((week) => {
    const wn = week.weekNumber ?? week.weekName ?? '?'
    body += `<div class="week"><h2>Week ${wn}</h2>`
    if (type === 'nutrition') {
      body += `<p><strong>Energie:</strong> ${week.energyDirection || '—'} · ca. ${week.averageCaloriesPerDay ?? '—'} kcal/dag</p>`
      if (week.macrosPerDay) body += `<p><strong>Macro's:</strong> E ${week.macrosPerDay.protein}g · K ${week.macrosPerDay.carbs}g · V ${week.macrosPerDay.fat}g</p>`
      if (week.days?.length) {
        week.days.forEach((day) => {
          body += `<p class="dayLabel"><strong>Dag ${day.dayNumber}</strong></p><ul>`
          ;(day.meals ?? []).forEach((m) => {
            body += `<li><strong>${m.meal}:</strong> ${m.name} · ${m.kcal} kcal</li>`
          })
          body += '</ul>'
        })
      } else {
        body += '<ul>'
        ;(week.exampleMeals ?? []).forEach((m) => {
          body += `<li><strong>${m.meal}:</strong> ${m.name} · ${m.kcal} kcal</li>`
        })
        body += '</ul>'
      }
    } else {
      body += `<p><strong>Focus:</strong> ${week.focus}</p><p>${week.volumeDescription ?? ''}</p>`
      ;(week.sessions ?? []).forEach((sess) => {
        body += `<p><strong>${sess.dayLabel}</strong> – ${sess.type} · ${sess.durationMin} min</p><ul>`
        ;(sess.exercises ?? []).forEach((ex) => {
          body += `<li>${ex.name}: ${ex.sets}×${ex.reps}</li>`
        })
        body += '</ul>'
      })
    }
    body += '</div>'
  })
  if (type === 'nutrition') {
    body += '<p class="disclaimer">Raadpleeg altijd een arts of diëtist voor vragen of bij twijfel over voeding of gezondheid.</p>'
  }

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${docTitle} – TrainLogic</title>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&display=swap" rel="stylesheet">
<style>
  body{font-family:${BRAND_FONT};max-width:720px;margin:0 auto;padding:2rem 1.5rem;line-height:1.5;color:#1a1a1a;background:#fff;}
  .cover{text-align:center;padding:3rem 1rem;border-bottom:3px solid ${BRAND_ACCENT};margin-bottom:2rem;}
  .brand{font-size:2rem;font-weight:700;color:${BRAND_ACCENT};margin:0 0 0.5rem;}
  .subtitle{font-size:1.35rem;font-weight:600;margin:0 0 0.25rem;color:#333;}
  .meta{font-size:0.95rem;color:#666;margin:0;}
  .week{margin-bottom:2rem;page-break-inside:avoid;}
  h2{font-size:1.2rem;margin:0 0 0.75rem;color:${BRAND_ACCENT};font-weight:600;}
  p{margin:0.35rem 0;}
  ul{margin:0.5rem 0;padding-left:1.25rem;}
  li{margin:0.25rem 0;}
  .dayLabel{margin-top:1rem;margin-bottom:0.25rem;}
  .disclaimer{margin-top:2rem;font-size:0.85rem;color:#666;font-style:italic;}
</style></head><body>${body}</body></html>`
}

export default function ExportPDFModal({ type, plan, title, onClose }) {
  const [weekOption, setWeekOption] = useState('all')
  const weeks = plan?.weeks ?? []

  const handleExport = () => {
    const html = buildPrintHtml(type, plan, weekOption)
    const w = window.open('', '_blank')
    if (!w) return
    w.document.write(html)
    w.document.close()
    w.focus()
    setTimeout(() => {
      w.print()
      w.onafterprint = () => w.close()
    }, 250)
    onClose()
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3>Export als PDF</h3>
        <p className={styles.hint}>Kies welke week(s) je wilt opnemen. Er opent een printvenster; kies daar &quot;Opslaan als PDF&quot;.</p>
        <div className={styles.radios}>
          <label>
            <input type="radio" name="week" value="all" checked={weekOption === 'all'} onChange={() => setWeekOption('all')} />
            Alle weken
          </label>
          {weeks.map((_, i) => (
            <label key={i}>
              <input type="radio" name="week" value={i + 1} checked={weekOption === i + 1} onChange={() => setWeekOption(i + 1)} />
              Week {i + 1}
            </label>
          ))}
        </div>
        <div className={styles.actions}>
          <button type="button" onClick={onClose} className={styles.cancel}>Annuleren</button>
          <button type="button" onClick={handleExport} className={styles.export}>Exporteer & open printvenster</button>
        </div>
      </div>
    </div>
  )
}
