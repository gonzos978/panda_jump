import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'

function load(path, extra = {}) {
  const source = fs.readFileSync(new URL('../' + path, import.meta.url), 'utf8')
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
  const exports = {}
  vm.runInNewContext(code, { exports, ...extra })
  return exports
}
const { createPokiBridge } = load('src/game/pokiBridge.ts')
test('loading and gameplay events are deduplicated across pause/resume', () => {
  const events = []
  const bridge = createPokiBridge(() => ({ gameLoadingFinished: () => events.push('loaded'), gameplayStart: () => events.push('start'), gameplayStop: () => events.push('stop') }))
  bridge.stop(); bridge.loadingFinished(); bridge.loadingFinished()
  bridge.start(); bridge.start(); bridge.stop(); bridge.stop(); bridge.start(); bridge.stop()
  assert.deepEqual(events, ['loaded', 'start', 'stop', 'start', 'stop'])
})
test('ad blocks gameplay events and failed ads allow play to resume', async () => {
  const events = []
  let finish
  const bridge = createPokiBridge(() => ({ gameplayStart: () => events.push('start'), gameplayStop: () => events.push('stop'), commercialBreak: callback => { callback(); return new Promise((_resolve, reject) => { finish = reject }) } }))
  bridge.start()
  const ad = bridge.commercialBreak(() => events.push('ad'))
  assert.equal(bridge.advertising, true)
  bridge.start(); bridge.stop()
  await bridge.commercialBreak(() => assert.fail('duplicate ad'))
  finish(new Error('ad blocker')); await ad
  assert.equal(bridge.advertising, false)
  bridge.start()
  assert.deepEqual(events, ['start', 'stop', 'ad', 'start'])
})
test('missing SDK never blocks play', async () => {
  const bridge = createPokiBridge(() => undefined)
  bridge.loadingFinished(); bridge.start(); bridge.stop()
  await bridge.commercialBreak(() => {})
  assert.equal(bridge.advertising, false)
})
test('blocked storage retains coins, upgrades and preferences for the session', () => {
  const blocked = { getItem() { throw Error('blocked') }, setItem() { throw Error('blocked') }, removeItem() { throw Error('blocked') } }
  const { safeStorage } = load('src/game/safeStorage.ts', { localStorage: blocked })
  assert.equal(safeStorage.isPersistent(), false)
  assert.equal(safeStorage.getItem('coins'), null)
  safeStorage.setItem('coins', '20'); safeStorage.setItem('upgrade', '2')
  assert.equal(safeStorage.getItem('coins'), '20'); assert.equal(safeStorage.getItem('upgrade'), '2')
})
test('Poki release contains no Firebase code or developer assets', () => {
  const dir = new URL('../dist-poki/assets/', import.meta.url)
  const scripts = fs.readdirSync(dir).filter(name => name.endsWith('.js'))
  assert.ok(scripts.length > 0)
  for (const name of scripts) {
    assert.doesNotMatch(name, /firebase/i)
    const code = fs.readFileSync(new URL(name, dir), 'utf8')
    assert.equal(/firestore.googleapis.com|identitytoolkit.googleapis.com|api-project-477028850280|Waterfall debug:|debugWaterfall/.test(code), false, 'external Firebase or debug code remains in ' + name)
  }
  assert.equal(fs.existsSync(new URL('bcg_layers/LayeredBackground.ts', dir)), false)
})
