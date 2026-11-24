import { IS_POKI } from './platform'
export interface GlobalLeaderboardEntry { name: string; score: number }
export async function submitScore(name: string, score: number) {
  if (IS_POKI) return
  const firebase = await import('./firebaseLeaderboard')
  return firebase.submitScore(name, score)
}
export async function fetchTopScores(max = 10): Promise<GlobalLeaderboardEntry[]> {
  if (IS_POKI) return []
  const firebase = await import('./firebaseLeaderboard')
  return firebase.fetchTopScores(max)
}
