// Pencil gardens along the bottom, one in each corner, grown from a seed: flowers, ferns and clumps of broad leaves.
// Every session gets its own plants. A session starts with two seedlings in each bed. As the turns go by those
// grow up, their buds open and the oldest put out a side shoot, and meanwhile new seedlings keep coming up among
// them, so the garden gets fuller as well as taller. They sway slowly.
// The app's sidebar covers the window's left edge, so the left bed runs on past it into the gutter beside the chat.
// Plants get shorter toward the chat.
// The idea is from Kevin Raymond's florilegium (procedural flowers for LaTeX page margins); none of its code is used.

import { GRAPHITE } from './backdrop'
import { type Curve, along, hashUnit, round } from './kit'

/** A bed of plants: how wide it is (in a box 1000 high), how many plants it holds, and what share of them flower. */
export type Bed = { width: number; plants: number; flowerShare: number }
export const LEFT_BED: Bed = { width: 620, plants: 12, flowerShare: 0.5 }
export const RIGHT_BED: Bed = { width: 400, plants: 8, flowerShare: 0.8 }

const GROUND = 1000
const WASHES = ['#8a4b2d', '#3d6a96', '#b98a2c', '#b44a36']
const GREENS = ['#6f8355', '#7f8f5e', '#5f7a5a']
const OCHRE = '#b98a2c'

export function gardenStyle(): string {
  return `
.sway{animation:sway 9s ease-in-out infinite alternate;animation-delay:var(--at)}
@keyframes sway{from{transform:rotate(-1.2deg)}to{transform:rotate(1.2deg)}}`
}

/** A fixed number from 0 to 1 for one choice about one plant, so a seed always grows the same garden. */
function chance(seed: number, index: number, choice: number): number {
  return hashUnit(seed * 97 + index, choice)
}

function pick<T>(list: readonly T[], share: number, fallback: T): T {
  return list[Math.floor(share * list.length)] ?? fallback
}

type Leaf = { x: number; y: number; angle: number; length: number; plump: number; hasRib: boolean }

/**
 * One almond-shaped leaf growing out of (x, y) at `angle` degrees. `plump` is its width as a share of its length.
 * It carries no colour of its own: `foliage` gives a plant's leaves their look once, which keeps the picture small.
 */
function leaf({ x, y, angle, length, plump, hasRib }: Leaf): string {
  const half = round(length / 2)
  const belly = round(length * plump)
  const rib = hasRib ? `M0 0L${round(length * 0.82)} 0` : ''
  return `<path transform="translate(${round(x)} ${round(y)}) rotate(${round(angle)})" d="M0 0Q${half} ${-belly} ${round(length)} 0Q${half} ${belly} 0 0Z${rib}"/>`
}

function foliage(green: string, leaves: string): string {
  return `<g fill="${green}" fill-opacity=".42" stroke="${GRAPHITE}" stroke-width="1.2" stroke-linejoin="round">${leaves}</g>`
}

function daisy(wash: string): string {
  let petals = ''
  for (let petal = 0; petal < 10; petal += 1) petals += `<ellipse cx="12" cy="0" rx="10" ry="4" transform="rotate(${petal * 36})"/>`
  return `<g fill="${wash}" fill-opacity=".45" stroke="${GRAPHITE}" stroke-width=".7">${petals}<circle r="5" fill="${OCHRE}" fill-opacity=".9"/></g>`
}

function tulip(wash: string): string {
  return `<path d="M-9 0C-15 -12 -11 -22 -10 -28L-4 -19L0 -30L4 -19L10 -28C11 -22 15 -12 9 0Q0 6 -9 0Z" fill="${wash}" fill-opacity=".5" stroke="${GRAPHITE}" stroke-width=".8" stroke-linejoin="round"/>`
}

function umbel(wash: string): string {
  let spokes = ''
  let heads = ''
  for (let spoke = 0; spoke < 9; spoke += 1) {
    const angle = ((-160 + spoke * 17.5) * Math.PI) / 180
    const reach = spoke % 2 === 0 ? 24 : 18
    const x = round(Math.cos(angle) * reach)
    const y = round(Math.sin(angle) * reach)
    spokes += `M0 0L${x} ${y}`
    heads += `<circle cx="${x}" cy="${y}" r="4.2"/>`
  }
  return `<path d="${spokes}" fill="none" stroke="${GRAPHITE}" stroke-width=".6"/><g fill="${wash}" fill-opacity=".55" stroke="${GRAPHITE}" stroke-width=".6">${heads}</g>`
}

function bud(green: string): string {
  return `<path d="M0 0C-7 -6 -5 -15 0 -20C5 -15 7 -6 0 0Z" fill="${green}" fill-opacity=".5" stroke="${GRAPHITE}" stroke-width=".8"/>`
}

/** A spike of small florets up the last stretch of the stem, as lavender or a foxglove has. */
function spike(wash: string): string {
  let florets = ''
  for (let step = 0; step < 9; step += 1) {
    const y = round(14 - step * 6.5)
    const size = round(5.2 - step * 0.38)
    const x = round((step % 2 === 0 ? -1 : 1) * size * 0.8)
    florets += `<ellipse cx="${x}" cy="${y}" rx="${size}" ry="${round(size * 0.62)}" transform="rotate(${x < 0 ? 28 : -28} ${x} ${y})"/>`
  }
  return `<path d="M0 16V-40" fill="none" stroke="${GRAPHITE}" stroke-width=".7"/><g fill="${wash}" fill-opacity=".55" stroke="${GRAPHITE}" stroke-width=".6">${florets}</g>`
}

/** Bells hanging from a stalk that arches over, as a bluebell's do. */
function bells(wash: string): string {
  const hung = [[3, -14], [9, -25], [17, -31], [26, -34]]
    .map(([x, y]) => `<path transform="translate(${x} ${y})" d="M0 0V3M-3.5 3C-5 8 -6 12 -6.5 15L-3 13L0 16L3 13L6.5 15C6 12 5 8 3.5 3Z"/>`)
    .join('')
  return `<path d="M0 0C0 -22 10 -34 27 -34" fill="none" stroke="${GRAPHITE}" stroke-width=".8"/><g fill="${wash}" fill-opacity=".55" stroke="${GRAPHITE}" stroke-width=".6" stroke-linejoin="round">${hung}</g>`
}

/** A globe of tiny flowers on a bare stem, as an allium has. */
function globe(wash: string): string {
  let dots = '<circle cx="0" cy="-13" r="3"/>'
  for (let dot = 0; dot < 16; dot += 1) {
    const ring = dot < 10 ? 11.5 : 5.8
    const angle = (dot / (dot < 10 ? 10 : 6)) * Math.PI * 2
    dots += `<circle cx="${round(Math.cos(angle) * ring)}" cy="${round(-13 + Math.sin(angle) * ring)}" r="3"/>`
  }
  return `<g fill="${wash}" fill-opacity=".5" stroke="${GRAPHITE}" stroke-width=".5">${dots}</g>`
}

/** A poppy: four broad petals round a dark middle. */
function poppy(wash: string): string {
  let petals = ''
  for (let petal = 0; petal < 4; petal += 1) petals += `<ellipse cx="0" cy="-9" rx="10.5" ry="9.5" transform="rotate(${petal * 90 + 20})"/>`
  return `<g fill="${wash}" fill-opacity=".5" stroke="${GRAPHITE}" stroke-width=".7">${petals}<circle r="4" fill="${GRAPHITE}" fill-opacity=".8"/></g>`
}

/** A cluster of small five-petalled flowers, as forget-me-nots grow. */
function starCluster(wash: string): string {
  let cluster = ''
  for (const [x, y] of [[0, -6], [-11, 0], [10, 2], [-3, 9]]) {
    let petals = ''
    for (let petal = 0; petal < 5; petal += 1) {
      const angle = (petal / 5) * Math.PI * 2
      petals += `<circle cx="${round((x ?? 0) + Math.cos(angle) * 3.7)}" cy="${round((y ?? 0) + Math.sin(angle) * 3.7)}" r="2.7"/>`
    }
    cluster += `${petals}<circle cx="${x}" cy="${y}" r="1.6" fill="${OCHRE}" fill-opacity="1"/>`
  }
  return `<g fill="${wash}" fill-opacity=".6" stroke="${GRAPHITE}" stroke-width=".5">${cluster}</g>`
}

/** A sunflower: a wide brown middle and a ring of long yellow petals, whatever colour its neighbours are. */
function sunflower(): string {
  let petals = ''
  for (let petal = 0; petal < 14; petal += 1) petals += `<ellipse cx="14" cy="0" rx="8" ry="3.3" transform="rotate(${round(petal * (360 / 14))})"/>`
  return `<g fill="${OCHRE}" fill-opacity=".6" stroke="${GRAPHITE}" stroke-width=".6">${petals}<circle r="8" fill="#8a4b2d" fill-opacity=".8"/></g>`
}

const BLOOMS: readonly ((wash: string) => string)[] = [daisy, tulip, umbel, spike, bells, globe, poppy, starCluster, sunflower]

/** One plant's place: `grown` is how far along it is (0 to 1), and `size` is that made smaller toward the chat. */
type Plot = { seed: number; index: number; rootX: number; grown: number; size: number; green: string }

function swaying(plot: Plot, body: string): string {
  return `<g class="sway" style="transform-origin:${round(plot.rootX)}px ${GROUND}px;animation-duration:${7 + Math.floor(chance(plot.seed, plot.index, 8) * 5)}s">${body}</g>`
}

function stemOf(plot: Plot, height: number, lean: number): { curve: Curve; drawn: string } {
  const { rootX } = plot
  const curve: Curve = [
    [rootX, GROUND],
    [rootX + lean * 0.05, GROUND - height * 0.45],
    [rootX + lean * 0.65, GROUND - height * 0.75],
    [rootX + lean, GROUND - height],
  ]
  const drawn = `<path d="M${curve.map(([x, y], at) => `${at === 1 ? 'C' : ''}${round(x)} ${round(y)}`).join(' ')}" fill="none" stroke="${GRAPHITE}" stroke-width="2.2" stroke-linecap="round"/>`
  return { curve, drawn }
}

/** One flowering stem: pairs of leaves up it and a bloom at its tip, or a bud until it is nearly full grown. */
function stalk(plot: Plot, order: number, bloom: string): string {
  const { seed, index, size, green } = plot
  const height = (150 + chance(seed, index, 2) * 190) * size * (1 - order * 0.2)
  const rooted = { ...plot, rootX: plot.rootX + order * 13 * (order % 2 === 0 ? 1 : -1) }
  const { curve, drawn } = stemOf(rooted, height, (chance(seed, index * 7 + order, 3) - 0.4) * 110 * size)

  let leaves = ''
  const pairs = Math.floor(height / (order === 0 ? 50 : 85))
  for (let step = 1; step <= pairs; step += 1) {
    const share = (step / (pairs + 1)) * 0.9
    const spot = along(curve, share)
    for (const side of [-1, 1]) {
      const length = (34 + chance(seed, index * 31 + step, 4 + side) * 18) * (1 - share * 0.4) * Math.min(1, size + 0.2)
      leaves += leaf({ x: spot.x, y: spot.y, angle: spot.facing - 180 + side * (52 + chance(seed, index * 31 + step, 6 + side) * 18), length, plump: 0.3, hasRib: true })
    }
  }

  const tip = along(curve, 1)
  const scale = (1.5 + chance(seed, index, 9) * 1.2) * (1 - order * 0.12)
  const head = `<g transform="translate(${round(tip.x)} ${round(tip.y)}) rotate(${round(tip.facing - 90)}) scale(${round(scale)})">${plot.grown >= 0.8 ? bloom : bud(green)}</g>`
  const shoot = order === 0 && plot.grown >= 0.95 ? sideShoot(plot, curve, bloom) : ''
  return drawn + foliage(green, leaves) + shoot + head
}

/**
 * A flower plant: one kind of bloom, on one to three stems that share a foot, with big leaves at the ground.
 * Which bloom, what colour, how large and how many stems all come from the seed.
 */
function flower(plot: Plot): string {
  const { seed, index, rootX, size, green } = plot
  const bloom = pick(BLOOMS, chance(seed, index, 7), daisy)(pick(WASHES, chance(seed, index, 6), OCHRE))
  const share = chance(seed, index, 19)
  const stems = share < 0.45 ? 1 : share < 0.8 ? 2 : 3

  let basal = ''
  for (const side of [-1, 1]) {
    basal += leaf({ x: rootX, y: GROUND, angle: -90 + side * (38 + chance(seed, index, 12 + side) * 22), length: (70 + chance(seed, index, 14 + side) * 50) * size, plump: 0.24, hasRib: true })
  }
  let stalks = ''
  for (let order = stems - 1; order >= 0; order -= 1) stalks += stalk(plot, order, bloom)
  return swaying(plot, foliage(green, basal) + stalks)
}

/** A short shoot off the middle of a full-grown flower's stem, with a smaller bloom of its own. */
function sideShoot(plot: Plot, curve: Curve, bloom: string): string {
  const from = along(curve, 0.55)
  const side = chance(plot.seed, plot.index, 18) < 0.5 ? -1 : 1
  const angle = ((from.facing - 180 + side * 42) * Math.PI) / 180
  const reach = 52 * plot.size
  const x = round(from.x + Math.cos(angle) * reach)
  const y = round(from.y + Math.sin(angle) * reach)
  return (
    `<path d="M${round(from.x)} ${round(from.y)}Q${round(from.x + Math.cos(angle) * reach * 0.6)} ${round(from.y)} ${x} ${y}" fill="none" stroke="${GRAPHITE}" stroke-width="1.5" stroke-linecap="round"/>` +
    `<g transform="translate(${x} ${y}) rotate(${round(from.facing - 90 + side * 30)}) scale(1.2)">${bloom}</g>`
  )
}

/** A fern: one arching stem with a leaflet on each side all the way up, longest in the middle. */
function fern(plot: Plot): string {
  const { seed, index, size, green } = plot
  const height = (170 + chance(seed, index, 2) * 150) * size
  const { curve, drawn } = stemOf(plot, height, (chance(seed, index, 3) - 0.5) * 200 * size)
  const pairs = Math.floor(height / 15)
  let leaflets = ''
  for (let step = 1; step <= pairs; step += 1) {
    const share = step / (pairs + 1)
    const spot = along(curve, share)
    const length = 46 * size * (0.3 + 0.7 * Math.sin(Math.PI * Math.sqrt(share)))
    for (const side of [-1, 1]) {
      leaflets += leaf({ x: spot.x, y: spot.y, angle: spot.facing - 180 + side * 62, length, plump: 0.2, hasRib: false })
    }
  }
  return swaying(plot, drawn + foliage(green, leaflets))
}

/** A clump of broad leaves fanning out from the ground. */
function clump(plot: Plot): string {
  const { seed, index, rootX, size, green } = plot
  const count = 5 + Math.floor(chance(seed, index, 2) * 2)
  let leaves = ''
  for (let blade = 0; blade < count; blade += 1) {
    const spread = -90 + (blade - (count - 1) / 2) * 24 + (chance(seed, index * 31 + blade, 3) - 0.5) * 12
    leaves += leaf({ x: rootX, y: GROUND, angle: spread, length: (110 + chance(seed, index * 31 + blade, 4) * 80) * size, plump: 0.17, hasRib: true })
  }
  return swaying(plot, foliage(green, leaves))
}

function grass(seed: number, width: number): string {
  let blades = ''
  for (let blade = 0; blade < width / 20 - 1; blade += 1) {
    const x = round(14 + blade * 20 + chance(seed, blade, 9) * 10)
    const height = round(16 + chance(seed, blade, 10) * 26)
    const bend = round((chance(seed, blade, 11) - 0.5) * 16)
    blades += `M${x} ${GROUND}q${round(bend / 3)} ${-round(height / 2)} ${bend} ${-height}`
  }
  return `<path d="${blades}" fill="none" stroke="${GRAPHITE}" stroke-opacity=".7" stroke-width="1.1" stroke-linecap="round"/>`
}

/**
 * One bed. Plants come up in a fixed, scattered order: two at the start of a session, then another every turn or
 * two. Each takes about ten turns from seedling to full grown.
 * Foliage is drawn first and the flowers over it. `fewer` leaves out that many of the last plants to come up.
 */
export function garden(seed: number, turns: number, bed: Bed, fewer = 0): string {
  let greenery = ''
  let flowers = ''
  for (let index = 0; index < bed.plants; index += 1) {
    const rank = (index * 5) % bed.plants
    const sproutedAt = rank < 2 ? 0 : (rank - 1) * 1.3
    if (turns < sproutedAt || rank >= bed.plants - fewer) continue
    const grown = Math.min(1, 0.12 + (turns - sproutedAt) * 0.09)
    const plot: Plot = {
      seed,
      index,
      // Each plant has a strip of the bed to itself and stands anywhere across it, so no two gardens line up alike.
      rootX: 22 + (index + chance(seed, index, 1) * 0.9) * ((bed.width - 50) / bed.plants),
      grown,
      size: grown * (1 - (index / bed.plants) * 0.3),
      green: pick(GREENS, chance(seed, index, 16), '#6f8355'),
    }
    const kind = chance(seed, index, 17)
    if (kind < bed.flowerShare || index % 4 === 1) flowers += flower(plot)
    else if (kind < bed.flowerShare + (1 - bed.flowerShare) / 2) greenery += fern(plot)
    else greenery += clump(plot)
  }
  return grass(seed, bed.width) + greenery + flowers
}
