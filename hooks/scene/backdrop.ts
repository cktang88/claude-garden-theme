// The backdrop: a sheet of warm paper. A faint dot grid, paper fibres and specks, a soft darkening toward the edges,
// and one pencil doodle in the lower right: a paper plane on a dashed loop, which flies while Claude works.
// Nothing here uses a filter, and all motion is plain CSS animation, the way the app's own example scenes move.

import { HEIGHT, WIDTH, hashUnit, round } from './kit'

export const PAPER = '#f3eee2'
export const GRAPHITE = '#4a443c'

type Point = readonly [number, number]
type Curve = readonly [Point, Point, Point, Point]

const LOOP = 'M0 0C-60 -70 -190 -80 -210 -10C-226 46 -150 70 -128 20C-104 -34 -196 -96 -330 -70'
const LOOP_CURVES: readonly Curve[] = [
  [[0, 0], [-60, -70], [-190, -80], [-210, -10]],
  [[-210, -10], [-226, 46], [-150, 70], [-128, 20]],
  [[-128, 20], [-104, -34], [-196, -96], [-330, -70]],
]

/** Where the plane is, and which way it faces, a share `t` of the way along one curve of the loop. */
function along(curve: Curve, t: number): { x: number; y: number; facing: number } {
  const [a, b, c, d] = curve
  const u = 1 - t
  const at = (axis: 0 | 1) => u * u * u * a[axis] + 3 * u * u * t * b[axis] + 3 * u * t * t * c[axis] + t * t * t * d[axis]
  const slope = (axis: 0 | 1) => 3 * u * u * (b[axis] - a[axis]) + 6 * u * t * (c[axis] - b[axis]) + 3 * t * t * (d[axis] - c[axis])
  return { x: at(0), y: at(1), facing: (Math.atan2(slope(1), slope(0)) * 180) / Math.PI + 180 }
}

/**
 * The plane's flight as plain keyframes of translate and rotate. The app lets a mod's picture move only when its
 * style calls no function outside a short list, and `path()` (so `offset-path`) is not on it.
 */
function flightKeyframes(): string {
  const stops = LOOP_CURVES.flatMap((curve, index) =>
    Array.from({ length: index === 0 ? 9 : 8 }, (_, step) => along(curve, (index === 0 ? step : step + 1) / 8)),
  )
  let flown = 0
  let facing = stops[0]?.facing ?? 0
  let last = stops[0]
  const marks = stops.map(stop => {
    flown += last ? Math.hypot(stop.x - last.x, stop.y - last.y) : 0
    facing += ((stop.facing - facing + 540) % 360) - 180
    last = stop
    return { x: stop.x, y: stop.y, flown, facing }
  })
  return marks
    .map(mark => `${round((mark.flown / flown) * 100)}%{transform:translate(${round(mark.x)}px,${round(mark.y)}px) rotate(${round(mark.facing)}deg)}`)
    .join('')
}

export function backdropStyle(): string {
  return `
.plane{animation:fly 9s linear infinite,fade 9s linear infinite;animation-delay:var(--at)}
.trail{stroke-dasharray:7 9;animation:trail 9s linear infinite;animation-delay:var(--at)}
@keyframes fly{${flightKeyframes()}}
@keyframes fade{0%{opacity:0}6%{opacity:1}88%{opacity:1}100%{opacity:0}}
@keyframes trail{to{stroke-dashoffset:-160}}`
}

export function backdropDefs(): string {
  let fibres = ''
  for (let index = 0; index < 70; index += 1) {
    const x = round(hashUnit(index, 1) * 180)
    const y = round(hashUnit(index, 2) * 180)
    const angle = hashUnit(index, 3) * Math.PI
    const length = 3 + hashUnit(index, 4) * 9
    fibres += `M${x} ${y}l${round(Math.cos(angle) * length)} ${round(Math.sin(angle) * length)}`
  }
  let specks = ''
  for (let index = 0; index < 90; index += 1) {
    specks += `<circle cx="${round(hashUnit(index, 5) * 180)}" cy="${round(hashUnit(index, 6) * 180)}" r="${round(0.4 + hashUnit(index, 7) * 0.7)}" fill="#8f8371" fill-opacity="${round(0.1 + hashUnit(index, 8) * 0.2)}"/>`
  }
  return (
    `<pattern id="dots" width="34" height="34" patternUnits="userSpaceOnUse"><circle cx="17" cy="17" r="1" fill="#b3a68e" fill-opacity=".5"/></pattern>` +
    `<pattern id="fibre" width="180" height="180" patternUnits="userSpaceOnUse"><path d="${fibres}" fill="none" stroke="#a39478" stroke-opacity=".22" stroke-width=".7"/>${specks}</pattern>` +
    `<radialGradient id="edges" cx=".5" cy=".45" r=".8"><stop offset=".55" stop-color="#c9b996" stop-opacity="0"/><stop offset="1" stop-color="#b9a680" stop-opacity=".4"/></radialGradient>`
  )
}

/** A folded paper plane, drawn in pencil about its nose, pointing left. */
function plane(): string {
  return (
    `<g fill="${PAPER}" stroke="${GRAPHITE}" stroke-width="1.6" stroke-linejoin="round">` +
    `<path d="M0 0L46 -16L34 2Z"/><path d="M0 0L34 2L40 16Z" fill="#e3dccb"/><path d="M34 2L46 -16L38 8Z" fill="#d6cdb9"/></g>`
  )
}

export function backdrop(isWorking: boolean): string {
  const loop = LOOP
  const doodle = isWorking
    ? `<path class="trail" d="${loop}" fill="none" stroke="${GRAPHITE}" stroke-opacity=".55" stroke-width="1.4" stroke-linecap="round"/><g class="plane">${plane()}</g>`
    : `<path d="${loop}" fill="none" stroke="${GRAPHITE}" stroke-opacity=".3" stroke-width="1.4" stroke-dasharray="7 9" stroke-linecap="round"/><g transform="translate(-330 -70) rotate(-12)">${plane()}</g>`
  return (
    `<rect width="${WIDTH}" height="${HEIGHT}" fill="${PAPER}"/>` +
    `<rect width="${WIDTH}" height="${HEIGHT}" fill="url(#dots)"/>` +
    `<rect width="${WIDTH}" height="${HEIGHT}" fill="url(#fibre)"/>` +
    `<rect width="${WIDTH}" height="${HEIGHT}" fill="url(#edges)"/>` +
    `<g transform="translate(1520 840)">${doodle}</g>`
  )
}
