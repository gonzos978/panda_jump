import { SpinePlugin } from '@esotericsoftware/spine-phaser-v4'
import Phaser from 'phaser'
import { useEffect, useRef } from 'react'
import { GAME_HEIGHT, GAME_WIDTH } from './constants'
import { MainScene } from './scenes/MainScene'

interface PhaserGameProps {
  onReady?: (game: Phaser.Game) => void
}

// Module-scoped (not a ref) so it survives React StrictMode's dev-only
// mount->cleanup->mount cycle. The Spine plugin registers its `add.spine`
// factory as a shared mixin that isn't safe to install/tear down/reinstall
// across multiple Phaser.Game instances in quick succession, so this game is
// created once for the page's lifetime and never destroyed on cleanup.
let sharedGame: Phaser.Game | null = null

export function PhaserGame({ onReady }: PhaserGameProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    if (sharedGame) {
      // StrictMode remounted us into a new container div, or we're
      // returning to the game screen for a new run - the game (and its
      // canvas) already exist, so just re-parent it. Moving the canvas
      // ourselves doesn't tell Phaser's Scale Manager the parent changed, so
      // without setParent+refresh it keeps sizing against the old (possibly
      // now-detached) container and the canvas renders into only a corner.
      if (sharedGame.canvas.parentElement !== containerRef.current) {
        containerRef.current.appendChild(sharedGame.canvas)
        sharedGame.scale.parent = containerRef.current
        sharedGame.scale.getParentBounds()
        sharedGame.scale.refresh()
      }
      onReady?.(sharedGame)
      return
    }

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
      parent: containerRef.current,
      backgroundColor: '#aee4ff',
      physics: {
        default: 'arcade',
        arcade: {
          debug: false,
        },
      },
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      plugins: {
        scene: [{ key: 'spine.SpinePlugin', plugin: SpinePlugin, mapping: 'spine' }],
      },
      scene: [MainScene],
    }

    const game = new Phaser.Game(config)
    sharedGame = game
    onReady?.(game)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <div id="game-container" ref={containerRef} />
}
