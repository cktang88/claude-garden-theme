// Garden theme: a sheet of warm paper behind the chat with four pencil-sketched dials and a garden that grows over
// the session, and a matching light color theme. The backdrop is drawn again only when a turn starts and when it
// ends: the app shows a redraw as a brief flash of the whole picture, so nothing is redrawn while a turn runs.

import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, ThemeSetArgs } from 'claude-code'

import type { Gauges, Stage, Tally, Watch } from '../types'
import { makeColors } from './make-colors.js'
import { sceneSvg } from './scene'

const COMMAND = 'garden'

const GAUGES = { plugin: 'garden-theme', key: 'gauges' } as const
const ACTIVITY = { plugin: 'garden-theme', key: 'activity' } as const
const TALLY = { plugin: 'garden-theme', key: 'tally' } as const

const watch = atom({ plugin: 'garden-theme', key: 'activity' } as const, { phase: 'idle', startedAt: 0, toolCalls: 0 } as Watch)
const tally = atom({ plugin: 'garden-theme', key: 'tally' } as const, { turns: 0, lastTurnSeconds: 0 } as Tally)

const { theme, problems } = makeColors({
  label: 'Garden',
  only: 'light',
  roles: { accent: '#2f5d8c', danger: '#b3392f', success: '#4e7d3a', warning: '#a86f14', pro: '#6d4f94' },
  light: {
    gray: {
      anchors: {
        'surface-0': '#efe6d3',
        'surface-1': '#f4ecdc',
        'surface-2': '#faf5e9',
        'text-primary': '#2a241d',
        'text-secondary': '#544a3d',
        'text-muted': '#6a5f50',
      },
    },
  },
})


const SCENE = 'garden'
const STAGE = { plugin: 'garden-theme', key: 'stage' } as const
const NO_FIGURES: Gauges = { contextPercent: null, limits: [], usd: null }
const NOTHING_BEFORE = { contextPercent: null, usd: null }
const EMPTY_STAGE: Stage = { at: 0, isWorking: false, lastTurnSeconds: 0, lastTurnTools: 0, turnSeconds: 0, seed: 0, turns: 0, figures: NO_FIGURES, previous: NOTHING_BEFORE }

// The scene's name goes under `id` as well as `scene`, as the theme-examples plugin sets its own.
// The window's kind is not named: the colors hold only a light half, which makes the window light by itself.
const LOOK = {
  colors: theme,
  backdrop: { scene: SCENE, id: SCENE, glass: { blur: 4, tint: '#f6f1e6', opacity: 0.6 } },
} as unknown as ThemeSetArgs

/**
 * What the backdrop draws from, kept here so the backdrop hook can answer at once. THE HOOK MUST NOT BE ASYNC:
 * the desktop app shows a backdrop answered a moment late as a still picture, with every animation stopped.
 */
let latest: Stage = EMPTY_STAGE
let built: { from: Stage; source: string } | undefined

function backdropSource(): string {
  if (built?.from !== latest) {
    const scene = { now: latest.at / 1000, daySeconds: daySecondsOf(latest.at), lastTurnSeconds: latest.lastTurnSeconds, turnSeconds: latest.turnSeconds, phase: latest.isWorking ? 'engaged' : 'standby', total: latest.isWorking ? 0 : latest.lastTurnTools, seed: latest.seed, turns: latest.turns } as const

    built = { from: latest, source: sceneSvg(scene, latest.figures, latest.previous) }
  }

  return built.source
}

async function show($: EngineInterface): Promise<string> {
  const unpainted = problems.find(problem => problem.startsWith("Desktop won't paint"))

  if (unpainted !== undefined) {
    return unpainted
  }

  const set = await $.theme.set(LOOK)

  return set.isDrawn ? 'The garden theme is on.' : `The garden theme is set, but this window does not draw it: ${set.reason}`
}

/** Asks for the backdrop to be drawn again, from the figures as they are now. */
async function redraw($: EngineInterface, isWorking: boolean, lastTurn?: { seconds: number; tools: number }): Promise<void> {
  const { value: was } = await $.state.get(STAGE)
  const { value: figures = NO_FIGURES } = await $.state.get(GAUGES)
  const { value: activity } = await $.state.get(ACTIVITY)
  const { value: counts } = await $.state.get(TALLY)
  const now = await $.clock.now()

  // The backdrop draws from this snapshot alone. It is also kept in the session's state, so the last turn's
  // figures survive a reload of the mod.
  latest = {
    at: now,
    isWorking,
    lastTurnSeconds: lastTurn?.seconds ?? was?.lastTurnSeconds ?? 0,
    lastTurnTools: lastTurn?.tools ?? was?.lastTurnTools ?? 0,
    turnSeconds: isWorking && activity ? Math.max(0, (now - activity.startedAt) / 1000) : 0,
    seed: was?.seed || Math.floor(now % 100_000) + 1,
    turns: counts?.turns ?? 0,
    figures,
    previous: { contextPercent: was?.figures?.contextPercent ?? null, usd: was?.figures?.usd ?? null },
  }
  await $.state.set(STAGE, latest)
  $.ui.invalidate('ui.render')
}

/** Seconds since local midnight, for the backdrop's clock hands. */
function daySecondsOf(ms: number): number {
  const date = new Date(ms)

  return date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds()
}

async function readGauges($: EngineInterface): Promise<void> {
  const usage = await $.session.usage()

  await $.state.set(GAUGES, {
    contextPercent: usage.context.percent ?? null,
    limits: usage.rateLimits.map(limit => ({ kind: limit.kind, percentUsed: Math.round(limit.percentUsed) })),
    usd: usage.cost?.usd ?? null,
  })
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const result = await next(e)

    await $.command.register({
      name: COMMAND,
      description: 'Garden theme: alone it turns the theme on; "off" clears it.',
    })
    await readGauges($)
    // After a reload in the middle of a turn, the picture carries on as a working one.
    await redraw($, (await $.state.get(ACTIVITY)).value?.phase === 'working')

    const said = await show($)

    if (said !== 'The garden theme is on.') {
      void $.ui.toast(said)
    }

    return result
  })

  on('turn.start', async ($, e, next) => {
    if (e.agentId === undefined) {
      const now = await $.clock.now()

      await update($, watch, () => ({ phase: 'working', startedAt: now, toolCalls: 0 }))
      await readGauges($)
      await redraw($, true)
    }

    return next(e)
  })

  // A fault in the theme must never get in the way of a tool call: if the count fails, the call goes on.
  on('tool.call', async ($, e, next) => {
    await update($, watch, was => ({ ...was, toolCalls: was.toolCalls + 1 }))

    return next(e)
  }).catch(($, e, next) => next(e))

  on('turn.complete', async ($, e, next) => {
    if (e.agentId === undefined) {
      const now = await $.clock.now()
      const was = await read($, watch)

      await update($, watch, () => ({ phase: 'idle', startedAt: 0, toolCalls: was.toolCalls }))
      await update($, tally, old => ({ turns: old.turns + 1, lastTurnSeconds: Math.round((now - was.startedAt) / 1000) }))
      await readGauges($)
      await redraw($, false, { seconds: Math.round((now - was.startedAt) / 1000), tools: was.toolCalls })
    }

    return next(e)
  })

  // A new session starts before its window attaches, and the theme set then is not drawn. Set it again on attach.
  on('session.attach', { surface: 'desktop' }, async ($, e, next) => {
    const result = await next(e)
    await show($).catch(() => undefined)
    return result
  })

  on('command.run', { command: COMMAND }, async ($, e) => {
    if (e.args.trim().toLowerCase() === 'off') {
      await $.theme.clear()

      return { text: 'The garden theme is off for this session. /garden turns it on again.' }
    }

    return { text: await show($) }
  }).catch(() => ({ text: 'The garden theme hit an error. Run /garden again.' }))

  // Not async, on purpose: see `latest`. It answers at once from the snapshot `redraw` keeps.
  on('ui.render', { component: 'Backdrop' }, ($, e, next) => {
    if (e.props.scene !== SCENE || e.surface !== 'desktop') {
      return next(e)
    }

    const { Svg } = $.ui.resolve(e)

    return <Svg isInteractive alt="A sheet of warm paper with four pencil-sketched dials at the top right, a paper plane crossing the top, a tree at the right edge and a pencil garden in each bottom corner" source={backdropSource()} />
  })
}
