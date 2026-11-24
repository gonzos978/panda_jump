import {
  getBestScore,
  getGamesPlayed,
  getMaxCombo,
  getPowerupUsed,
  getTotalCoinsCollected,
  type PowerupKind,
} from './storage'

export interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  isUnlocked: () => boolean
}

const powerupIcon: Record<PowerupKind, string> = {
  rocket: `${import.meta.env.BASE_URL}assets/upgrades/rocket.png`,
  shield: `${import.meta.env.BASE_URL}assets/upgrades/shield.png`,
  magnet: `${import.meta.env.BASE_URL}assets/upgrades/magnet.png`,
  wings: `${import.meta.env.BASE_URL}assets/upgrades/wings.png`,
  parachute: `${import.meta.env.BASE_URL}assets/upgrades/parachute.png`,
}

const powerupTitle: Record<PowerupKind, string> = {
  rocket: 'Blast Off',
  shield: 'Shielded',
  magnet: 'Magnetic Personality',
  wings: 'Featherlight',
  parachute: 'Gentle Landing',
}

const powerupDescription: Record<PowerupKind, string> = {
  rocket: 'Use a rocket power-up',
  shield: 'Use a shield power-up',
  magnet: 'Use a magnet power-up',
  wings: 'Use a wings power-up',
  parachute: 'Use a parachute power-up',
}

function powerupAchievement(kind: PowerupKind): Achievement {
  return {
    id: `powerup-${kind}`,
    title: powerupTitle[kind],
    description: powerupDescription[kind],
    icon: powerupIcon[kind],
    isUnlocked: () => getPowerupUsed(kind),
  }
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'score-50',
    title: 'Getting Started',
    description: 'Reach a score of 50',
    icon: '🏆',
    isUnlocked: () => getBestScore() >= 50,
  },
  {
    id: 'score-250',
    title: 'High Climber',
    description: 'Reach a score of 250',
    icon: '🏆',
    isUnlocked: () => getBestScore() >= 250,
  },
  {
    id: 'score-750',
    title: 'Sky Legend',
    description: 'Reach a score of 750',
    icon: '🏆',
    isUnlocked: () => getBestScore() >= 750,
  },
  {
    id: 'coins-25',
    title: 'Coin Collector',
    description: 'Collect 25 coins in total',
    icon: `${import.meta.env.BASE_URL}assets/upgrades/coin.png`,
    isUnlocked: () => getTotalCoinsCollected() >= 25,
  },
  {
    id: 'coins-100',
    title: 'Coin Hoarder',
    description: 'Collect 100 coins in total',
    icon: `${import.meta.env.BASE_URL}assets/upgrades/coin.png`,
    isUnlocked: () => getTotalCoinsCollected() >= 100,
  },
  powerupAchievement('rocket'),
  powerupAchievement('shield'),
  powerupAchievement('magnet'),
  powerupAchievement('wings'),
  powerupAchievement('parachute'),
  {
    id: 'games-10',
    title: 'Persistent',
    description: 'Play 10 runs',
    icon: '🎮',
    isUnlocked: () => getGamesPlayed() >= 10,
  },
  {
    id: 'combo-10',
    title: 'On a Roll',
    description: 'Reach a 10x combo streak',
    icon: '🔥',
    isUnlocked: () => getMaxCombo() >= 10,
  },
]
