/**
 * Food library: ~50 maaltijden voor ontbijt, lunch, avond en snacks.
 * Per maaltijd: name, kcal, protein, carbs, fat, energyLevel ('laag' | 'medium' | 'hoog').
 * Klanten kiezen uit deze lijst bij "Kies iets anders" op de voedingsweekpagina.
 */

const ONTBIJT = [
  { name: 'Havermout met banaan en noten', kcal: 320, protein: 10, carbs: 48, fat: 11, energyLevel: 'laag' },
  { name: 'Griekse yoghurt met muesli', kcal: 280, protein: 18, carbs: 32, fat: 8, energyLevel: 'laag' },
  { name: 'Eieren met volkorenbrood en avocado', kcal: 350, protein: 18, carbs: 28, fat: 18, energyLevel: 'laag' },
  { name: 'Kwark met appel en kaneel', kcal: 260, protein: 20, carbs: 28, fat: 6, energyLevel: 'laag' },
  { name: 'Smoothie bowl met banaan en granola', kcal: 300, protein: 8, carbs: 52, fat: 8, energyLevel: 'laag' },
  { name: 'Volkorenbrood met pindakaas en banaan', kcal: 380, protein: 14, carbs: 48, fat: 16, energyLevel: 'medium' },
  { name: 'Havermout met banaan, noten en honing', kcal: 400, protein: 12, carbs: 58, fat: 14, energyLevel: 'medium' },
  { name: 'Griekse yoghurt met muesli en fruit', kcal: 360, protein: 22, carbs: 42, fat: 10, energyLevel: 'medium' },
  { name: 'Eieren met volkorenbrood, avocado en tomaat', kcal: 420, protein: 22, carbs: 34, fat: 22, energyLevel: 'medium' },
  { name: 'Omelet met groenten en kaas', kcal: 380, protein: 24, carbs: 12, fat: 26, energyLevel: 'medium' },
  { name: 'Pannenkoeken met fruit en yoghurt', kcal: 440, protein: 14, carbs: 62, fat: 16, energyLevel: 'medium' },
  { name: 'Havermout met banaan, noten, honing en pindakaas', kcal: 520, protein: 18, carbs: 62, fat: 22, energyLevel: 'hoog' },
  { name: 'Griekse yoghurt met muesli, fruit en noten', kcal: 450, protein: 26, carbs: 50, fat: 16, energyLevel: 'hoog' },
  { name: 'Eieren met volkorenbrood, avocado, kaas', kcal: 500, protein: 26, carbs: 38, fat: 26, energyLevel: 'hoog' },
  { name: 'Ontbijtburrito met ei, bonen en avocado', kcal: 480, protein: 22, carbs: 48, fat: 22, energyLevel: 'hoog' },
]

const LUNCH = [
  { name: 'Salade met kip, quinoa en groenten', kcal: 420, protein: 35, carbs: 38, fat: 14, energyLevel: 'laag' },
  { name: 'Volkoren wrap met hummus en groente', kcal: 380, protein: 14, carbs: 52, fat: 12, energyLevel: 'laag' },
  { name: 'Soep met bruin brood en kaas', kcal: 400, protein: 16, carbs: 48, fat: 14, energyLevel: 'laag' },
  { name: 'Couscoussalade met falafel', kcal: 390, protein: 14, carbs: 54, fat: 12, energyLevel: 'laag' },
  { name: 'Rijstwafel met hüttenkäse en komkommer', kcal: 280, protein: 18, carbs: 28, fat: 10, energyLevel: 'laag' },
  { name: 'Salade met kip, quinoa, noten en dressing', kcal: 520, protein: 40, carbs: 44, fat: 18, energyLevel: 'medium' },
  { name: 'Volkoren wrap met kip, hummus en groente', kcal: 480, protein: 32, carbs: 52, fat: 16, energyLevel: 'medium' },
  { name: 'Pasta met tonijn en groenten', kcal: 550, protein: 28, carbs: 62, fat: 20, energyLevel: 'medium' },
  { name: 'Buddha bowl met zoete aardappel en kikkererwten', kcal: 500, protein: 18, carbs: 68, fat: 18, energyLevel: 'medium' },
  { name: 'Sandwich met kip, avocado en sla', kcal: 460, protein: 32, carbs: 42, fat: 20, energyLevel: 'medium' },
  { name: 'Linzensoep met volkorenbrood', kcal: 420, protein: 20, carbs: 58, fat: 10, energyLevel: 'medium' },
  { name: 'Salade met kip, quinoa, noten, kaas en dressing', kcal: 620, protein: 46, carbs: 48, fat: 24, energyLevel: 'hoog' },
  { name: 'Volkoren wrap met kip, hummus, avocado', kcal: 560, protein: 38, carbs: 52, fat: 22, energyLevel: 'hoog' },
  { name: 'Pasta met tonijn, groenten en olie', kcal: 640, protein: 32, carbs: 68, fat: 26, energyLevel: 'hoog' },
  { name: 'Rijst met kip, groenten en pindasaus', kcal: 580, protein: 38, carbs: 62, fat: 20, energyLevel: 'hoog' },
]

const AVOND = [
  { name: 'Zalm met zoete aardappel en broccoli', kcal: 520, protein: 38, carbs: 42, fat: 22, energyLevel: 'laag' },
  { name: 'Kipfilet met rijst en groenten', kcal: 480, protein: 42, carbs: 48, fat: 12, energyLevel: 'laag' },
  { name: 'Linzenstoof met volkorenrijst', kcal: 450, protein: 20, carbs: 68, fat: 10, energyLevel: 'laag' },
  { name: 'Wok met tofu en groenten', kcal: 420, protein: 22, carbs: 48, fat: 14, energyLevel: 'laag' },
  { name: 'Gebakken witvis met aardappel en salade', kcal: 460, protein: 36, carbs: 42, fat: 16, energyLevel: 'laag' },
  { name: 'Zalm met zoete aardappel, broccoli en olie', kcal: 620, protein: 42, carbs: 48, fat: 28, energyLevel: 'medium' },
  { name: 'Kipfilet met aardappel en groenten', kcal: 560, protein: 48, carbs: 52, fat: 16, energyLevel: 'medium' },
  { name: 'Rundergehakt met rijst en salade', kcal: 580, protein: 38, carbs: 54, fat: 22, energyLevel: 'medium' },
  { name: 'Pasta carbonara met spek en groene salade', kcal: 600, protein: 28, carbs: 58, fat: 28, energyLevel: 'medium' },
  { name: 'Ovenschotel met kip, groenten en kaas', kcal: 540, protein: 40, carbs: 42, fat: 22, energyLevel: 'medium' },
  { name: 'Curry met kikkererwten en rijst', kcal: 520, protein: 18, carbs: 72, fat: 16, energyLevel: 'medium' },
  { name: 'Zalm met zoete aardappel, broccoli, olie en noten', kcal: 720, protein: 44, carbs: 54, fat: 36, energyLevel: 'hoog' },
  { name: 'Kipfilet met aardappel, groenten en saus', kcal: 660, protein: 52, carbs: 58, fat: 24, energyLevel: 'hoog' },
  { name: 'Biefstuk met rijst, groenten en boter', kcal: 680, protein: 46, carbs: 56, fat: 28, energyLevel: 'hoog' },
  { name: 'Zelfgemaakte pizza met volkorendeeg en groenten', kcal: 620, protein: 28, carbs: 72, fat: 22, energyLevel: 'hoog' },
]

const SNACK = [
  { name: 'Kwark of fruit', kcal: 120, protein: 12, carbs: 12, fat: 2, energyLevel: 'laag' },
  { name: 'Noten of rijstwafel met pindakaas', kcal: 150, protein: 6, carbs: 10, fat: 11, energyLevel: 'laag' },
  { name: 'Banaan met amandelpasta', kcal: 180, protein: 4, carbs: 28, fat: 8, energyLevel: 'laag' },
  { name: 'Komkommer met hüttenkäse', kcal: 80, protein: 12, carbs: 6, fat: 2, energyLevel: 'laag' },
  { name: 'Kwark met noten en fruit', kcal: 180, protein: 16, carbs: 18, fat: 6, energyLevel: 'medium' },
  { name: 'Smoothie met banaan en pindakaas', kcal: 220, protein: 8, carbs: 28, fat: 10, energyLevel: 'medium' },
  { name: 'Volkoren cracker met kaas en tomaat', kcal: 160, protein: 8, carbs: 16, fat: 8, energyLevel: 'medium' },
  { name: 'Dadels met noten', kcal: 200, protein: 4, carbs: 32, fat: 8, energyLevel: 'medium' },
  { name: 'Kwark met noten, fruit en muesli', kcal: 260, protein: 20, carbs: 26, fat: 10, energyLevel: 'hoog' },
  { name: 'Smoothie met banaan, pindakaas en melk', kcal: 320, protein: 14, carbs: 38, fat: 14, energyLevel: 'hoog' },
  { name: 'Broodje met pindakaas en banaan', kcal: 280, protein: 12, carbs: 36, fat: 12, energyLevel: 'hoog' },
]

/** Alle maaltijden per slot (zonder energyLevel in output voor backward compatibility waar nodig). */
export const FOOD_LIBRARY = {
  ontbijt: ONTBIJT,
  lunch: LUNCH,
  avond: AVOND,
  snack: SNACK,
}

/**
 * Opties voor een maaltijdslot en energieniveau (voor "Kies iets anders").
 * @param {string} energyLevel - 'laag' | 'medium' | 'hoog'
 * @param {string} mealSlot - 'ontbijt' | 'lunch' | 'avond' | 'snack1' | 'snack2'
 */
export function getMealOptionsFromLibrary(energyLevel, mealSlot) {
  const slot = mealSlot === 'snack1' || mealSlot === 'snack2' ? 'snack' : mealSlot
  const list = FOOD_LIBRARY[slot]
  if (!list) return []
  return list
    .filter((m) => m.energyLevel === energyLevel)
    .map(({ name, kcal, protein, carbs, fat }) => ({ name, kcal, protein, carbs, fat }))
}

/** Eerste/voorbeeldmaaltijd per slot voor een energieniveau (voor voorbeelddag). */
export function pickExampleDayFromLibrary(energyLevel) {
  const slotKeys = ['ontbijt', 'lunch', 'avond', 'snack']
  const result = {}
  for (const slot of slotKeys) {
    const options = FOOD_LIBRARY[slot].filter((m) => m.energyLevel === energyLevel)
    result[slot] = options[0] ? { ...options[0] } : null
  }
  return result
}

/** Ingrediënten per maaltijdnaam (voor boodschappenlijst). */
const MEAL_INGREDIENTS = {
  'Havermout met banaan en noten': 'haver, banaan, noten',
  'Griekse yoghurt met muesli': 'Griekse yoghurt, muesli',
  'Eieren met volkorenbrood en avocado': 'eieren, volkorenbrood, avocado',
  'Kwark met appel en kaneel': 'kwark, appel, kaneel',
  'Smoothie bowl met banaan en granola': 'banaan, granola, melk of yoghurt',
  'Volkorenbrood met pindakaas en banaan': 'volkorenbrood, pindakaas, banaan',
  'Havermout met banaan, noten en honing': 'haver, banaan, noten, honing',
  'Griekse yoghurt met muesli en fruit': 'Griekse yoghurt, muesli, fruit',
  'Eieren met volkorenbrood, avocado en tomaat': 'eieren, volkorenbrood, avocado, tomaat',
  'Omelet met groenten en kaas': 'eieren, groenten, kaas',
  'Pannenkoeken met fruit en yoghurt': 'volkorenmeel, eieren, melk, fruit, yoghurt',
  'Havermout met banaan, noten, honing en pindakaas': 'haver, banaan, noten, honing, pindakaas',
  'Griekse yoghurt met muesli, fruit en noten': 'Griekse yoghurt, muesli, fruit, noten',
  'Eieren met volkorenbrood, avocado, kaas': 'eieren, volkorenbrood, avocado, kaas',
  'Ontbijtburrito met ei, bonen en avocado': 'tortilla, eieren, bonen, avocado',
  'Salade met kip, quinoa en groenten': 'kip, quinoa, groenten, sla',
  'Volkoren wrap met hummus en groente': 'volkoren wrap, hummus, groente',
  'Soep met bruin brood en kaas': 'soep (kant-en-klaar of ingrediënten), bruin brood, kaas',
  'Couscoussalade met falafel': 'couscous, falafel, groenten',
  'Rijstwafel met hüttenkäse en komkommer': 'rijstwafels, hüttenkäse, komkommer',
  'Salade met kip, quinoa, noten en dressing': 'kip, quinoa, noten, sla, dressing',
  'Volkoren wrap met kip, hummus en groente': 'volkoren wrap, kip, hummus, groente',
  'Pasta met tonijn en groenten': 'pasta, tonijn, groenten',
  'Buddha bowl met zoete aardappel en kikkererwten': 'zoete aardappel, kikkererwten, groenten, rijst of quinoa',
  'Sandwich met kip, avocado en sla': 'brood, kip, avocado, sla',
  'Linzensoep met volkorenbrood': 'linzen, groenten, volkorenbrood',
  'Salade met kip, quinoa, noten, kaas en dressing': 'kip, quinoa, noten, kaas, sla, dressing',
  'Volkoren wrap met kip, hummus, avocado': 'volkoren wrap, kip, hummus, avocado',
  'Pasta met tonijn, groenten en olie': 'pasta, tonijn, groenten, olie',
  'Rijst met kip, groenten en pindasaus': 'rijst, kip, groenten, pindasaus',
  'Zalm met zoete aardappel en broccoli': 'zalm, zoete aardappel, broccoli',
  'Kipfilet met rijst en groenten': 'kipfilet, rijst, groenten',
  'Linzenstoof met volkorenrijst': 'linzen, groenten, volkorenrijst',
  'Wok met tofu en groenten': 'tofu, groenten, rijst of noedels',
  'Gebakken witvis met aardappel en salade': 'witvis, aardappel, salade',
  'Zalm met zoete aardappel, broccoli en olie': 'zalm, zoete aardappel, broccoli, olie',
  'Kipfilet met aardappel en groenten': 'kipfilet, aardappel, groenten',
  'Rundergehakt met rijst en salade': 'rundergehakt, rijst, salade',
  'Pasta carbonara met spek en groene salade': 'pasta, ei, spek, kaas, sla',
  'Ovenschotel met kip, groenten en kaas': 'kip, groenten, kaas',
  'Curry met kikkererwten en rijst': 'kikkererwten, rijst, currypasta, groenten',
  'Zalm met zoete aardappel, broccoli, olie en noten': 'zalm, zoete aardappel, broccoli, olie, noten',
  'Kipfilet met aardappel, groenten en saus': 'kipfilet, aardappel, groenten, saus',
  'Biefstuk met rijst, groenten en boter': 'biefstuk, rijst, groenten, boter',
  'Zelfgemaakte pizza met volkorendeeg en groenten': 'volkorenmeel, tomatensaus, kaas, groenten',
  'Kwark of fruit': 'kwark of fruit',
  'Noten of rijstwafel met pindakaas': 'noten, rijstwafels, pindakaas',
  'Banaan met amandelpasta': 'banaan, amandelpasta',
  'Komkommer met hüttenkäse': 'komkommer, hüttenkäse',
  'Kwark met noten en fruit': 'kwark, noten, fruit',
  'Smoothie met banaan en pindakaas': 'banaan, pindakaas, melk of yoghurt',
  'Volkoren cracker met kaas en tomaat': 'volkoren cracker, kaas, tomaat',
  'Dadels met noten': 'dadels, noten',
  'Kwark met noten, fruit en muesli': 'kwark, noten, fruit, muesli',
  'Smoothie met banaan, pindakaas en melk': 'banaan, pindakaas, melk',
  'Broodje met pindakaas en banaan': 'broodje, pindakaas, banaan',
}

/**
 * Boodschappenlijst voor een set maaltijdnamen: merged en gededupliceerd.
 * @param {Array<{ name: string }>} meals - bijv. displayMeals van NutritionPlanWeek
 * @returns {string[]} lijst van ingrediënten
 */
export function getShoppingListForMeals(meals) {
  const seen = new Set()
  const out = []
  for (const m of meals || []) {
    const raw = MEAL_INGREDIENTS[m.name] || m.name
    const parts = raw.split(',').map((s) => s.trim()).filter(Boolean)
    for (const p of parts) {
      const key = p.toLowerCase()
      if (!seen.has(key)) {
        seen.add(key)
        out.push(p)
      }
    }
  }
  return out.sort((a, b) => a.localeCompare(b, 'nl'))
}
