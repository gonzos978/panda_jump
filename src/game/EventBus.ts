import Phaser from 'phaser'

export type GameOverPayload = {
  score: number
  best: number
  isNewBest: boolean
  coinsThisRun: number
}

export type PowerupPayload = {
  rocket: boolean
  shield: boolean
  magnet: boolean
  wings: boolean
  parachute: boolean
}

export type ComboPayload = {
  combo: number
  multiplier: number
}

export const EventBus = new Phaser.Events.EventEmitter()
