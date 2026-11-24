import { safeStorage } from './safeStorage'
import {
  BEST_SCORE_KEY,
  COINS_KEY,
  GAMES_PLAYED_KEY,
  MAGNET_LEVEL_KEY,
  MAX_COMBO_KEY,
  MUSIC_ENABLED_KEY,
  PARACHUTE_LEVEL_KEY,
  PLAYER_NAME_KEY,
  POWERUP_USED_KEY_PREFIX,
  ROCKET_LEVEL_KEY,
  SHIELD_LEVEL_KEY,
  SOUND_ENABLED_KEY,
  TOTAL_COINS_COLLECTED_KEY,
  TUTORIAL_SEEN_KEY,
  WINGS_LEVEL_KEY,
} from './constants'

export type PowerupKind = 'rocket' | 'shield' | 'magnet' | 'wings' | 'parachute'

export function getBestScore() {
  return Number(safeStorage.getItem(BEST_SCORE_KEY) ?? 0)
}

export function setBestScore(score: number) {
  safeStorage.setItem(BEST_SCORE_KEY, String(score))
}

export function getCoins() {
  return Number(safeStorage.getItem(COINS_KEY) ?? 0)
}

export function addCoins(amount: number) {
  const total = getCoins() + amount
  safeStorage.setItem(COINS_KEY, String(total))
  return total
}

export function spendCoins(amount: number) {
  const total = getCoins()
  if (total < amount) return false
  safeStorage.setItem(COINS_KEY, String(total - amount))
  return true
}

export function getMagnetLevel() {
  return Number(safeStorage.getItem(MAGNET_LEVEL_KEY) ?? 0)
}

export function setMagnetLevel(level: number) {
  safeStorage.setItem(MAGNET_LEVEL_KEY, String(level))
}

export function getRocketLevel() {
  return Number(safeStorage.getItem(ROCKET_LEVEL_KEY) ?? 0)
}

export function setRocketLevel(level: number) {
  safeStorage.setItem(ROCKET_LEVEL_KEY, String(level))
}

export function getShieldLevel() {
  return Number(safeStorage.getItem(SHIELD_LEVEL_KEY) ?? 0)
}

export function setShieldLevel(level: number) {
  safeStorage.setItem(SHIELD_LEVEL_KEY, String(level))
}

export function getWingsLevel() {
  return Number(safeStorage.getItem(WINGS_LEVEL_KEY) ?? 0)
}

export function setWingsLevel(level: number) {
  safeStorage.setItem(WINGS_LEVEL_KEY, String(level))
}

export function getParachuteLevel() {
  return Number(safeStorage.getItem(PARACHUTE_LEVEL_KEY) ?? 0)
}

export function setParachuteLevel(level: number) {
  safeStorage.setItem(PARACHUTE_LEVEL_KEY, String(level))
}

export function getMusicEnabled() {
  return safeStorage.getItem(MUSIC_ENABLED_KEY) !== 'false'
}

export function setMusicEnabled(enabled: boolean) {
  safeStorage.setItem(MUSIC_ENABLED_KEY, String(enabled))
}

export function getSoundEnabled() {
  return safeStorage.getItem(SOUND_ENABLED_KEY) !== 'false'
}

export function setSoundEnabled(enabled: boolean) {
  safeStorage.setItem(SOUND_ENABLED_KEY, String(enabled))
}

export function getGamesPlayed() {
  return Number(safeStorage.getItem(GAMES_PLAYED_KEY) ?? 0)
}

export function incrementGamesPlayed() {
  safeStorage.setItem(GAMES_PLAYED_KEY, String(getGamesPlayed() + 1))
}

export function getTotalCoinsCollected() {
  return Number(safeStorage.getItem(TOTAL_COINS_COLLECTED_KEY) ?? 0)
}

export function addTotalCoinsCollected(amount: number) {
  safeStorage.setItem(TOTAL_COINS_COLLECTED_KEY, String(getTotalCoinsCollected() + amount))
}

export function getPowerupUsed(kind: PowerupKind) {
  return safeStorage.getItem(POWERUP_USED_KEY_PREFIX + kind) === 'true'
}

export function markPowerupUsed(kind: PowerupKind) {
  safeStorage.setItem(POWERUP_USED_KEY_PREFIX + kind, 'true')
}

export function getMaxCombo() {
  return Number(safeStorage.getItem(MAX_COMBO_KEY) ?? 0)
}

export function recordCombo(combo: number) {
  if (combo > getMaxCombo()) {
    safeStorage.setItem(MAX_COMBO_KEY, String(combo))
  }
}

export function getTutorialSeen() {
  return safeStorage.getItem(TUTORIAL_SEEN_KEY) === 'true'
}

export function setTutorialSeen() {
  safeStorage.setItem(TUTORIAL_SEEN_KEY, 'true')
}

export function getPlayerName() {
  return safeStorage.getItem(PLAYER_NAME_KEY)
}

export function setPlayerName(name: string) {
  safeStorage.setItem(PLAYER_NAME_KEY, name)
}
