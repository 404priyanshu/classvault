export type Phase = { title: string; tasks: string[]; source: string; weeks: string }
export type StudyMode = 'indepth' | 'exam'
export type GenStep = { log: string; progress: number; phases: number; duration: number }
export type GenerationPhaseState = 'idle' | 'generating' | 'done'
