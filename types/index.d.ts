export type Watch = {
  phase: 'idle' | 'working'
  startedAt: number
  toolCalls: number
}

/** What the backdrop was last drawn from. Writing it draws the backdrop again. */
export type Stage = {
  at: number
  isWorking: boolean
  lastTurnSeconds: number
  lastTurnTools: number
  turnSeconds: number
  turnTools: number
  figures: Gauges
  previous: { contextPercent: number | null; usd: number | null }
}

export type Tally = {
  turns: number
  lastTurnSeconds: number
}

export type Gauges = {
  contextPercent: number | null
  limits: { kind: string; percentUsed: number }[]
  usd: number | null
}

declare module 'claude-code' {
  interface PluginState {
    'paper-dials': {
      activity: Watch
      tally: Tally
      gauges: Gauges
      clock: number
      stage: Stage
    }
  }
}
