export interface PokiSDK {
  init(): Promise<void>
  gameLoadingFinished(): void
  gameplayStart(): void
  gameplayStop(): void
  commercialBreak(onStart: () => void): Promise<void>
}

// Explicit state prevents duplicate SDK events and events during an ad.
export function createPokiBridge(getSDK: () => PokiSDK | undefined) {
  let playing = false
  let loaded = false
  let advertising = false
  return {
    get advertising() { return advertising },
    loadingFinished() {
      if (loaded) return
      loaded = true
      getSDK()?.gameLoadingFinished()
    },
    start() {
      if (playing || advertising) return
      playing = true
      getSDK()?.gameplayStart()
    },
    stop() {
      if (!playing || advertising) return
      playing = false
      getSDK()?.gameplayStop()
    },
    async commercialBreak(onStart: () => void) {
      if (advertising) return
      this.stop()
      advertising = true
      try { await getSDK()?.commercialBreak(onStart) } catch {
        // Failed or blocked ads must never prevent a player from continuing.
      } finally { advertising = false }
    },
  }
}
