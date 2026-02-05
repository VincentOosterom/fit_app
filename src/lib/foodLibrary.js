/**
 * Voedingsbibliotheek: maaltijden per slot en energieniveau.
 * Tags voor filtering op dieet/restricties: varken, vis, gevogelte, groente, noten, gluten, lactose, zuivel, ei, etc.
 */

const make = (name, kcal, protein, carbs, fat, energyLevel, tags = []) => ({
  name,
  kcal,
  protein,
  carbs,
  fat,
  energyLevel,
  tags: tags.map((t) => t.toLowerCase()),
})

/** Bepaalt welke tags uitgesloten moeten worden op basis van dietary_prefs en restrictions. */
function getExcludedTags(input) {
  const excluded = new Set()
  if (!input) return excluded

  const prefs = (input.dietary_prefs || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
  const restrictionText = (input.restrictions || '').toLowerCase().replace(/,/g, ' ')
  const restrictionWords = restrictionText.split(/\s+/).filter((w) => w.length > 1)

  if (prefs.includes('geen_varken') || prefs.includes('halal') || prefs.includes('vis_gevogelte')) excluded.add('varken')
  if (prefs.includes('geen_noten')) excluded.add('noten')
  if (prefs.includes('geen_noten')) excluded.add('pinda')
  if (prefs.includes('geen_groente')) excluded.add('groente')
  if (prefs.includes('vegetarisch')) {
    excluded.add('varken')
    excluded.add('vis')
    excluded.add('gevogelte')
    excluded.add('kip')
    excluded.add('rund')
    excluded.add('biefstuk')
    excluded.add('tonijn')
    excluded.add('zalm')
  }
  if (prefs.includes('vegan')) {
    excluded.add('varken')
    excluded.add('vis')
    excluded.add('gevogelte')
    excluded.add('kip')
    excluded.add('rund')
    excluded.add('zuivel')
    excluded.add('ei')
    excluded.add('tonijn')
    excluded.add('zalm')
    excluded.add('biefstuk')
  }
  if (prefs.includes('glutenvrij')) excluded.add('gluten')
  if (prefs.includes('lactosevrij')) {
    excluded.add('lactose')
    excluded.add('zuivel')
  }

  for (const w of restrictionWords) {
    if (w.length > 1) excluded.add(w)
  }
  return excluded
}

/** Retourneert true als de maaltijd uitgesloten is (bevat een van de excluded tags of naam bevat een woord). */
function mealExcluded(meal, excludedTags) {
  if (!excludedTags.size) return false
  const nameLower = (meal.name || '').toLowerCase()
  const mealTags = new Set([...(meal.tags || []), ...nameLower.split(/\s+/).filter((w) => w.length > 2)])
  for (const tag of excludedTags) {
    if (mealTags.has(tag)) return true
    if (nameLower.includes(tag)) return true
    for (const t of mealTags) {
      if (t.includes(tag) || tag.includes(t)) return true
    }
  }
  return false
}

/** Filtert maaltijden op basis van client input (dieetvoorkeuren en allergieën/restricties). */
export function filterMealsByInput(meals, input) {
  if (!meals?.length) return meals
  const excluded = getExcludedTags(input)
  if (!excluded.size) return meals
  return meals.filter((m) => !mealExcluded(m, excluded))
}

export const FOOD_LIBRARY = {
  ontbijt: [
    make('Havermout met banaan', 320, 10, 55, 6, 'laag', ['gluten']),
    make('Havermout met banaan en noten', 420, 14, 58, 14, 'medium', ['gluten', 'noten']),
    make('Havermout met banaan, noten en honing', 520, 16, 72, 18, 'hoog', ['gluten', 'noten']),
    make('Yoghurt met muesli', 280, 12, 42, 6, 'laag', ['zuivel', 'gluten']),
    make('Yoghurt met muesli en fruit', 380, 14, 52, 10, 'medium', ['zuivel', 'gluten']),
    make('Eieren met volkorenbrood', 350, 18, 32, 14, 'medium', ['ei', 'gluten']),
    make('Smoothie bowl', 400, 12, 62, 12, 'hoog', []),
    make('Kwark met banaan', 300, 22, 38, 6, 'laag', ['zuivel']),
    make('Omelet met groente', 340, 24, 8, 24, 'laag', ['ei', 'groente']),
    make('Pannenkoeken met banaan', 420, 12, 62, 14, 'medium', ['gluten', 'ei']),
    make('Brinta met melk en banaan', 350, 14, 58, 6, 'laag', ['gluten', 'zuivel']),
    make('Crackers met hüttenkäse', 280, 18, 28, 10, 'laag', ['zuivel']),
    make('Fruit salade met kwark', 260, 16, 42, 2, 'laag', ['zuivel']),
    make('Roggebrood met kaas', 320, 16, 38, 12, 'medium', ['gluten', 'zuivel']),
    make('Scrambled eggs met toast', 380, 20, 36, 16, 'medium', ['ei', 'gluten']),
    make('Ontbijtgranen met melk', 360, 12, 62, 8, 'medium', ['gluten', 'zuivel']),
    make('Smoothie met banaan en spinazie', 280, 8, 52, 4, 'laag', ['groente']),
    make('Bagel met roomkaas en zalm', 450, 24, 48, 18, 'hoog', ['gluten', 'zuivel', 'vis']),
    make('Pindakaas op volkorenbrood', 400, 18, 44, 18, 'medium', ['gluten', 'pinda']),
    make('Chia pudding met fruit', 320, 10, 48, 12, 'laag', []),
    make('Griekse yoghurt met honing en walnoten', 380, 20, 42, 16, 'medium', ['zuivel', 'noten']),
    make('Wentelteefjes met kaneel', 420, 14, 52, 16, 'medium', ['gluten', 'ei']),
    make('Mueslireep met yoghurt', 340, 12, 52, 10, 'medium', ['zuivel', 'gluten']),
    make('Avocado op toast', 380, 10, 36, 22, 'medium', ['gluten']),
    make('Overnight oats met bessen', 350, 12, 58, 8, 'laag', []),
    make('Eierkoek met banaan', 320, 12, 52, 8, 'laag', ['ei', 'gluten']),
    make('Knakworst met brood', 420, 18, 38, 22, 'medium', ['varken', 'gluten']),
    make('Spekpannenkoek', 480, 16, 48, 24, 'hoog', ['varken', 'gluten', 'ei']),
    make('Cornflakes met melk', 340, 10, 62, 6, 'medium', ['gluten', 'zuivel']),
    make('Boerenomelet', 450, 28, 12, 32, 'hoog', ['ei', 'groente']),
    make('Croissant met jam', 380, 8, 48, 18, 'medium', ['gluten', 'zuivel']),
    make('Ontbijtkoek met boter', 360, 6, 58, 12, 'medium', ['gluten']),
    make('Kefir met muesli', 300, 12, 48, 8, 'laag', ['zuivel', 'gluten']),
    make('Rijstwafels met pindakaas', 320, 12, 42, 12, 'laag', ['pinda']),
    make('Sojayoghurt met granola', 340, 16, 48, 10, 'medium', ['gluten', 'soja']),
    make('Pompoenpannenkoeken', 380, 12, 58, 12, 'medium', ['gluten', 'ei', 'groente']),
    make('Gierstpap met bessen', 350, 10, 62, 8, 'laag', []),
    make('Speltbrood met ei', 400, 22, 42, 16, 'medium', ['gluten', 'ei']),
    make('Smoothie bowl met granola', 440, 14, 68, 14, 'hoog', ['gluten']),
    make('Wafel met fruit', 420, 10, 72, 12, 'hoog', ['gluten', 'ei']),
    make('Ontbijtburrito met ei en bonen', 480, 24, 48, 22, 'hoog', ['ei', 'gluten']),
    make('Zweeds ontbijt (knäckebröd, kaas)', 360, 18, 38, 16, 'medium', ['gluten', 'zuivel']),
    make('Pannenkoek met spek', 520, 22, 48, 28, 'hoog', ['varken', 'gluten', 'ei']),
    make('Quinoa ontbijt met noten', 400, 14, 52, 14, 'medium', ['noten']),
    make('Lijnzaadcrackers met hummus', 320, 12, 38, 14, 'laag', []),
  ],
  lunch: [
    make('Volkoren wrap met kip en groente', 380, 28, 42, 10, 'laag', ['kip', 'groente', 'gluten']),
    make('Salade met quinoa en feta', 450, 18, 48, 20, 'medium', ['groente', 'zuivel']),
    make('Sandwich met hummus en groente', 420, 14, 58, 14, 'medium', ['groente', 'gluten']),
    make('Pasta salade met tonijn', 520, 32, 55, 18, 'hoog', ['vis', 'gluten']),
    make('Rijst met kip en groente', 550, 35, 62, 14, 'hoog', ['kip', 'groente']),
    make('Kipfilet met zoete aardappel', 480, 42, 48, 10, 'laag', ['kip']),
    make('Tonijnsalade met crackers', 400, 36, 32, 16, 'medium', ['vis', 'gluten']),
    make('Broodje gezond met kip', 450, 28, 48, 14, 'medium', ['kip', 'groente', 'gluten']),
    make('Linzensoep met brood', 420, 18, 62, 12, 'medium', ['gluten']),
    make('Wraps met kidneybonen en groente', 480, 20, 72, 14, 'medium', ['groente', 'gluten']),
    make('Zalm met rijst en komkommer', 520, 38, 48, 18, 'hoog', ['vis', 'groente']),
    make('Pita met falafel en salade', 500, 18, 62, 18, 'medium', ['groente', 'gluten']),
    make('Omelet met groente en brood', 460, 28, 42, 18, 'medium', ['ei', 'groente', 'gluten']),
    make('Couscous met groente en kikkererwten', 440, 16, 72, 12, 'medium', ['groente', 'gluten']),
    make('Broodje tonijn', 420, 28, 48, 12, 'medium', ['vis', 'gluten']),
    make('Maaltijdsalade met kip', 480, 42, 38, 16, 'laag', ['kip', 'groente']),
    make('Tortilla met kip en avocado', 520, 36, 48, 20, 'hoog', ['kip', 'gluten']),
    make('Rijstsalade met edamame', 460, 20, 62, 14, 'medium', ['groente', 'soja']),
    make('Gevulde wrap met hummus', 440, 14, 62, 16, 'medium', ['groente', 'gluten']),
    make('Haring met uitjes en brood', 500, 28, 42, 22, 'hoog', ['vis', 'gluten']),
    make('Gebakken ei met spinazie en brood', 420, 22, 42, 16, 'medium', ['ei', 'groente', 'gluten']),
    make('Pasta met pesto en groente', 540, 18, 72, 20, 'hoog', ['groente', 'gluten', 'noten']),
    make('Buddha bowl met tofu', 480, 22, 58, 18, 'medium', ['groente', 'soja']),
    make('Broodje rosbief', 480, 32, 42, 20, 'medium', ['rund', 'gluten']),
    make('Salade met geitenkaas en noten', 500, 20, 32, 36, 'hoog', ['zuivel', 'noten', 'groente']),
    make('Wortelsoep met brood', 380, 10, 62, 12, 'laag', ['groente', 'gluten']),
    make('Sushi bowl met zalm', 520, 28, 62, 18, 'hoog', ['vis']),
    make('Broodje kipfilet', 420, 36, 42, 12, 'medium', ['kip', 'gluten']),
    make('Groentesoep met balletjes', 400, 22, 48, 12, 'medium', ['groente', 'varken']),
    make('Wrap met gegrilde groente', 440, 14, 62, 16, 'medium', ['groente', 'gluten']),
    make('Gnocchi met tomatensaus', 520, 14, 78, 16, 'hoog', ['gluten']),
    make('Broodje kaas', 420, 22, 42, 20, 'medium', ['zuivel', 'gluten']),
    make('Salade met kip en avocado', 480, 38, 28, 26, 'medium', ['kip', 'groente']),
    make('Pasta met tonijn en spinazie', 540, 34, 62, 16, 'hoog', ['vis', 'groente', 'gluten']),
    make('Broodje brie en walnoot', 480, 20, 42, 26, 'hoog', ['zuivel', 'noten', 'gluten']),
    make('Burger van kikkererwt met salade', 500, 20, 58, 20, 'medium', ['groente', 'gluten']),
    make('Nasi met kip en groente', 580, 38, 62, 20, 'hoog', ['kip', 'groente']),
    make('Broodje makreel', 460, 28, 42, 20, 'medium', ['vis', 'gluten']),
    make('Groente-omelet met rijst', 480, 24, 52, 20, 'medium', ['ei', 'groente']),
    make('Broodje carpaccio', 500, 32, 38, 24, 'hoog', ['rund', 'gluten']),
    make('Salade met gerookte zalm', 520, 30, 32, 32, 'hoog', ['vis', 'groente']),
    make('Broodje kroket', 480, 16, 42, 28, 'medium', ['varken', 'gluten']),
    make('Pasta met groente en parmezaan', 540, 22, 68, 20, 'hoog', ['groente', 'gluten', 'zuivel']),
    make('Broodje spek en ei', 520, 28, 38, 28, 'hoog', ['varken', 'ei', 'gluten']),
    make('Maaltijdsalade met zalm', 500, 34, 38, 24, 'medium', ['vis', 'groente']),
    make('Soep met brood en kaas', 440, 18, 52, 18, 'medium', ['gluten', 'zuivel']),
  ],
  avond: [
    make('Gegrilde kip met rijst en groente', 480, 42, 52, 10, 'laag', ['kip', 'groente']),
    make('Zalm met zoete aardappel en broccoli', 520, 38, 48, 20, 'medium', ['vis', 'groente']),
    make('Pasta bolognese', 580, 32, 72, 16, 'medium', ['varken', 'gluten']),
    make('Biefstuk met aardappelen en groente', 620, 45, 55, 22, 'hoog', ['rund', 'groente']),
    make('Risotto met groente en parmezaan', 560, 16, 78, 18, 'hoog', ['groente', 'zuivel']),
    make('Kip curry met rijst', 520, 38, 58, 14, 'medium', ['kip']),
    make('Pangasius met dille en aardappel', 480, 42, 48, 12, 'laag', ['vis']),
    make('Vegetarische curry met rijst', 500, 16, 78, 14, 'medium', ['groente']),
    make('Varkenshaas met groente', 540, 42, 48, 20, 'medium', ['varken', 'groente']),
    make('Zalm uit de oven met groente', 550, 40, 42, 24, 'hoog', ['vis', 'groente']),
    make('Kipfilet met pasta en spinazie', 560, 48, 58, 14, 'medium', ['kip', 'groente', 'gluten']),
    make('Stamppot boerenkool met worst', 580, 28, 62, 24, 'hoog', ['varken', 'groente']),
    make('Tacos met kip en bonen', 540, 36, 58, 18, 'medium', ['kip', 'gluten']),
    make('Pasta carbonara', 620, 28, 62, 28, 'hoog', ['varken', 'ei', 'gluten', 'zuivel']),
    make('Gebakken tilapia met rijst', 500, 44, 52, 12, 'medium', ['vis']),
    make('Linzenstoof met groente', 460, 22, 72, 12, 'medium', ['groente']),
    make('Kip saté met pindasaus en rijst', 580, 42, 62, 20, 'hoog', ['kip', 'pinda']),
    make('Ovenschotel met gehakt en groente', 560, 36, 48, 24, 'medium', ['varken', 'groente']),
    make('Quinoa bowl met groente en feta', 520, 22, 58, 22, 'medium', ['groente', 'zuivel']),
    make('Biefstuk met friet en salade', 640, 48, 52, 28, 'hoog', ['rund', 'groente']),
    make('Pasta met zalm en dille', 560, 34, 58, 22, 'hoog', ['vis', 'gluten']),
    make('Kipburger met zoete aardappel', 540, 42, 52, 18, 'medium', ['kip', 'gluten']),
    make('Rijst met tofu en groente', 500, 24, 62, 18, 'medium', ['groente', 'soja']),
    make('Hamburger met salade', 580, 38, 42, 28, 'hoog', ['rund', 'groente', 'gluten']),
    make('Pasta pesto met kip', 580, 42, 58, 22, 'hoog', ['kip', 'gluten', 'noten']),
    make('Gebakken kabeljauw met groente', 520, 44, 42, 20, 'medium', ['vis', 'groente']),
    make('Stoofvlees met rode kool', 600, 42, 48, 28, 'hoog', ['rund', 'groente']),
    make('Nasi met garnalen', 560, 36, 58, 20, 'hoog', ['vis', 'groente', 'schaaldieren']),
    make('Lasagne met groente', 600, 32, 62, 28, 'hoog', ['groente', 'gluten', 'zuivel']),
    make('Kip uit de oven met aardappel', 540, 46, 52, 16, 'medium', ['kip']),
    make('Risotto met champignons', 520, 14, 72, 18, 'medium', ['groente', 'zuivel']),
    make('Spaghetti met tonijn', 560, 36, 62, 20, 'hoog', ['vis', 'gluten']),
    make('Gehaktbal met puree en groente', 580, 38, 52, 26, 'hoog', ['varken', 'groente']),
    make('Zalm met quinoa en asperges', 560, 40, 48, 24, 'hoog', ['vis', 'groente']),
    make('Thaise groente curry met rijst', 520, 14, 78, 18, 'medium', ['groente']),
    make('Schnitzel met aardappel en salade', 620, 38, 58, 26, 'hoog', ['varken', 'groente', 'gluten']),
    make('Kip tandoori met naan', 560, 44, 58, 18, 'hoog', ['kip', 'gluten']),
    make('Gebakken makreel met groente', 540, 38, 42, 28, 'hoog', ['vis', 'groente']),
    make('Tortilla’s met bonen en kaas', 560, 28, 62, 24, 'medium', ['zuivel', 'gluten']),
    make('Pasta met kip en broccoli', 540, 42, 58, 16, 'medium', ['kip', 'groente', 'gluten']),
    make('Vispannetje met rijst', 520, 38, 52, 18, 'medium', ['vis']),
    make('Chili con carne met rijst', 580, 40, 58, 22, 'hoog', ['rund']),
    make('Rolletjes kip met groente', 500, 44, 42, 18, 'medium', ['kip', 'groente']),
    make('Omelet met kaas en groente', 520, 32, 22, 36, 'hoog', ['ei', 'zuivel', 'groente']),
    make('Wok met kip en groente', 540, 42, 48, 20, 'medium', ['kip', 'groente']),
    make('Lamsrack met couscous', 620, 42, 48, 32, 'hoog', ['gluten']),
    make('Pasta puttanesca', 540, 20, 68, 20, 'medium', ['vis', 'gluten']),
    make('Kip kerrie met rijst', 520, 38, 58, 14, 'medium', ['kip']),
    make('Gegrilde tonijn met groente', 560, 48, 42, 24, 'hoog', ['vis', 'groente']),
    make('Cottage pie met groente', 580, 36, 52, 28, 'hoog', ['rund', 'groente']),
    make('Risotto met zalm', 580, 28, 62, 26, 'hoog', ['vis', 'zuivel']),
    make('Kipfilet met ratatouille', 500, 44, 42, 18, 'medium', ['kip', 'groente']),
  ],
  snack: [
    make('Banaan', 105, 1, 27, 0, 'laag', []),
    make('Kwark', 120, 18, 6, 4, 'laag', ['zuivel']),
    make('Notenmix (handje)', 180, 6, 6, 16, 'medium', ['noten']),
    make('Banaan met pindakaas', 280, 10, 32, 14, 'medium', ['pinda']),
    make('Smoothie', 220, 8, 38, 4, 'medium', []),
    make('Energiereep', 200, 8, 28, 6, 'hoog', []),
    make('Boterham met jam', 250, 6, 48, 4, 'hoog', ['gluten']),
    make('Appel', 80, 0, 22, 0, 'laag', []),
    make('Griekse yoghurt', 140, 16, 8, 6, 'laag', ['zuivel']),
    make('Rozijnen (handje)', 130, 1, 32, 0, 'laag', []),
    make('Rijstwafel met hummus', 180, 6, 28, 8, 'laag', []),
    make('Komkommer met dip', 60, 2, 10, 2, 'laag', ['groente']),
    make('Cracker met kaas', 200, 10, 18, 12, 'medium', ['gluten', 'zuivel']),
    make('Dadel met amandel', 160, 4, 24, 8, 'medium', ['noten']),
    make('Mueslireep', 220, 6, 38, 8, 'medium', ['gluten']),
    make('Paprika reepjes', 30, 1, 6, 0, 'laag', ['groente']),
    make('Meloen', 70, 1, 18, 0, 'laag', []),
    make('Eierkoek', 120, 4, 22, 2, 'laag', ['ei', 'gluten']),
    make('Pindakaas op cracker', 240, 10, 22, 16, 'medium', ['gluten', 'pinda']),
    make('Sinaasappel', 60, 1, 15, 0, 'laag', []),
    make('Vruchtenyoghurt', 180, 8, 32, 4, 'medium', ['zuivel']),
    make('Studentenhaver', 200, 6, 18, 14, 'medium', ['noten']),
    make('Banaan met kwark', 220, 16, 32, 4, 'laag', ['zuivel']),
    make('Gedroogde abrikozen', 140, 2, 36, 0, 'laag', []),
    make('Haring', 220, 18, 0, 16, 'medium', ['vis']),
    make('Boterham met pindakaas', 320, 14, 38, 16, 'medium', ['gluten', 'pinda']),
    make('Cottage cheese met fruit', 200, 24, 22, 4, 'laag', ['zuivel']),
    make('Mix van bessen', 80, 1, 20, 0, 'laag', []),
    make('Reep met noten en honing', 260, 8, 32, 14, 'hoog', ['noten']),
    make('Kaasblokjes', 180, 14, 2, 14, 'medium', ['zuivel']),
    make('Smoothie met banaan en melk', 240, 10, 42, 6, 'medium', ['zuivel']),
    make('Worteltjes', 40, 0, 10, 0, 'laag', ['groente']),
    make('Ontbijtkoek (klein)', 180, 2, 38, 4, 'medium', ['gluten']),
    make('Amandelen (handje)', 170, 6, 6, 15, 'medium', ['noten']),
    make('Boterham met hagelslag', 280, 8, 48, 10, 'medium', ['gluten']),
    make('Krentenbol', 220, 8, 42, 4, 'medium', ['gluten']),
    make('Gedroogde vijgen', 150, 2, 38, 0, 'laag', []),
    make('Tonijn op cracker', 200, 22, 18, 8, 'medium', ['vis', 'gluten']),
    make('Chocolademelk', 220, 10, 32, 8, 'medium', ['zuivel']),
    make('Banaan met amandelpasta', 300, 10, 38, 14, 'medium', ['noten']),
    make('Fruit salade', 100, 1, 26, 0, 'laag', []),
    make('Popcorn (natuurlijk)', 120, 2, 24, 4, 'laag', []),
    make('Liga met banaan', 240, 6, 42, 8, 'medium', ['gluten']),
    make('Kwark met muesli', 280, 22, 38, 8, 'medium', ['zuivel', 'gluten']),
    make('Geroosterde kikkererwten', 180, 10, 26, 6, 'laag', []),
    make('Boterham met banaan', 300, 10, 52, 8, 'medium', ['gluten']),
    make('Protein shake', 200, 28, 8, 4, 'medium', ['zuivel']),
    make('Druiven', 90, 1, 24, 0, 'laag', []),
    make('Walnoten (handje)', 200, 6, 4, 20, 'hoog', ['noten']),
    make('Boterham met kaas en tomaat', 320, 16, 38, 14, 'medium', ['gluten', 'zuivel', 'groente']),
    make('Rijstcake met avocado', 220, 4, 28, 12, 'medium', []),
    make('Sultana', 200, 4, 38, 6, 'medium', ['gluten']),
  ],
}

/** Geeft alle maaltijden voor een slot en energieniveau. Optioneel gefilterd op client input (dieet/allergieën). */
export function getMealOptionsFromLibrary(energyLevel, mealSlot, input) {
  const slot = mealSlot === 'snack1' || mealSlot === 'snack2' ? 'snack' : mealSlot
  const list = FOOD_LIBRARY[slot]
  if (!list) return []
  let out = list.filter((m) => m.energyLevel === energyLevel)
  if (input && (input.dietary_prefs || input.restrictions)) {
    out = filterMealsByInput(out, input)
  }
  return out
}

/** Geeft een eenvoudige boodschappenlijst op basis van de gekozen maaltijden (namen). */
export function getShoppingListForMeals(displayMeals) {
  if (!displayMeals?.length) return []
  const ingredients = []
  const added = new Set()
  for (const m of displayMeals) {
    const name = (m.name || '').toLowerCase()
    if (name && !added.has(name)) {
      added.add(name)
      ingredients.push(m.name)
    }
  }
  return ingredients
}
