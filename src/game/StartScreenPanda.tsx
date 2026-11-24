import { SpinePlugin } from '@esotericsoftware/spine-phaser-v4'
import Phaser from 'phaser'
import { useEffect, useRef } from 'react'
import { StartPandaScene } from './scenes/StartPandaScene'

const WIDTH = 300
const HEIGHT = 320

// Same module-scoped "never destroy" pattern as PhaserGame.tsx - the Spine
// plugin's shared `add.spine` factory isn't safe to install/tear down across
// React StrictMode's dev-only mount->cleanup->mount cycle.
let sharedStartGame: Phaser.Game | null = null

// The start screen's sound manager only ever plays the one looped music
// track, so a blanket mute on the whole manager is safe here (unlike the
// main game's manager, which also plays one-shot SFX).
export function setStartMusicMuted(muted: boolean) {
  if (sharedStartGame) {
    sharedStartGame.sound.mute = muted
  }
}

// The start screen's Phaser game is never destroyed, so its scene (and the
// looped start-screen music playing in it) keeps running behind the game
// screen unless explicitly paused - otherwise it plays at the same time as
// the in-game music.
export function pauseStartMusic() {
  const scene = sharedStartGame?.scene.getScene('StartPandaScene') as StartPandaScene | undefined
  scene?.pauseMusic()
}

export function resumeStartMusic() {
  const scene = sharedStartGame?.scene.getScene('StartPandaScene') as StartPandaScene | undefined
  scene?.resumeMusic()
}

export function StartScreenPanda() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    if (sharedStartGame) {
      // moving the canvas ourselves doesn't tell Phaser's Scale Manager the
      // parent changed, so without setting parent+refresh it keeps sizing
      // against the old (now-detached) container and the canvas renders
      // into only a corner, or not at all, on returning to this screen
      if (sharedStartGame.canvas.parentElement !== containerRef.current) {
        containerRef.current.appendChild(sharedStartGame.canvas)
        sharedStartGame.scale.parent = containerRef.current
        sharedStartGame.scale.getParentBounds()
        sharedStartGame.scale.refresh()
      }
      return
    }

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: WIDTH,
      height: HEIGHT,
      parent: containerRef.current,
      transparent: true,
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      plugins: {
        scene: [{ key: 'spine.SpinePlugin', plugin: SpinePlugin, mapping: 'spine' }],
      },
      scene: [StartPandaScene],
    }

    sharedStartGame = new Phaser.Game(config)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <div className="hero-art hero-art-canvas" ref={containerRef} />
}
