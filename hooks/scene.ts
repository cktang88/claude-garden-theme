// Garden theme: a sheet of warm paper with four pencil-sketched dials at the top right, a paper plane that crosses
// the top, and a garden in each bottom corner: plants, a tree that keeps growing, and a few garden things.
// The picture is drawn from a Stage and the session's figures. The app redraws the whole picture whenever its source
// changes, which starts its animations again. `--at` (seconds on a shared clock) and `--turn` (seconds into the turn)
// tell each animation how far along it already is, so a redraw carries on where the last picture was.
//
// The picture is layers, each fitted to the window by itself, back to front: the sheet of paper with the plane, the
// tree (pinned to the bottom right, mirrored, so its trunk stands at the page's right edge), the two gardens (bottom
// left, and bottom right mirrored), and last the dials, so they stay in view in front of the tree. The sheet and the
// dials are pinned to the top right corner: a window of another shape crops their left and bottom, never the dials.

import { backdrop, backdropDefs, backdropStyle } from './scene/backdrop'
import { LEFT_BED, RIGHT_BED, garden, gardenStyle } from './scene/garden'
import { fox, foxStyle } from './scene/fox'
import { birdhouse, butterfly, fence, mushrooms, propStyle, snail, wateringCan } from './scene/props'
import { TREE_ROOM, tree, treeStyle } from './scene/tree'
import { type Figures, type Previous, instrumentStyle, instruments } from './scene/instruments'
import { HEIGHT, WIDTH, type Stage, round } from './scene/kit'

/** Every looping animation's full cycle (6 to 22 seconds) divides this, so `--at` can wrap round without a jump. */
const SHARED_CLOCK = 55440

function style(): string {
  return `${backdropStyle()}${instrumentStyle()}${gardenStyle()}${propStyle()}${treeStyle()}${foxStyle()}
@media (prefers-reduced-motion: reduce){*{animation:none!important}}`
}

function draw(stage: Stage, figures: Figures, previous: Previous, fewer: number): string {
  const left = garden(stage.seed, stage.turns, LEFT_BED, fewer)
  const right = garden(stage.seed + 7, stage.turns, RIGHT_BED, fewer)
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" style="--at:-${round(stage.now % SHARED_CLOCK)}s;--turn:-${round(stage.turnSeconds)}s">` +
    `<style>${style()}</style>` +
    `<svg viewBox="0 0 ${WIDTH} ${HEIGHT}" width="100%" height="100%" preserveAspectRatio="xMaxYMin slice"><defs>${backdropDefs()}</defs>` +
    backdrop() +
    `</svg>` +
    `<svg viewBox="0 0 ${TREE_ROOM} ${TREE_ROOM}" width="100%" height="100%" preserveAspectRatio="xMaxYMax meet"><g transform="translate(${TREE_ROOM} 0) scale(-1 1)">${tree(stage.seed, stage.turns, 24)}</g></svg>` +
    `<svg viewBox="0 0 ${LEFT_BED.width} ${HEIGHT}" width="100%" height="100%" preserveAspectRatio="xMinYMax meet">` +
    left.back +
    fence(250, 600) +
    left.front +
    mushrooms(560) +
    snail(436) +
    wateringCan(310) +
    `</svg>` +
    `<svg viewBox="0 0 ${RIGHT_BED.width} ${HEIGHT}" width="100%" height="100%" preserveAspectRatio="xMaxYMax meet"><g transform="translate(${RIGHT_BED.width} 0) scale(-1 1)">` +
    right.back +
    right.front +
    birdhouse(338) +
    mushrooms(262) +
    (stage.turns >= 3 ? butterfly(90, 600) : '') +
    fox() +
    `</g></svg>` +
    `<svg viewBox="0 0 ${WIDTH} ${HEIGHT}" width="100%" height="100%" preserveAspectRatio="xMaxYMin slice">${instruments(stage, figures, previous)}</svg>` +
    `</svg>`
  )
}

/** The app refuses a picture whose source is over 131,072 characters, so a garden that grew too big loses plants. */
const LARGEST = 122_000

export function sceneSvg(stage: Stage, figures: Figures, previous: Previous): string {
  for (let fewer = 0; fewer < LEFT_BED.plants; fewer += 1) {
    const picture = draw(stage, figures, previous, fewer)
    if (picture.length <= LARGEST) return picture
  }
  return draw(stage, figures, previous, LEFT_BED.plants)
}
