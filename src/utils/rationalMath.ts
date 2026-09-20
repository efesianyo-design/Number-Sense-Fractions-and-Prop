/**
 * Exact Rational Arithmetic Engine for Sir Eugene Mathematics Studio
 * Eliminates floating-point rounding errors and provides exact fraction calculations.
 */

export interface Rational {
  numerator: number;
  denominator: number;
}

/**
 * Computes Greatest Common Divisor (GCD) using Euclidean algorithm.
 */
export function gcd(a: number, b: number): number {
  let x = Math.abs(Math.round(a));
  let y = Math.abs(Math.round(b));
  while (y) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x || 1;
}

/**
 * Computes Least Common Multiple (LCM) of two numbers.
 */
export function lcm(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return Math.abs(Math.round((a * b) / gcd(a, b)));
}

/**
 * Computes LCM of multiple numbers.
 */
export function lcmMultiple(numbers: number[]): number {
  if (numbers.length === 0) return 1;
  return numbers.reduce((acc, curr) => lcm(acc, curr), 1);
}

/**
 * Creates and simplifies a Rational number.
 */
export function createRational(numerator: number, denominator: number): Rational {
  if (denominator === 0) {
    throw new Error('Denominator cannot be zero.');
  }
  const sign = (numerator < 0) !== (denominator < 0) ? -1 : 1;
  const num = Math.abs(Math.round(numerator));
  const den = Math.abs(Math.round(denominator));
  const g = gcd(num, den);
  return {
    numerator: sign * (num / g),
    denominator: den / g,
  };
}

/**
 * Adds two rational numbers exactly.
 */
export function addRational(a: Rational, b: Rational): Rational {
  const commonDen = lcm(a.denominator, b.denominator);
  const num = a.numerator * (commonDen / a.denominator) + b.numerator * (commonDen / b.denominator);
  return createRational(num, commonDen);
}

/**
 * Sums an array of rational numbers.
 */
export function sumRationals(rationals: Rational[]): Rational {
  if (rationals.length === 0) return { numerator: 0, denominator: 1 };
  return rationals.reduce((acc, curr) => addRational(acc, curr), { numerator: 0, denominator: 1 });
}

/**
 * Subtracts rational b from rational a.
 */
export function subtractRational(a: Rational, b: Rational): Rational {
  const commonDen = lcm(a.denominator, b.denominator);
  const num = a.numerator * (commonDen / a.denominator) - b.numerator * (commonDen / b.denominator);
  return createRational(num, commonDen);
}

/**
 * Multiplies two rational numbers.
 */
export function multiplyRational(a: Rational, b: Rational): Rational {
  return createRational(a.numerator * b.numerator, a.denominator * b.denominator);
}

/**
 * Divides rational a by rational b.
 */
export function divideRational(a: Rational, b: Rational): Rational {
  if (b.numerator === 0) {
    throw new Error('Cannot divide by zero fraction.');
  }
  return createRational(a.numerator * b.denominator, a.denominator * b.numerator);
}

/**
 * Compares two rational numbers:
 * Returns -1 if a < b, 0 if a = b, 1 if a > b.
 */
export function compareRational(a: Rational, b: Rational): -1 | 0 | 1 {
  const diff = a.numerator * b.denominator - b.numerator * a.denominator;
  if (diff < 0) return -1;
  if (diff > 0) return 1;
  return 0;
}

/**
 * Converts a Rational to a decimal float value.
 */
export function rationalToDecimal(r: Rational): number {
  return r.numerator / r.denominator;
}

/**
 * Formats a Rational as a KaTeX string.
 */
export function rationalToLatex(r: Rational, showSign = false): string {
  const isNeg = r.numerator < 0;
  const num = Math.abs(r.numerator);
  const den = r.denominator;
  const prefix = isNeg ? '-' : showSign && num > 0 ? '+' : '';

  if (den === 1) {
    return `${prefix}${num}`;
  }
  return `${prefix}\\frac{${num}}{${den}}`;
}

/**
 * Converts an improper fraction to a mixed number string (e.g. 1 \frac{1}{4}).
 */
export function rationalToMixedLatex(r: Rational): string {
  const isNeg = r.numerator < 0;
  const num = Math.abs(r.numerator);
  const den = r.denominator;
  const whole = Math.floor(num / den);
  const rem = num % den;
  const prefix = isNeg ? '-' : '';

  if (rem === 0) {
    return `${prefix}${whole}`;
  }
  if (whole === 0) {
    return `${prefix}\\frac{${rem}}{${den}}`;
  }
  return `${prefix}${whole}\\frac{${rem}}{${den}}`;
}
