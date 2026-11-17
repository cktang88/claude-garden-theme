// Paper Dials: a sheet of warm paper with four pencil-sketched dials at the top right.
// The picture is drawn from a Stage and the session's figures. The app redraws the whole picture whenever its source
// changes, which starts its animations again. `--at` (seconds on a shared clock) and `--turn` (seconds into the turn)
// tell each animation how far along it already is, so a redraw carries on where the last picture was.
//
// The sheet is pinned to the window's top right corner: a window of another shape crops the left and the bottom,
// never the dials.

import { backdrop, backdropDefs, backdropStyle } from './scene/backdrop'
import { type Figures, type Previous, instrumentStyle, instruments } from './scene/instruments'
import { HEIGHT, WIDTH, type Stage, round } from './scene/kit'

function style(): string {
  return `${backdropStyle()}${instrumentStyle()}
@media (prefers-reduced-motion: reduce){*{animation:none!important}}`
}

export function paperDialsSvg(stage: Stage, figures: Figures, previous: Previous): string {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" width="100%" height="100%" preserveAspectRatio="xMaxYMin slice" style="--at:-${round(stage.now % 1800)}s;--turn:-${round(stage.turnSeconds)}s">` +
    `<style>${style()}</style><defs>${backdropDefs()}</defs>` +
    backdrop(stage.phase === 'engaged') +
    instruments(stage, figures, previous) +
    `</svg>`
  )
}
