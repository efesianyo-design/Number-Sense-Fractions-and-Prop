// Math utility functions for Fraction & Proportion Studio

export function gcd(a: number, b: number): number {
  a = Math.abs(Math.round(a));
  b = Math.abs(Math.round(b));
  while (b) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a || 1;
}

export function lcm(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return Math.abs(Math.round(a * b)) / gcd(a, b);
}

export function simplifyFraction(num: number, den: number): { num: number; den: number } {
  if (den === 0) return { num: 0, den: 1 };
  if (num === 0) return { num: 0, den: 1 };
  const divisor = gcd(num, den);
  const sign = (num * den < 0) ? -1 : 1;
  return {
    num: sign * Math.abs(num / divisor),
    den: Math.abs(den / divisor)
  };
}

export function fractionToLatex(num: number, den: number, showSign = false): string {
  if (den === 1) {
    return showSign && num > 0 ? `+${num}` : `${num}`;
  }
  const isNeg = num < 0;
  const absNum = Math.abs(num);
  const prefix = isNeg ? '-' : (showSign && num > 0 ? '+' : '');
  return `${prefix}\\frac{${absNum}}{${den}}`;
}

export function mixedToLatex(whole: number, num: number, den: number): string {
  if (num === 0) return `${whole}`;
  if (whole === 0) return fractionToLatex(num, den);
  return `${whole}\\frac{${num}}{${den}}`;
}

export function decimalToPercent(val: number): string {
  return `${(val * 100).toFixed(val * 100 % 1 === 0 ? 0 : 1)}%`;
}

export const FRACTION_PALETTE: Record<number, { bg: string; border: string; text: string; lightBg: string; hover: string; solidBg: string }> = {
  1: { bg: 'bg-slate-800', border: 'border-slate-700', text: 'text-white', lightBg: 'bg-slate-100', hover: 'hover:bg-slate-700', solidBg: '#1E293B' },
  2: { bg: 'bg-[#EF4444]', border: 'border-[#EF4444]', text: 'text-[#B91C1C]', lightBg: 'bg-[#FEE2E2]', hover: 'hover:bg-[#FECACA]', solidBg: '#EF4444' },
  3: { bg: 'bg-[#F97316]', border: 'border-[#F97316]', text: 'text-[#C2410C]', lightBg: 'bg-[#FFEDD5]', hover: 'hover:bg-[#FED7AA]', solidBg: '#F97316' },
  4: { bg: 'bg-[#EAB308]', border: 'border-[#EAB308]', text: 'text-[#A16207]', lightBg: 'bg-[#FEF9C3]', hover: 'hover:bg-[#FEF08A]', solidBg: '#EAB308' },
  5: { bg: 'bg-[#84CC16]', border: 'border-[#84CC16]', text: 'text-[#4D7C0F]', lightBg: 'bg-[#ECFCCB]', hover: 'hover:bg-[#D9F99D]', solidBg: '#84CC16' },
  6: { bg: 'bg-[#22C55E]', border: 'border-[#22C55E]', text: 'text-[#15803D]', lightBg: 'bg-[#DCFCE7]', hover: 'hover:bg-[#BBF7D0]', solidBg: '#22C55E' },
  8: { bg: 'bg-[#3B82F6]', border: 'border-[#3B82F6]', text: 'text-[#1D4ED8]', lightBg: 'bg-[#DBEAFE]', hover: 'hover:bg-[#BFDBFE]', solidBg: '#3B82F6' },
  10: { bg: 'bg-[#6366F1]', border: 'border-[#6366F1]', text: 'text-[#4338CA]', lightBg: 'bg-[#E0E7FF]', hover: 'hover:bg-[#C7D2FE]', solidBg: '#6366F1' },
  12: { bg: 'bg-[#A855F7]', border: 'border-[#A855F7]', text: 'text-[#7E22CE]', lightBg: 'bg-[#F3E8FF]', hover: 'hover:bg-[#E9D5FF]', solidBg: '#A855F7' },
  16: { bg: 'bg-[#EC4899]', border: 'border-[#EC4899]', text: 'text-[#BE185D]', lightBg: 'bg-[#FCE7F3]', hover: 'hover:bg-[#FBCFE8]', solidBg: '#EC4899' },
};

export const DENOMINATORS = [2, 3, 4, 5, 6, 8, 10, 12, 16] as const;
