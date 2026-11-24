import { addDoc, collection, getDocs, limit, orderBy, query, serverTimestamp } from 'firebase/firestore'
import { db, ensureAuth } from './firebase'

export interface GlobalLeaderboardEntry {
  name: string
  score: number
}

const LEADERBOARD_COLLECTION = 'leaderboard'
const MAX_NAME_LENGTH = 16

export async function submitScore(name: string, score: number) {
  await ensureAuth()
  await addDoc(collection(db, LEADERBOARD_COLLECTION), {
    name: name.slice(0, MAX_NAME_LENGTH),
    score,
    createdAt: serverTimestamp(),
  })
}

export async function fetchTopScores(max = 10): Promise<GlobalLeaderboardEntry[]> {
  await ensureAuth()
  const q = query(collection(db, LEADERBOARD_COLLECTION), orderBy('score', 'desc'), limit(max))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => {
    const data = doc.data()
    return { name: data.name as string, score: data.score as number }
  })
}
