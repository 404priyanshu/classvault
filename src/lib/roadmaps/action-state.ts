export type RoadmapGenerationActionState = {
  kind: 'error' | 'idle' | 'pending' | 'success'
  message: string
  roadmapId?: string
}

export const initialRoadmapGenerationState: RoadmapGenerationActionState = {
  kind: 'idle',
  message: '',
}
