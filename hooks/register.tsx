// Paper Dials: a sheet of warm paper behind the chat with four pencil-sketched dials, a matching light
// color theme, and a status row above the prompt. The backdrop is drawn again when a turn starts, when it ends, and
// (at most every few seconds) after tool calls; its dials carry on from where they were.

import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, ThemeSetArgs, Timer } from 'claude-code'

import type { Gauges, Stage, Tally, Watch } from '../types'
import { makeColors } from './make-colors.js'
import { paperDialsSvg } from './scene'

const COMMAND = 'paper-dials'
const AMBER = '#8a4b2d'

const GAUGES = { plugin: 'paper-dials', key: 'gauges' } as const
const CLOCK = { plugin: 'paper-dials', key: 'clock' } as const
const ACTIVITY = { plugin: 'paper-dials', key: 'activity' } as const
const REDRAW_GAP_MS = 4000

const watch = atom({ plugin: 'paper-dials', key: 'activity' } as const, { phase: 'idle', startedAt: 0, toolCalls: 0 } as Watch)
const tally = atom({ plugin: 'paper-dials', key: 'tally' } as const, { turns: 0, lastTurnSeconds: 0 } as Tally)
const gauges = atom({ plugin: 'paper-dials', key: 'gauges' } as const, { contextPercent: null, limits: [], usd: null } as Gauges)
const clock = atom({ plugin: 'paper-dials', key: 'clock' } as const, 0)

const { theme, problems } = makeColors({
  label: 'Paper Dials',
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


const SCENE = 'paper-dials'
const STAGE = { plugin: 'paper-dials', key: 'stage' } as const
const NO_FIGURES: Gauges = { contextPercent: null, limits: [], usd: null }
const NOTHING_BEFORE = { contextPercent: null, usd: null }
const EMPTY_STAGE: Stage = { at: 0, isWorking: false, lastTurnSeconds: 0, lastTurnTools: 0, turnSeconds: 0, turnTools: 0, figures: NO_FIGURES, previous: NOTHING_BEFORE }

// The scene's name goes under `id` as well as `scene`, as the theme-examples plugin sets its own.
// The window's kind is not named: the colors hold only a light half, which makes the window light by itself.
const LOOK = {
  colors: theme,
  backdrop: { scene: SCENE, id: SCENE, glass: { blur: 4, tint: '#f6f1e6', opacity: 0.6 } },
} as unknown as ThemeSetArgs

let secondTicker: Timer | undefined
let lateRedraw: Timer | undefined

/**
 * What the backdrop draws from, kept here so the backdrop hook can answer at once. THE HOOK MUST NOT BE ASYNC:
 * the desktop app shows a backdrop answered a moment late as a still picture, with every animation stopped.
 */
let latest: Stage = EMPTY_STAGE
let built: { from: Stage; source: string } | undefined

function backdropSource(): string {
  if (built?.from !== latest) {
    const scene = { now: latest.at / 1000, daySeconds: daySecondsOf(latest.at), lastTurnSeconds: latest.lastTurnSeconds, turnSeconds: latest.turnSeconds, phase: latest.isWorking ? 'engaged' : 'standby', total: latest.isWorking ? latest.turnTools : latest.lastTurnTools } as const

    built = { from: latest, source: paperDialsSvg(scene, latest.figures, latest.previous) }
  }

  return built.source
}

async function show($: EngineInterface): Promise<string> {
  const unpainted = problems.find(problem => problem.startsWith("Desktop won't paint"))

  if (unpainted !== undefined) {
    return unpainted
  }

  const set = await $.theme.set(LOOK)

  return set.isDrawn ? 'Paper Dials is on.' : `Paper Dials is set, but this window does not draw it: ${set.reason}`
}

/** Asks for the backdrop to be drawn again, from the figures as they are now. */
async function redraw($: EngineInterface, isWorking: boolean, lastTurn?: { seconds: number; tools: number }): Promise<void> {
  const { value: was } = await $.state.get(STAGE)
  const { value: figures = NO_FIGURES } = await $.state.get(GAUGES)
  const { value: activity } = await $.state.get(ACTIVITY)
  const now = await $.clock.now()

  // The backdrop draws from this snapshot alone. It is also kept in the session's state, so the last turn's
  // figures survive a reload of the mod.
  latest = {
    at: now,
    isWorking,
    lastTurnSeconds: lastTurn?.seconds ?? was?.lastTurnSeconds ?? 0,
    lastTurnTools: lastTurn?.tools ?? was?.lastTurnTools ?? 0,
    turnSeconds: isWorking && activity ? Math.max(0, (now - activity.startedAt) / 1000) : 0,
    turnTools: isWorking ? (activity?.toolCalls ?? 0) : 0,
    figures,
    previous: { contextPercent: was?.figures?.contextPercent ?? null, usd: was?.figures?.usd ?? null },
  }
  await $.state.set(STAGE, latest)
  $.ui.invalidate('ui.render')
}

/**
 * Draws the backdrop again for a new tool call, but not more often than every few seconds: a call that comes
 * sooner is drawn when the gap is over.
 */
async function redrawSoon($: EngineInterface): Promise<void> {
  const { value: activity } = await $.state.get(ACTIVITY)

  if (activity?.phase !== 'working' || lateRedraw !== undefined) {
    return
  }

  const wait = latest.at + REDRAW_GAP_MS - (await $.clock.now())

  if (wait <= 0) {
    await redraw($, true)

    return
  }

  lateRedraw = $.clock.after(wait, async () => {
    lateRedraw = undefined
    await redrawSoon($)
  })
}

/** Seconds since local midnight, for the backdrop's clock hands. */
function daySecondsOf(ms: number): number {
  const date = new Date(ms)

  return date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds()
}

async function tick($: EngineInterface): Promise<void> {
  await $.state.set(CLOCK, await $.clock.now())
}

async function readGauges($: EngineInterface): Promise<void> {
  const usage = await $.session.usage()

  await $.state.set(GAUGES, {
    contextPercent: usage.context.percent ?? null,
    limits: usage.rateLimits.map(limit => ({ kind: limit.kind, percentUsed: Math.round(limit.percentUsed) })),
    usd: usage.cost?.usd ?? null,
  })
}

function clockText(ms: number): string {
  const date = new Date(ms)

  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

function elapsedText(ms: number): string {
  const seconds = Math.max(0, Math.floor(ms / 1000))

  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
}

/** A ten-step bar for a percentage, such as "▰▰▰▰▰▱▱▱▱▱ 51%". */
function meter(percent: number): string {
  const lit = Math.max(0, Math.min(10, Math.round(percent / 10)))

  return `${'▰'.repeat(lit)}${'▱'.repeat(10 - lit)} ${Math.round(percent)}%`
}

function limitText(figures: Gauges): string {
  const names: Record<string, string> = { five_hour: '5h', seven_day: '7d' }

  return figures.limits
    .filter(limit => names[limit.kind] !== undefined)
    .map(limit => ` · ${names[limit.kind]} ${limit.percentUsed}%`)
    .join('')
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const result = await next(e)

    await $.command.register({
      name: COMMAND,
      description: 'Paper Dials: alone it turns the theme on; "off" clears it.',
    })
    await tick($)
    await readGauges($)
    await redraw($, false)
    $.clock.every(30_000, async () => {
      await tick($)
      await readGauges($)
    })

    const said = await show($)

    if (said !== 'Paper Dials is on.') {
      void $.ui.toast(said)
    }

    return result
  })

  on('turn.start', async ($, e, next) => {
    if (e.agentId === undefined) {
      const now = await $.clock.now()

      await update($, watch, () => ({ phase: 'working', startedAt: now, toolCalls: 0 }))
      secondTicker?.cancel()
      secondTicker = $.clock.every(1000, () => tick($))

      await redraw($, true)
    }

    return next(e)
  })

  on('tool.call', async ($, e, next) => {
    await update($, watch, was => ({ ...was, toolCalls: was.toolCalls + 1 }))
    await redrawSoon($)

    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    if (e.agentId === undefined) {
      const now = await $.clock.now()
      const was = await read($, watch)

      secondTicker?.cancel()
      secondTicker = undefined
      lateRedraw?.cancel()
      lateRedraw = undefined
      await update($, watch, () => ({ phase: 'idle', startedAt: 0, toolCalls: was.toolCalls }))
      await update($, tally, old => ({ turns: old.turns + 1, lastTurnSeconds: Math.round((now - was.startedAt) / 1000) }))
      await update($, clock, () => now)
      await readGauges($)
      await redraw($, false, { seconds: Math.round((now - was.startedAt) / 1000), tools: was.toolCalls })
    }

    return next(e)
  })

  on('command.run', { command: COMMAND }, async ($, e) => {
    if (e.args.trim().toLowerCase() === 'off') {
      await $.theme.clear()

      return { text: 'Paper Dials is off for this session. /paper-dials turns it on again.' }
    }

    return { text: await show($) }
  })

  // Not async, on purpose: see `latest`. It answers at once from the snapshot `redraw` keeps.
  on('ui.render', { component: 'Backdrop' }, ($, e, next) => {
    if (e.props.scene !== SCENE || e.surface !== 'desktop') {
      return next(e)
    }

    const { Svg } = $.ui.resolve(e)

    return <Svg isInteractive alt="A sheet of warm paper with four pencil-sketched dials at the top right" source={backdropSource()} />
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey) {
      return next(e)
    }

    const { Box, Text } = $.ui.resolve(e)
    const now = await read($, clock)
    const current = await read($, watch)
    const counts = await read($, tally)
    const figures = await read($, gauges)
    const isWorking = current.phase === 'working'
    const activity = isWorking
      ? ` ${elapsedText(now - current.startedAt)} · ${current.toolCalls} tool calls`
      : ` · ${counts.turns} turns · last ${counts.lastTurnSeconds}s`
    const context = figures.contextPercent === null ? '' : ` · context ${meter(figures.contextPercent)}`
    const cost = figures.usd === null ? '' : ` · $${figures.usd.toFixed(2)}`

    return (
      <Box>
        <Text bold color={isWorking ? AMBER : undefined}>
          {isWorking ? 'WORKING' : 'IDLE'}
        </Text>
        <Text dimColor>
          {activity}
          {context}
          {limitText(figures)}
          {cost} · {clockText(now)}
        </Text>
      </Box>
    )
  })
}
