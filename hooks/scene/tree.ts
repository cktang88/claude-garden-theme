// A tree at the very edge of the page, so only part of it is ever in view. It grows the way trees do and far more
// slowly than the flowers: a sapling in the first turns, a young tree that already stands well above the flowers by
// the time they are full grown, then a tall tree whose crown fills the corner, and in a very long session a trunk
// so big that its bark is all there is to see, the crown having grown up out of the window.

import { GRAPHITE } from './backdrop'
import { hashUnit, round } from './kit'

/** The tree is drawn in a box this wide and this high, standing on the box's bottom edge. */
export const TREE_ROOM = 1000
const GROUND = TREE_ROOM
const BARK = '#cdb497'
const SHADE = '#5f7a5a'
const LIGHT = '#869a68'
const FRUIT = '#b44a36'

export function treeStyle(): string {
  return `
.bough{animation:bough 11s ease-in-out infinite alternate;animation-delay:var(--at)}
@keyframes bough{from{transform:rotate(-.3deg)}to{transform:rotate(.3deg)}}`
}

/** How tall the tree stands after so many turns. It slows as it goes but never quite stops. */
function heightAfter(turns: number): number {
  return 90 + 2900 * (1 - Math.exp(-turns / 55))
}

type Limb = { x1: number; y1: number; x2: number; y2: number; width: number }
type Tip = { x: number; y: number; id: number }

/** Grows one limb up and out from `start`, then forks it, noting every limb drawn and every twig end reached. */
function grow(seed: number, start: Tip, angle: number, length: number, width: number, forksLeft: number, limbs: Limb[], tips: Tip[]): void {
  const x2 = start.x + Math.sin(angle) * length
  const y2 = start.y - Math.cos(angle) * length
  limbs.push({ x1: start.x, y1: start.y, x2, y2, width })
  if (forksLeft === 0) {
    tips.push({ x: x2, y: y2, id: start.id })
    return
  }
  const children = hashUnit(seed + start.id, 31) < 0.45 ? 3 : 2
  for (let child = 0; child < children; child += 1) {
    const id = start.id * 3 + child + 1
    const fan = (child - (children - 1) / 2) * 0.62 * (0.85 + hashUnit(seed + id, 32) * 0.5)
    // Limbs lean back toward upright a little, so the crown rounds over instead of fanning out flat.
    grow(seed, { x: x2, y: y2, id }, angle * 0.6 + fan, length * (0.66 + hashUnit(seed + id, 33) * 0.14), width * 0.6, forksLeft - 1, limbs, tips)
  }
  tips.push({ x: x2, y: y2, id: start.id + 500 })
}

/** A mass of foliage with a scalloped edge, and a few short strokes inside it for leaves. */
function foliage(seed: number, tip: Tip, radius: number): string {
  const bumps = 7
  const turn = hashUnit(seed + tip.id, 34) * 6
  let edge = ''
  for (let bump = 0; bump <= bumps; bump += 1) {
    const at = turn + (bump / bumps) * Math.PI * 2
    const x = round(tip.x + Math.cos(at) * radius)
    const y = round(tip.y + Math.sin(at) * radius * 0.86)
    const mid = at - Math.PI / bumps
    edge += bump === 0 ? `M${x} ${y}` : `Q${round(tip.x + Math.cos(mid) * radius * 1.32)} ${round(tip.y + Math.sin(mid) * radius * 1.14)} ${x} ${y}`
  }
  let marks = ''
  for (let mark = 0; mark < 4; mark += 1) {
    const x = tip.x + (hashUnit(seed + tip.id, 35 + mark) - 0.5) * radius * 1.1
    const y = tip.y + (hashUnit(seed + tip.id, 39 + mark) - 0.5) * radius * 0.9
    marks += `M${round(x)} ${round(y)}q${round(radius * 0.16)} ${round(-radius * 0.22)} ${round(radius * 0.36)} ${round(-radius * 0.06)}`
  }
  return `<path d="${edge}Z"/><path d="${marks}" fill="none" stroke-opacity=".45" stroke-width=".9"/>`
}

/** The first turns: one thin stem with a few pairs of leaves, and one more at the top. */
function sapling(rootX: number, height: number): string {
  let leaves = ''
  for (let pair = 1; pair <= 3; pair += 1) {
    const y = round(GROUND - (height * pair) / 3.4)
    const reach = round(height * 0.2 - pair * 3)
    leaves += `M${rootX} ${y}q${reach / 2} ${-reach * 0.7} ${reach} ${-reach * 0.3}q${-reach * 0.4} ${reach * 0.5} ${-reach} ${reach * 0.3}`
    leaves += `M${rootX} ${y}q${-reach / 2} ${-reach * 0.7} ${-reach} ${-reach * 0.3}q${reach * 0.4} ${reach * 0.5} ${reach} ${reach * 0.3}`
  }
  const top = round(GROUND - height)
  leaves += `M${rootX} ${top}q-9 -14 0 -26q9 12 0 26`
  return (
    `<path d="M${rootX} ${GROUND}Q${rootX + 4} ${round(GROUND - height / 2)} ${rootX} ${top}" fill="none" stroke="${GRAPHITE}" stroke-width="2.6" stroke-linecap="round"/>` +
    `<path d="${leaves}" fill="${LIGHT}" fill-opacity=".7" stroke="${GRAPHITE}" stroke-width="1.1" stroke-linejoin="round"/>`
  )
}

/**
 * The trunk from the ground to where it forks: wide where its roots spread, narrowing as it rises. Bark is drawn as
 * broken lines that follow the trunk up, with a knot here and there. Only what is on the page is drawn.
 */
function trunk(seed: number, rootX: number, girth: number, bole: number): string {
  const topWidth = girth * 0.62
  const widthAt = (up: number) => topWidth + (girth - topWidth) * (1 - up / bole) ** 1.6 + girth * 0.5 * Math.exp(-up / (bole * 0.05))
  const seen = Math.min(bole, GROUND + 40)
  let left = ''
  let right = ''
  for (let step = 0; step <= 12; step += 1) {
    const up = (seen * step) / 12
    left += `${step === 0 ? 'M' : 'L'}${round(rootX - widthAt(up) / 2)} ${round(GROUND - up)}`
    right = `L${round(rootX + widthAt(up) / 2)} ${round(GROUND - up)}` + right
  }
  const wood = `<path d="${left}${right}Z" fill="${BARK}" stroke="${GRAPHITE}" stroke-width="1.6" stroke-linejoin="round"/>`
  if (girth < 16) return wood

  let lines = ''
  const count = Math.floor(girth / 15)
  for (let line = 0; line < count; line += 1) {
    const across = (((line + 0.5) / count) * 2 - 1) * 0.84
    let up = girth * 0.25 + hashUnit(seed + line, 51) * 60
    for (let piece = 0; up < seen - 30; piece += 1) {
      const length = 46 + hashUnit(seed + line * 17 + piece, 52) * 110
      const from = rootX + (across * widthAt(up)) / 2
      const to = rootX + (across * widthAt(up + length)) / 2
      if (Math.min(from, to) > -4) {
        const wobble = (hashUnit(seed + line * 17 + piece, 53) - 0.5) * 9
        lines += `M${round(from)} ${round(GROUND - up)}Q${round((from + to) / 2 + wobble)} ${round(GROUND - up - length / 2)} ${round(to)} ${round(GROUND - up - length)}`
      }
      up += length + 14 + hashUnit(seed + line * 17 + piece, 54) * 34
    }
  }
  let knots = ''
  for (let knot = 0; knot < Math.floor(girth / 60); knot += 1) {
    const up = seen * (0.2 + hashUnit(seed + knot, 55) * 0.65)
    const x = rootX + ((hashUnit(seed + knot, 56) * 0.9 + 0.05) * widthAt(up)) / 2
    const size = girth * 0.06
    knots += `<ellipse cx="${round(x)}" cy="${round(GROUND - up)}" rx="${round(size)}" ry="${round(size * 1.5)}"/><ellipse cx="${round(x)}" cy="${round(GROUND - up)}" rx="${round(size * 0.45)}" ry="${round(size * 0.75)}"/>`
  }
  return (
    wood +
    `<path d="${lines}" fill="none" stroke="${GRAPHITE}" stroke-opacity=".5" stroke-width="1.2" stroke-linecap="round"/>` +
    `<g fill="none" stroke="${GRAPHITE}" stroke-opacity=".6" stroke-width="1.1">${knots}</g>`
  )
}

export function tree(seed: number, turns: number, rootX: number): string {
  const height = heightAfter(turns)
  if (height < 230) return sapling(rootX, height)

  const girth = 2 + height * 0.085
  const bole = height * 0.42
  const lean = (hashUnit(seed, 30) - 0.5) * 0.1
  const fork = { x: rootX + Math.sin(lean) * bole, y: GROUND - Math.cos(lean) * bole, id: 0 }
  const forks = height < 420 ? 1 : height < 800 ? 2 : 3
  const limbs: Limb[] = []
  const tips: Tip[] = []
  for (let limb = 0; limb < 3; limb += 1) {
    grow(seed, { ...fork, id: limb + 1 }, lean + (limb - 1) * 0.72, height * 0.2 * (limb === 1 ? 1.15 : 1), girth * 0.4, forks - 1, limbs, tips)
  }

  // Each limb is drawn twice, a dark line and a paler one inside it, so limbs join without a seam.
  // A limb sets off sideways and then turns up, as boughs do. Limbs wholly off the page are left out.
  const onPage = (limb: Limb) => Math.max(limb.y1, limb.y2) > -20 && Math.max(limb.x1, limb.x2) > -20
  const line = (limb: Limb) =>
    `M${round(limb.x1)} ${round(limb.y1)}Q${round(limb.x1 + (limb.x2 - limb.x1) * 0.7)} ${round(limb.y1 + (limb.y2 - limb.y1) * 0.3)} ${round(limb.x2)} ${round(limb.y2)}`
  const byWidth = new Map<number, string>()
  for (const limb of limbs.filter(onPage)) byWidth.set(round(limb.width), (byWidth.get(round(limb.width)) ?? '') + line(limb))
  let outlines = ''
  let wood = ''
  for (const [width, d] of byWidth) {
    outlines += `<path d="${d}" stroke="${GRAPHITE}" stroke-width="${round(width + 2.8)}"/>`
    wood += `<path d="${d}" stroke="${BARK}" stroke-width="${width}"/>`
  }
  const boughs = `<g fill="none" stroke-linecap="round">${outlines}${wood}</g>`

  const radius = height * 0.07
  let behind = ''
  let front = ''
  let fruit = ''
  tips.forEach((tip, order) => {
    const size = radius * (0.85 + hashUnit(seed + tip.id, 41) * 0.4)
    if (tip.y + size * 1.4 < 0 || tip.x + size * 1.4 < 0) return
    if (order % 3 === 0) behind += foliage(seed, { ...tip, y: tip.y - size * 0.2 }, size * 1.15)
    else front += foliage(seed, tip, size)
    if (height > 700 && hashUnit(seed + tip.id, 42) < 0.5) {
      fruit += `<circle cx="${round(tip.x + (hashUnit(seed + tip.id, 43) - 0.5) * size)}" cy="${round(tip.y + size * 0.45)}" r="6"/>`
    }
  })
  const leafy = (colour: string, body: string) => `<g fill="${colour}" fill-opacity=".9" stroke="${GRAPHITE}" stroke-width="1.2" stroke-linejoin="round">${body}</g>`
  const fruits = fruit === '' ? '' : `<g fill="${FRUIT}" fill-opacity=".85" stroke="${GRAPHITE}" stroke-width=".9">${fruit}</g>`
  const crown = `<g class="bough" style="transform-origin:${round(fork.x)}px ${round(fork.y)}px">${leafy(SHADE, behind)}${boughs}${leafy(LIGHT, front)}${fruits}</g>`

  return trunk(seed, rootX, girth, bole) + crown
}
