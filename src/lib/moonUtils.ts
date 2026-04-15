
/**
 * Calculates the current moon phase.
 * Returns a value between 0 and 1, where:
 * 0 = New Moon
 * 0.25 = First Quarter
 * 0.5 = Full Moon
 * 0.75 = Last Quarter
 */
export function getMoonPhase(date: Date = new Date()): number {
  const lp = 2551443; // Lunar period in seconds
  const now = Math.floor(date.getTime() / 1000);
  const newMoon = 592500; // Reference New Moon in Unix time
  const phase = ((now - newMoon) % lp) / lp;
  return phase < 0 ? phase + 1 : phase;
}

export function getMoonPhaseName(phase: number): string {
  if (phase < 0.06 || phase > 0.94) return 'New Moon';
  if (phase < 0.19) return 'Waxing Crescent';
  if (phase < 0.31) return 'First Quarter';
  if (phase < 0.44) return 'Waxing Gibbous';
  if (phase < 0.56) return 'Full Moon';
  if (phase < 0.69) return 'Waning Gibbous';
  if (phase < 0.81) return 'Last Quarter';
  return 'Waning Crescent';
}

export function getMoonPhaseArabic(phase: number): string {
  if (phase < 0.06 || phase > 0.94) return 'محاق';
  if (phase < 0.19) return 'هلال متزايد';
  if (phase < 0.31) return 'تربيع أول';
  if (phase < 0.44) return 'أحدب متزايد';
  if (phase < 0.56) return 'بدر كامل';
  if (phase < 0.69) return 'أحدب متناقص';
  if (phase < 0.81) return 'تربيع ثاني';
  return 'هلال متناقص';
}
