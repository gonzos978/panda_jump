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
  return Number(localStorage.getItem(BEST_SCORE_KEY) ?? 0)
}

export function setBestScore(score: number) {
  localStorage.setItem(BEST_SCORE_KEY, String(score))
}

export function getCoins() {
  return Number(localStorage.getItem(COINS_KEY) ?? 0)
}

export function addCoins(amount: number) {
  const total = getCoins() + amount
  localStorage.setItem(COINS_KEY, String(total))
  return total
}

export function spendCoins(amount: number) {
  const total = getCoins()
  if (total < amount) return false
  localStorage.setItem(COINS_KEY, String(total - amount))
  return true
}

export function getMagnetLevel() {
  return Number(localStorage.getItem(MAGNET_LEVEL_KEY) ?? 0)
}

export function setMagnetLevel(level: number) {
  localStorage.setItem(MAGNET_LEVEL_KEY, String(level))
}

export function getRocketLevel() {
  return Number(localStorage.getItem(ROCKET_LEVEL_KEY) ?? 0)
}

export function setRocketLevel(level: number) {
  localStorage.setItem(ROCKET_LEVEL_KEY, String(level))
}

export function getShieldLevel() {
  return Number(localStorage.getItem(SHIELD_LEVEL_KEY) ?? 0)
}

export function setShieldLevel(level: number) {
  localStorage.setItem(SHIELD_LEVEL_KEY, String(level))
}

export function getWingsLevel() {
  return Number(localStorage.getItem(WINGS_LEVEL_KEY) ?? 0)
}

export function setWingsLevel(level: number) {
  localStorage.setItem(WINGS_LEVEL_KEY, String(level))
}

export function getParachuteLevel() {
  return Number(localStorage.getItem(PARACHUTE_LEVEL_KEY) ?? 0)
}

export function setParachuteLevel(level: number) {
  localStorage.setItem(PARACHUTE_LEVEL_KEY, String(level))
}

export function getMusicEnabled() {
  return localStorage.getItem(MUSIC_ENABLED_KEY) !== 'false'
}

export function setMusicEnabled(enabled: boolean) {
  localStorage.setItem(MUSIC_ENABLED_KEY, String(enabled))
}

export function getSoundEnabled() {
  return localStorage.getItem(SOUND_ENABLED_KEY) !== 'false'
}

export function setSoundEnabled(enabled: boolean) {
  localStorage.setItem(SOUND_ENABLED_KEY, String(enabled))
}

export function getGamesPlayed() {
  return Number(localStorage.getItem(GAMES_PLAYED_KEY) ?? 0)
}

export function incrementGamesPlayed() {
  localStorage.setItem(GAMES_PLAYED_KEY, String(getGamesPlayed() + 1))
}

export function getTotalCoinsCollected() {
  return Number(localStorage.getItem(TOTAL_COINS_COLLECTED_KEY) ?? 0)
}

export function addTotalCoinsCollected(amount: number) {
  localStorage.setItem(TOTAL_COINS_COLLECTED_KEY, String(getTotalCoinsCollected() + amount))
}

export function getPowerupUsed(kind: PowerupKind) {
  return localStorage.getItem(POWERUP_USED_KEY_PREFIX + kind) === 'true'
}

export function markPowerupUsed(kind: PowerupKind) {
  localStorage.setItem(POWERUP_USED_KEY_PREFIX + kind, 'true')
}

export function getMaxCombo() {
  return Number(localStorage.getItem(MAX_COMBO_KEY) ?? 0)
}

export function recordCombo(combo: number) {
  if (combo > getMaxCombo()) {
    localStorage.setItem(MAX_COMBO_KEY, String(combo))
  }
}

export function getTutorialSeen() {
  return localStorage.getItem(TUTORIAL_SEEN_KEY) === 'true'
}

export function setTutorialSeen() {
  localStorage.setItem(TUTORIAL_SEEN_KEY, 'true')
}

export function getPlayerName() {
  return localStorage.getItem(PLAYER_NAME_KEY)
}

export function setPlayerName(name: string) {
  localStorage.setItem(PLAYER_NAME_KEY, name)
}
