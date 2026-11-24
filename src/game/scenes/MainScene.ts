import { SkinsAndAnimationBoundsProvider, type SpineGameObject } from '@esotericsoftware/spine-phaser-v4'
import Phaser from 'phaser'
import { getEquippedJumpEffect } from '../jumpEffects'
import { EventBus } from '../EventBus'
import {
  addCoins,
  addTotalCoinsCollected,
  getBestScore,
  getMagnetLevel,
  getMusicEnabled,
  getParachuteLevel,
  getRocketLevel,
  getShieldLevel,
  getSoundEnabled,
  getWingsLevel,
  incrementGamesPlayed,
  markPowerupUsed,
  recordCombo,
  setBestScore,
} from '../storage'
import {
  BASE_JUMP_VELOCITY,
  BIRD_BASE_CHANCE,
  BIRD_BODY_BOTTOM_PCT,
  BIRD_BODY_LEFT_PCT,
  BIRD_BODY_RIGHT_PCT,
  BIRD_BODY_TOP_PCT,
  BIRD_MAX_CHANCE,
  BIRD_MIN_FLOOR,
  BIRD_MIN_FLOOR_GAP,
  BIRD_SIZE,
  BIRD_SPEED,
  CHASER_BASE_SPEED,
  CHASER_CATCHUP_SPEED,
  CHASER_MAX_GAP,
  CHASER_START_OFFSET,
  COMBO_LEVEL_SIZE,
  COMBO_MAX_MULTIPLIER,
  COMBO_TRICKLE_BONUS,
  COMBO_WINDOW_MS,
  CRUMBLE_ANIM_FRAME_RATE,
  CRUMBLE_BASE_CHANCE,
  CRUMBLE_MAX_CHANCE,
  CRUMBLE_MIN_FLOOR,
  CRUMBLE_SHAKE_MS,
  CRUMBLE_SHAKE_OFFSET,
  FLOOR_HEIGHT,
  GAME_HEIGHT,
  GAME_WIDTH,
  GRAVITY_Y,
  MAGNET_DURATION_MS,
  MAGNET_LEVEL_DURATION_MS_BONUS,
  MAGNET_LEVEL_RADIUS_BONUS,
  MAGNET_PULL_FACTOR,
  MAGNET_RADIUS,
  MAX_JUMP_BONUS,
  MAX_PLATFORM_X_DELTA,
  MAX_RUN_SPEED,
  MOVING_BASE_CHANCE,
  MOVING_MAX_CHANCE,
  MOVING_MIN_FLOOR,
  PARACHUTE_DURATION_MS,
  PARACHUTE_LEVEL_DURATION_MS_BONUS,
  PARACHUTE_MAX_FALL_SPEED,
  PICKUP_CHANCE,
  PICKUP_MIN_FLOOR,
  PICKUP_SIZE,
  PLATFORM_MAX_DISPLAY_HEIGHT,
  PLATFORM_MIN_WIDTH,
  PLATFORM_START_WIDTH,
  PLAYER_BODY_BOTTOM_PCT,
  PLAYER_BODY_LEFT_PCT,
  PLAYER_BODY_RIGHT_PCT,
  PLAYER_BODY_TOP_PCT,
  PLAYER_DISPLAY_SIZE,
  POINTER_DEADZONE,
  ROCKET_DURATION_MS,
  ROCKET_LEVEL_DURATION_MS_BONUS,
  ROCKET_LEVEL_SPEED_BONUS,
  ROCKET_SPEED,
  RUN_ACCEL,
  RUN_DRAG,
  SHIELD_BASE_CHARGES,
  SHIELD_LEVEL_CHARGE_BONUS,
  SPIKE_BASE_CHANCE,
  SPIKE_MAX_CHANCE,
  SPIKE_MIN_FLOOR,
  SPRING_CHANCE,
  SPRING_JUMP_VELOCITY,
  SPRING_MIN_FLOOR,
  STAR_BONUS,
  WINGS_DURATION_MS,
  WINGS_GRAVITY_SCALE,
  WINGS_LEVEL_DURATION_MS_BONUS,
} from '../constants'

type PickupKind = 'rocket' | 'shield' | 'star' | 'magnet' | 'wings' | 'parachute'
const PLATFORM_LOOKAHEAD = 5 * FLOOR_HEIGHT
const PLATFORM_RECOVERY = 3 * FLOOR_HEIGHT

type PlatformKind = 'normal' | 'moving' | 'hazard' | 'crumble' | 'spring'

interface PickupIconMeta {
  key: string
  frame?: string
  anim?: string
  aspect: number
}

const WINGS_ANIM_FRAMES = [
  'wings_01_raised.png',
  'wings_02_half_raised.png',
  'wings_03_level.png',
  'wings_04_lowered.png',
  'wings_05_level.png',
  'wings_06_half_raised.png',
]

const COIN_ANIM_FRAMES = [
  'coin_00.png',
  'coin_01.png',
  'coin_02.png',
  'coin_03.png',
  'coin_04.png',
  'coin_05.png',
  'coin_06.png',
  'coin_07.png',
]

const PICKUP_ICON_META: Record<PickupKind, PickupIconMeta> = {
  star: { key: 'pickup-star-anim', frame: 'coin_00.png', anim: 'coin-rotate', aspect: 1 },
  rocket: { key: 'pickup-rocket', aspect: 1402 / 1122 },
  shield: { key: 'pickup-shield', aspect: 1402 / 1122 },
  magnet: { key: 'pickup-magnet', aspect: 1434 / 1097 },
  wings: { key: 'pickup-wings-anim', frame: 'wings_01_raised.png', anim: 'wings-flap', aspect: 1 },
  parachute: { key: 'pickup-parachute', aspect: 359 / 306 },
}

interface PlatformTextureMeta {
  key: string
  frame?: string
  aspect: number
  bodyTopPct: number
  bodyBottomPct: number
  bodyLeftPct: number
  bodyRightPct: number
}

const SPRING_ANIM_FRAMES = [
  'spring_01_idle.png',
  'spring_02_compress.png',
  'spring_03_compressed.png',
  'spring_04_release.png',
  'spring_05_stretched.png',
  'spring_06_settle.png',
]

const WOOD_DESTROY_ANIM_FRAMES = [
  'wood_destroy_01_intact.png',
  'wood_destroy_02_cracked.png',
  'wood_destroy_03_separated.png',
  'wood_destroy_04_breaking.png',
  'wood_destroy_05_collapsed.png',
  'wood_destroy_06_debris.png',
]

// Aspect ratio (width/height) and the band (as a fraction of the texture's own
// width/height) where each asset's solid landing surface actually is - measured
// from the source art's opaque pixels, since every log/platform image has hanging
// vines, leaf overhang, or side padding that shouldn't be part of the collision box.
const NORMAL_PLATFORM_TEXTURES: PlatformTextureMeta[] = [
  { key: 'land-normal-1', aspect: 2.0, bodyTopPct: 0.24, bodyBottomPct: 0.65, bodyLeftPct: 0.09, bodyRightPct: 0.89 },
  { key: 'land-normal-2', aspect: 2.0, bodyTopPct: 0.365, bodyBottomPct: 0.7, bodyLeftPct: 0.16, bodyRightPct: 0.84 },
  { key: 'land-normal-3', aspect: 1.5, bodyTopPct: 0.236, bodyBottomPct: 0.716, bodyLeftPct: 0.13, bodyRightPct: 0.9 },
]
const MOVING_PLATFORM_TEXTURE: PlatformTextureMeta = {
  key: 'land-moving',
  aspect: 2.75,
  bodyTopPct: 0.296,
  bodyBottomPct: 0.737,
  bodyLeftPct: 0.15,
  bodyRightPct: 0.85,
}
const CRUMBLE_PLATFORM_TEXTURE: PlatformTextureMeta = {
  key: 'land-crumble-anim',
  frame: 'wood_destroy_01_intact.png',
  aspect: 1.333,
  bodyTopPct: 0.453,
  bodyBottomPct: 0.77,
  bodyLeftPct: 0.07,
  bodyRightPct: 0.97,
}
const SPRING_PLATFORM_TEXTURE: PlatformTextureMeta = {
  key: 'land-spring-anim',
  frame: 'spring_01_idle.png',
  aspect: 1,
  bodyTopPct: 0.264,
  bodyBottomPct: 0.53,
  bodyLeftPct: 0.12,
  bodyRightPct: 0.87,
}
const HAZARD_PLATFORM_TEXTURE: PlatformTextureMeta = {
  key: 'land-hazard',
  aspect: 3.0,
  bodyTopPct: 0.35,
  bodyBottomPct: 0.67,
  bodyLeftPct: 0.1,
  bodyRightPct: 0.9,
}

interface PlatformData {
  body: Phaser.Physics.Arcade.Sprite
  floorIndex: number
  kind: PlatformKind
  displayHeight: number
  crumbling: boolean
  moveSpeed: number
  moveRangeLeft: number
  moveRangeRight: number
}

type BirdSprite = SpineGameObject & { body: Phaser.Physics.Arcade.Body }
type PlayerSprite = SpineGameObject & { body: Phaser.Physics.Arcade.Body }

interface BirdData {
  sprite: BirdSprite
  baseY: number
  bobOffset: number
}

interface BgTile {
  left: Phaser.GameObjects.Image
  right: Phaser.GameObjects.Image
  topY: number
  swayOffset: number
}

// The parallax backdrop, back to front - each layer's own art (from
// public/assets/bcg_layers) shares a 941x1672 canvas positioned at (0,0), and
// `parallax` mirrors that folder's layers.json (0 = fixed like the old flat
// sky backdrop, 1 would scroll at full world speed like a platform).
interface BgLayerMeta {
  key: string
  file: string
  parallax: number
  driftX?: number
  pulseAlpha?: boolean
}

const BCG_LAYERS: BgLayerMeta[] = [
  { key: 'bcg-sky', file: '00-sky-base.png', parallax: 0 },
  { key: 'bcg-rear-clouds', file: '01-rear-clouds.png', parallax: 0.06, driftX: 3 },
  { key: 'bcg-distant-islands', file: '02-distant-islands.png', parallax: 0.12 },
  { key: 'bcg-central-mountains', file: '03-central-mountains.png', parallax: 0.28 },
  { key: 'bcg-foreground-cliffs', file: '04-foreground-cliffs.png', parallax: 0.55 },
  { key: 'bcg-waterfalls-mist', file: '05-waterfalls-mist.png', parallax: 0.4, pulseAlpha: true },
]

export class MainScene extends Phaser.Scene {
  private player!: PlayerSprite
  private platforms!: Phaser.Physics.Arcade.Group
  private solidPlatforms!: Phaser.Physics.Arcade.StaticGroup
  private hazards!: Phaser.Physics.Arcade.Group
  private pickups!: Phaser.Physics.Arcade.Group
  private platformList: PlatformData[] = []
  private birdList: BirdData[] = []
  private bgLayers: Phaser.GameObjects.Image[] = []
  private bgTiles: BgTile[] = []
  private bgTileScale = 0
  private bgTileHeight = 0
  private nextBgIndex = 0
  private highestBgY = 0
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private keyA!: Phaser.Input.Keyboard.Key
  private keyD!: Phaser.Input.Keyboard.Key
  // touch/mouse: while a pointer is down, the player steers toward its x
  // instead of reading arrow keys - null means no active touch/drag
  private pointerTargetX: number | null = null

  private startY = 0
  private highestPlatformY = 0
  private highestPlatformX = 0
  private lastLandedFloor = 0
  private lastBirdFloor = 0
  private bestFloorReached = 0
  private bonusScore = 0
  private coinsThisRun = 0
  private minCameraScrollY = 0
  private waterfallDebugMode = false

  private chaserY = 0
  private chaserGraphics?: Phaser.GameObjects.Graphics
  private jumpEffect?: Phaser.GameObjects.Particles.ParticleEmitter
  private chaserMist?: Phaser.GameObjects.Particles.ParticleEmitter
  private gameOver = false

  private combo = 0
  private comboMultiplier = 1
  private lastLandingTime = 0

  private shieldCharges = 0
  private shieldSprite?: Phaser.GameObjects.Sprite
  private musicTrack?: Phaser.Sound.WebAudioSound | Phaser.Sound.HTML5AudioSound
  private rocketActive = false
  private rocketEndTime = 0
  private magnetActive = false
  private magnetEndTime = 0
  private magnetRadius = MAGNET_RADIUS
  private wingsActive = false
  private wingsEndTime = 0
  private parachuteActive = false
  private parachuteEndTime = 0

  constructor() {
    super('MainScene')
  }

  preload() {
    for (const layer of BCG_LAYERS) {
      this.load.image(layer.key, `/assets/bcg_layers/${layer.file}`)
    }
    this.load.image('level-left', '/assets/level/level1left.png')
    this.load.image('level-right', '/assets/level/level1Right.png')
    this.load.image('land-normal-1', '/assets/level/land1.png')
    this.load.image('land-normal-2', '/assets/level/land2.png')
    this.load.image('land-normal-3', '/assets/level/land5.png')
    this.load.image('land-moving', '/assets/level/land4.png')
    this.load.image('land-hazard', '/assets/level/spikes.png')
    this.load.atlas(
      'land-spring-anim',
      '/assets/level/land-spring-spritesheet.png',
      '/assets/level/land-spring-spritesheet.json',
    )
    this.load.atlas(
      'land-crumble-anim',
      '/assets/level/wood-destroy-spritesheet-v2.png',
      '/assets/level/wood-destroy-spritesheet-v2.json',
    )
    this.load.atlas(
      'pickup-star-anim',
      '/assets/upgrades/coin-rotation-spritesheet.png',
      '/assets/upgrades/coin-rotation-spritesheet.json',
    )
    this.load.image('pickup-rocket', '/assets/upgrades/rocket.png')
    this.load.image('pickup-shield', '/assets/upgrades/shield.png')
    this.load.image('pickup-magnet', '/assets/upgrades/magnet.png')
    this.load.atlas(
      'pickup-wings-anim',
      '/assets/upgrades/wings-flap-spritesheet.png',
      '/assets/upgrades/wings-flap-spritesheet.json',
    )
    this.load.image('pickup-parachute', '/assets/upgrades/parachute.png')
    this.load.spineAtlas('panda-atlas', '/assets/hero/panda-idle-1080p.atlas')
    this.load.spineSkeleton('panda-data', '/assets/hero/panda-idle.json')
    this.load.spineAtlas('bat-atlas', '/assets/enemies/bat-1080p.atlas')
    this.load.spineSkeleton('bat-data', '/assets/enemies/bat.json')
    this.load.audio('sfx-spring', '/assets/sfx/spring_hit.mp3')
    this.load.audio('sfx-jump', '/assets/sfx/jump.mp3')
    this.load.audio('sfx-coin', '/assets/sfx/coin_collect.mp3')
    this.load.audio('sfx-powerup', '/assets/sfx/power_up.mp3')
    this.load.audio('sfx-fall', '/assets/sfx/fall_down.mp3')
    this.load.audio('music-game', '/assets/sfx/game_music.mp3')
  }

  private playSfx(key: string, config?: Phaser.Types.Sound.SoundConfig) {
    if (getSoundEnabled()) {
      this.sound.play(key, config)
    }
  }

  create() {
    this.gameOver = false
    this.bonusScore = 0
    this.coinsThisRun = 0
    this.lastLandedFloor = 0
    this.lastBirdFloor = 0
    this.bestFloorReached = 0
    this.combo = 0
    this.comboMultiplier = 1
    this.lastLandingTime = 0
    this.platformList = []
    this.birdList = []
    this.bgTiles = []
    this.nextBgIndex = 0
    this.highestBgY = 0
    this.shieldCharges = 0
    this.shieldSprite = undefined
    this.rocketActive = false
    this.magnetActive = false
    this.wingsActive = false
    this.parachuteActive = false

    // the scene instance survives scene.restart() (only fields explicitly
    // reset here go back to their defaults), so a leftover track from the
    // previous run has to be stopped before starting a fresh one
    this.musicTrack?.stop()
    this.musicTrack = this.sound.add('music-game', { loop: true, volume: 0.35 }) as
      | Phaser.Sound.WebAudioSound
      | Phaser.Sound.HTML5AudioSound
    this.musicTrack.mute = !getMusicEnabled()
    this.musicTrack.play()

    // extended well below GAME_HEIGHT too (not just above it), so a missed
    // first jump falls far enough to trip the "fell off camera" game-over
    // check in update() instead of coming to rest on this physical bound
    this.physics.world.setBounds(0, -1_000_000, GAME_WIDTH, 2_000_000)
    this.cameras.main.setBounds(0, -1_000_000, GAME_WIDTH, 2_000_000)

    this.createTextures()
    this.createAnimations()
    this.createBackground()
    this.createWaterfallEffect()

    this.solidPlatforms = this.physics.add.staticGroup()
    this.platforms = this.physics.add.group({ allowGravity: false, immovable: true })
    this.hazards = this.physics.add.group({ allowGravity: false })
    this.pickups = this.physics.add.group({ allowGravity: false })

    this.startY = GAME_HEIGHT - 60
    this.spawnPlatform(GAME_WIDTH / 2, this.startY, PLATFORM_START_WIDTH, 'normal')
    this.highestPlatformY = this.startY
    this.highestPlatformX = GAME_WIDTH / 2
    this.createChaser()
    this.createJumpEffect()

    this.updatePlatformWindow(0)

    this.player = this.add.spine(GAME_WIDTH / 2, this.startY - 60, 'panda-data', 'panda-atlas', {
      boundsProvider: new SkinsAndAnimationBoundsProvider('jump', [], 1 / 30, false),
    }) as PlayerSprite
    const playerScale = PLAYER_DISPLAY_SIZE / Math.max(this.player.width, this.player.height)
    this.player.setScale(playerScale)
    // the plugin's computed display origin doesn't match where it actually renders
    // the skeleton vertically (a spine-phaser-v4 quirk); pin it to the bounds' top
    // edge so body offsets below can use the same top-left crop convention as
    // every other sprite in this file
    this.player.setDisplayOrigin(this.player.displayOriginX, 0)
    this.physics.add.existing(this.player)
    this.player.setDepth(4)
    const body = this.player.body
    body.setDragX(RUN_DRAG)
    body.setMaxVelocity(MAX_RUN_SPEED, 2000)
    // body size/offset are in unscaled skeleton-bounds space (auto-scaled to the
    // final display size), keeping the hitbox close to the character's actual core body
    // rather than the wide space taken up by its outstretched limbs and tail.
    body.setSize(
      (PLAYER_BODY_RIGHT_PCT - PLAYER_BODY_LEFT_PCT) * this.player.width,
      (PLAYER_BODY_BOTTOM_PCT - PLAYER_BODY_TOP_PCT) * this.player.height,
      false,
    )
    body.setOffset(PLAYER_BODY_LEFT_PCT * this.player.width, PLAYER_BODY_TOP_PCT * this.player.height)
    body.setCollideWorldBounds(true)
    body.checkCollision.up = false
    body.checkCollision.down = true
    body.setGravityY(GRAVITY_Y)
    this.player.animationState.setAnimation(0, 'jump', true)

    this.physics.add.collider(this.player, this.solidPlatforms, this.handleLanding, this.canLand, this)
    this.physics.add.collider(this.player, this.platforms, this.handleLanding, this.canLand, this)
    this.physics.add.overlap(this.player, this.hazards, this.handleHazardHit, undefined, this)
    this.physics.add.overlap(this.player, this.pickups, this.handlePickup, undefined, this)

    // scrollY is fully hand-driven every frame in update() below (monotonic,
    // never follows back down), so Phaser's own camera follow would only
    // fight it - starting from a plain 0 keeps that logic's baseline exact,
    // matching the world-space y the background tiles were seeded around
    this.minCameraScrollY = 0
    this.cameras.main.scrollY = 0

    this.cursors = this.input.keyboard!.createCursorKeys()
    this.keyA = this.input.keyboard!.addKey('A')
    this.keyD = this.input.keyboard!.addKey('D')

    // touch/mouse control: hold anywhere and the panda steers toward that x,
    // for devices with no keyboard
    this.pointerTargetX = null
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.pointerTargetX = pointer.worldX
    })
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (pointer.isDown) this.pointerTargetX = pointer.worldX
    })
    this.input.on('pointerup', () => {
      this.pointerTargetX = null
    })
    this.input.on('pointerupoutside', () => {
      this.pointerTargetX = null
    })

    this.emitScore(true)
    this.emitPowerups()

    EventBus.emit('scene-ready', this)

    // Dev-only tool for picking waterfall particle spots by eye - visit
    // ?debugWaterfall=1 to freeze the run and click the backdrop to drop
    // markers; each click also logs the coordinate to the console.
    if (new URLSearchParams(window.location.search).has('debugWaterfall')) {
      this.setupWaterfallDebugMode()
    }
  }

  private setupWaterfallDebugMode() {
    this.physics.pause()
    this.waterfallDebugMode = true

    // marks track the mist layer's own parallax (0.4) so a dropped marker
    // stays pinned to the same painted spot as the background is panned,
    // matching how the real particle emitters will behave once placed there
    const MARK_PARALLAX = 0.4
    const marks: { worldX: number; worldY: number }[] = []
    const markerGraphics = this.add.graphics().setScrollFactor(0, MARK_PARALLAX).setDepth(1000)

    const hint = this.add
      .text(8, 8, 'Waterfall debug: click to mark, drag to pan, Up/Down to nudge, C to clear (see console)', {
        fontSize: '11px',
        color: '#ffffff',
        backgroundColor: '#000000cc',
        padding: { x: 4, y: 4 },
      })
      .setScrollFactor(0)
      .setDepth(1000)
    hint.setWordWrapWidth(GAME_WIDTH - 16)

    const listText = this.add
      .text(8, hint.height + 14, '', {
        fontSize: '11px',
        color: '#ffff66',
        backgroundColor: '#000000cc',
        padding: { x: 4, y: 4 },
      })
      .setScrollFactor(0)
      .setDepth(1000)

    const redraw = () => {
      markerGraphics.clear()
      marks.forEach((m) => {
        markerGraphics.lineStyle(2, 0xff3d3d, 1)
        markerGraphics.strokeCircle(m.worldX, m.worldY, 9)
        markerGraphics.fillStyle(0xff3d3d, 1)
        markerGraphics.fillCircle(m.worldX, m.worldY, 2)
      })
      listText.setText(marks.map((m, i) => `${i + 1}: { x: ${m.worldX}, y: ${m.worldY} }`).join('\n'))
    }

    let dragStartScreenY: number | null = null
    let dragStartScrollY = 0
    let dragged = false
    const DRAG_THRESHOLD = 6

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      dragStartScreenY = pointer.y
      dragStartScrollY = this.cameras.main.scrollY
      dragged = false
    })

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (dragStartScreenY === null || !pointer.isDown) return
      const dy = pointer.y - dragStartScreenY
      if (Math.abs(dy) > DRAG_THRESHOLD) {
        dragged = true
        this.cameras.main.scrollY = dragStartScrollY - dy
      }
    })

    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (!dragged && dragStartScreenY !== null) {
        const worldX = Math.round(pointer.x)
        const worldY = Math.round(pointer.y + this.cameras.main.scrollY * MARK_PARALLAX)
        marks.push({ worldX, worldY })
        console.log('Waterfall spot:', JSON.stringify({ x: worldX, y: worldY }))
        redraw()
      }
      dragStartScreenY = null
      dragged = false
    })

    this.input.keyboard?.on('keydown-C', () => {
      marks.length = 0
      console.log('Waterfall spots cleared')
      redraw()
    })
  }

  private createTextures() {
    if (!this.textures.exists('shield-aura')) {
      const size = PLAYER_DISPLAY_SIZE + 16
      const au = this.make.graphics({ x: 0, y: 0 }, false)
      au.lineStyle(3, 0x3d9bff, 0.9)
      au.strokeCircle(size / 2, size / 2, size / 2 - 3)
      au.lineStyle(1.5, 0xbfe1ff, 0.9)
      au.strokeCircle(size / 2, size / 2, size / 2 - 8)
      au.generateTexture('shield-aura', size, size)
      au.destroy()
    }

    if (!this.textures.exists('water-droplet')) {
      const w = this.make.graphics({ x: 0, y: 0 }, false)
      w.fillStyle(0xe8faff, 1)
      w.fillRoundedRect(0, 0, 5, 16, 2)
      w.generateTexture('water-droplet', 5, 16)
      w.destroy()
    }

    if (!this.textures.exists('steam-puff')) {
      // layered circles of falling opacity stand in for a soft radial
      // gradient, so the puff fades at the edges instead of showing a hard rim
      const size = 28
      const s = this.make.graphics({ x: 0, y: 0 }, false)
      s.fillStyle(0xffffff, 0.22)
      s.fillCircle(size / 2, size / 2, size / 2)
      s.fillStyle(0xffffff, 0.35)
      s.fillCircle(size / 2, size / 2, size / 3)
      s.fillStyle(0xffffff, 0.5)
      s.fillCircle(size / 2, size / 2, size / 5)
      s.generateTexture('steam-puff', size, size)
      s.destroy()
    }
  }

  private createWaterfallEffect() {
    // Spots picked by eye with the ?debugWaterfall=1 tool (see
    // setupWaterfallDebugMode) so the mist lines up with the actual painted
    // waterfalls in the backdrop. Matches the waterfalls-mist layer's own
    // parallax so it scrolls together with that art.
    const spots = [
      { x: 185, y: 354 },
      { x: 129, y: -56 },
      { x: 167, y: -48 },
      { x: 280, y: -246 },
      { x: 127, y: -156 },
    ]
    for (const spot of spots) {
      const emitter = this.add.particles(spot.x, spot.y, 'water-droplet', {
        speedY: { min: 180, max: 260 },
        speedX: { min: -6, max: 6 },
        lifespan: 1300,
        scale: { start: 1, end: 0.4 },
        alpha: { start: 0.5, end: 0 },
        frequency: 55,
        tint: 0xdff6ff,
        blendMode: 'ADD',
      })
      emitter.setScrollFactor(0, 0.4)
      emitter.setDepth(-14)

      // rising steam/spray where the falling water would land, well below
      // each fall's start - drifts up and billows out rather than falling
      const steam = this.add.particles(spot.x, spot.y + 180, 'steam-puff', {
        speedY: { min: -55, max: -20 },
        speedX: { min: -14, max: 14 },
        lifespan: { min: 2200, max: 3200 },
        scale: { start: 0.5, end: 1.6 },
        alpha: { start: 0.35, end: 0 },
        frequency: 170,
        tint: 0xf2fbff,
      })
      steam.setScrollFactor(0, 0.4)
      steam.setDepth(-13)
    }
  }

  private createJumpEffect() {
    this.jumpEffect = undefined
    const { color } = getEquippedJumpEffect()
    if (color === null) return

    const texture = 'collection-spark'
    if (!this.textures.exists(texture)) {
      const art = this.make.graphics({ x: 0, y: 0 }, false)
      art.fillStyle(0xffffff)
      art.fillCircle(4, 4, 4)
      art.generateTexture(texture, 8, 8)
      art.destroy()
    }

    this.jumpEffect = this.add.particles(0, 0, texture, {
      emitting: false,
      lifespan: 340,
      speedX: { min: -110, max: 110 },
      speedY: { min: -105, max: -30 },
      gravityY: 330,
      scale: { start: 0.85, end: 0.15 },
      alpha: { start: 1, end: 0 },
      tint: color,
    }).setDepth(3)
  }

  private createChaser() {
    this.chaserY = this.startY + CHASER_START_OFFSET

    if (!this.textures.exists('storm-wisp')) {
      const size = 30
      const g = this.make.graphics({ x: 0, y: 0 }, false)
      g.fillStyle(0x2d1b3d, 0.35)
      g.fillCircle(size / 2, size / 2, size / 2)
      g.fillStyle(0x2d1b3d, 0.5)
      g.fillCircle(size / 2, size / 2, size / 3)
      g.generateTexture('storm-wisp', size, size)
      g.destroy()
    }

    // World-space (not scrollFactor-parallaxed) since its y is compared
    // directly against the player's own world y to detect being caught
    this.chaserGraphics = this.add.graphics().setDepth(3.5)
    this.chaserMist = this.add.particles(GAME_WIDTH / 2, this.chaserY, 'storm-wisp', {
      x: { min: 0, max: GAME_WIDTH },
      speedY: { min: -50, max: -18 },
      speedX: { min: -20, max: 20 },
      lifespan: { min: 900, max: 1400 },
      scale: { start: 0.7, end: 1.6 },
      alpha: { start: 0.5, end: 0 },
      frequency: 60,
    })
    this.chaserMist.setDepth(3.6)
    this.redrawChaser()
  }

  private redrawChaser() {
    if (!this.chaserGraphics) return
    this.chaserGraphics.clear()
    this.chaserGraphics.fillStyle(0x1a0f24, 0.5)
    this.chaserGraphics.fillRect(0, this.chaserY + 16, GAME_WIDTH, 4000)
    this.chaserGraphics.fillStyle(0x1a0f24, 0.75)
    this.chaserGraphics.fillRect(0, this.chaserY + 30, GAME_WIDTH, 4000)
    this.chaserGraphics.fillStyle(0x1a0f24, 1)
    this.chaserGraphics.fillRect(0, this.chaserY + 46, GAME_WIDTH, 4000)
  }

  private createAnimations() {
    if (!this.anims.exists('spring-bounce')) {
      this.anims.create({
        key: 'spring-bounce',
        frames: SPRING_ANIM_FRAMES.map((frame) => ({ key: 'land-spring-anim', frame })),
        frameRate: 20,
        repeat: 0,
      })
    }

    if (!this.anims.exists('wood-destroy')) {
      this.anims.create({
        key: 'wood-destroy',
        frames: WOOD_DESTROY_ANIM_FRAMES.map((frame) => ({ key: 'land-crumble-anim', frame })),
        frameRate: CRUMBLE_ANIM_FRAME_RATE,
        repeat: 0,
      })
    }

    if (!this.anims.exists('wings-flap')) {
      this.anims.create({
        key: 'wings-flap',
        frames: WINGS_ANIM_FRAMES.map((frame) => ({ key: 'pickup-wings-anim', frame })),
        frameRate: 10,
        repeat: -1,
      })
    }

    if (!this.anims.exists('coin-rotate')) {
      this.anims.create({
        key: 'coin-rotate',
        frames: COIN_ANIM_FRAMES.map((frame) => ({ key: 'pickup-star-anim', frame })),
        frameRate: 6,
        repeat: -1,
      })
    }
  }

  private createBackground() {
    // Layered parallax backdrop, back to front - each layer scrolls at its
    // own fraction of the camera's movement (scrollFactor), so distant sky
    // barely moves while nearer cliffs drift past faster, reading as real
    // depth instead of one flat painted image. Scaled well past a single
    // screen's worth of coverage (not just GAME_HEIGHT) so the faster layers
    // have room to slide before their edges would show; climbing high enough
    // still eventually scrolls the nearer layers away, which reads fine as
    // "climbing above the clouds" rather than a broken layer.
    const bgScale = Math.max(GAME_WIDTH / 941, GAME_HEIGHT / 1672) * 3
    this.bgLayers = BCG_LAYERS.map((layer, index) => {
      const sprite = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, layer.key)
      sprite.setScale(bgScale)
      sprite.setScrollFactor(0, layer.parallax)
      sprite.setDepth(-20 + index)
      return sprite
    })

    // Source art (941x1672) isn't a seamless vertical tile - its top is plain sky
    // and its bottom is detailed cliffs, so a straight repeat leaves a visible seam.
    // Alternating a vertically-flipped copy guarantees the shared edge is pixel-for-
    // pixel identical (mirrored), so tiles always meet with no seam, however high
    // the player climbs. Tiles are spawned ahead of the camera and culled behind it,
    // the same recycling pattern used for platforms, so the climb is unbounded.
    this.bgTileScale = GAME_WIDTH / 941
    this.bgTileHeight = 1672 * this.bgTileScale

    const seedCount = Math.ceil((GAME_HEIGHT * 2) / this.bgTileHeight) + 1
    for (let i = 0; i < seedCount; i++) {
      this.spawnBackgroundTile(this.nextBgIndex)
      this.nextBgIndex++
    }
  }

  private spawnBackgroundTile(index: number) {
    const topY = -index * this.bgTileHeight
    const flip = index % 2 === 1

    const left = this.add.image(GAME_WIDTH / 2, topY, 'level-left').setOrigin(0.5, 0)
    const right = this.add.image(GAME_WIDTH / 2, topY, 'level-right').setOrigin(0.5, 0)

    for (const img of [left, right]) {
      img.setScale(this.bgTileScale)
      img.setFlipY(flip)
      img.setDepth(-9)
    }

    this.bgTiles.push({ left, right, topY, swayOffset: Math.random() * 1000 })
    this.highestBgY = topY
  }

  private spawnPlatform(x: number, y: number, width: number, kind: PlatformKind) {
    const meta =
      kind === 'normal'
        ? NORMAL_PLATFORM_TEXTURES[Phaser.Math.Between(0, NORMAL_PLATFORM_TEXTURES.length - 1)]
        : kind === 'moving'
          ? MOVING_PLATFORM_TEXTURE
          : kind === 'crumble'
            ? CRUMBLE_PLATFORM_TEXTURE
            : kind === 'spring'
              ? SPRING_PLATFORM_TEXTURE
              : HAZARD_PLATFORM_TEXTURE

    // some textures have a low enough aspect ratio that scaling to a wide
    // platform's width would grow taller than FLOOR_HEIGHT, overlapping the
    // platform on the floor above - shrink width to match if so, preserving
    // the texture's own aspect ratio
    const rawHeight = width / meta.aspect
    const shrink = rawHeight > PLATFORM_MAX_DISPLAY_HEIGHT ? PLATFORM_MAX_DISPLAY_HEIGHT / rawHeight : 1
    const displayWidth = width * shrink
    const displayHeight = rawHeight * shrink
    const group = kind === 'normal' ? this.solidPlatforms : this.platforms
    const sprite = group.create(x, y, meta.key, meta.frame) as Phaser.Physics.Arcade.Sprite
    sprite.setDepth(2)
    sprite.setDisplaySize(displayWidth, displayHeight)
    sprite.refreshBody()
    // Static bodies use world pixels. Dynamic bodies scale texture pixels.
    // Both keep the collision box aligned to each texture's own
    // solid landing surface on all sides - excluding hanging vines, leaf overhang,
    // spike tips, and the transparent side padding every asset has around its
    // actual log/plank silhouette - regardless of the platform's display width.
    const body = sprite.body as Phaser.Physics.Arcade.Body | Phaser.Physics.Arcade.StaticBody
    const bodyWidth = kind === 'normal' ? displayWidth : sprite.width
    const bodyHeight = kind === 'normal' ? displayHeight : sprite.height
    body.setSize(
      (meta.bodyRightPct - meta.bodyLeftPct) * bodyWidth,
      (meta.bodyBottomPct - meta.bodyTopPct) * bodyHeight,
      false,
    )
    body.setOffset(meta.bodyLeftPct * bodyWidth, meta.bodyTopPct * bodyHeight)

    const floorIndex = Math.round((this.startY - y) / FLOOR_HEIGHT)
    const data: PlatformData = {
      body: sprite,
      floorIndex,
      kind,
      displayHeight,
      crumbling: false,
      moveSpeed: Phaser.Math.Between(40, 90),
      moveRangeLeft: Math.max(width / 2 + 4, x - Phaser.Math.Between(60, 120)),
      moveRangeRight: Math.min(GAME_WIDTH - width / 2 - 4, x + Phaser.Math.Between(60, 120)),
    }
    sprite.setData('platformData', data)
    if (kind === 'moving') {
      sprite.setVelocityX(data.moveSpeed)
    }
    this.platformList.push(data)
    return data
  }

  private updatePlatformWindow(peakScrollY: number) {
    while (this.highestPlatformY > peakScrollY - PLATFORM_LOOKAHEAD) {
      this.spawnNextPlatform(this.highestPlatformY - FLOOR_HEIGHT)
    }

    // Keep every row the recovery camera can show, plus padding for art
    // extending beyond a platform's center.
    const cullBelow = peakScrollY + GAME_HEIGHT + PLATFORM_RECOVERY + FLOOR_HEIGHT
    this.platformList = this.platformList.filter((data) => {
      if (!data.crumbling && data.body.y > cullBelow) {
        data.body.destroy()
        return false
      }
      return true
    })
    return cullBelow
  }

  private spawnNextPlatform(y: number) {
    const floorIndex = Math.round((this.startY - y) / FLOOR_HEIGHT)
    const difficulty = Math.min(1, floorIndex / 60)
    const width = Phaser.Math.Linear(PLATFORM_START_WIDTH, PLATFORM_MIN_WIDTH, difficulty)
    const halfW = width / 2
    const minX = halfW + 10
    const maxX = GAME_WIDTH - halfW - 10
    const x = Phaser.Math.Clamp(
      Phaser.Math.Between(this.highestPlatformX - MAX_PLATFORM_X_DELTA, this.highestPlatformX + MAX_PLATFORM_X_DELTA),
      minX,
      maxX,
    )

    const spikeChance = Phaser.Math.Linear(SPIKE_BASE_CHANCE, SPIKE_MAX_CHANCE, difficulty)
    const movingChance = Phaser.Math.Linear(MOVING_BASE_CHANCE, MOVING_MAX_CHANCE, difficulty)
    const crumbleChance = Phaser.Math.Linear(CRUMBLE_BASE_CHANCE, CRUMBLE_MAX_CHANCE, difficulty)

    let kind: PlatformKind = 'normal'
    if (floorIndex >= SPIKE_MIN_FLOOR && Math.random() < spikeChance) {
      kind = 'hazard'
    } else if (floorIndex >= MOVING_MIN_FLOOR && Math.random() < movingChance) {
      kind = 'moving'
    } else if (floorIndex >= CRUMBLE_MIN_FLOOR && Math.random() < crumbleChance) {
      kind = 'crumble'
    } else if (floorIndex >= SPRING_MIN_FLOOR && Math.random() < SPRING_CHANCE) {
      kind = 'spring'
    }

    const data = this.spawnPlatform(x, y, width, 'normal')
    if (kind !== 'normal') {
      this.spawnSidePlatform(x, y, width, kind)
    }

    if (floorIndex >= PICKUP_MIN_FLOOR && Math.random() < PICKUP_CHANCE) {
      this.spawnPickup(x, y - data.displayHeight / 2 - PICKUP_SIZE / 2 - 10)
    }

    if (
      floorIndex >= BIRD_MIN_FLOOR &&
      floorIndex - this.lastBirdFloor >= BIRD_MIN_FLOOR_GAP &&
      Math.random() < Phaser.Math.Linear(BIRD_BASE_CHANCE, BIRD_MAX_CHANCE, difficulty)
    ) {
      this.spawnBird(y - FLOOR_HEIGHT * 0.5)
      this.lastBirdFloor = floorIndex
    }

    this.highestPlatformY = y
    this.highestPlatformX = x
  }

  private spawnSidePlatform(x: number, y: number, width: number, kind: Exclude<PlatformKind, 'normal'>) {
    // Leave a panda-wide gap between the solid route and the side platform's
    // entire travel range, using the requested widths as conservative bounds.
    const innerEdge = width / 2 + PLAYER_DISPLAY_SIZE / 2 + 8
    const left = x < GAME_WIDTH / 2 ? x + innerEdge : 10
    const right = x < GAME_WIDTH / 2 ? GAME_WIDTH - 10 : x - innerEdge
    const travel = kind === 'moving' ? 40 : 0
    const sideWidth = Math.min(width, right - left - travel)
    if (sideWidth < PLATFORM_MIN_WIDTH) return

    const minX = left + sideWidth / 2
    const maxX = right - sideWidth / 2
    const side = this.spawnPlatform((minX + maxX) / 2, y, sideWidth, kind)
    side.moveRangeLeft = minX
    side.moveRangeRight = maxX
  }

  private spawnPickup(x: number, y: number) {
    const roll = Math.random()
    const kind: PickupKind =
      roll < 0.6
        ? 'star'
        : roll < 0.68
          ? 'rocket'
          : roll < 0.76
            ? 'shield'
            : roll < 0.84
              ? 'magnet'
              : roll < 0.92
                ? 'wings'
                : 'parachute'

    const meta = PICKUP_ICON_META[kind]
    const sprite = this.pickups.create(x, y, meta.key, meta.frame) as Phaser.Physics.Arcade.Sprite
    sprite.setData('kind', kind)
    sprite.setDepth(3)
    if (meta.anim) {
      sprite.play(meta.anim)
    }

    // the real upgrade art comes in at full native resolution, so size it down to
    // a consistent height and re-sync the (otherwise oversized) physics body to
    // match, keeping pickup collection distance visually accurate
    const height = PICKUP_SIZE * 1.3
    sprite.setDisplaySize(height * meta.aspect, height)
    ;(sprite.body as Phaser.Physics.Arcade.Body).setSize(sprite.width, sprite.height)

    this.tweens.add({
      targets: sprite,
      y: y - 10,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    })
  }

  private spawnBird(y: number) {
    const startLeft = Math.random() < 0.5
    const x = startLeft ? -BIRD_SIZE : GAME_WIDTH + BIRD_SIZE
    const sprite = this.add.spine(x, y, 'bat-data', 'bat-atlas', {
      boundsProvider: new SkinsAndAnimationBoundsProvider('fly', [], 1 / 30, false),
    }) as BirdSprite
    sprite.animationState.setAnimation(0, 'fly', true)
    // the animation bounds span the bat's full wing spread, so scale from the
    // larger of the two dimensions to keep the wingspan within BIRD_SIZE
    const scale = BIRD_SIZE / Math.max(sprite.width, sprite.height)
    sprite.setScale(scale)
    // the plugin's computed display origin doesn't match where it actually renders
    // the skeleton vertically (a spine-phaser-v4 quirk); pin it to the bounds' top
    // edge so body offsets below can use the same top-left crop convention as
    // every other sprite in this file
    sprite.setDisplayOrigin(sprite.displayOriginX, 0)
    this.physics.add.existing(sprite)
    // body size/offset are in unscaled skeleton-bounds space (auto-scaled to the
    // final display size), keeping the hitbox to the bat's furry body rather than
    // its wide wing membranes
    const body = sprite.body
    body.setAllowGravity(false)
    body.setSize(
      (BIRD_BODY_RIGHT_PCT - BIRD_BODY_LEFT_PCT) * sprite.width,
      (BIRD_BODY_BOTTOM_PCT - BIRD_BODY_TOP_PCT) * sprite.height,
      false,
    )
    body.setOffset(BIRD_BODY_LEFT_PCT * sprite.width, BIRD_BODY_TOP_PCT * sprite.height)
    this.hazards.add(sprite)
    sprite.setFlipX(!startLeft)
    sprite.setDepth(3)
    body.setVelocityX(startLeft ? BIRD_SPEED : -BIRD_SPEED)
    this.birdList.push({ sprite, baseY: y, bobOffset: Math.random() * 1000 })
  }

  private canLand(_player: unknown, platformObj: unknown) {
    const platform = platformObj as Phaser.Physics.Arcade.Sprite
    return this.player.body.velocity.y >= 0 && this.player.y < platform.y
  }

  private handleLanding(_playerObj: unknown, platformObj: unknown) {
    if (this.gameOver) return
    const platform = platformObj as Phaser.Physics.Arcade.Sprite
    const data = platform.getData('platformData') as PlatformData

    if (data.kind === 'hazard') {
      if (this.shieldCharges > 0) {
        this.consumeShield()
      } else {
        this.triggerGameOver()
        return
      }
    }

    const speedRatio = Phaser.Math.Clamp(Math.abs(this.player.body.velocity.x) / MAX_RUN_SPEED, 0, 1)
    const jumpVelocity = data.kind === 'spring' ? SPRING_JUMP_VELOCITY : BASE_JUMP_VELOCITY + speedRatio * MAX_JUMP_BONUS
    this.player.body.setVelocityY(-jumpVelocity)
    this.jumpEffect?.explode(10, this.player.body.center.x, this.player.body.bottom)
    // resync the jump animation's own arc to this landing so its bounce reads
    // in time with the actual physics jump instead of looping out of phase
    this.player.animationState.setAnimation(0, 'jump', true)

    if (data.kind === 'spring') {
      this.showFloatingText('BOING!', undefined, '#3ddc84')
      platform.play('spring-bounce')
      this.playSfx('sfx-spring', { volume: 0.6 })
    } else {
      this.playSfx('sfx-jump', { volume: 0.05 })
    }

    if (data.kind === 'crumble' && !data.crumbling) {
      this.startCrumble(platform, data)
    }

    if (data.floorIndex > this.lastLandedFloor) {
      const delta = data.floorIndex - this.lastLandedFloor
      const now = this.time.now
      const withinComboWindow = now - this.lastLandingTime <= COMBO_WINDOW_MS
      // skipping a floor always builds the streak; a plain single-floor hop
      // only keeps an already-active streak alive, so careful step-by-step
      // climbing alone never starts a combo
      const previousMultiplier = this.comboMultiplier
      if (delta >= 2 || (withinComboWindow && this.combo > 0)) {
        this.combo += 1
        recordCombo(this.combo)
      } else {
        this.combo = 0
      }
      this.lastLandingTime = now
      this.comboMultiplier = Math.min(1 + Math.floor(this.combo / COMBO_LEVEL_SIZE), COMBO_MAX_MULTIPLIER)

      if (delta >= 2) {
        const bonus = (delta - 1) * 15 * this.comboMultiplier
        this.bonusScore += bonus
        this.showFloatingText(`+${bonus}`, delta >= 4 ? 'AMAZING!' : delta === 3 ? 'GREAT!' : 'NICE!', '#ff7a3d')
      } else if (this.combo > 0) {
        this.bonusScore += COMBO_TRICKLE_BONUS * this.comboMultiplier
      }
      if (this.comboMultiplier > previousMultiplier) {
        this.showFloatingText(`COMBO x${this.comboMultiplier}!`, undefined, '#ffc93d')
      }
      this.emitCombo()

      this.lastLandedFloor = data.floorIndex
      if (data.floorIndex > this.bestFloorReached) {
        this.bestFloorReached = data.floorIndex
      }
      this.emitScore(false)
    }
  }

  private startCrumble(platform: Phaser.Physics.Arcade.Sprite, data: PlatformData) {
    data.crumbling = true
    // stop colliding immediately so a stray re-overlap mid-animation can't
    // re-trigger the bounce or block the player, while the sprite plays out its
    // shake-then-collapse sequence visually
    ;(platform.body as Phaser.Physics.Arcade.Body).checkCollision.none = true

    // shake in place on its still-intact frame as a warning, then play the
    // crack-and-collapse animation and remove the platform once it finishes
    const originalX = platform.x
    this.tweens.add({
      targets: platform,
      x: originalX + CRUMBLE_SHAKE_OFFSET,
      duration: 60,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    })

    this.time.delayedCall(CRUMBLE_SHAKE_MS, () => {
      if (!platform.active) return
      this.tweens.killTweensOf(platform)
      platform.x = originalX
      platform.play('wood-destroy')
      platform.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
        platform.destroy()
        this.platformList = this.platformList.filter((p) => p !== data)
      })
    })
  }

  private handleHazardHit(_playerObj: unknown, hazardObj: unknown) {
    if (this.gameOver) return
    const sprite = hazardObj as Phaser.GameObjects.GameObject
    if (this.shieldCharges > 0) {
      this.consumeShield()
      this.birdList = this.birdList.filter((b) => b.sprite !== sprite)
      sprite.destroy()
      return
    }
    this.triggerGameOver()
  }

  private handlePickup(_playerObj: unknown, pickupObj: unknown) {
    if (this.gameOver) return
    const sprite = pickupObj as Phaser.Physics.Arcade.Sprite
    const kind = sprite.getData('kind') as PickupKind
    sprite.destroy()

    switch (kind) {
      case 'rocket':
        this.activateRocket()
        markPowerupUsed('rocket')
        this.playSfx('sfx-powerup', { volume: 0.6 })
        this.showFloatingText('ROCKET!', undefined, '#ff7a3d')
        break
      case 'shield':
        this.activateShield()
        markPowerupUsed('shield')
        this.playSfx('sfx-powerup', { volume: 0.6 })
        this.showFloatingText('SHIELD!', undefined, '#3d9bff')
        break
      case 'star':
        this.bonusScore += STAR_BONUS
        this.coinsThisRun += 1
        addCoins(1)
        addTotalCoinsCollected(1)
        this.emitScore(false)
        this.playSfx('sfx-coin', { volume: 0.6 })
        this.showFloatingText(`+${STAR_BONUS}`, undefined, '#ffc93d')
        break
      case 'magnet':
        this.activateMagnet()
        markPowerupUsed('magnet')
        this.playSfx('sfx-powerup', { volume: 0.6 })
        this.showFloatingText('MAGNET!', undefined, '#4ade80')
        break
      case 'wings':
        this.activateWings()
        markPowerupUsed('wings')
        this.playSfx('sfx-powerup', { volume: 0.6 })
        this.showFloatingText('WINGS!', undefined, '#c084fc')
        break
      case 'parachute':
        this.activateParachute()
        markPowerupUsed('parachute')
        this.playSfx('sfx-powerup', { volume: 0.6 })
        this.showFloatingText('PARACHUTE!', undefined, '#4ade80')
        break
    }
  }

  private activateMagnet() {
    const level = getMagnetLevel()
    this.magnetActive = true
    this.magnetRadius = MAGNET_RADIUS + level * MAGNET_LEVEL_RADIUS_BONUS
    this.magnetEndTime = this.time.now + MAGNET_DURATION_MS + level * MAGNET_LEVEL_DURATION_MS_BONUS
    this.emitPowerups()
  }

  private deactivateMagnet() {
    this.magnetActive = false
    this.emitPowerups()
  }

  private activateWings() {
    this.wingsActive = true
    this.wingsEndTime = this.time.now + WINGS_DURATION_MS + getWingsLevel() * WINGS_LEVEL_DURATION_MS_BONUS
    this.player.body.setGravityY(GRAVITY_Y * WINGS_GRAVITY_SCALE)
    this.emitPowerups()
  }

  private deactivateWings() {
    this.wingsActive = false
    this.player.body.setGravityY(GRAVITY_Y)
    this.emitPowerups()
  }

  private activateParachute() {
    this.parachuteActive = true
    this.parachuteEndTime =
      this.time.now + PARACHUTE_DURATION_MS + getParachuteLevel() * PARACHUTE_LEVEL_DURATION_MS_BONUS
    this.emitPowerups()
  }

  private deactivateParachute() {
    this.parachuteActive = false
    this.emitPowerups()
  }

  private activateRocket() {
    this.rocketActive = true
    this.rocketEndTime = this.time.now + ROCKET_DURATION_MS + getRocketLevel() * ROCKET_LEVEL_DURATION_MS_BONUS
    const body = this.player.body
    body.setAllowGravity(false)
    body.checkCollision.down = false
    body.setVelocityY(-(ROCKET_SPEED + getRocketLevel() * ROCKET_LEVEL_SPEED_BONUS))
    this.emitPowerups()
  }

  private deactivateRocket() {
    this.rocketActive = false
    const body = this.player.body
    body.setAllowGravity(true)
    body.checkCollision.down = true
    this.emitPowerups()
  }

  private activateShield() {
    this.shieldCharges = SHIELD_BASE_CHARGES + getShieldLevel() * SHIELD_LEVEL_CHARGE_BONUS
    if (!this.shieldSprite) {
      // the player's origin is pinned to the top of its bounds (see the Spine
      // display-origin note in create()), so its vertical center - not
      // this.player.y - is what the aura should track
      this.shieldSprite = this.add.sprite(this.player.x, this.player.y + this.player.displayHeight / 2, 'shield-aura')
      this.shieldSprite.setDepth(5)
    }
    this.shieldSprite.setVisible(true)
    this.emitPowerups()
  }

  private consumeShield() {
    this.shieldCharges -= 1
    this.combo = 0
    this.comboMultiplier = 1
    this.emitCombo()
    if (this.shieldCharges > 0) {
      this.showFloatingText('SHIELD HIT', undefined, '#3d9bff')
      this.emitPowerups()
      return
    }
    this.shieldSprite?.setVisible(false)
    this.showFloatingText('SHIELD BROKEN', undefined, '#3d9bff')
    this.emitPowerups()
  }

  private emitPowerups() {
    EventBus.emit('powerup-changed', {
      rocket: this.rocketActive,
      shield: this.shieldCharges > 0,
      magnet: this.magnetActive,
      wings: this.wingsActive,
      parachute: this.parachuteActive,
    })
  }

  private emitCombo() {
    EventBus.emit('combo-changed', { combo: this.combo, multiplier: this.comboMultiplier })
  }

  private showFloatingText(main: string, prefix: string | undefined, color: string) {
    const label = prefix ? `${prefix}  ${main}` : main
    const text = this.add.text(this.player.x, this.player.y + this.player.displayHeight / 2 - 50, label, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '20px',
      fontStyle: 'bold',
      color,
      stroke: '#ffffff',
      strokeThickness: 4,
    })
    text.setOrigin(0.5)
    text.setDepth(6)
    this.tweens.add({
      targets: text,
      y: text.y - 40,
      alpha: 0,
      duration: 700,
      ease: 'Cubic.Out',
      onComplete: () => text.destroy(),
    })
  }

  private emitScore(initial: boolean) {
    const score = this.getScore()
    EventBus.emit('score-changed', score)
    if (initial) {
      EventBus.emit('best-score', getBestScore())
    }
  }

  private getScore() {
    return this.bestFloorReached * 10 + this.bonusScore
  }

  update(_time: number, delta: number) {
    if (this.gameOver) return

    const pointerLeft = this.pointerTargetX !== null && this.pointerTargetX < this.player.x - POINTER_DEADZONE
    const pointerRight = this.pointerTargetX !== null && this.pointerTargetX > this.player.x + POINTER_DEADZONE
    const left = this.cursors.left.isDown || this.keyA.isDown || pointerLeft
    const right = this.cursors.right.isDown || this.keyD.isDown || pointerRight

    if (left && !right) {
      this.player.body.setAccelerationX(-RUN_ACCEL)
      this.player.setFlipX(true)
    } else if (right && !left) {
      this.player.body.setAccelerationX(RUN_ACCEL)
      this.player.setFlipX(false)
    } else {
      this.player.body.setAccelerationX(0)
    }

    if (this.rocketActive) {
      this.player.body.setVelocityY(-ROCKET_SPEED)
      if (this.time.now >= this.rocketEndTime) {
        this.deactivateRocket()
      }
    }

    if (this.wingsActive && this.time.now >= this.wingsEndTime) {
      this.deactivateWings()
    }

    if (this.parachuteActive) {
      if (this.time.now >= this.parachuteEndTime) {
        this.deactivateParachute()
      } else if (this.player.body.velocity.y > PARACHUTE_MAX_FALL_SPEED) {
        this.player.body.setVelocityY(PARACHUTE_MAX_FALL_SPEED)
      }
    }

    if (this.magnetActive) {
      if (this.time.now >= this.magnetEndTime) {
        this.deactivateMagnet()
      } else {
        for (const obj of this.pickups.getChildren()) {
          const sprite = obj as Phaser.Physics.Arcade.Sprite
          if (sprite.getData('kind') !== 'star') continue
          const dx = this.player.x - sprite.x
          const dy = this.player.y - sprite.y
          if (Math.hypot(dx, dy) >= this.magnetRadius) continue
          if (!sprite.getData('pulled')) {
            sprite.setData('pulled', true)
            this.tweens.killTweensOf(sprite)
          }
          sprite.x += dx * MAGNET_PULL_FACTOR
          sprite.y += dy * MAGNET_PULL_FACTOR
        }
      }
    }

    if (this.shieldCharges > 0 && this.shieldSprite) {
      this.shieldSprite.setPosition(this.player.x, this.player.y + this.player.displayHeight / 2)
    }

    const currentFloor = Math.max(0, Math.round((this.startY - this.player.y) / FLOOR_HEIGHT))
    if (currentFloor > this.bestFloorReached) {
      this.bestFloorReached = currentFloor
      this.emitScore(false)
    }

    const camera = this.cameras.main
    if (!this.waterfallDebugMode) {
      const targetScrollY = this.player.y - GAME_HEIGHT * 0.6
      this.minCameraScrollY = Math.min(this.minCameraScrollY, targetScrollY)
      camera.scrollY = Math.min(0, targetScrollY, this.minCameraScrollY + PLATFORM_RECOVERY)
    }

    const cullBelow = this.updatePlatformWindow(this.minCameraScrollY)

    while (this.highestBgY > this.cameras.main.scrollY - this.bgTileHeight) {
      this.spawnBackgroundTile(this.nextBgIndex)
      this.nextBgIndex++
    }

    const bgCullBelow = this.cameras.main.scrollY + GAME_HEIGHT + this.bgTileHeight
    this.bgTiles = this.bgTiles.filter((tile) => {
      if (tile.topY > bgCullBelow) {
        tile.left.destroy()
        tile.right.destroy()
        return false
      }
      return true
    })

    for (const tile of this.bgTiles) {
      // gentle wind sway - each side leans outward (away from the play field) and
      // back, rather than swinging inward across its resting position
      const leftSway = (Math.sin((this.time.now + tile.swayOffset) / 1800) + 1) * 4
      const rightSway = (Math.sin((this.time.now + tile.swayOffset) / 1800 + Math.PI / 3) + 1) * 4
      tile.left.x = GAME_WIDTH / 2 - leftSway
      tile.right.x = GAME_WIDTH / 2 + rightSway
    }

    const bgElapsed = this.time.now / 1000
    this.bgLayers.forEach((sprite, index) => {
      const layer = BCG_LAYERS[index]
      if (layer.driftX) {
        sprite.x = GAME_WIDTH / 2 + Math.sin(bgElapsed * 0.15) * layer.driftX
      }
      if (layer.pulseAlpha) {
        sprite.alpha = 0.88 + Math.sin(bgElapsed * 0.7) * 0.08
      }
    })

    for (const data of this.platformList) {
      if (data.kind !== 'moving') continue
      const sprite = data.body
      const body = sprite.body as Phaser.Physics.Arcade.Body
      if (sprite.x <= data.moveRangeLeft && body.velocity.x < 0) {
        sprite.setVelocityX(Math.abs(data.moveSpeed))
      } else if (sprite.x >= data.moveRangeRight && body.velocity.x > 0) {
        sprite.setVelocityX(-Math.abs(data.moveSpeed))
      }
    }

    this.birdList = this.birdList.filter((bird) => {
      if (bird.sprite.y > cullBelow || !bird.sprite.active) {
        bird.sprite.destroy()
        return false
      }
      const body = bird.sprite.body as Phaser.Physics.Arcade.Body
      // patrol back and forth across the screen forever instead of flying off
      if (bird.sprite.x <= -BIRD_SIZE && body.velocity.x < 0) {
        body.setVelocityX(BIRD_SPEED)
      } else if (bird.sprite.x >= GAME_WIDTH + BIRD_SIZE && body.velocity.x > 0) {
        body.setVelocityX(-BIRD_SPEED)
      }
      bird.sprite.y = bird.baseY + Math.sin((this.time.now + bird.bobOffset) / 300) * 12
      bird.sprite.setFlipX(body.velocity.x < 0)
      return true
    })

    // runs from scene start (not gated on `started`) so falling past the
    // bottom before ever landing on a platform is still detected below -
    // otherwise the camera never tracks the fall and the player can come to
    // rest on the world bounds instead of triggering game over
    if (!this.waterfallDebugMode) {
      if (this.player.y > this.minCameraScrollY + GAME_HEIGHT + 60) {
        this.triggerGameOver()
      }

      // rises steadily, but speeds up to close the gap whenever the player
      // has pulled too far ahead, so a big rocket boost early on doesn't
      // make the chaser irrelevant for the rest of the run
      const gap = this.player.y - this.chaserY
      const riseSpeed = gap < -CHASER_MAX_GAP ? CHASER_CATCHUP_SPEED : CHASER_BASE_SPEED
      this.chaserY -= riseSpeed * (delta / 1000)
      this.chaserMist?.setY(this.chaserY)
      this.redrawChaser()

      if (this.player.y >= this.chaserY) {
        this.triggerGameOver()
      }
    } else {
      const nudge = 6
      if (this.cursors.up.isDown) this.cameras.main.scrollY -= nudge
      if (this.cursors.down.isDown) this.cameras.main.scrollY += nudge
    }
  }

  private triggerGameOver() {
    if (this.gameOver) return
    this.gameOver = true
    this.physics.pause()
    this.musicTrack?.stop()
    this.playSfx('sfx-fall', { volume: 0.6 })
    incrementGamesPlayed()

    const score = this.getScore()
    const best = getBestScore()
    const isNewBest = score > best
    if (isNewBest) {
      setBestScore(score)
    }

    EventBus.emit('game-over', { score, best: isNewBest ? score : best, isNewBest, coinsThisRun: this.coinsThisRun })
  }

  restartGame() {
    this.scene.restart()
  }

  setMusicMuted(muted: boolean) {
    if (this.musicTrack) this.musicTrack.mute = muted
  }

  pauseGame() {
    if (this.gameOver) return
    this.scene.pause()
    this.musicTrack?.pause()
  }

  resumeGame() {
    this.scene.resume()
    if (this.musicTrack?.isPaused) this.musicTrack.resume()
  }
}
