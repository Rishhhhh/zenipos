/**
 * Optimal Change Calculator
 * Bounded coin change with inventory constraints
 * Minimizes coins dispensed while preserving future change-making ability
 */

export interface HopperInventory {
  denomination: number;
  available: number;
  lowThreshold: number;
}

export interface ChangePlan {
  denominations: { denomination: number; quantity: number }[];
  totalCoins: number;
  feasible: boolean;
  useDrawer: boolean;
  reason?: string;
}

export function calculateOptimalChange(
  changeAmount: number,
  hoppers: HopperInventory[]
): ChangePlan {
  // Sort denominations descending
  const sortedHoppers = [...hoppers].sort((a, b) => b.denomination - a.denomination);
  
  // Try greedy approach first (fastest)
  const greedyResult = calculateGreedy(changeAmount, sortedHoppers);
  if (greedyResult.feasible && !wouldDepleteSmallCoins(greedyResult, sortedHoppers)) {
    return greedyResult;
  }

  // Try dynamic programming with constraints
  const dpResult = calculateDP(changeAmount, sortedHoppers);
  if (dpResult.feasible) {
    return dpResult;
  }

  // No feasible solution - use drawer
  return {
    denominations: [],
    totalCoins: 0,
    feasible: false,
    useDrawer: true,
    reason: 'Insufficient coins in hoppers',
  };
}

function calculateGreedy(amount: number, hoppers: HopperInventory[]): ChangePlan {
  const plan: { denomination: number; quantity: number }[] = [];
  let remaining = Math.round(amount * 100); // Work in cents
  let totalCoins = 0;

  for (const hopper of hoppers) {
    if (remaining === 0) break;

    const denomInCents = Math.round(hopper.denomination * 100);
    const maxCoins = Math.min(
      Math.floor(remaining / denomInCents),
      hopper.available
    );

    if (maxCoins > 0) {
      plan.push({ denomination: hopper.denomination, quantity: maxCoins });
      remaining -= maxCoins * denomInCents;
      totalCoins += maxCoins;
    }
  }

  return {
    denominations: plan,
    totalCoins,
    feasible: remaining === 0,
    useDrawer: false,
  };
}

function calculateDP(amount: number, hoppers: HopperInventory[]): ChangePlan {
  const amountInCents = Math.round(amount * 100);
  
  // DP table: dp[i] = minimum coins to make amount i
  const dp: number[] = new Array(amountInCents + 1).fill(Infinity);
  const parent: { denom: number; count: number }[][] = new Array(amountInCents + 1).fill(null).map(() => []);
  
  dp[0] = 0;

  // Build DP table with inventory constraints
  for (const hopper of hoppers) {
    const denomInCents = Math.round(hopper.denomination * 100);
    
    for (let amt = denomInCents; amt <= amountInCents; amt++) {
      for (let count = 1; count <= hopper.available; count++) {
        const needed = count * denomInCents;
        if (needed > amt) break;
        
        const prev = amt - needed;
        const newCoins = dp[prev] + count;
        
        if (newCoins < dp[amt]) {
          // Check if this uses the same denomination already
          const alreadyUsed = parent[prev].find(p => p.denom === hopper.denomination);
          if (!alreadyUsed || alreadyUsed.count + count <= hopper.available) {
            dp[amt] = newCoins;
            parent[amt] = [...parent[prev], { denom: hopper.denomination, count }];
          }
        }
      }
    }
  }

  if (dp[amountInCents] === Infinity) {
    return {
      denominations: [],
      totalCoins: 0,
      feasible: false,
      useDrawer: false,
    };
  }

  // Reconstruct solution
  const solution = new Map<number, number>();
  for (const { denom, count } of parent[amountInCents]) {
    solution.set(denom, (solution.get(denom) || 0) + count);
  }

  const denominations = Array.from(solution.entries())
    .map(([denomination, quantity]) => ({ denomination, quantity }))
    .sort((a, b) => b.denomination - a.denomination);

  return {
    denominations,
    totalCoins: dp[amountInCents],
    feasible: true,
    useDrawer: false,
  };
}

function wouldDepleteSmallCoins(plan: ChangePlan, hoppers: HopperInventory[]): boolean {
  // Check if plan would leave small denominations below threshold
  const smallDenoms = [0.05, 0.10, 0.20]; // Critical for change
  
  for (const { denomination, quantity } of plan.denominations) {
    if (smallDenoms.includes(denomination)) {
      const hopper = hoppers.find(h => h.denomination === denomination);
      if (hopper && hopper.available - quantity < hopper.lowThreshold) {
        return true;
      }
    }
  }
  
  return false;
}

export function formatChangePlan(plan: ChangePlan): string {
  if (plan.useDrawer) {
    return `Drawer payout: ${plan.reason || 'Manual change required'}`;
  }

  const parts = plan.denominations.map(
    ({ denomination, quantity }) => `RM${denomination.toFixed(2)} × ${quantity}`
  );
  
  return parts.join(' + ') + ` (${plan.totalCoins} coins)`;
}
