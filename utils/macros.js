/**
 * Atwater general factors: protein 4, carbs 4, fat 9 kcal/g
 */
export function kcalFromMacros(proteinsG, carbsG, fatsG) {
  const p = Number(proteinsG) || 0;
  const c = Number(carbsG) || 0;
  const f = Number(fatsG) || 0;
  return Math.round(p * 4 + c * 4 + f * 9);
}
