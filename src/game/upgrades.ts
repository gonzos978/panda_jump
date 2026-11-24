import {
  MAGNET_DURATION_MS,
  MAGNET_LEVEL_DURATION_MS_BONUS,
  MAGNET_LEVEL_RADIUS_BONUS,
  MAGNET_RADIUS,
  MAGNET_UPGRADE_COSTS,
  PARACHUTE_DURATION_MS,
  PARACHUTE_LEVEL_DURATION_MS_BONUS,
  PARACHUTE_UPGRADE_COSTS,
  ROCKET_DURATION_MS,
  ROCKET_LEVEL_DURATION_MS_BONUS,
  ROCKET_LEVEL_SPEED_BONUS,
  ROCKET_SPEED,
  ROCKET_UPGRADE_COSTS,
  SHIELD_BASE_CHARGES,
  SHIELD_LEVEL_CHARGE_BONUS,
  SHIELD_UPGRADE_COSTS,
  WINGS_DURATION_MS,
  WINGS_LEVEL_DURATION_MS_BONUS,
  WINGS_UPGRADE_COSTS,
} from './constants'
import {
  getMagnetLevel,
  getParachuteLevel,
  getRocketLevel,
  getShieldLevel,
  getWingsLevel,
  setMagnetLevel,
  setParachuteLevel,
  setRocketLevel,
  setShieldLevel,
  setWingsLevel,
} from './storage'

export interface UpgradeDefinition {
  id: string
  title: string
  icon: string
  costs: number[]
  getLevel: () => number
  setLevel: (level: number) => void
  statsAtLevel: (level: number) => string
}

export const UPGRADES: UpgradeDefinition[] = [
  {
    id: 'magnet',
    title: 'Magnet',
    icon: `${import.meta.env.BASE_URL}assets/upgrades/magnet.png`,
    costs: MAGNET_UPGRADE_COSTS,
    getLevel: getMagnetLevel,
    setLevel: setMagnetLevel,
    statsAtLevel: (level) => {
      const radius = MAGNET_RADIUS + level * MAGNET_LEVEL_RADIUS_BONUS
      const durationSec = (MAGNET_DURATION_MS + level * MAGNET_LEVEL_DURATION_MS_BONUS) / 1000
      return `Radius ${radius}px · ${durationSec}s`
    },
  },
  {
    id: 'rocket',
    title: 'Rocket',
    icon: `${import.meta.env.BASE_URL}assets/upgrades/rocket.png`,
    costs: ROCKET_UPGRADE_COSTS,
    getLevel: getRocketLevel,
    setLevel: setRocketLevel,
    statsAtLevel: (level) => {
      const durationSec = (ROCKET_DURATION_MS + level * ROCKET_LEVEL_DURATION_MS_BONUS) / 1000
      const speed = ROCKET_SPEED + level * ROCKET_LEVEL_SPEED_BONUS
      return `${durationSec}s · Speed ${speed}`
    },
  },
  {
    id: 'shield',
    title: 'Shield',
    icon: `${import.meta.env.BASE_URL}assets/upgrades/shield.png`,
    costs: SHIELD_UPGRADE_COSTS,
    getLevel: getShieldLevel,
    setLevel: setShieldLevel,
    statsAtLevel: (level) => {
      const charges = SHIELD_BASE_CHARGES + level * SHIELD_LEVEL_CHARGE_BONUS
      return charges === 1 ? 'Blocks 1 hit' : `Blocks ${charges} hits`
    },
  },
  {
    id: 'wings',
    title: 'Wings',
    icon: `${import.meta.env.BASE_URL}assets/upgrades/wings.png`,
    costs: WINGS_UPGRADE_COSTS,
    getLevel: getWingsLevel,
    setLevel: setWingsLevel,
    statsAtLevel: (level) => {
      const durationSec = (WINGS_DURATION_MS + level * WINGS_LEVEL_DURATION_MS_BONUS) / 1000
      return `${durationSec}s glide`
    },
  },
  {
    id: 'parachute',
    title: 'Parachute',
    icon: `${import.meta.env.BASE_URL}assets/upgrades/parachute.png`,
    costs: PARACHUTE_UPGRADE_COSTS,
    getLevel: getParachuteLevel,
    setLevel: setParachuteLevel,
    statsAtLevel: (level) => {
      const durationSec = (PARACHUTE_DURATION_MS + level * PARACHUTE_LEVEL_DURATION_MS_BONUS) / 1000
      return `${durationSec}s slow fall`
    },
  },
]
