// Small things a garden has, drawn in pencil with a wash of colour: a picket fence, a watering can, a birdhouse with
// a bird on it, mushrooms, a snail and a butterfly.
// Each is drawn standing on the ground at `x`.

import { GRAPHITE } from './backdrop'

const GROUND = 1000
const SHEET = '#f8f4ea'
const BLUE = '#3d6a96'
const RED = '#b44a36'
const SEPIA = '#8a4b2d'
const OCHRE = '#b98a2c'
const PENCIL = `stroke="${GRAPHITE}" stroke-width="1.3" stroke-linejoin="round" stroke-linecap="round"`

export function propStyle(): string {
  return `
.flit{animation:flit 14s ease-in-out infinite alternate;animation-delay:var(--at)}
.flap{animation:flap .35s ease-in-out infinite alternate;animation-delay:var(--at)}
@keyframes flit{0%{transform:translate(0,0)}25%{transform:translate(46px,-34px)}50%{transform:translate(104px,8px)}75%{transform:translate(150px,-52px)}100%{transform:translate(196px,-10px)}}
@keyframes flap{from{transform:scaleX(1)}to{transform:scaleX(.25)}}`
}

function standing(x: number, body: string): string {
  return `<g transform="translate(${x} ${GROUND})" ${PENCIL}>${body}</g>`
}

export function fence(from: number, to: number): string {
  let pickets = ''
  for (let x = from; x <= to - 12; x += 24) pickets += `M${x} ${GROUND}V${GROUND - 62}l6 -9l6 9V${GROUND}Z`
  return (
    `<path d="M${from - 6} ${GROUND - 46}H${to + 6}M${from - 6} ${GROUND - 18}H${to + 6}" fill="none" stroke="${GRAPHITE}" stroke-width="3" stroke-linecap="round"/>` +
    `<path d="${pickets}" fill="${SHEET}" ${PENCIL}/>`
  )
}

export function wateringCan(x: number): string {
  return standing(
    x,
    `<path d="M-2 -36C-26 -40 -26 -8 -1 -10M6 -42C8 -62 36 -62 38 -42" fill="none" stroke-width="2"/>` +
      `<path d="M44 -30L74 -52L78 -47L46 -18Z" fill="${BLUE}" fill-opacity=".35"/>` +
      `<ellipse cx="78" cy="-51" rx="4" ry="8" transform="rotate(-35 78 -51)" fill="${BLUE}" fill-opacity=".5"/>` +
      `<path d="M0 0L-3 -42H45L42 0Z" fill="${BLUE}" fill-opacity=".4"/>`,
  )
}

export function birdhouse(x: number): string {
  return standing(
    x,
    `<path d="M0 0V-292" fill="none" stroke-width="3"/>` +
      `<g transform="translate(0 -100)"><rect x="-22" y="-240" width="44" height="50" fill="${SEPIA}" fill-opacity=".5"/>` +
      `<path d="M-31 -238L0 -270L31 -238Z" fill="${RED}" fill-opacity=".6"/>` +
      `<circle cx="0" cy="-219" r="7" fill="${GRAPHITE}" fill-opacity=".7"/><path d="M-7 -203H7" fill="none" stroke-width="2"/>` +
      `<g fill="${BLUE}" fill-opacity=".6"><path d="M8 -262l-9 -5l2 8z"/><ellipse cx="15" cy="-262" rx="8" ry="6"/><circle cx="22" cy="-268" r="4.6"/></g>` +
      `<path d="M26 -269l6 1.5l-6 2z" fill="${OCHRE}"/><circle cx="23.5" cy="-269" r=".8" fill="${GRAPHITE}"/></g>`,
  )
}

export function mushrooms(x: number): string {
  const one = (at: number, size: number) =>
    `<g transform="translate(${at} 0) scale(${size})"><path d="M-3 0V-12H3V0Z" fill="${SHEET}"/><path d="M-11 -12Q0 -30 11 -12Z" fill="${RED}" fill-opacity=".55"/>` +
    `<circle cx="-4" cy="-17" r="1.6" fill="${SHEET}" stroke="none"/><circle cx="3" cy="-20" r="1.3" fill="${SHEET}" stroke="none"/></g>`
  return standing(x, one(0, 1.3) + one(20, 0.9))
}

export function snail(x: number): string {
  return standing(
    x,
    `<path d="M-14 0Q-2 -5 14 -2Q21 -2 21 -9M21 -9l-2 -7M21 -9l4 -6" fill="none" stroke-width="2"/>` +
      `<circle cx="0" cy="-10" r="10" fill="${OCHRE}" fill-opacity=".5"/><path d="M-5 -10a5 5 0 1 1 5 5" fill="none"/>`,
  )
}

/** A butterfly that wanders above the flowers, starting from (x, y), with its wings beating. */
export function butterfly(x: number, y: number): string {
  const wing = (side: number) =>
    `<ellipse cx="${side * 7}" cy="-4" rx="6.5" ry="9" transform="rotate(${side * 24} ${side * 7} -4)"/><ellipse cx="${side * 5}" cy="6" rx="4.5" ry="6" transform="rotate(${side * -20} ${side * 5} 6)"/>`
  return (
    `<g transform="translate(${x} ${y})"><g class="flit"><g class="flap" fill="${OCHRE}" fill-opacity=".6" stroke="${GRAPHITE}" stroke-width=".9">${wing(-1)}${wing(1)}</g>` +
    `<path d="M0 -8V9" fill="none" stroke="${GRAPHITE}" stroke-width="1.8" stroke-linecap="round"/></g></g>`
  )
}
