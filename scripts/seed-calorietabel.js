/**
 * Genereert SQL-migratie voor food_library uit data.xlsx (sheet Calorietabel).
 * Gebruik: node scripts/seed-calorietabel.js [pad/naar/data.xlsx]
 * Default pad: ./data/data.xlsx (kopieer het bestand daarheen).
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import XLSX from 'xlsx'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const root = path.join(__dirname, '..')
const inputPath = process.argv[2] || path.join(root, 'data', 'data.xlsx')
const outputPath = path.join(root, 'supabase', 'migrations', '026_seed_food_library_calorietabel.sql')

// Bepaal meal_slot op basis van productnaam (kleine letters). Volgorde: ontbijt → lunch → avond → snack.
function getMealSlot(name) {
  if (!name || typeof name !== 'string') return 'avond'
  const n = name.toLowerCase()
  const ontbijt = /brood|brinta|muesli|ontbijt|^ei(?!erkoek)|yoghurt|kwark|pap|haver|cornflakes|all bran|cruesli|beschuit|cracker|ontbijtkoek|americain|kefir|roggebrood|croissant|eierkoek|knäckebröd|speltbrood|wafel|chia|gierst|rijstwafel|sojayoghurt|pompoenpan/
  const lunch = /salade|soep|sandwich|wrap|boterham|beleg|hummus|falafel|pita|couscous|tortilla|buddy|bowl|linzen|wortelsoep|sushi|gnocchi|burger|nasi|bami/
  const avond = /kip|kipfilet|vlees|rund|biefstuk|gehakt|vis|zalm|tonijn|pasta|rijst|aardappel|groente|groenten|sperziebonen|broccoli|ovenschotel|bacon|babi|bakbokking|bami|bami|spaghetti|lasagne|nasi|pizza|sate|schnitzel|braadworst|hutspot|stamppot|witlof|andijvie|asperges|aubergine|bloemkool|boerenkool|erwten|prei|spinazie|sperziebonen|tomaat|wortel|zilvervliesrijst|bulgur|quinoa/
  const snack = /^appel$|^banaan|peer|sinaasappel|fruit|noten|amandel|walnoot|pinda|koek|reep|chocolade|snoep|drop|winegum|biscuit|abrikoos|aardbei|aalbessen|druif|mandarijn|kiwi|mango|meloen|framboos|bosbes|vijg|dadel|rozijn|mueslireep|speculaas|stroopwafel|leverworst|studentenhaver|appelmoes|appelstroop|appeltaart|appelflap|appelcarre|appelbeignet/
  if (ontbijt.test(n)) return 'ontbijt'
  if (lunch.test(n)) return 'lunch'
  if (avond.test(n)) return 'avond'
  if (snack.test(n)) return 'snack'
  return 'avond'
}

// energy_level op basis van kcal per portie
function getEnergyLevel(kcal, grams) {
  const k = Number(kcal) || 0
  const g = Number(grams) || 100
  const kcalPer100 = g > 0 ? (k / g) * 100 : k
  if (kcalPer100 < 130) return 'laag'
  if (kcalPer100 > 250) return 'hoog'
  return 'medium'
}

function escapeSql(str) {
  if (str == null) return 'NULL'
  return "'" + String(str).replace(/'/g, "''") + "'"
}

function run() {
  if (!fs.existsSync(inputPath)) {
    console.error('Bestand niet gevonden:', inputPath)
    console.error('Gebruik: node scripts/seed-calorietabel.js [pad/naar/data.xlsx]')
    process.exit(1)
  }

  const wb = XLSX.readFile(inputPath)
  const sheet = wb.Sheets['Calorietabel']
  if (!sheet) {
    console.error('Sheet "Calorietabel" niet gevonden in', inputPath)
    process.exit(1)
  }

  const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })
  const rows = data.slice(1).filter((r) => r && r[0] && String(r[0]).trim())

  const inserts = []
  let sortOrder = 0
  for (const r of rows) {
    const product = String(r[0] || '').trim()
    if (!product) continue
    const hoeveelheid = r[1] != null && r[1] !== '' ? Number(r[1]) : 100
    const eenheid = (r[2] || 'g').toString().toLowerCase().trim()
    const kcal = Math.round(Number(r[3]) || 0)
    const eiwit = Math.round((Number(r[4]) || 0) * 10) / 10
    const carbs = Math.round((Number(r[5]) || 0) * 10) / 10
    const vet = Math.round((Number(r[6]) || 0) * 10) / 10

    const meal_slot = getMealSlot(product)
    const grams = eenheid === 'g' ? Math.round(hoeveelheid) : null
    const energy_level = getEnergyLevel(kcal, grams != null ? grams : 100)

    const name = product.charAt(0).toUpperCase() + product.slice(1).toLowerCase()
    const gramsSql = grams != null ? grams : 'NULL'
    inserts.push(
      `  (${escapeSql(meal_slot)}, ${escapeSql(energy_level)}, ${escapeSql(name)}, ${gramsSql}, ${kcal}, ${eiwit}, ${carbs}, ${vet}, ${sortOrder})`
    )
    sortOrder++
  }

  const sql = `-- Seed food_library met realistische waardes uit Calorietabel (data.xlsx)
-- Gegenereerd door: node scripts/seed-calorietabel.js

-- Optioneel: bestaande seed leegmaken (uncomment als je alleen calorietabel wilt)
-- DELETE FROM public.food_library;

INSERT INTO public.food_library (meal_slot, energy_level, name, grams, kcal, protein, carbs, fat, sort_order)
VALUES
${inserts.join(',\n')};
`

  fs.writeFileSync(outputPath, sql, 'utf8')
  console.log('Geschreven:', outputPath)
  console.log('Rijen:', inserts.length)
}

run()
