// A red fox, drawn in pencil with washes of colour, that looks in from the edge of the page now and then: it steps
// in until its head, chest and front legs show, looks about (an ear flicks, it blinks, it turns its head), and steps
// back out. The rest of it stays off the page. It comes once every 40 seconds and stays about ten.

import { GRAPHITE } from './backdrop'

const GROUND = 1000
const FUR = '#d98a52'
const FUR_DARK = '#b96a3a'
const CREAM = '#f8f1e4'
const SOCK = '#4a3b33'
const EYE = '#c58a2e'

export function foxStyle(): string {
  return `
.poke{animation:poke 40s ease-in-out infinite;animation-delay:var(--at)}
.ear{transform-origin:64px -138px;animation:ear 7s ease-in-out infinite;animation-delay:var(--at)}
.blink{transform-origin:81px -118px;animation:blink 6s linear infinite;animation-delay:var(--at)}
.head{transform-origin:52px -100px;animation:head 12s ease-in-out infinite;animation-delay:var(--at)}
@keyframes poke{0%,62%{transform:translate(-120px,0)}64%{transform:translate(-90px,-3px)}66%{transform:translate(-60px,0)}68%{transform:translate(-30px,-3px)}70%,90%{transform:translate(0,0)}92%{transform:translate(-30px,-3px)}94%{transform:translate(-60px,0)}96%{transform:translate(-90px,-3px)}98%,100%{transform:translate(-120px,0)}}
@keyframes ear{0%,86%,100%{transform:rotate(0deg)}90%{transform:rotate(-13deg)}94%{transform:rotate(4deg)}}
@keyframes blink{0%,95%,100%{transform:scaleY(1)}97.5%{transform:scaleY(.1)}}
@keyframes head{0%,55%,100%{transform:rotate(0deg)}65%,85%{transform:rotate(-7deg)}}`
}

const LINE = `stroke="${GRAPHITE}" stroke-width="1.2" stroke-linejoin="round" stroke-linecap="round"`

function body(): string {
  return (
    // The far front leg, a shade darker, behind the near one.
    `<path d="M53 -58C52 -40 54 -22 55 -9C54 -4 56 0 61 0L68 0C70 -2 69 -5 66 -7C66 -24 67 -42 67 -58Z" fill="${FUR_DARK}" ${LINE}/>` +
    `<path d="M54.2 -26L57 -29L60 -25L63 -29L66.4 -26C66 -18 66 -12 66 -7C69 -5 70 -2 68 0L61 0C56 0 54 -4 55 -9Z" fill="${SOCK}" ${LINE}/>` +
    // Back, rump, belly and chest, with a darker saddle along the spine.
    `<path d="M46 -104C24 -102 -6 -86 -20 -58C-29 -41 -32 -22 -27 -9C-25 -3 -19 0 -10 0L48 0C56 -22 63 -52 61 -80C59 -93 54 -102 46 -104Z" fill="${FUR}" ${LINE}/>` +
    `<path d="M46 -104C24 -102 -6 -86 -20 -58C-27 -44 -30 -30 -29 -18C-20 -44 -2 -68 18 -80C28 -86 38 -90 48 -90C50 -96 49 -101 46 -104Z" fill="${FUR_DARK}" fill-opacity=".45" stroke="none"/>` +
    // The folded hind leg and its paw.
    `<path d="M-19 -8C-27 -32 -8 -55 15 -49C31 -44 36 -24 31 -8" fill="none" ${LINE}/>` +
    `<path d="M8 0C7 -6 16 -10 28 -9C38 -8 44 -4 42 0Z" fill="${SOCK}" ${LINE}/>` +
    // The white throat and chest, ragged where the fur ends, running down to a point between the legs.
    `<path d="M47 -92C52 -86 58 -84 62 -86C64 -70 62 -50 58 -34L55 -40L53 -31L50 -40L48 -30C43 -46 42 -64 44 -78L40 -80L45 -85L42 -89Z" fill="${CREAM}" ${LINE}/>` +
    // The near front leg: slender, with a dark sock and a small paw.
    `<path d="M40 -62C38 -44 41 -24 43 -10C42 -4 44 0 50 0L58 0C60 -2 59 -5 56 -7C56 -26 57 -44 57 -62C52 -68 44 -68 40 -62Z" fill="${FUR}" ${LINE}/>` +
    `<path d="M42.2 -27L45 -31L48 -26L51 -31L54 -27L56.2 -30C56 -22 56 -14 56 -7C59 -5 60 -2 58 0L50 0C44 0 42 -4 43 -10Z" fill="${SOCK}" ${LINE}/>` +
    `<path d="M49 -1v-4M53.5 -1v-4" fill="none" stroke="${CREAM}" stroke-opacity=".5" stroke-width=".8" stroke-linecap="round"/>` +
    // Strokes of fur along the back, the flank and the haunch.
    `<path d="M22 -94q-8 5 -11 13M6 -84q-7 6 -9 14M-9 -68q-6 7 -6 15M-20 -46q-4 8 -3 15M14 -70q-6 6 -7 13M30 -78q-5 6 -6 12M2 -40q-6 5 -7 12M18 -36q-5 5 -5 11M-6 -24q-5 5 -5 10" fill="none" stroke="${FUR_DARK}" stroke-width="1" stroke-linecap="round"/>`
  )
}

function head(): string {
  return (
    `<g class="head">` +
    // The far ear, behind the head.
    `<path d="M44 -130C40 -146 42 -160 46 -168C53 -158 59 -148 62 -138Z" fill="${FUR_DARK}" ${LINE}/>` +
    // The skull, brow, long muzzle and jaw.
    `<path d="M40 -106C34 -122 42 -138 58 -142C70 -145 80 -140 86 -130C93 -123 104 -114 113 -108C116 -105 115 -100 111 -99C101 -97 91 -94 82 -91C70 -86 58 -86 50 -91C44 -95 41 -100 40 -106Z" fill="${FUR}" ${LINE}/>` +
    // The white of the cheek and under the muzzle, ending in a ruff of fur at the back.
    `<path d="M113 -105C102 -103 93 -105 85 -110C80 -104 73 -100 64 -101C58 -102 52 -105 47 -109L49 -102L43 -103L48 -96L44 -94L51 -91C58 -86 70 -86 82 -91C91 -94 101 -97 111 -99C114 -100 115 -103 113 -105Z" fill="${CREAM}" ${LINE}/>` +
    // The near ear: dark at the tip and back, pale inside.
    `<g class="ear"><path d="M56 -138C55 -154 59 -166 64 -175C71 -164 77 -152 79 -139Z" fill="${FUR}" ${LINE}/>` +
    `<path d="M61 -161L64 -175L69 -163Z" fill="${SOCK}" ${LINE}/>` +
    `<path d="M61 -141C61 -150 63 -157 65 -162C69 -155 73 -147 74 -141Z" fill="${CREAM}" stroke="none"/></g>` +
    // The nose, the line of the mouth, and the dark stripe a fox has from eye to nose.
    `<ellipse cx="112" cy="-104" rx="3.8" ry="3.1" fill="${GRAPHITE}"/>` +
    `<path d="M109 -100C102 -97 96 -96 90 -97M88 -116C95 -113 102 -110 108 -107" fill="none" stroke="${GRAPHITE}" stroke-width="1" stroke-linecap="round"/>` +
    // The eye: amber, almond shaped, with an upright pupil.
    `<g class="blink"><path d="M74 -117C77 -122 85 -122 88 -116C84 -114 78 -114 74 -117Z" fill="${EYE}" stroke="${GRAPHITE}" stroke-width="1.1" stroke-linejoin="round"/>` +
    `<ellipse cx="81" cy="-118" rx="1.5" ry="2.6" fill="${GRAPHITE}"/></g>` +
    // Whiskers and a little fur on the brow.
    `<path d="M100 -101q8 3 16 7M98 -99q7 5 12 11M62 -134q-5 4 -6 9M50 -122q-4 5 -4 10" fill="none" stroke="${GRAPHITE}" stroke-opacity=".6" stroke-width=".7" stroke-linecap="round"/>` +
    `</g>`
  )
}

/** The fox, placed so that when it has stepped in, the page's edge (x = 0) cuts it just behind the shoulder. */
export function fox(): string {
  return `<g transform="translate(-34 ${GROUND})"><g class="poke">${body()}${head()}</g></g>`
}
