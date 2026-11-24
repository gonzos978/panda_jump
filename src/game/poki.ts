import { IS_POKI } from './platform'
import { createPokiBridge, type PokiSDK } from './pokiBridge'
declare global { interface Window { PokiSDK?: PokiSDK } }
let sdk: PokiSDK | undefined
let initialization: Promise<void> | undefined
export const poki = createPokiBridge(() => sdk)

export function initializePoki(): Promise<void> {
  if (!IS_POKI) return Promise.resolve()
  if (initialization) return initialization
  initialization = new Promise<void>((resolve) => {
    const script = document.createElement('script')
    let settled = false
    const finish = () => { settled = true; clearTimeout(timeout); resolve() }
    const timeout = window.setTimeout(finish, 8000)
    script.src = 'https://game-cdn.poki.com/scripts/v2/poki-sdk.js'
    script.onload = () => {
      const candidate = window.PokiSDK
      if (!candidate) { finish(); return }
      candidate.init().then(() => { if (!settled) sdk = candidate; finish() }).catch(finish)
    }
    script.onerror = finish
    document.head.appendChild(script)
  })
  return initialization
}
