// The backdrop: a sheet of plain cream paper with a soft darkening toward the edges,
// and one pencil doodle: a paper plane that keeps flying across the top of the sheet.
// Nothing here uses a filter, and all motion is plain CSS animation, the way the app's own example scenes move.

import { type Curve, HEIGHT, WIDTH, along, round } from './kit'

export const PAPER = '#f3eee2'
export const GRAPHITE = '#4a443c'

/** The plane's way across the top of the sheet, right to left: it comes in under the dials, climbs, loops once and flies off. */
const FLIGHT: readonly Curve[] = [
  [[1660, 400], [1500, 420], [1380, 300], [1240, 190]],
  [[1240, 190], [1120, 100], [980, 90], [900, 150]],
  [[900, 150], [840, 200], [860, 270], [920, 262]],
  [[920, 262], [990, 250], [960, 130], [840, 120]],
  [[840, 120], [640, 100], [420, 220], [200, 160]],
  [[200, 160], [100, 135], [20, 150], [-60, 170]],
]

function pathOf(curves: readonly Curve[]): string {
  const start = curves[0]?.[0] ?? [0, 0]
  return `M${start[0]} ${start[1]}` + curves.map(([, b, c, d]) => `C${b[0]} ${b[1]} ${c[0]} ${c[1]} ${d[0]} ${d[1]}`).join('')
}

/**
 * The plane's flight as plain keyframes of translate and rotate. The app lets a mod's picture move only when its
 * style calls no function outside a short list, and `path()` (so `offset-path`) is not on it.
 */
function flightKeyframes(): string {
  const stops = FLIGHT.flatMap((curve, index) =>
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
.plane{animation:fly 18s linear infinite,fade 18s linear infinite;animation-delay:var(--at)}
.trail{stroke-dasharray:7 9;animation:trail 18s linear infinite;animation-delay:var(--at)}
@keyframes fly{${flightKeyframes()}}
@keyframes fade{0%{opacity:0}4%{opacity:1}94%{opacity:1}100%{opacity:0}}
@keyframes trail{to{stroke-dashoffset:-320}}`
}

export function backdropDefs(): string {
  return `<radialGradient id="edges" cx=".5" cy=".45" r=".8"><stop offset=".6" stop-color="#d9c9a6" stop-opacity="0"/><stop offset="1" stop-color="#c9b78f" stop-opacity=".3"/></radialGradient>`
}

/** A folded paper plane, drawn in pencil about its nose, pointing left. */
function plane(): string {
  return (
    `<g fill="${PAPER}" stroke="${GRAPHITE}" stroke-width="1.6" stroke-linejoin="round">` +
    `<path d="M0 0L46 -16L34 2Z"/><path d="M0 0L34 2L40 16Z" fill="#e3dccb"/><path d="M34 2L46 -16L38 8Z" fill="#d6cdb9"/></g>`
  )
}

export function backdrop(): string {
  return (
    `<rect width="${WIDTH}" height="${HEIGHT}" fill="${PAPER}"/>` +
    `<rect width="${WIDTH}" height="${HEIGHT}" fill="url(#edges)"/>` +
    `<path class="trail" d="${pathOf(FLIGHT)}" fill="none" stroke="${GRAPHITE}" stroke-opacity=".3" stroke-width="1.4" stroke-linecap="round"/><g class="plane">${plane()}</g>`
  )
}
