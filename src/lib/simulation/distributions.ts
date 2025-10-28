import { ArrivalRate } from './types';

// Seeded random number generator for reproducibility
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }
}

// Poisson distribution for realistic customer arrivals
export function poissonInterval(lambda: number, random: SeededRandom): number {
  let l = Math.exp(-lambda);
  let k = 0;
  let p = 1;

  do {
    k++;
    p *= random.next();
  } while (p > l);

  return (k - 1) * 1000; // Convert to milliseconds
}

// Get arrival rate based on time of day and configuration
export function getArrivalRate(hour: number, rate: ArrivalRate): number {
  const baseRates = {
    low: 5,
    medium: 15,
    high: 30,
    rush: 50,
  };

  const base = baseRates[rate];

  // Rush hour multipliers
  const isBreakfast = hour >= 7 && hour <= 9; // 7am-9am
  const isLunch = hour >= 12 && hour <= 14; // 12pm-2pm
  const isDinner = hour >= 18 && hour <= 21; // 6pm-9pm

  if (isBreakfast) return base * 1.5;
  if (isLunch) return base * 2.0;
  if (isDinner) return base * 2.5;

  return base;
}

// Check if current time is peak hour
export function isPeakHour(): boolean {
  const hour = new Date().getHours();
  return (
    (hour >= 7 && hour <= 9) || // Breakfast
    (hour >= 12 && hour <= 14) || // Lunch
    (hour >= 18 && hour <= 21) // Dinner
  );
}

// Weighted random selection
export function weightedRandom<T>(items: T[], weights: number[]): T {
  const total = weights.reduce((sum, w) => sum + w, 0);
  let random = Math.random() * total;

  for (let i = 0; i < items.length; i++) {
    random -= weights[i];
    if (random <= 0) return items[i];
  }

  return items[items.length - 1];
}

// Generate realistic cooking time based on item complexity
export function getCookingTime(itemCount: number): number {
  const baseTime = 5 * 60 * 1000; // 5 minutes
  const perItemTime = 2 * 60 * 1000; // 2 minutes per item
  const randomFactor = 0.8 + Math.random() * 0.4; // ±20% variation

  return (baseTime + itemCount * perItemTime) * randomFactor;
}

// Generate realistic dining time
export function getDiningTime(): number {
  const baseTime = 15 * 60 * 1000; // 15 minutes
  const randomFactor = 0.7 + Math.random() * 0.6; // 15-25 minutes

  return baseTime * randomFactor;
}

// Generate random customer name
export function generateCustomerName(): string {
  const firstNames = [
    'James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer',
    'Michael', 'Linda', 'William', 'Elizabeth', 'David', 'Barbara',
    'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah',
  ];

  const lastNames = [
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia',
    'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez',
  ];

  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];

  return `${firstName} ${lastName}`;
}

// Generate customer avatar (using emoji)
export function generateAvatar(): string {
  const avatars = ['👨', '👩', '👴', '👵', '🧑', '👦', '👧', '🧔', '👨‍🦱', '👩‍🦰'];
  return avatars[Math.floor(Math.random() * avatars.length)];
}
