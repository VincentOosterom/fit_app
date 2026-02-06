/**
 * Voedingsbibliotheek: maaltijden per slot en energieniveau.
 * Tags voor filtering op dieet/restricties: varken, vis, gevogelte, groente, noten, gluten, lactose, zuivel, ei, etc.
 *
 * kcal en macro's zijn afgestemd op de opgegeven porties (grams), gebaseerd op gangbare
 * referentiewaarden (bijv. banaan ~89 kcal/100g, havermout droog ~389/100g, kip ~110/100g).
 */

/** grams: optionele hoeveelheid, bv. "40 g havermout, 1 banaan" of "200 g kip" */
const make = (name, kcal, protein, carbs, fat, energyLevel, tags = [], grams = null) => ({
  name,
  kcal,
  protein,
  carbs,
  fat,
  energyLevel,
  tags: tags.map((t) => t.toLowerCase()),
  ...(grams != null && grams !== '' && { grams }),
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
    make('Havermout met banaan', 265, 9, 50, 5, 'laag', ['gluten'], '40 g havermout, 1 banaan'),
    make('Havermout met banaan en noten', 420, 12, 58, 14, 'medium', ['gluten', 'noten'], '50 g havermout, 1 banaan, 20 g noten'),
    make('Havermout met banaan, noten en honing', 555, 14, 72, 18, 'hoog', ['gluten', 'noten'], '60 g havermout, 1 banaan, 25 g noten, 1 el honing'),
    make('Yoghurt met muesli', 250, 10, 40, 6, 'laag', ['zuivel', 'gluten'], '150 g yoghurt, 40 g muesli'),
    make('Yoghurt met muesli en fruit', 380, 12, 52, 10, 'medium', ['zuivel', 'gluten'], '200 g yoghurt, 50 g muesli, 1 stuk fruit'),
    make('Eieren met volkorenbrood', 335, 18, 30, 14, 'medium', ['ei', 'gluten'], '2 eieren, 2 sneetjes volkorenbrood'),
    make('Smoothie bowl', 385, 10, 60, 11, 'hoog', [], '1 banaan, 50 g bessen, 40 g granola, 100 ml melk'),
    make('Kwark met banaan', 230, 23, 35, 1, 'laag', ['zuivel'], '200 g kwark, 1 banaan'),
    make('Omelet met groente', 315, 22, 6, 24, 'laag', ['ei', 'groente'], '2 eieren, 75 g groente'),
    make('Pannenkoeken met banaan', 395, 11, 58, 13, 'medium', ['gluten', 'ei'], '2 pannenkoeken, 1 banaan'),
    make('Brinta met melk en banaan', 335, 12, 56, 5, 'laag', ['gluten', 'zuivel'], '50 g Brinta, 150 ml melk, 1 banaan'),
    make('Crackers met hüttenkäse', 280, 18, 28, 10, 'laag', ['zuivel'], '4 crackers, 80 g hüttenkäse'),
    make('Fruit salade met kwark', 260, 16, 42, 2, 'laag', ['zuivel'], '150 g kwark, 150 g fruit'),
    make('Roggebrood met kaas', 320, 16, 38, 12, 'medium', ['gluten', 'zuivel'], '2 sneetjes roggebrood, 40 g kaas'),
    make('Scrambled eggs met toast', 380, 20, 36, 16, 'medium', ['ei', 'gluten'], '2 eieren, 2 sneetjes toast'),
    make('Ontbijtgranen met melk', 360, 12, 62, 8, 'medium', ['gluten', 'zuivel'], '60 g ontbijtgranen, 200 ml melk'),
    make('Smoothie met banaan en spinazie', 255, 6, 50, 3, 'laag', ['groente'], '1 banaan, 30 g spinazie, 150 ml melk'),
    make('Bagel met roomkaas en zalm', 450, 24, 48, 18, 'hoog', ['gluten', 'zuivel', 'vis'], '1 bagel, 50 g roomkaas, 60 g zalm'),
    make('Pindakaas op volkorenbrood', 400, 18, 44, 18, 'medium', ['gluten', 'pinda'], '2 sneetjes brood, 30 g pindakaas'),
    make('Chia pudding met fruit', 320, 10, 48, 12, 'laag', [], '30 g chiazaad, 150 ml melk, 100 g fruit'),
    make('Griekse yoghurt met honing en walnoten', 380, 20, 42, 16, 'medium', ['zuivel', 'noten'], '200 g Griekse yoghurt, 1 el honing, 20 g walnoten'),
    make('Wentelteefjes met kaneel', 420, 14, 52, 16, 'medium', ['gluten', 'ei'], '2 wentelteefjes'),
    make('Mueslireep met yoghurt', 340, 12, 52, 10, 'medium', ['zuivel', 'gluten'], '1 mueslireep, 150 g yoghurt'),
    make('Avocado op toast', 380, 10, 36, 22, 'medium', ['gluten'], '½ avocado, 2 sneetjes toast'),
    make('Overnight oats met bessen', 350, 12, 58, 8, 'laag', [], '50 g havermout, 100 g bessen, 150 ml melk'),
    make('Eierkoek met banaan', 215, 5, 50, 4, 'laag', ['ei', 'gluten'], '1 eierkoek, 1 banaan'),
    make('Knakworst met brood', 420, 18, 38, 22, 'medium', ['varken', 'gluten'], '1 knakworst, 2 sneetjes brood'),
    make('Spekpannenkoek', 480, 16, 48, 24, 'hoog', ['varken', 'gluten', 'ei'], '2 pannenkoeken, 2 plakken spek'),
    make('Cornflakes met melk', 340, 10, 62, 6, 'medium', ['gluten', 'zuivel'], '60 g cornflakes, 200 ml melk'),
    make('Boerenomelet', 450, 28, 12, 32, 'hoog', ['ei', 'groente'], '3 eieren, 100 g groente, 40 g kaas'),
    make('Croissant met jam', 380, 8, 48, 18, 'medium', ['gluten', 'zuivel'], '1 croissant, 2 el jam'),
    make('Ontbijtkoek met boter', 360, 6, 58, 12, 'medium', ['gluten'], '2 plakken ontbijtkoek, 15 g boter'),
    make('Kefir met muesli', 300, 12, 48, 8, 'laag', ['zuivel', 'gluten'], '250 ml kefir, 40 g muesli'),
    make('Rijstwafels met pindakaas', 320, 12, 42, 12, 'laag', ['pinda'], '4 rijstwafels, 25 g pindakaas'),
    make('Sojayoghurt met granola', 340, 16, 48, 10, 'medium', ['gluten', 'soja'], '200 g sojayoghurt, 45 g granola'),
    make('Pompoenpannenkoeken', 380, 12, 58, 12, 'medium', ['gluten', 'ei', 'groente'], '2 pannenkoeken, 80 g pompoen'),
    make('Gierstpap met bessen', 350, 10, 62, 8, 'laag', [], '50 g gierst, 80 g bessen'),
    make('Speltbrood met ei', 400, 22, 42, 16, 'medium', ['gluten', 'ei'], '2 sneetjes speltbrood, 2 eieren'),
    make('Smoothie bowl met granola', 430, 10, 66, 13, 'hoog', ['gluten'], '1 banaan, 50 g bessen, 50 g granola'),
    make('Wafel met fruit', 420, 10, 72, 12, 'hoog', ['gluten', 'ei'], '1 wafel, 100 g fruit'),
    make('Ontbijtburrito met ei en bonen', 480, 24, 48, 22, 'hoog', ['ei', 'gluten'], '1 tortilla, 2 eieren, 60 g bonen'),
    make('Zweeds ontbijt (knäckebröd, kaas)', 360, 18, 38, 16, 'medium', ['gluten', 'zuivel'], '3 knäckebröd, 50 g kaas'),
    make('Pannenkoek met spek', 520, 22, 48, 28, 'hoog', ['varken', 'gluten', 'ei'], '3 pannenkoeken, 3 plakken spek'),
    make('Quinoa ontbijt met noten', 400, 14, 52, 14, 'medium', ['noten'], '80 g quinoa, 25 g noten'),
    make('Lijnzaadcrackers met hummus', 320, 12, 38, 14, 'laag', [], '4 crackers, 60 g hummus'),
  ],
  lunch: [
    make('Volkoren wrap met kip en groente', 380, 28, 42, 10, 'laag', ['kip', 'groente', 'gluten'], '1 wrap, 100 g kip, 80 g groente'),
    make('Salade met quinoa en feta', 450, 18, 48, 20, 'medium', ['groente', 'zuivel'], '80 g quinoa, 60 g feta, 100 g groente'),
    make('Sandwich met hummus en groente', 420, 14, 58, 14, 'medium', ['groente', 'gluten'], '2 sneetjes brood, 60 g hummus, 75 g groente'),
    make('Pasta salade met tonijn', 520, 32, 55, 18, 'hoog', ['vis', 'gluten'], '100 g pasta, 100 g tonijn, 50 g groente'),
    make('Rijst met kip en groente', 550, 35, 62, 14, 'hoog', ['kip', 'groente'], '120 g rijst, 150 g kip, 100 g groente'),
    make('Kipfilet met zoete aardappel', 480, 42, 48, 10, 'laag', ['kip'], '150 g kip, 200 g zoete aardappel'),
    make('Tonijnsalade met crackers', 400, 36, 32, 16, 'medium', ['vis', 'gluten'], '100 g tonijn, 4 crackers, 50 g groente'),
    make('Broodje gezond met kip', 450, 28, 48, 14, 'medium', ['kip', 'groente', 'gluten'], '1 broodje, 80 g kip, 60 g groente'),
    make('Linzensoep met brood', 420, 18, 62, 12, 'medium', ['gluten'], '350 ml soep, 1 sneetje brood'),
    make('Wraps met kidneybonen en groente', 480, 20, 72, 14, 'medium', ['groente', 'gluten'], '2 wraps, 80 g kidneybonen, 80 g groente'),
    make('Zalm met rijst en komkommer', 520, 38, 48, 18, 'hoog', ['vis', 'groente'], '120 g zalm, 100 g rijst, 50 g komkommer'),
    make('Pita met falafel en salade', 500, 18, 62, 18, 'medium', ['groente', 'gluten'], '1 pita, 4 falafel, 80 g salade'),
    make('Omelet met groente en brood', 460, 28, 42, 18, 'medium', ['ei', 'groente', 'gluten'], '2 eieren, 80 g groente, 1 sneetje brood'),
    make('Couscous met groente en kikkererwten', 440, 16, 72, 12, 'medium', ['groente', 'gluten'], '80 g couscous, 60 g kikkererwten, 80 g groente'),
    make('Broodje tonijn', 420, 28, 48, 12, 'medium', ['vis', 'gluten'], '1 broodje, 80 g tonijn'),
    make('Maaltijdsalade met kip', 480, 42, 38, 16, 'laag', ['kip', 'groente'], '150 g kip, 120 g salade'),
    make('Tortilla met kip en avocado', 520, 36, 48, 20, 'hoog', ['kip', 'gluten'], '2 tortilla’s, 120 g kip, ½ avocado'),
    make('Rijstsalade met edamame', 460, 20, 62, 14, 'medium', ['groente', 'soja'], '100 g rijst, 60 g edamame, 60 g groente'),
    make('Gevulde wrap met hummus', 440, 14, 62, 16, 'medium', ['groente', 'gluten'], '2 wraps, 70 g hummus, 80 g groente'),
    make('Haring met uitjes en brood', 500, 28, 42, 22, 'hoog', ['vis', 'gluten'], '1 haring, 2 sneetjes brood'),
    make('Gebakken ei met spinazie en brood', 420, 22, 42, 16, 'medium', ['ei', 'groente', 'gluten'], '2 eieren, 60 g spinazie, 1 sneetje brood'),
    make('Pasta met pesto en groente', 540, 18, 72, 20, 'hoog', ['groente', 'gluten', 'noten'], '100 g pasta, 40 g pesto, 80 g groente'),
    make('Buddha bowl met tofu', 480, 22, 58, 18, 'medium', ['groente', 'soja'], '100 g rijst, 100 g tofu, 80 g groente'),
    make('Broodje rosbief', 480, 32, 42, 20, 'medium', ['rund', 'gluten'], '1 broodje, 80 g rosbief'),
    make('Salade met geitenkaas en noten', 500, 20, 32, 36, 'hoog', ['zuivel', 'noten', 'groente'], '60 g geitenkaas, 25 g noten, 100 g salade'),
    make('Wortelsoep met brood', 380, 10, 62, 12, 'laag', ['groente', 'gluten'], '350 ml soep, 1 sneetje brood'),
    make('Sushi bowl met zalm', 520, 28, 62, 18, 'hoog', ['vis'], '100 g rijst, 80 g zalm, 30 g zeewier'),
    make('Broodje kipfilet', 420, 36, 42, 12, 'medium', ['kip', 'gluten'], '1 broodje, 100 g kipfilet'),
    make('Groentesoep met balletjes', 400, 22, 48, 12, 'medium', ['groente', 'varken'], '350 ml soep, 3 balletjes'),
    make('Wrap met gegrilde groente', 440, 14, 62, 16, 'medium', ['groente', 'gluten'], '2 wraps, 120 g groente'),
    make('Gnocchi met tomatensaus', 520, 14, 78, 16, 'hoog', ['gluten'], '200 g gnocchi, 100 g tomatensaus'),
    make('Broodje kaas', 420, 22, 42, 20, 'medium', ['zuivel', 'gluten'], '1 broodje, 50 g kaas'),
    make('Salade met kip en avocado', 480, 38, 28, 26, 'medium', ['kip', 'groente'], '120 g kip, ½ avocado, 80 g salade'),
    make('Pasta met tonijn en spinazie', 540, 34, 62, 16, 'hoog', ['vis', 'groente', 'gluten'], '100 g pasta, 80 g tonijn, 50 g spinazie'),
    make('Broodje brie en walnoot', 480, 20, 42, 26, 'hoog', ['zuivel', 'noten', 'gluten'], '1 broodje, 50 g brie, 20 g walnoot'),
    make('Burger van kikkererwt met salade', 500, 20, 58, 20, 'medium', ['groente', 'gluten'], '1 burger, 80 g salade'),
    make('Nasi met kip en groente', 580, 38, 62, 20, 'hoog', ['kip', 'groente'], '120 g rijst, 120 g kip, 80 g groente'),
    make('Broodje makreel', 460, 28, 42, 20, 'medium', ['vis', 'gluten'], '1 broodje, 80 g makreel'),
    make('Groente-omelet met rijst', 480, 24, 52, 20, 'medium', ['ei', 'groente'], '2 eieren, 80 g groente, 80 g rijst'),
    make('Broodje carpaccio', 500, 32, 38, 24, 'hoog', ['rund', 'gluten'], '1 broodje, 80 g carpaccio'),
    make('Salade met gerookte zalm', 520, 30, 32, 32, 'hoog', ['vis', 'groente'], '80 g zalm, 100 g salade'),
    make('Broodje kroket', 480, 16, 42, 28, 'medium', ['varken', 'gluten'], '1 broodje, 2 kroketten'),
    make('Pasta met groente en parmezaan', 540, 22, 68, 20, 'hoog', ['groente', 'gluten', 'zuivel'], '100 g pasta, 80 g groente, 20 g parmezaan'),
    make('Broodje spek en ei', 520, 28, 38, 28, 'hoog', ['varken', 'ei', 'gluten'], '1 broodje, 2 plakken spek, 1 ei'),
    make('Maaltijdsalade met zalm', 500, 34, 38, 24, 'medium', ['vis', 'groente'], '100 g zalm, 120 g salade'),
    make('Soep met brood en kaas', 440, 18, 52, 18, 'medium', ['gluten', 'zuivel'], '350 ml soep, 1 sneetje brood, 30 g kaas'),
  ],
  avond: [
    make('Gegrilde kip met rijst en groente', 480, 42, 52, 10, 'laag', ['kip', 'groente'], '150 g kip, 100 g rijst, 150 g groente'),
    make('Zalm met zoete aardappel en broccoli', 520, 38, 48, 20, 'medium', ['vis', 'groente'], '150 g zalm, 150 g zoete aardappel, 100 g broccoli'),
    make('Pasta bolognese', 580, 32, 72, 16, 'medium', ['varken', 'gluten'], '100 g pasta, 120 g gehakt, 80 g tomatensaus'),
    make('Biefstuk met aardappelen en groente', 620, 45, 55, 22, 'hoog', ['rund', 'groente'], '180 g biefstuk, 200 g aardappel, 150 g groente'),
    make('Risotto met groente en parmezaan', 560, 16, 78, 18, 'hoog', ['groente', 'zuivel'], '90 g rijst, 80 g groente, 25 g parmezaan'),
    make('Kip curry met rijst', 520, 38, 58, 14, 'medium', ['kip'], '150 g kip, 120 g rijst, 80 g groente'),
    make('Pangasius met dille en aardappel', 480, 42, 48, 12, 'laag', ['vis'], '180 g pangasius, 200 g aardappel'),
    make('Vegetarische curry met rijst', 500, 16, 78, 14, 'medium', ['groente'], '120 g rijst, 150 g groente, 50 g kikkererwten'),
    make('Varkenshaas met groente', 540, 42, 48, 20, 'medium', ['varken', 'groente'], '150 g varkenshaas, 200 g groente'),
    make('Zalm uit de oven met groente', 550, 40, 42, 24, 'hoog', ['vis', 'groente'], '180 g zalm, 200 g groente'),
    make('Kipfilet met pasta en spinazie', 560, 48, 58, 14, 'medium', ['kip', 'groente', 'gluten'], '150 g kip, 100 g pasta, 80 g spinazie'),
    make('Stamppot boerenkool met worst', 580, 28, 62, 24, 'hoog', ['varken', 'groente'], '300 g stamppot, 1 rookworst'),
    make('Tacos met kip en bonen', 540, 36, 58, 18, 'medium', ['kip', 'gluten'], '3 tortilla\'s, 120 g kip, 60 g bonen'),
    make('Pasta carbonara', 620, 28, 62, 28, 'hoog', ['varken', 'ei', 'gluten', 'zuivel'], '100 g pasta, 80 g spek, 1 ei, 30 g kaas'),
    make('Gebakken tilapia met rijst', 500, 44, 52, 12, 'medium', ['vis'], '180 g tilapia, 120 g rijst'),
    make('Linzenstoof met groente', 460, 22, 72, 12, 'medium', ['groente'], '80 g linzen, 150 g groente'),
    make('Kip saté met pindasaus en rijst', 580, 42, 62, 20, 'hoog', ['kip', 'pinda'], '150 g kip, 120 g rijst, 50 g pindasaus'),
    make('Ovenschotel met gehakt en groente', 560, 36, 48, 24, 'medium', ['varken', 'groente'], '120 g gehakt, 150 g groente, 80 g aardappel'),
    make('Quinoa bowl met groente en feta', 520, 22, 58, 22, 'medium', ['groente', 'zuivel'], '100 g quinoa, 100 g groente, 50 g feta'),
    make('Biefstuk met friet en salade', 640, 48, 52, 28, 'hoog', ['rund', 'groente'], '180 g biefstuk, 150 g friet, 80 g salade'),
    make('Pasta met zalm en dille', 560, 34, 58, 22, 'hoog', ['vis', 'gluten'], '100 g pasta, 120 g zalm'),
    make('Kipburger met zoete aardappel', 540, 42, 52, 18, 'medium', ['kip', 'gluten'], '1 kipburger, 150 g zoete aardappel'),
    make('Rijst met tofu en groente', 500, 24, 62, 18, 'medium', ['groente', 'soja'], '120 g rijst, 150 g tofu, 100 g groente'),
    make('Hamburger met salade', 580, 38, 42, 28, 'hoog', ['rund', 'groente', 'gluten'], '1 hamburger (150 g), 80 g salade'),
    make('Pasta pesto met kip', 580, 42, 58, 22, 'hoog', ['kip', 'gluten', 'noten'], '100 g pasta, 120 g kip, 40 g pesto'),
    make('Gebakken kabeljauw met groente', 520, 44, 42, 20, 'medium', ['vis', 'groente'], '180 g kabeljauw, 200 g groente'),
    make('Stoofvlees met rode kool', 600, 42, 48, 28, 'hoog', ['rund', 'groente'], '150 g stoofvlees, 150 g rode kool'),
    make('Nasi met garnalen', 560, 36, 58, 20, 'hoog', ['vis', 'groente', 'schaaldieren'], '120 g rijst, 100 g garnalen, 80 g groente'),
    make('Lasagne met groente', 600, 32, 62, 28, 'hoog', ['groente', 'gluten', 'zuivel'], '250 g lasagne, 80 g groente'),
    make('Kip uit de oven met aardappel', 540, 46, 52, 16, 'medium', ['kip'], '180 g kip, 200 g aardappel'),
    make('Risotto met champignons', 520, 14, 72, 18, 'medium', ['groente', 'zuivel'], '90 g rijst, 80 g champignons'),
    make('Spaghetti met tonijn', 560, 36, 62, 20, 'hoog', ['vis', 'gluten'], '100 g pasta, 100 g tonijn'),
    make('Gehaktbal met puree en groente', 580, 38, 52, 26, 'hoog', ['varken', 'groente'], '2 gehaktballen, 200 g puree, 100 g groente'),
    make('Zalm met quinoa en asperges', 560, 40, 48, 24, 'hoog', ['vis', 'groente'], '150 g zalm, 80 g quinoa, 100 g asperges'),
    make('Thaise groente curry met rijst', 520, 14, 78, 18, 'medium', ['groente'], '120 g rijst, 180 g groente'),
    make('Schnitzel met aardappel en salade', 620, 38, 58, 26, 'hoog', ['varken', 'groente', 'gluten'], '1 schnitzel (150 g), 200 g aardappel, 80 g salade'),
    make('Kip tandoori met naan', 560, 44, 58, 18, 'hoog', ['kip', 'gluten'], '180 g kip, 1 naan'),
    make('Gebakken makreel met groente', 540, 38, 42, 28, 'hoog', ['vis', 'groente'], '180 g makreel, 200 g groente'),
    make('Tortilla’s met bonen en kaas', 560, 28, 62, 24, 'medium', ['zuivel', 'gluten'], '3 tortilla\'s, 80 g bonen, 40 g kaas'),
    make('Pasta met kip en broccoli', 540, 42, 58, 16, 'medium', ['kip', 'groente', 'gluten'], '100 g pasta, 120 g kip, 150 g broccoli'),
    make('Vispannetje met rijst', 520, 38, 52, 18, 'medium', ['vis'], '150 g vis, 120 g rijst'),
    make('Chili con carne met rijst', 580, 40, 58, 22, 'hoog', ['rund'], '120 g rijst, 150 g gehakt, 80 g bonen'),
    make('Rolletjes kip met groente', 500, 44, 42, 18, 'medium', ['kip', 'groente'], '150 g kip, 150 g groente'),
    make('Omelet met kaas en groente', 520, 32, 22, 36, 'hoog', ['ei', 'zuivel', 'groente'], '3 eieren, 50 g kaas, 80 g groente'),
    make('Wok met kip en groente', 540, 42, 48, 20, 'medium', ['kip', 'groente'], '150 g kip, 200 g groente'),
    make('Lamsrack met couscous', 620, 42, 48, 32, 'hoog', ['gluten'], '180 g lamsrack, 100 g couscous'),
    make('Pasta puttanesca', 540, 20, 68, 20, 'medium', ['vis', 'gluten'], '100 g pasta, 50 g tonijn, 50 g olijven'),
    make('Kip kerrie met rijst', 520, 38, 58, 14, 'medium', ['kip'], '150 g kip, 120 g rijst'),
    make('Gegrilde tonijn met groente', 560, 48, 42, 24, 'hoog', ['vis', 'groente'], '180 g tonijn, 200 g groente'),
    make('Cottage pie met groente', 580, 36, 52, 28, 'hoog', ['rund', 'groente'], '250 g cottage pie, 80 g groente'),
    make('Risotto met zalm', 580, 28, 62, 26, 'hoog', ['vis', 'zuivel'], '90 g rijst, 100 g zalm'),
    make('Kipfilet met ratatouille', 500, 44, 42, 18, 'medium', ['kip', 'groente'], '150 g kip, 200 g ratatouille'),
  ],
  snack: [
    make('Banaan', 107, 1, 27, 0, 'laag', [], '1 banaan (ca. 120 g)'),
    make('Kwark', 90, 16, 5, 2, 'laag', ['zuivel'], '150 g kwark'),
    make('Notenmix (handje)', 180, 5, 6, 16, 'medium', ['noten'], '30 g notenmix'),
    make('Banaan met pindakaas', 225, 8, 30, 12, 'medium', ['pinda'], '1 banaan, 20 g pindakaas'),
    make('Smoothie', 220, 8, 38, 4, 'medium', [], '300 ml smoothie'),
    make('Energiereep', 200, 8, 28, 6, 'hoog', [], '1 reep (55 g)'),
    make('Boterham met jam', 250, 6, 48, 4, 'hoog', ['gluten'], '1 sneetje brood, 1 el jam'),
    make('Appel', 80, 0, 22, 0, 'laag', [], '1 appel (ca. 150 g)'),
    make('Griekse yoghurt', 140, 16, 8, 6, 'laag', ['zuivel'], '150 g Griekse yoghurt'),
    make('Rozijnen (handje)', 130, 1, 32, 0, 'laag', [], '30 g rozijnen'),
    make('Rijstwafel met hummus', 180, 6, 28, 8, 'laag', [], '2 rijstwafels, 40 g hummus'),
    make('Komkommer met dip', 60, 2, 10, 2, 'laag', ['groente'], '½ komkommer, 2 el dip'),
    make('Cracker met kaas', 200, 10, 18, 12, 'medium', ['gluten', 'zuivel'], '4 crackers, 30 g kaas'),
    make('Dadel met amandel', 160, 4, 24, 8, 'medium', ['noten'], '2 dadels, 10 g amandelen'),
    make('Mueslireep', 220, 6, 38, 8, 'medium', ['gluten'], '1 mueslireep (50 g)'),
    make('Paprika reepjes', 30, 1, 6, 0, 'laag', ['groente'], '50 g paprika'),
    make('Meloen', 70, 1, 18, 0, 'laag', [], '150 g meloen'),
    make('Eierkoek', 120, 4, 22, 2, 'laag', ['ei', 'gluten'], '1 eierkoek'),
    make('Pindakaas op cracker', 240, 10, 22, 16, 'medium', ['gluten', 'pinda'], '2 crackers, 25 g pindakaas'),
    make('Sinaasappel', 60, 1, 15, 0, 'laag', [], '1 sinaasappel'),
    make('Vruchtenyoghurt', 180, 8, 32, 4, 'medium', ['zuivel'], '200 g vruchtenyoghurt'),
    make('Studentenhaver', 200, 6, 18, 14, 'medium', ['noten'], '35 g studentenhaver'),
    make('Banaan met kwark', 165, 18, 28, 1, 'laag', ['zuivel'], '1 banaan, 100 g kwark'),
    make('Gedroogde abrikozen', 140, 2, 36, 0, 'laag', [], '40 g gedroogde abrikozen'),
    make('Haring', 220, 18, 0, 16, 'medium', ['vis'], '1 haring (ca. 80 g)'),
    make('Boterham met pindakaas', 320, 14, 38, 16, 'medium', ['gluten', 'pinda'], '1 sneetje brood, 30 g pindakaas'),
    make('Cottage cheese met fruit', 200, 24, 22, 4, 'laag', ['zuivel'], '150 g cottage cheese, 80 g fruit'),
    make('Mix van bessen', 80, 1, 20, 0, 'laag', [], '100 g bessen'),
    make('Reep met noten en honing', 260, 8, 32, 14, 'hoog', ['noten'], '1 reep (60 g)'),
    make('Kaasblokjes', 180, 14, 2, 14, 'medium', ['zuivel'], '40 g kaas'),
    make('Smoothie met banaan en melk', 220, 8, 40, 5, 'medium', ['zuivel'], '1 banaan, 150 ml melk'),
    make('Worteltjes', 40, 0, 10, 0, 'laag', ['groente'], '1 wortel (ca. 80 g)'),
    make('Ontbijtkoek (klein)', 180, 2, 38, 4, 'medium', ['gluten'], '1 plak ontbijtkoek'),
    make('Amandelen (handje)', 170, 6, 6, 15, 'medium', ['noten'], '28 g amandelen'),
    make('Boterham met hagelslag', 280, 8, 48, 10, 'medium', ['gluten'], '1 sneetje brood, 15 g hagelslag'),
    make('Krentenbol', 220, 8, 42, 4, 'medium', ['gluten'], '1 krentenbol'),
    make('Gedroogde vijgen', 150, 2, 38, 0, 'laag', [], '40 g gedroogde vijgen'),
    make('Tonijn op cracker', 200, 22, 18, 8, 'medium', ['vis', 'gluten'], '2 crackers, 50 g tonijn'),
    make('Chocolademelk', 220, 10, 32, 8, 'medium', ['zuivel'], '300 ml chocolademelk'),
    make('Banaan met amandelpasta', 260, 6, 35, 14, 'medium', ['noten'], '1 banaan, 25 g amandelpasta'),
    make('Fruit salade', 100, 1, 26, 0, 'laag', [], '150 g fruit'),
    make('Popcorn (natuurlijk)', 120, 2, 24, 4, 'laag', [], '30 g maïs (popped)'),
    make('Liga met banaan', 215, 5, 42, 5, 'medium', ['gluten'], '1 Liga, 1 banaan'),
    make('Kwark met muesli', 280, 22, 38, 8, 'medium', ['zuivel', 'gluten'], '150 g kwark, 40 g muesli'),
    make('Geroosterde kikkererwten', 180, 10, 26, 6, 'laag', [], '50 g kikkererwten'),
    make('Boterham met banaan', 295, 6, 52, 6, 'medium', ['gluten'], '1 sneetje brood, 1 banaan'),
    make('Protein shake', 200, 28, 8, 4, 'medium', ['zuivel'], '1 shake (300 ml)'),
    make('Druiven', 90, 1, 24, 0, 'laag', [], '1 tros (ca. 120 g)'),
    make('Walnoten (handje)', 200, 6, 4, 20, 'hoog', ['noten'], '30 g walnoten'),
    make('Boterham met kaas en tomaat', 320, 16, 38, 14, 'medium', ['gluten', 'zuivel', 'groente'], '1 sneetje brood, 30 g kaas, 1 tomaat'),
    make('Rijstcake met avocado', 220, 4, 28, 12, 'medium', [], '2 rijstcakes, ¼ avocado'),
    make('Sultana', 200, 4, 38, 6, 'medium', ['gluten'], '1 Sultana (42 g)'),
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
