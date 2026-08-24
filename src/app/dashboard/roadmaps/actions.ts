'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import type { RoadmapGenerationActionState } from '@/lib/roadmaps/action-state'
import { generateRoadmapForOwner, isRoadmapWorkerConfigured } from '@/lib/roadmaps/worker'
import { createClient } from '@/lib/supabase/server'

const roadmapRequestSchema = z.object({
  studyMode: z.enum(['indepth', 'exam']),
  topic: z.string().trim().min(3).max(160),
})

const roadmapIdSchema = z.string().uuid()

const taskProgressSchema = z.object({
  completed: z.enum(['true', 'false']),
  roadmapId: z.string().uuid(),
  taskId: z.coerce.number().int().positive(),
})

async function authenticatedOwner() {
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const ownerId = z.string().uuid().safeParse(claimsData?.claims?.sub)

  if (!ownerId.success) return null
  return { ownerId: ownerId.data, supabase }
}

function generationFailureMessage(failureCode: string) {
  if (failureCode === 'already_running') {
    return 'This roadmap is already generating. Its status will refresh automatically.'
  }
  if (failureCode === 'no_sources') {
    return 'Upload or publish at least one eligible note before generating a roadmap.'
  }
  if (failureCode === 'source_access_changed') {
    return 'A source changed while generation was starting. Create a new roadmap to refresh the source set.'
  }
  if (failureCode === 'not_retryable') {
    return 'This roadmap cannot be retried in its current state.'
  }
  if (failureCode === 'not_found') {
    return 'That roadmap could not be found.'
  }
  return 'Roadmap generation did not finish. You can retry from the saved roadmaps list.'
}

export async function createRoadmapAction(
  _previousState: RoadmapGenerationActionState,
  formData: FormData,
): Promise<RoadmapGenerationActionState> {
  const parsed = roadmapRequestSchema.safeParse({
    studyMode: formData.get('studyMode'),
    topic: formData.get('topic'),
  })

  if (!parsed.success) {
    return {
      kind: 'error',
      message: 'Enter a topic between 3 and 160 characters and choose a study mode.',
    }
  }

  const authenticated = await authenticatedOwner()
  if (!authenticated) {
    return { kind: 'error', message: 'Your session expired. Sign in and try again.' }
  }

  if (!isRoadmapWorkerConfigured()) {
    return {
      kind: 'error',
      message: 'The server-side roadmap worker is not configured yet.',
    }
  }

  const { data, error } = await authenticated.supabase.rpc(
    'create_roadmap_source_snapshot',
    {
      p_study_mode: parsed.data.studyMode,
      p_topic: parsed.data.topic,
    },
  )
  const created = data?.[0]

  if (error || !created?.roadmap_id) {
    return {
      kind: 'error',
      message: 'ClassVault could not create the server-owned source snapshot.',
    }
  }

  const result = await generateRoadmapForOwner(
    created.roadmap_id,
    authenticated.ownerId,
  )

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/roadmaps')

  if (result.status === 'ready') {
    revalidatePath(`/dashboard/roadmaps/${result.roadmapId}`)
    return {
      kind: 'success',
      message: 'Your grounded roadmap is ready.',
      roadmapId: result.roadmapId,
    }
  }

  return {
    kind: result.failureCode === 'already_running' ? 'pending' : 'error',
    message: generationFailureMessage(result.failureCode),
    roadmapId: result.roadmapId,
  }
}

export async function retryRoadmapAction(
  _previousState: RoadmapGenerationActionState,
  formData: FormData,
): Promise<RoadmapGenerationActionState> {
  const roadmapId = roadmapIdSchema.safeParse(formData.get('roadmapId'))
  if (!roadmapId.success) {
    return { kind: 'error', message: 'That roadmap could not be found.' }
  }

  const authenticated = await authenticatedOwner()
  if (!authenticated) {
    return { kind: 'error', message: 'Your session expired. Sign in and try again.' }
  }

  if (!isRoadmapWorkerConfigured()) {
    return {
      kind: 'error',
      message: 'The server-side roadmap worker is not configured yet.',
    }
  }

  const result = await generateRoadmapForOwner(
    roadmapId.data,
    authenticated.ownerId,
  )

  revalidatePath('/dashboard/roadmaps')
  revalidatePath(`/dashboard/roadmaps/${roadmapId.data}`)

  if (result.status === 'ready') {
    return {
      kind: 'success',
      message: 'The roadmap is ready.',
      roadmapId: roadmapId.data,
    }
  }

  return {
    kind: result.failureCode === 'already_running' ? 'pending' : 'error',
    message: generationFailureMessage(result.failureCode),
    roadmapId: roadmapId.data,
  }
}

export async function setRoadmapTaskProgressAction(formData: FormData) {
  const parsed = taskProgressSchema.safeParse({
    completed: formData.get('completed'),
    roadmapId: formData.get('roadmapId'),
    taskId: formData.get('taskId'),
  })
  if (!parsed.success) return

  const authenticated = await authenticatedOwner()
  if (!authenticated) return

  const { data: updated, error } = await authenticated.supabase.rpc(
    'set_roadmap_task_progress',
    {
      p_completed: parsed.data.completed === 'true',
      p_task_id: parsed.data.taskId,
    },
  )
  if (error || !updated) return

  revalidatePath('/dashboard/roadmaps')
  revalidatePath(`/dashboard/roadmaps/${parsed.data.roadmapId}`)
}
