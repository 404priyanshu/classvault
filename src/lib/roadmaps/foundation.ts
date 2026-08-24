export type RoadmapSourceEligibility = {
  eligible_university_count: number
  generation_plan: string
  personal_count: number
  pro_university_count: number
  public_count: number
  total_eligible_count: number
}

export type OwnedRoadmapSummary = {
  completed_task_count: number
  created_at: string
  generated_at: string | null
  generation_plan: string
  roadmap_id: string
  section_count: number
  sharing_enabled: boolean
  source_count: number
  status: string
  study_mode: string
  title: string
  topic: string
  total_task_count: number
}

export function formatRoadmapStudyMode(value: string) {
  return value === 'exam' ? 'Exam revision' : 'In-depth study'
}

export function formatRoadmapStatus(value: string) {
  if (value === 'ready') return 'Ready'
  if (value === 'generating') return 'Generating'
  if (value === 'failed') return 'Needs retry'
  return 'Source snapshot'
}
