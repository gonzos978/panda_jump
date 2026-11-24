import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import {
  equipJumpEffect,
  getEquippedJumpEffect,
  getJumpEffectAchievement,
  isJumpEffectUnlocked,
  JUMP_EFFECTS,
} from './game/jumpEffects'
import './PandaCollection.css'

export function PandaCollection({ onClose }: { onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const closeButton = useRef<HTMLButtonElement>(null)
  const [equipped, setEquipped] = useState(getEquippedJumpEffect)
  const [preview, setPreview] = useState(equipped)
  const unlockedCount = JUMP_EFFECTS.filter(isJumpEffectUnlocked).length
  const unlocked = isJumpEffectUnlocked(preview)
  const color = preview.color === null ? '#a5b9a7' : '#' + preview.color.toString(16).padStart(6, '0')

  useEffect(() => {
    const modal = dialog.current
    if (!modal) return
    const trigger = document.activeElement
    modal.showModal()
    closeButton.current?.focus()
    return () => {
      modal.close()
      if (trigger instanceof HTMLElement) trigger.focus()
    }
  }, [])

  return (
    <dialog
      ref={dialog}
      className="panda-collection"
      aria-labelledby="collection-title"
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
    >
      <button ref={closeButton} type="button" className="collection-close" onClick={onClose} aria-label="Close collection" />
      <header className="collection-header">
        <h2 id="collection-title">Panda Collection</h2>
        <p>{unlockedCount} / {JUMP_EFFECTS.length} jump effects unlocked</p>
      </header>

      <div className="collection-preview" style={{ '--effect-color': color } as CSSProperties}>
        <div className="collection-stage" aria-hidden="true">
          <div className="collection-panda" />
          {preview.color !== null && (
            <div key={preview.id} className="collection-sparks"><i /><i /><i /><i /><i /></div>
          )}
        </div>
        <div className="collection-selection">
          <h3>{preview.name}</h3>
          {unlocked ? (
            <button
              type="button"
              className="collection-equip"
              disabled={preview.id === equipped.id}
              onClick={() => {
                equipJumpEffect(preview)
                setEquipped(getEquippedJumpEffect())
              }}
            >
              {preview.id === equipped.id ? 'Equipped' : 'Equip effect'}
            </button>
          ) : (
            <p>{getJumpEffectAchievement(preview)?.description}</p>
          )}
        </div>
      </div>

      <ul className="collection-list" aria-label="Jump effects">
        {JUMP_EFFECTS.map((effect) => {
          const status = effect.id === equipped.id ? 'Equipped' : isJumpEffectUnlocked(effect) ? 'Unlocked' : 'Locked'
          return (
            <li key={effect.id}>
              <button
                type="button"
                className="collection-item"
                aria-pressed={effect.id === preview.id}
                onClick={() => setPreview(effect)}
              >
                <span
                  aria-hidden="true"
                  className="collection-swatch"
                  style={{ color: effect.color === null ? '#a5b9a7' : '#' + effect.color.toString(16).padStart(6, '0') }}
                >{effect.color === null ? '●' : '✦'}</span>
                <strong>{effect.name}</strong>
                <span className="collection-status">{status}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </dialog>
  )
}
