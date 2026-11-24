export const GAME_WIDTH = 480
export const GAME_HEIGHT = 800

export const FLOOR_HEIGHT = 92
export const BASE_JUMP_VELOCITY = 640
export const MAX_JUMP_BONUS = 360
export const MAX_RUN_SPEED = 340
export const RUN_ACCEL = 2200
export const RUN_DRAG = 1500
export const GRAVITY_Y = 1750
// While a touch/mouse pointer is held down, the player steers toward its x
// instead of reading arrow keys - this deadzone stops the direction from
// flickering once the player is already under the pointer.
export const POINTER_DEADZONE = 10

// Rising chaser - a storm creeping up from below that punishes idling or
// slow, over-careful climbing with real time pressure, instead of the run
// only ending when a jump is actually missed. It rises at a gentle base
// pace, but speeds up to close the gap whenever the player has pulled too
// far ahead (e.g. after a rocket), so it never becomes permanently
// irrelevant for the rest of the run.
export const CHASER_START_OFFSET = 750
export const CHASER_BASE_SPEED = 62
export const CHASER_CATCHUP_SPEED = 260
export const CHASER_MAX_GAP = 900

export const PLATFORM_START_WIDTH = 170
export const PLATFORM_MIN_WIDTH = 78
// Keep the permanent platforms within reach of a standing jump, including
// the extra height between different textures' landing surfaces.
export const MAX_PLATFORM_X_DELTA = 85

// Combo system - the signature mechanic that rewards continuous, fast
// climbing instead of just careful step-by-step platforming. Landing again
// within the window keeps the streak alive (skipping floors always counts,
// a plain single-floor hop only counts while a streak is already active);
// missing the window, taking a hazard hit, or dying resets it to zero.
export const COMBO_WINDOW_MS = 2200
export const COMBO_LEVEL_SIZE = 4
export const COMBO_MAX_MULTIPLIER = 5
export const COMBO_TRICKLE_BONUS = 2

// Source frames are 444x444 with a lot of surrounding transparent padding around
// the dynamic pose (raised arm, curled tail); the body band is measured from the
// character's actual opaque core (excluding the outstretched limb/tail) so the
// hitbox stays close to the original tuned size despite the much bigger art.
export const PLAYER_DISPLAY_SIZE = 64
export const PLAYER_BODY_LEFT_PCT = 0.32
export const PLAYER_BODY_RIGHT_PCT = 0.68
export const PLAYER_BODY_TOP_PCT = 0.22
export const PLAYER_BODY_BOTTOM_PCT = 0.85

export const BEST_SCORE_KEY = 'pandajump.bestScore'
export const COINS_KEY = 'pandajump.coins'
export const MAGNET_LEVEL_KEY = 'pandajump.magnetLevel'
export const ROCKET_LEVEL_KEY = 'pandajump.rocketLevel'
export const SHIELD_LEVEL_KEY = 'pandajump.shieldLevel'
export const WINGS_LEVEL_KEY = 'pandajump.wingsLevel'
export const PARACHUTE_LEVEL_KEY = 'pandajump.parachuteLevel'
export const MUSIC_ENABLED_KEY = 'pandajump.musicEnabled'
export const SOUND_ENABLED_KEY = 'pandajump.soundEnabled'
// Lifetime stats for achievements - separate from COINS_KEY (a spendable
// balance) and per-run counters, so they only ever go up.
export const GAMES_PLAYED_KEY = 'pandajump.gamesPlayed'
export const TOTAL_COINS_COLLECTED_KEY = 'pandajump.totalCoinsCollected'
export const POWERUP_USED_KEY_PREFIX = 'pandajump.powerupUsed.'
export const PLAYER_NAME_KEY = 'pandajump.playerName'
export const MAX_COMBO_KEY = 'pandajump.maxCombo'
export const TUTORIAL_SEEN_KEY = 'pandajump.tutorialSeen'

// Obstacles
export const SPIKE_MIN_FLOOR = 9
export const SPIKE_BASE_CHANCE = 0.08
export const SPIKE_MAX_CHANCE = 0.22

export const BIRD_MIN_FLOOR = 7
export const BIRD_MIN_FLOOR_GAP = 5
export const BIRD_BASE_CHANCE = 0.16
export const BIRD_MAX_CHANCE = 0.38
export const BIRD_SPEED = 110
// Source frames are 512x512 with wide wing membranes spreading almost edge to
// edge; the hitbox is measured from just the bat's furry body, not the wings.
export const BIRD_SIZE = 56
export const BIRD_BODY_LEFT_PCT = 0.32
export const BIRD_BODY_RIGHT_PCT = 0.68
export const BIRD_BODY_TOP_PCT = 0.2
export const BIRD_BODY_BOTTOM_PCT = 0.78

export const MOVING_MIN_FLOOR = 10
export const MOVING_BASE_CHANCE = 0.1
export const MOVING_MAX_CHANCE = 0.45

export const CRUMBLE_MIN_FLOOR = 4
export const CRUMBLE_BASE_CHANCE = 0.08
export const CRUMBLE_MAX_CHANCE = 0.2
export const CRUMBLE_ANIM_FRAME_RATE = 7
// how long the platform shakes in place (still showing its intact frame)
// before the collapse animation actually plays
export const CRUMBLE_SHAKE_MS = 2000
export const CRUMBLE_SHAKE_OFFSET = 3

export const SPRING_MIN_FLOOR = 2
export const SPRING_CHANCE = 0.08
export const SPRING_JUMP_VELOCITY = 1150

// Some platform textures (spring, crumble, and one normal variant) have a low
// width/height aspect ratio; scaled to a wide platform's width they'd grow
// taller than FLOOR_HEIGHT and overlap the platform on the floor above. Any
// platform's display height is capped to this, shrinking width to match and
// keep the texture's own aspect ratio (no squish). Kept close to FLOOR_HEIGHT
// (only ~14px of clearance) so the common wide textures barely shrink at all.
export const PLATFORM_MAX_DISPLAY_HEIGHT = 78

// Power-ups
export const PICKUP_MIN_FLOOR = 3
export const PICKUP_CHANCE = 0.4
export const PICKUP_SIZE = 32
export const ROCKET_DURATION_MS = 1700
export const ROCKET_SPEED = 560
export const STAR_BONUS = 25

export const MAGNET_DURATION_MS = 10000
export const MAGNET_RADIUS = 170
export const MAGNET_PULL_FACTOR = 0.14

// Persistent shop upgrades: each level adds to the relevant power-up's base
// stat(s) above. Index i = cost (in coins) to go from level i to level i+1.
export const MAGNET_UPGRADE_COSTS = [50, 100, 175, 275, 400]
export const MAGNET_MAX_LEVEL = MAGNET_UPGRADE_COSTS.length
export const MAGNET_LEVEL_RADIUS_BONUS = 30
export const MAGNET_LEVEL_DURATION_MS_BONUS = 2000

export const ROCKET_UPGRADE_COSTS = [50, 100, 175, 275, 400]
export const ROCKET_MAX_LEVEL = ROCKET_UPGRADE_COSTS.length
export const ROCKET_LEVEL_DURATION_MS_BONUS = 300
export const ROCKET_LEVEL_SPEED_BONUS = 40

export const SHIELD_UPGRADE_COSTS = [50, 100, 175, 275, 400]
export const SHIELD_MAX_LEVEL = SHIELD_UPGRADE_COSTS.length
// base charges before any upgrade - one hit absorbed, same as the original
// (pre-upgrade) shield behavior
export const SHIELD_BASE_CHARGES = 1
export const SHIELD_LEVEL_CHARGE_BONUS = 1

export const WINGS_DURATION_MS = 5000
export const WINGS_GRAVITY_SCALE = 0.35

export const WINGS_UPGRADE_COSTS = [50, 100, 175, 275, 400]
export const WINGS_MAX_LEVEL = WINGS_UPGRADE_COSTS.length
export const WINGS_LEVEL_DURATION_MS_BONUS = 1000

// Parachute - unlike Wings (which just scales gravity down, so you still
// accelerate into a fall, just slower), this hard-caps fall speed once
// active, giving a floaty, constant-speed descent for precisely threading
// gaps or easing past a close call with the chaser.
export const PARACHUTE_DURATION_MS = 6000
export const PARACHUTE_MAX_FALL_SPEED = 90

export const PARACHUTE_UPGRADE_COSTS = [50, 100, 175, 275, 400]
export const PARACHUTE_MAX_LEVEL = PARACHUTE_UPGRADE_COSTS.length
export const PARACHUTE_LEVEL_DURATION_MS_BONUS = 1200

