// Shared by every part of the scene: the sheet's size and small drawing helpers.

export const WIDTH = 1600
export const HEIGHT = 1000

/**
 * What the scene is drawn from: the time (seconds), the local time of day (seconds), whether Claude is working, how
 * far into the turn it is (seconds), and the turn's tool calls (`total`: this turn's while working, the last turn's
 * otherwise).
 */
export type Stage = {
  now: number
  daySeconds: number
  lastTurnSeconds: number
  turnSeconds: number
  phase: 'standby' | 'engaged'
  total: number
}

/** A fixed pseudo-random number from 0 to 1 for an index, so scattered marks land in the same place at every draw. */
export function hashUnit(index: number, salt: number): number {
  let value = (Math.imul(index, 374761393) + Math.imul(salt, 668265263)) | 0
  value = Math.imul(value ^ (value >>> 13), 1274126177)
  value ^= value >>> 16
  return (value >>> 0) / 4294967296
}

export function round(value: number): number {
  return Math.round(value * 10) / 10
}
