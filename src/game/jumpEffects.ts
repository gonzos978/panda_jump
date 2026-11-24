import { safeStorage } from './safeStorage'
import { ACHIEVEMENTS } from './achievements'

const EFFECT_KEY = 'pandajump.jumpEffect'

export const JUMP_EFFECTS = [
  { id: 'classic', name: 'Classic', color: null, unlock: null },
  { id: 'gold', name: 'Gold Rush', color: 0xffc857, unlock: 'coins-25' },
  { id: 'sky', name: 'Sky Spark', color: 0x73daff, unlock: 'score-250' },
  { id: 'flame', name: 'Ember Burst', color: 0xff7454, unlock: 'combo-10' },
  { id: 'jade', name: 'Jade Scatter', color: 0x66eda8, unlock: 'coins-100' },
] as const

export type JumpEffect = (typeof JUMP_EFFECTS)[number]

export function getJumpEffectAchievement(effect: JumpEffect) {
  return ACHIEVEMENTS.find((achievement) => achievement.id === effect.unlock)
}

export function isJumpEffectUnlocked(effect: JumpEffect) {
  return effect.unlock === null || getJumpEffectAchievement(effect)?.isUnlocked() === true
}

export function getEquippedJumpEffect(): JumpEffect {
  const savedId = safeStorage.getItem(EFFECT_KEY)
  return JUMP_EFFECTS.find((effect) => effect.id === savedId && isJumpEffectUnlocked(effect)) ?? JUMP_EFFECTS[0]
}

export function equipJumpEffect(effect: JumpEffect) {
  if (isJumpEffectUnlocked(effect)) safeStorage.setItem(EFFECT_KEY, effect.id)
}
