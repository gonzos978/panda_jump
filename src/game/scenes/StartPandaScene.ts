import { SkinsAndAnimationBoundsProvider } from '@esotericsoftware/spine-phaser-v4'
import Phaser from 'phaser'
import { EventBus } from '../EventBus'
import { getMusicEnabled } from '../storage'

export class StartPandaScene extends Phaser.Scene {
  private musicTrack?: Phaser.Sound.WebAudioSound | Phaser.Sound.HTML5AudioSound

  constructor() {
    super('StartPandaScene')
  }

  preload() {
    this.load.spineAtlas('panda-atlas', `${import.meta.env.BASE_URL}assets/hero/panda-idle-1080p.atlas`)
    this.load.spineSkeleton('panda-data', `${import.meta.env.BASE_URL}assets/hero/panda-idle.json`)
    this.load.audio('music-start', `${import.meta.env.BASE_URL}assets/sfx/main_screen_music.mp3`)
  }

  create() {
    const panda = this.add.spine(0, 0, 'panda-data', 'panda-atlas', {
      boundsProvider: new SkinsAndAnimationBoundsProvider('idle', [], 1 / 30, false),
    })

    // the plugin's computed display origin doesn't match where it actually
    // renders the skeleton vertically (a spine-phaser-v4 quirk); pin it to the
    // bounds' top edge so we can position by the top and stand it on the floor
    panda.setDisplayOrigin(panda.displayOriginX, 0)

    const scale = (this.scale.width * 0.92) / panda.width
    panda.setScale(scale)
    panda.setPosition(this.scale.width / 2, this.scale.height - panda.height * scale)

    panda.animationState.setAnimation(0, 'idle', true)

    this.musicTrack = this.sound.add('music-start', { loop: true, volume: 0.35 }) as
      | Phaser.Sound.WebAudioSound
      | Phaser.Sound.HTML5AudioSound
    this.musicTrack.mute = !getMusicEnabled()
    this.musicTrack.play()

    // lets the top-level React loading screen wait for the panda to actually
    // be constructed (not just for its assets to be fetched) before it ever
    // reveals the start screen underneath
    EventBus.emit('start-panda-ready')
  }

  pauseMusic() {
    if (this.musicTrack?.isPlaying) this.musicTrack.pause()
  }

  resumeMusic() {
    if (this.musicTrack?.isPaused) this.musicTrack.resume()
  }
}
