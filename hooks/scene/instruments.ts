// Four dials sketched on the paper in pencil, with calligraphy lettering, drawn from real session figures:
// how full the context window is (a wash of ink that rises), the turn (an hourglass, its time, its tool calls), the session's cost
// (or the rate limits, where the account has them), and a clock.
//
// All motion is plain CSS animation. The hooks redraw the picture when a turn starts, when it ends, and after tool
// calls. A redraw starts every animation again, so each one is told how far along it already is (`--at`, `--turn`).

import { type Stage, hashUnit, round } from './kit'

export type Figures = {
  contextPercent: number | null
  limits: readonly { kind: string; percentUsed: number }[]
  usd: number | null
}

/** The figures the backdrop showed at its last draw, which the wash and the cost glide on from. */
export type Previous = { contextPercent: number | null; usd: number | null }

const GRAPHITE = '#4a443c'
const INK = '#2b2620'
const SEPIA = '#8a4b2d'
const BLUE = '#3d6a96'
const OCHRE = '#b98a2c'
const RED = '#b44a36'
const SHEET = '#f8f4ea'
const SCRIPT = `'Snell Roundhand','Apple Chancery','Zapfino','Bradley Hand',cursive`

const SIZE = 124
const PITCH = 132
const RIGHT = 1452
const LEFT = RIGHT - PITCH
const TOP = 64

/**
 * The block is two by two, pinned to the top right. The app lets a mod's picture move only when its style holds no
 * `@media` rule other than prefers-reduced-motion, so the block does not restack for the window's shape.
 */
export function instrumentStyle(): string {
  return `
.wave{animation:wave 6s linear infinite;animation-delay:var(--at)}
.back{animation-duration:9s;animation-direction:reverse}
.hand{transform-origin:70px 70px;animation:spin 60s linear infinite}
.rise{animation:rise 1.8s cubic-bezier(.2,.8,.2,1) both}
.reel{animation:reel 1.6s cubic-bezier(.2,.8,.2,1) both}
@keyframes wave{from{transform:translateX(0)}to{transform:translateX(40px)}}
@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
@keyframes rise{from{transform:translateY(var(--from))}to{transform:translateY(0)}}
@keyframes reel{from{transform:translateY(var(--from))}to{transform:translateY(var(--to))}}
.tick{animation:tick 10s infinite;animation-delay:var(--turn)}
.sand{animation-duration:60s;animation-timing-function:linear;animation-iteration-count:infinite;animation-delay:var(--turn)}
.drain{animation-name:drain}.pile{animation-name:pile}.stream{animation-name:stream}.glass{animation-name:glass;transform-origin:70px 35px}
@keyframes tick{to{transform:translateY(var(--far))}}
@keyframes drain{0%{transform:translateY(0)}94%,100%{transform:translateY(10px)}}
@keyframes pile{0%{transform:translateY(0)}94%,100%{transform:translateY(-10px)}}
@keyframes stream{0%{stroke-dashoffset:0;opacity:1}93%{opacity:1}94%,100%{stroke-dashoffset:-200;opacity:0}}
@keyframes glass{0%,95%{transform:rotate(0deg)}100%{transform:rotate(180deg)}}`
}

function frame(slot: number, x: number, y: number, body: string): string {
  return `<g class="i${slot}"><svg x="${x}" y="${y}" width="${SIZE}" height="${SIZE}" viewBox="0 0 140 140" font-family="${SCRIPT}">${body}</svg></g>`
}

/** A dial's rim as a pencil would draw it: two passes that do not quite agree, the second lighter. */
function rim(): string {
  return (
    `<circle cx="70" cy="70" r="62" fill="${SHEET}" stroke="${GRAPHITE}" stroke-width="2.2"/>` +
    `<ellipse cx="70.8" cy="69.4" rx="63.4" ry="61.6" fill="none" stroke="${GRAPHITE}" stroke-opacity=".45" stroke-width="1.1" transform="rotate(-14 70 70)"/>` +
    `<ellipse cx="69.4" cy="70.6" rx="60.4" ry="61.8" fill="none" stroke="${GRAPHITE}" stroke-opacity=".3" stroke-width=".9" transform="rotate(31 70 70)"/>`
  )
}

function caption(text: string, y: number, colour = INK): string {
  return `<text x="70" y="${y}" text-anchor="middle" font-size="15" font-style="italic" fill="${colour}">${text}</text>`
}

function levelColour(percent: number): string {
  if (percent >= 85) return RED
  if (percent >= 60) return OCHRE
  return BLUE
}

/** Context: a wash of ink that fills the dial as the context window fills, and glides up from where it was. */
function context(figures: Figures, previous: number | null): string {
  const percent = figures.contextPercent
  const level = percent === null ? 0 : Math.max(0, Math.min(100, percent))
  const surface = round(128 - (level / 100) * 116)
  const wave = `M-80 ${surface}q10 -5 20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0V150H-80Z`
  const wash =
    percent === null
      ? ''
      : `<g clip-path="url(#washFace)"><g class="rise" style="--from:${round(((level - (previous ?? level)) / 100) * 116)}px">` +
        `<path class="wave" d="${wave}" fill="${levelColour(level)}" fill-opacity=".42"/>` +
        `<g transform="translate(11 5)"><path class="wave back" d="${wave}" fill="${levelColour(level)}" fill-opacity=".3"/></g></g></g>`
  return frame(
    1,
    LEFT,
    TOP,
    `<clipPath id="washFace"><circle cx="70" cy="70" r="60.5"/></clipPath>` +
      rim() +
      wash +
      `<circle cx="70" cy="70" r="62" fill="none" stroke="${GRAPHITE}" stroke-width="2.2"/>` +
      `<text x="70" y="80" text-anchor="middle" font-size="36" font-weight="700" fill="${INK}">${percent === null ? '--' : `${Math.round(level)}%`}</text>` +
      caption('context', 102),
  )
}

function face(): string {
  let ticks = ''
  for (let mark = 0; mark < 12; mark += 1) {
    const angle = (mark * Math.PI) / 6
    const inner = mark % 3 === 0 ? 46 : 50
    ticks += `M${round(70 + inner * Math.cos(angle))} ${round(70 + inner * Math.sin(angle))}L${round(70 + 56 * Math.cos(angle))} ${round(70 + 56 * Math.sin(angle))}`
  }
  return `<path d="${ticks}" stroke="${GRAPHITE}" stroke-width="1.6" stroke-linecap="round"/>`
}

/** One hand, set to its angle when the picture is drawn; a turning hand is then carried round by CSS at its own pace. */
function hand(angle: number, turnsIn: number | null, length: number, width: number, colour: string): string {
  const turning = turnsIn === null ? '' : `class="hand" style="animation-duration:${turnsIn}s" `
  return `<g transform="rotate(${round(angle)} 70 70)"><path ${turning}d="M70 78V${70 - length}" stroke="${colour}" stroke-width="${width}" stroke-linecap="round"/></g>`
}

function span(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`
}

const MOST_TALLIES = 20

/** Pencil tally marks in gates of five, centred on the dial: one mark for each tool call. */
function tallyMarks(count: number, y: number): string {
  if (count > MOST_TALLIES) {
    return `<text x="70" y="${y + 10}" text-anchor="middle" font-size="15" font-style="italic" fill="${INK}">${count} tools</text>`
  }
  const gates = Math.ceil(count / 5)
  const left = 70 - (gates * 14 + (gates - 1) * 5) / 2
  let strokes = ''
  for (let mark = 0; mark < count; mark += 1) {
    const gate = left + Math.floor(mark / 5) * 19
    const lean = round(hashUnit(mark, 11) * 1.6 - 0.8)
    strokes += mark % 5 === 4 ? `M${round(gate - 2)} ${y + 9}L${round(gate + 15)} ${y + 2}` : `M${round(gate + 1.5 + (mark % 5) * 3.6)} ${y}l${lean} 11`
  }
  return `<path d="${strokes}" fill="none" stroke="${GRAPHITE}" stroke-width="1.3" stroke-linecap="round"/>`
}

/** A small hourglass. While a turn runs its sand falls for a minute, then the glass turns over and it falls again. */
function hourglass(isRunning: boolean): string {
  const sand = `x="59" width="22" height="10" fill="${OCHRE}" fill-opacity=".75"`
  const falling = isRunning
    ? `<g clip-path="url(#bulbTop)"><rect class="sand drain" y="25" ${sand}/></g>` +
      `<path class="sand stream" d="M70 35V49" fill="none" stroke="${OCHRE}" stroke-width="1" stroke-dasharray="2 2"/>`
    : ''
  return (
    `<clipPath id="bulbTop"><path d="M61 20H79L70.8 34.4H69.2Z"/></clipPath><clipPath id="bulbBottom"><path d="M69.2 35.6H70.8L79 50H61Z"/></clipPath>` +
    `<g${isRunning ? ' class="sand glass"' : ''}>` +
    falling +
    `<g clip-path="url(#bulbBottom)"><rect${isRunning ? ' class="sand pile"' : ''} y="${isRunning ? 50 : 40}" ${sand}/></g>` +
    `<path d="M58 18.5H82M58 51.5H82" fill="none" stroke="${GRAPHITE}" stroke-width="2" stroke-linecap="round"/>` +
    `<path d="M60.5 19.5H79.5L71.2 35L79.5 50.5H60.5L68.8 35Z" fill="none" stroke="${GRAPHITE}" stroke-width="1.3" stroke-linejoin="round"/></g>`
  )
}

/**
 * The turn's running time as m:ss. Each digit is a strip of numbers behind a small window, and CSS steps the strip
 * along, so the time counts up without the picture being drawn again.
 */
function runningTime(size: number, baseline: number): string {
  const cell = size * 0.5
  const lineHeight = size + 6
  const reels = [
    { place: -1, faces: ['', '1', '2', '3', '4', '5', '6', '7', '8', '9'], seconds: 6000 },
    { place: 0, faces: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'], seconds: 600 },
    { place: 2, faces: ['0', '1', '2', '3', '4', '5'], seconds: 60 },
    { place: 3, faces: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'], seconds: 10 },
  ]
  const xOf = (place: number) => round(70 - 2 * cell + (place + 0.5) * cell)
  const look = `text-anchor="middle" font-size="${size}" font-weight="700" fill="${INK}"`
  let drawn = `<text x="${xOf(1)}" y="${baseline}" ${look}>:</text>`
  for (const reel of reels) {
    const x = xOf(reel.place)
    const strip = reel.faces.map((face, index) => `<tspan x="${x}" y="${baseline + index * lineHeight}">${face}</tspan>`).join('')
    drawn +=
      `<clipPath id="run${reel.place + 1}"><rect x="${round(x - cell / 2 - 1)}" y="${baseline - size + 3}" width="${round(cell + 2)}" height="${lineHeight - 2}"/></clipPath>` +
      `<g clip-path="url(#run${reel.place + 1})"><text class="tick" style="--far:-${reel.faces.length * lineHeight}px;animation-duration:${reel.seconds}s;animation-timing-function:steps(${reel.faces.length})" ${look}>${strip}</text></g>`
  }
  return drawn
}

/**
 * The turn dial. While a turn runs: an hourglass, the running time, and a tally mark for each tool call so far.
 * Between turns it rests on the last turn's time and tool calls.
 */
function turn(stage: Stage): string {
  const isRunning = stage.phase === 'engaged'
  const rest = stage.lastTurnSeconds > 0 ? span(stage.lastTurnSeconds) : '--'
  const time = isRunning ? runningTime(26, 80) : `<text x="70" y="80" text-anchor="middle" font-size="26" font-weight="700" fill="${INK}">${rest}</text>`
  const note = isRunning ? 'this turn' : stage.lastTurnSeconds > 0 ? 'last turn' : 'no turn yet'
  return frame(2, RIGHT, TOP, rim() + hourglass(isRunning) + time + tallyMarks(stage.total, 87) + caption(note, 114, isRunning ? SEPIA : INK))
}

/**
 * A number that rolls to its new value like an odometer: each digit is a strip of 0 to 9 behind a small window,
 * slid from the digit it showed before to the digit it shows now.
 */
function odometer(text: string, before: string, size: number, baseline: number): string {
  const cell = size * 0.5
  const lineHeight = size + 6
  const left = 70 - (text.length * cell) / 2
  const was = before.padStart(text.length, ' ').slice(-text.length)
  let drawn = ''
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index] ?? ''
    const x = round(left + (index + 0.5) * cell)
    if (!/[0-9]/.test(char)) {
      drawn += `<text x="${x}" y="${baseline}" text-anchor="middle" font-size="${size}" font-weight="700" fill="${INK}">${char}</text>`
      continue
    }
    const old = /[0-9]/.test(was[index] ?? '') ? Number(was[index]) : Number(char)
    const rest = -Number(char) * lineHeight
    let strip = ''
    for (let digit = 0; digit < 10; digit += 1) strip += `<tspan x="${x}" dy="${digit === 0 ? 0 : lineHeight}">${digit}</tspan>`
    drawn +=
      `<clipPath id="reel${index}"><rect x="${round(x - cell / 2 - 1)}" y="${baseline - size + 3}" width="${round(cell + 2)}" height="${lineHeight - 2}"/></clipPath>` +
      `<g clip-path="url(#reel${index})"><text class="reel" style="--from:${-old * lineHeight}px;--to:${rest}px;transform:translateY(${rest}px);animation-delay:${index * 90}ms" ` +
      `y="${baseline}" text-anchor="middle" font-size="${size}" font-weight="700" fill="${INK}">${strip}</text></g>`
  }
  return drawn
}

function cost(usd: number, previous: number | null): string {
  return frame(3, LEFT, TOP + PITCH, rim() + odometer(`$${usd.toFixed(2)}`, `$${(previous ?? usd).toFixed(2)}`, usd >= 100 ? 26 : 30, 80) + caption('session cost', 104))
}

function bar(y: number, name: string, percent: number): string {
  const level = Math.max(0, Math.min(100, percent))
  return (
    `<text x="24" y="${y + 9}" font-size="14" font-style="italic" fill="${INK}">${name}</text>` +
    `<rect x="52" y="${y}" width="64" height="10" rx="2" fill="none" stroke="${GRAPHITE}" stroke-width="1.4"/>` +
    `<rect x="53.5" y="${y + 1.5}" width="${round((level / 100) * 61)}" height="7" fill="${levelColour(level)}" fill-opacity=".55"/>`
  )
}

function limitOf(figures: Figures, kind: string): number {
  return figures.limits.find(limit => limit.kind === kind)?.percentUsed ?? 0
}

/** Rate limits, where the account has them: how much of the 5-hour and 7-day windows is used. */
function limits(figures: Figures): string {
  return frame(3, LEFT, TOP + PITCH, rim() + bar(48, '5h', limitOf(figures, 'five_hour')) + bar(70, '7d', limitOf(figures, 'seven_day')) + caption('limits used', 104))
}

/** The clock: the real local time of day. */
function clock(stage: Stage): string {
  const time = stage.daySeconds
  return frame(
    4,
    RIGHT,
    TOP + PITCH,
    rim() +
      face() +
      hand(((time % 43200) / 43200) * 360, 43200, 26, 3.2, INK) +
      hand(((time % 3600) / 3600) * 360, 3600, 40, 2.2, INK) +
      hand(((time % 60) / 60) * 360, 60, 47, 1.2, SEPIA) +
      `<circle cx="70" cy="70" r="3.4" fill="${INK}"/>`,
  )
}

export function instruments(stage: Stage, figures: Figures, previous: Previous): string {
  const third = figures.limits.length > 0 ? limits(figures) : figures.usd === null ? '' : cost(figures.usd, previous.usd)
  return context(figures, previous.contextPercent) + turn(stage) + third + clock(stage)
}
