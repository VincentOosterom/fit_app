import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { FOOD_LIBRARY, filterMealsByInput } from '../lib/foodLibrary'

/**
 * Haalt food_library uit de database en geeft getMealOptions(energyLevel, mealSlot, input?).
 * Optioneel input: filtert op dieetvoorkeuren en allergieën.
 */
export function useFoodLibrary() {
  const [dbMeals, setDbMeals] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    supabase
      .from('food_library')
      .select('id, meal_slot, energy_level, name, grams, kcal, protein, carbs, fat, tags')
      .order('meal_slot')
      .order('energy_level')
      .then(({ data }) => {
        if (!cancelled) setDbMeals(data ?? [])
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const getMealOptions = useMemo(() => {
    return (energyLevel, mealSlot, input) => {
      const slot = mealSlot === 'snack1' || mealSlot === 'snack2' ? 'snack' : mealSlot
      let list
      const fromDb = dbMeals.filter((m) => m.meal_slot === slot && m.energy_level === energyLevel)
      if (fromDb.length > 0) {
        list = fromDb.map((m) => ({
          name: m.name,
          kcal: m.kcal,
          protein: m.protein ?? 0,
          carbs: m.carbs ?? 0,
          fat: m.fat ?? 0,
          energyLevel: m.energy_level,
          grams: m.grams ?? undefined,
          tags: m.tags ?? [],
        }))
      } else {
        const staticList = FOOD_LIBRARY[slot]
        list = !staticList ? [] : staticList.filter((m) => m.energyLevel === energyLevel)
      }
      if (input && (input.dietary_prefs || input.restrictions)) {
        list = filterMealsByInput(list, input)
      }
      return list
    }
  }, [dbMeals])

  return { getMealOptions, loading }
}
