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
  /** What the garden grows from: a number fixed for the session, and how many turns the session has had. */
  seed: number
  turns: number
}

/** A fixed pseudo-random number from 0 to 1 for an index, so scattered marks land in the same place at every draw. */
export function hashUnit(index: number, salt: number): number {
  let value = (Math.imul(index, 374761393) + Math.imul(salt, 668265263)) | 0
  value = Math.imul(value ^ (value >>> 13), 1274126177)
  value ^= value >>> 16
  return (value >>> 0) / 4294967296
}

type Point = readonly [number, number]
export type Curve = readonly [Point, Point, Point, Point]

/** A point a share `t` of the way along a curve, and the way something travelling along it faces there (degrees). */
export function along(curve: Curve, t: number): { x: number; y: number; facing: number } {
  const [a, b, c, d] = curve
  const u = 1 - t
  const at = (axis: 0 | 1) => u * u * u * a[axis] + 3 * u * u * t * b[axis] + 3 * u * t * t * c[axis] + t * t * t * d[axis]
  const slope = (axis: 0 | 1) => 3 * u * u * (b[axis] - a[axis]) + 6 * u * t * (c[axis] - b[axis]) + 3 * t * t * (d[axis] - c[axis])
  return { x: at(0), y: at(1), facing: (Math.atan2(slope(1), slope(0)) * 180) / Math.PI + 180 }
}

export function round(value: number): number {
  return Math.round(value * 10) / 10
}
