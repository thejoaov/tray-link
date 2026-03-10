import React from 'react'
import { SwitchProps } from 'react-native'

export function Switch({ onValueChange, value, disabled }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      aria-disabled={disabled}
      disabled={disabled}
      onClick={() => {
        if (!disabled) {
          onValueChange?.(!value)
        }
      }}
      style={{
        width: 36,
        height: 20,
        borderRadius: 999,
        border: '1px solid rgba(255,255,255,0.14)',
        backgroundColor: value ? 'var(--accent-color, #3b82f6)' : 'rgba(255,255,255,0.12)',
        padding: 1,
        position: 'relative',
        transition: 'background-color 120ms ease, border-color 120ms ease, opacity 120ms ease',
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        boxShadow: value ? '0 0 0 1px rgba(59,130,246,0.18)' : 'none',
      }}
    >
      <span
        style={{
          display: 'block',
          width: 16,
          height: 16,
          borderRadius: 999,
          backgroundColor: '#fff',
          transform: value ? 'translateX(16px)' : 'translateX(0px)',
          transition: 'transform 120ms ease',
          boxShadow: '0 1px 2px rgba(0,0,0,0.24)',
        }}
      />
    </button>
  )
}
