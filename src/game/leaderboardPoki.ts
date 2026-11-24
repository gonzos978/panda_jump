// The Poki build has no network leaderboard, login, or nickname collection.
export interface GlobalLeaderboardEntry { name: string; score: number }
export async function submitScore(_name: string, _score: number): Promise<void> {}
export async function fetchTopScores(_max = 10): Promise<GlobalLeaderboardEntry[]> { return [] }
