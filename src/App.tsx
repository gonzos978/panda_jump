import { useEffect, useRef, useState } from 'react'
import type Phaser from 'phaser'
import './App.css'
import { PandaCollection } from './PandaCollection'
import { PhaserGame } from './game/PhaserGame'
import { pauseStartMusic, resumeStartMusic, setStartMusicMuted, StartScreenPanda } from './game/StartScreenPanda'
import { ACHIEVEMENTS } from './game/achievements'
import { EventBus, type ComboPayload, type GameOverPayload, type PowerupPayload } from './game/EventBus'
import { fetchTopScores, submitScore, type GlobalLeaderboardEntry } from './game/leaderboard'
import { ALL_ASSET_URLS } from './game/preloadAssets'
import type { MainScene } from './game/scenes/MainScene'
import {
  getBestScore,
  getCoins,
  getMusicEnabled,
  getPlayerName,
  getSoundEnabled,
  getTutorialSeen,
  setMusicEnabled,
  setPlayerName,
  setSoundEnabled,
  setTutorialSeen,
  spendCoins,
} from './game/storage'
import { UPGRADES } from './game/upgrades'

type Screen = 'loading' | 'start' | 'game'

const ASSETS = '/assets'

function App() {
  const gameRef = useRef<Phaser.Game | null>(null)
  const [screen, setScreen] = useState<Screen>('loading')
  const [loadProgress, setLoadProgress] = useState(0)
  const [score, setScore] = useState(0)
  const [best, setBest] = useState(() => getBestScore())
  const [totalCoins, setTotalCoins] = useState(() => getCoins())
  const [upgradeLevels, setUpgradeLevels] = useState(() =>
    Object.fromEntries(UPGRADES.map((upgrade) => [upgrade.id, upgrade.getLevel()])),
  )
  const [showCollection, setShowCollection] = useState(false)
  const [showShop, setShowShop] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showAchievements, setShowAchievements] = useState(false)
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [showPause, setShowPause] = useState(false)
  const [showTutorial, setShowTutorial] = useState(false)
  const [tutorialGatesPlay, setTutorialGatesPlay] = useState(false)
  const [musicEnabled, setMusicEnabledState] = useState(() => getMusicEnabled())
  const [soundEnabled, setSoundEnabledState] = useState(() => getSoundEnabled())
  const [result, setResult] = useState<GameOverPayload | null>(null)
  const [powerups, setPowerups] = useState<PowerupPayload>({
    rocket: false,
    shield: false,
    magnet: false,
    wings: false,
    parachute: false,
  })
  const [combo, setCombo] = useState<ComboPayload>({ combo: 0, multiplier: 1 })
  const [leaderboardEntries, setLeaderboardEntries] = useState<GlobalLeaderboardEntry[]>([])
  const [leaderboardStatus, setLeaderboardStatus] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle')
  const [pendingScore, setPendingScore] = useState<number | null>(null)
  const [nicknameInput, setNicknameInput] = useState('')
  const [assetsWarmed, setAssetsWarmed] = useState(false)
  const [startPandaReady, setStartPandaReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    let loaded = 0
    // Warms the browser's HTTP cache for every asset the app uses - the DOM
    // menus' images plus everything both Phaser scenes will load moments
    // later - so nothing pops in half-loaded once the start screen (or a
    // Phaser preload scene) actually renders.
    Promise.all(
      ALL_ASSET_URLS.map((url) =>
        fetch(url)
          .then((res) => res.blob())
          .catch(() => undefined)
          .finally(() => {
            loaded += 1
            if (!cancelled) setLoadProgress(loaded / ALL_ASSET_URLS.length)
          }),
      ),
    ).then(() => {
      if (!cancelled) setAssetsWarmed(true)
    })
    return () => {
      cancelled = true
    }
  }, [])

  // Only leaves the loading screen once the start-screen panda has actually
  // been constructed (not just once its assets are cached) - otherwise its
  // own Phaser preload scene briefly flashes its loading bar right after,
  // on top of what's supposed to be the fully-ready start screen.
  useEffect(() => {
    if (assetsWarmed && startPandaReady) setScreen('start')
  }, [assetsWarmed, startPandaReady])

  useEffect(() => {
    const onScore = (value: number) => setScore(value)
    const onBest = (value: number) => setBest(value)
    const onGameOver = (payload: GameOverPayload) => {
      setResult(payload)
      setBest(payload.best)
      setTotalCoins(getCoins())

      const name = getPlayerName()
      if (name) {
        submitScore(name, payload.score).catch((err) => console.error('Failed to submit score', err))
      } else {
        setPendingScore(payload.score)
      }
    }
    const onPowerups = (payload: PowerupPayload) => setPowerups(payload)
    const onCombo = (payload: ComboPayload) => setCombo(payload)
    const onStartPandaReady = () => setStartPandaReady(true)

    EventBus.on('score-changed', onScore)
    EventBus.on('best-score', onBest)
    EventBus.on('game-over', onGameOver)
    EventBus.on('powerup-changed', onPowerups)
    EventBus.on('combo-changed', onCombo)
    EventBus.on('start-panda-ready', onStartPandaReady)

    return () => {
      EventBus.off('score-changed', onScore)
      EventBus.off('best-score', onBest)
      EventBus.off('game-over', onGameOver)
      EventBus.off('start-panda-ready', onStartPandaReady)
      EventBus.off('powerup-changed', onPowerups)
      EventBus.off('combo-changed', onCombo)
    }
  }, [])

  useEffect(() => {
    if (!showLeaderboard) return
    setLeaderboardStatus('loading')
    fetchTopScores(10)
      .then((entries) => {
        setLeaderboardEntries(entries)
        setLeaderboardStatus('loaded')
      })
      .catch((err) => {
        console.error('Failed to load leaderboard', err)
        setLeaderboardStatus('error')
      })
  }, [showLeaderboard])

  const handleSubmitNickname = () => {
    const trimmed = nicknameInput.trim()
    if (!trimmed || pendingScore === null) return
    setPlayerName(trimmed)
    submitScore(trimmed, pendingScore).catch((err) => console.error('Failed to submit score', err))
    setPendingScore(null)
    setNicknameInput('')
  }

  const handleSkipNickname = () => {
    setPendingScore(null)
    setNicknameInput('')
  }

  const resetGameState = () => {
    setResult(null)
    setScore(0)
    setPowerups({ rocket: false, shield: false, magnet: false, wings: false, parachute: false })
    setCombo({ combo: 0, multiplier: 1 })
    setShowPause(false)
  }

  const startGame = () => {
    resetGameState()
    // the underlying Phaser game/scene is a persistent singleton (see
    // PhaserGame.tsx) - it's never recreated, so returning to this screen
    // must explicitly restart the still-paused, still-game-over scene from
    // the previous run instead of just resuming its frozen final state
    const scene = gameRef.current?.scene.getScene('MainScene') as MainScene | undefined
    scene?.restartGame()
    pauseStartMusic()
    setScreen('game')
  }

  const handlePlay = () => {
    if (!getTutorialSeen()) {
      setTutorialGatesPlay(true)
      setShowTutorial(true)
      return
    }
    startGame()
  }

  const handleOpenTutorialFromSettings = () => {
    setShowSettings(false)
    setTutorialGatesPlay(false)
    setShowTutorial(true)
  }

  const handleCloseTutorial = () => {
    setTutorialSeen()
    setShowTutorial(false)
    if (tutorialGatesPlay) {
      setTutorialGatesPlay(false)
      startGame()
    }
  }

  const handleRestart = () => {
    resetGameState()
    const scene = gameRef.current?.scene.getScene('MainScene') as MainScene | undefined
    scene?.restartGame()
  }

  const handleMainMenu = () => {
    const scene = gameRef.current?.scene.getScene('MainScene') as MainScene | undefined
    scene?.resumeGame()
    resetGameState()
    setTotalCoins(getCoins())
    resumeStartMusic()
    setScreen('start')
  }

  const handlePause = () => {
    const scene = gameRef.current?.scene.getScene('MainScene') as MainScene | undefined
    scene?.pauseGame()
    setShowPause(true)
  }

  const handleResume = () => {
    const scene = gameRef.current?.scene.getScene('MainScene') as MainScene | undefined
    scene?.resumeGame()
    setShowPause(false)
  }

  const handleBuyUpgrade = (upgradeId: string) => {
    const upgrade = UPGRADES.find((u) => u.id === upgradeId)
    if (!upgrade) return
    const level = upgradeLevels[upgradeId]
    if (level >= upgrade.costs.length) return
    if (!spendCoins(upgrade.costs[level])) return
    const newLevel = level + 1
    upgrade.setLevel(newLevel)
    setUpgradeLevels((prev) => ({ ...prev, [upgradeId]: newLevel }))
    setTotalCoins(getCoins())
  }

  const handleToggleMusic = () => {
    const next = !musicEnabled
    setMusicEnabled(next)
    setMusicEnabledState(next)
    const scene = gameRef.current?.scene.getScene('MainScene') as MainScene | undefined
    scene?.setMusicMuted(!next)
    setStartMusicMuted(!next)
  }

  const handleToggleSound = () => {
    const next = !soundEnabled
    setSoundEnabled(next)
    setSoundEnabledState(next)
  }

  const handleOpenUpgradesFromSettings = () => {
    setShowSettings(false)
    setShowShop(true)
  }

  const handleOpenAchievementsFromSettings = () => {
    setShowSettings(false)
    setShowAchievements(true)
  }

  return (
    <div className="app-shell">
      <div className="game-frame">
        {screen === 'loading' && (
          <div className="loading-screen">
            <img className="loading-logo" src={`${ASSETS}/start_screen/game_logo.png`} alt="PandaJump" />
            <div className="loading-bar-track">
              <div className="loading-bar-fill" style={{ width: `${Math.round(loadProgress * 100)}%` }} />
            </div>
            <p className="loading-percent">{Math.round(loadProgress * 100)}%</p>
          </div>
        )}

        {(screen === 'loading' || screen === 'start') && (
          <div className="start-screen" style={{ backgroundImage: `url(${ASSETS}/start_screen/bcg.png)` }}>
            <div className="coins-pill" style={{ backgroundImage: `url(${ASSETS}/start_screen/coinsPanel.png)` }}>
              <span className="coins-pill-value">{totalCoins}</span>
            </div>

            <div className="start-content">
              <img className="title-logo" src={`${ASSETS}/start_screen/game_logo.png`} alt="PandaJump" />

              <div className="hero-wrap">
                <StartScreenPanda />
                <img className="mossy-stone" src={`${ASSETS}/start_screen/mossy_stone.png`} alt="" />
              </div>

              <button
                type="button"
                className="play-btn-img"
                style={{ backgroundImage: `url(${ASSETS}/start_screen/playBtn.png)` }}
                onClick={handlePlay}
                aria-label="Play"
              />

              <div className="icon-row">
                <button
                  type="button"
                  className="icon-btn"
                  style={{ backgroundImage: `url(${ASSETS}/start_screen/heroBtn.png)` }}
                  onClick={() => setShowCollection(true)}
                  aria-label="Panda Collection"
                />
                <button
                  type="button"
                  className="icon-btn"
                  style={{ backgroundImage: `url(${ASSETS}/start_screen/statisticBtn.png)` }}
                  onClick={() => setShowLeaderboard(true)}
                  aria-label="Leaderboard"
                />
                <button
                  type="button"
                  className="icon-btn"
                  style={{ backgroundImage: `url(${ASSETS}/start_screen/settingsBtn.png)` }}
                  onClick={() => setShowSettings(true)}
                  aria-label="Settings"
                />
              </div>
            </div>

            {showCollection && <PandaCollection onClose={() => setShowCollection(false)} />}

            {showShop && (
              <div className="shop-overlay">
                <div className="shop-panel" style={{ backgroundImage: `url(${ASSETS}/end_screen/popupPannel2.png)` }}>
                  <button
                    type="button"
                    className="close-btn shop-close-btn"
                    style={{ backgroundImage: `url(${ASSETS}/end_screen/closeBtn.png)` }}
                    onClick={() => setShowShop(false)}
                    aria-label="Close shop"
                  />
                  <img className="settings-title" src={`${ASSETS}/ui/upgrades_btn.png`} alt="Upgrades" />

                  <div className="shop-list">
                    {UPGRADES.map((upgrade) => {
                      const level = upgradeLevels[upgrade.id]
                      const maxLevel = upgrade.costs.length
                      const isMax = level >= maxLevel
                      return (
                        <div key={upgrade.id} className="shop-list-item">
                          <img className="shop-list-icon" src={upgrade.icon} alt="" />
                          <div className="shop-list-text">
                            <p className="shop-list-title">
                              {upgrade.title} · Lv {level}
                              {!isMax && ` → ${level + 1}`}
                            </p>
                            <p className="shop-list-effect">
                              {upgrade.statsAtLevel(level)}
                              {!isMax && ` → ${upgrade.statsAtLevel(level + 1)}`}
                            </p>
                          </div>
                          {isMax ? (
                            <span className="shop-list-max">MAX</span>
                          ) : (
                            <button
                              type="button"
                              className="shop-list-buy-btn"
                              disabled={totalCoins < upgrade.costs[level]}
                              onClick={() => handleBuyUpgrade(upgrade.id)}
                            >
                              🐾 {upgrade.costs[level]}
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {showSettings && (
              <div className="settings-overlay">
                <div className="settings-panel" style={{ backgroundImage: `url(${ASSETS}/end_screen/popupPannel2.png)` }}>
                  <button
                    type="button"
                    className="close-btn settings-close-btn"
                    style={{ backgroundImage: `url(${ASSETS}/end_screen/closeBtn.png)` }}
                    onClick={() => setShowSettings(false)}
                    aria-label="Close settings"
                  />
                  <img className="settings-title" src={`${ASSETS}/ui/settings_label.png`} alt="Settings" />

                  <div className="settings-row">
                    <img className="settings-row-label" src={`${ASSETS}/ui/music_label.png`} alt="Music" />
                    <button
                      type="button"
                      className="settings-toggle"
                      style={{ backgroundImage: `url(${ASSETS}/ui/${musicEnabled ? 'on_btn' : 'off_btn'}.png)` }}
                      onClick={handleToggleMusic}
                      aria-label={`Music ${musicEnabled ? 'on' : 'off'}`}
                    />
                  </div>

                  <div className="settings-row">
                    <img className="settings-row-label" src={`${ASSETS}/ui/sounds_label.png`} alt="Sounds" />
                    <button
                      type="button"
                      className="settings-toggle"
                      style={{ backgroundImage: `url(${ASSETS}/ui/${soundEnabled ? 'on_btn' : 'off_btn'}.png)` }}
                      onClick={handleToggleSound}
                      aria-label={`Sounds ${soundEnabled ? 'on' : 'off'}`}
                    />
                  </div>

                  <button
                    type="button"
                    className="settings-action-btn"
                    style={{ backgroundImage: `url(${ASSETS}/ui/upgrades_btn.png)` }}
                    onClick={handleOpenUpgradesFromSettings}
                    aria-label="Upgrades"
                  />
                  <button
                    type="button"
                    className="settings-action-btn"
                    style={{ backgroundImage: `url(${ASSETS}/ui/achievements_btn.png)` }}
                    onClick={handleOpenAchievementsFromSettings}
                    aria-label="Achievements"
                  />
                  <button
                    type="button"
                    className="settings-action-btn"
                    style={{ backgroundImage: `url(${ASSETS}/ui/tutorialBtn.png)` }}
                    onClick={handleOpenTutorialFromSettings}
                    aria-label="How to Play"
                  />
                </div>
              </div>
            )}

            {showAchievements && (
              <div className="settings-overlay">
                <div className="achievements-panel" style={{ backgroundImage: `url(${ASSETS}/end_screen/popupPannel2.png)` }}>
                  <button
                    type="button"
                    className="close-btn settings-close-btn"
                    style={{ backgroundImage: `url(${ASSETS}/end_screen/closeBtn.png)` }}
                    onClick={() => setShowAchievements(false)}
                    aria-label="Close achievements"
                  />
                  <img className="settings-title" src={`${ASSETS}/ui/achievements_btn.png`} alt="Achievements" />

                  <div className="achievements-list">
                    {ACHIEVEMENTS.map((achievement) => {
                      const unlocked = achievement.isUnlocked()
                      return (
                        <div key={achievement.id} className={`achievement-item${unlocked ? ' achievement-unlocked' : ''}`}>
                          {achievement.icon.startsWith('/') ? (
                            <img className="achievement-icon" src={achievement.icon} alt="" />
                          ) : (
                            <span className="achievement-icon achievement-icon-emoji">{achievement.icon}</span>
                          )}
                          <div className="achievement-text">
                            <p className="achievement-title">{achievement.title}</p>
                            <p className="achievement-description">{achievement.description}</p>
                          </div>
                          <span className="achievement-status">{unlocked ? '✅' : '🔒'}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {showLeaderboard && (
              <div className="settings-overlay">
                <div className="leaderboard-panel" style={{ backgroundImage: `url(${ASSETS}/end_screen/popupPannel2.png)` }}>
                  <button
                    type="button"
                    className="close-btn settings-close-btn"
                    style={{ backgroundImage: `url(${ASSETS}/end_screen/closeBtn.png)` }}
                    onClick={() => setShowLeaderboard(false)}
                    aria-label="Close leaderboard"
                  />
                  <p className="leaderboard-title">Leaderboard</p>

                  {leaderboardStatus === 'loading' && <p className="leaderboard-empty">Loading...</p>}
                  {leaderboardStatus === 'error' && <p className="leaderboard-empty">Couldn't load leaderboard</p>}
                  {leaderboardStatus === 'loaded' && leaderboardEntries.length === 0 && (
                    <p className="leaderboard-empty">No scores yet - be the first!</p>
                  )}
                  {leaderboardStatus === 'loaded' && leaderboardEntries.length > 0 && (
                    <div className="leaderboard-list">
                      {leaderboardEntries.map((entry, index) => (
                        <div key={`${entry.name}-${entry.score}-${index}`} className="leaderboard-item">
                          <span className="leaderboard-rank">
                            {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                          </span>
                          <span className="leaderboard-score">{entry.score}</span>
                          <span className="leaderboard-name">{entry.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {showTutorial && (
              <div className="settings-overlay">
                <div className="tutorial-panel" style={{ backgroundImage: `url(${ASSETS}/end_screen/popupPannel2.png)` }}>
                  {!tutorialGatesPlay && (
                    <button
                      type="button"
                      className="close-btn settings-close-btn"
                      style={{ backgroundImage: `url(${ASSETS}/end_screen/closeBtn.png)` }}
                      onClick={handleCloseTutorial}
                      aria-label="Close tutorial"
                    />
                  )}
                  <p className="leaderboard-title">How to Play</p>

                  <div className="tutorial-list">
                    <div className="tutorial-item">
                      <span className="tutorial-icon">🖐️</span>
                      <p>Hold and drag anywhere to steer left or right</p>
                    </div>
                    <div className="tutorial-item">
                      <span className="tutorial-icon">🐾</span>
                      <p>Landing is automatic - just steer, the bounce takes care of itself</p>
                    </div>
                    <div className="tutorial-item">
                      <span className="tutorial-icon">⭐</span>
                      <p>Grab power-ups for rockets, shields, magnets, wings and parachutes</p>
                    </div>
                    <div className="tutorial-item">
                      <span className="tutorial-icon">🔥</span>
                      <p>Skip floors in one jump to build a COMBO multiplier</p>
                    </div>
                    <div className="tutorial-item">
                      <span className="tutorial-icon">⚠️</span>
                      <p>Watch out for spikes - a shield can save you from one hit</p>
                    </div>
                    <div className="tutorial-item">
                      <span className="tutorial-icon">🌫️</span>
                      <p>A dark storm rises from below - keep climbing or it'll catch you</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="tutorial-start-btn"
                    style={{ backgroundImage: `url(${ASSETS}/ui/gotitBtn.png)` }}
                    onClick={handleCloseTutorial}
                    aria-label={tutorialGatesPlay ? "Let's Go!" : 'Got it'}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {screen === 'game' && (
          <>
            <div className="hud">
              <div className="hud-score" style={{ backgroundImage: `url(${ASSETS}/ui/scorePanel.png)` }}>
                <span className="hud-value">{score}</span>
              </div>
              <div className="hud-best" style={{ backgroundImage: `url(${ASSETS}/ui/bestJumpPanel.png)` }}>
                <span className="hud-value">{best}</span>
              </div>
            </div>

            {!result && !pendingScore && (
              <button
                type="button"
                className="hud-pause-btn"
                style={{ backgroundImage: `url(${ASSETS}/start_screen/pauseBtn.png)` }}
                onClick={handlePause}
                aria-label="Pause"
              />
            )}

            <button
              type="button"
              className="hud-mute-btn"
              style={{
                backgroundImage: `url(${ASSETS}/start_screen/${soundEnabled ? 'soundOnBtn' : 'soundOffBtn'}.png)`,
              }}
              onClick={handleToggleSound}
              aria-label={`Sounds ${soundEnabled ? 'on' : 'off'}`}
            />

            {combo.combo > 0 && (
              <div className="combo-badge">
                🔥 COMBO x{combo.multiplier}
                <span className="combo-count">{combo.combo}</span>
              </div>
            )}

            {(powerups.rocket || powerups.shield || powerups.magnet || powerups.wings || powerups.parachute) && (
              <div className="powerup-status">
                {powerups.rocket && (
                  <span className="powerup-pill rocket">
                    <img src={`${ASSETS}/upgrades/rocket.png`} alt="" /> Rocket
                  </span>
                )}
                {powerups.shield && (
                  <span className="powerup-pill shield">
                    <img src={`${ASSETS}/upgrades/shield.png`} alt="" /> Shield
                  </span>
                )}
                {powerups.magnet && (
                  <span className="powerup-pill magnet">
                    <img src={`${ASSETS}/upgrades/magnet.png`} alt="" /> Magnet
                  </span>
                )}
                {powerups.wings && (
                  <span className="powerup-pill wings">
                    <img src={`${ASSETS}/upgrades/wings.png`} alt="" /> Wings
                  </span>
                )}
                {powerups.parachute && (
                  <span className="powerup-pill parachute">
                    <img src={`${ASSETS}/upgrades/parachute.png`} alt="" /> Parachute
                  </span>
                )}
              </div>
            )}

            {showPause && (
              <div className="settings-overlay">
                <div className="pause-panel" style={{ backgroundImage: `url(${ASSETS}/end_screen/popupPannel2.png)` }}>
                  <p className="leaderboard-title">Paused</p>
                  <button
                    type="button"
                    className="pause-resume-btn"
                    style={{ backgroundImage: `url(${ASSETS}/start_screen/playBtn.png)` }}
                    onClick={handleResume}
                    aria-label="Resume"
                  />
                  <button
                    type="button"
                    className="pause-home-btn"
                    style={{ backgroundImage: `url(${ASSETS}/start_screen/homeBtn.png)` }}
                    onClick={handleMainMenu}
                    aria-label="Main menu"
                  />
                </div>
              </div>
            )}

            <PhaserGame
              onReady={(game) => {
                gameRef.current = game
              }}
            />

            {result && (
              <div className="game-over-overlay">
                <div className="run-over-wrap">
                  <div
                    className="run-over-panel"
                    style={{ backgroundImage: `url(${ASSETS}/end_screen/runOverPanel.png)` }}
                  >
                    <span className="stat-value stat-height">{result.score}</span>
                    <span className="stat-value stat-coins">{result.coinsThisRun}</span>
                    <span className={`stat-value stat-best${result.isNewBest ? ' stat-best-new' : ''}`}>
                      {result.best}
                    </span>

                    <button
                      type="button"
                      className="close-btn"
                      style={{ backgroundImage: `url(${ASSETS}/end_screen/closeBtn.png)` }}
                      onClick={handleMainMenu}
                      aria-label="Main menu"
                    />
                  </div>

                  <button
                    type="button"
                    className="play-again-btn"
                    style={{ backgroundImage: `url(${ASSETS}/end_screen/playAgainBtn.png)` }}
                    onClick={handleRestart}
                    aria-label="Play again"
                  />
                </div>
              </div>
            )}

            {pendingScore !== null && (
              <div className="settings-overlay">
                <div className="nickname-panel" style={{ backgroundImage: `url(${ASSETS}/end_screen/popupPannel2.png)` }}>
                  <p className="leaderboard-title">Nice run!</p>
                  <p className="nickname-subtitle">Enter a name for the global leaderboard</p>
                  <input
                    type="text"
                    className="nickname-input"
                    value={nicknameInput}
                    onChange={(event) => setNicknameInput(event.target.value)}
                    placeholder="Your name"
                    maxLength={16}
                    autoFocus
                  />
                  <div className="nickname-actions">
                    <button
                      type="button"
                      className="nickname-btn nickname-btn-primary"
                      onClick={handleSubmitNickname}
                      disabled={!nicknameInput.trim()}
                    >
                      Submit
                    </button>
                    <button type="button" className="nickname-btn" onClick={handleSkipNickname}>
                      Skip
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default App
