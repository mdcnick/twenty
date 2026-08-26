export type Money = { amount: bigint; currencyCode: string };

const CENTS_PER_UNIT = 100n;
const MAX_SAFE_STORAGE_AMOUNT = BigInt(Number.MAX_SAFE_INTEGER) / 10_000n;

export function assertStorableCents(amount: bigint): bigint {
  if (amount > MAX_SAFE_STORAGE_AMOUNT || amount < -MAX_SAFE_STORAGE_AMOUNT) {
    throw new Error('money amount exceeds safe storage range');
  }
  return amount;
}

export function moneyFromDecimal(value: string, currencyCode: string): Money {
  if (!/^[A-Z]{3}$/.test(currencyCode)) throw new Error('currency must be ISO-4217 uppercase');
  const match = value.trim().match(/^([+-]?)(\d+)(?:\.(\d+))?$/);
  if (!match) throw new Error(`invalid money decimal: ${value}`);
  const [, sign, whole, fraction = ''] = match;
  const roundedFraction = `${fraction}00`.slice(0, 2);
  const roundUp = fraction.length > 2 && fraction[2] >= '5';
  let amount = BigInt(whole) * CENTS_PER_UNIT + BigInt(roundedFraction);
  if (roundUp) amount += 1n;
  if (sign === '-') amount = -amount;
  assertStorableCents(amount);
  return { amount, currencyCode };
}

export function sumMoney(values: readonly Money[]): Money {
  if (values.length === 0) return { amount: 0n, currencyCode: 'USD' };
  const currencyCode = values[0].currencyCode;
  const amount = values.reduce((total, value) => {
    if (value.currencyCode !== currencyCode) throw new Error('currency mismatch');
    return total + value.amount;
  }, 0n);
  return { amount: assertStorableCents(amount), currencyCode };
}

export function formatMoney(value: Money): string {
  const absoluteAmount = value.amount < 0n ? -value.amount : value.amount;
  const prefix = value.amount < 0n ? '-' : '';
  return `${prefix}${absoluteAmount / CENTS_PER_UNIT}.${String(absoluteAmount % CENTS_PER_UNIT).padStart(2, '0')} ${value.currencyCode}`;
}
