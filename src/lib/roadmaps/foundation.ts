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

/**
 * The roadmap the dashboard offers to continue.
 *
 * The newest ready roadmap with tasks left, since that is the one a student is
 * most likely mid-way through. When every ready roadmap is finished, or none is
 * ready yet, the newest roadmap of any kind, so a plan still generating or
 * needing a retry is not hidden. Expects the newest-first order that
 * `list_owned_roadmaps` returns.
 */
export function pickRoadmapToContinue(roadmaps: OwnedRoadmapSummary[]) {
  return (
    roadmaps.find(
      (roadmap) =>
        roadmap.status === 'ready' &&
        roadmap.completed_task_count < roadmap.total_task_count,
    ) ||
    roadmaps[0] ||
    null
  )
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
