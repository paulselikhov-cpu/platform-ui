/**
 * Результат одного тап-действия работы (дворник).
 */
export interface IWorkResult {
  coinsEarned: number;
  xpEarned: number;
  newCoinBalance: number;
  newXp: number;
  newEnergy: number;
}
