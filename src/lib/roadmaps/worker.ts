import 'server-only'

import { z } from 'zod'
import type { Json } from '@/lib/supabase/database.types'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  deterministicRoadmapProvider,
  roadmapGenerationSourceSchema,
  roadmapStudyModeSchema,
  validateRoadmapGenerationOutput,
  type RoadmapGenerationProvider,
} from './generation'

const claimSchema = z
  .object({
    claim_status: z.enum([
      'claimed',
      'already_running',
      'no_sources',
      'not_found',
      'not_retryable',
      'source_access_changed',
    ]),
    roadmap_id: z.string().uuid(),
    source_count: z.number().int().nonnegative(),
    sources: z.array(roadmapGenerationSourceSchema),
    study_mode: roadmapStudyModeSchema.nullable(),
    topic: z.string().trim().min(3).max(160).nullable(),
  })
  .refine(
    (claim) =>
      claim.claim_status !== 'claimed' ||
      claim.source_count === claim.sources.length,
    'The claimed roadmap source count did not match its source payload.',
  )

export type RoadmapWorkerResult =
  | { roadmapId: string; status: 'ready' }
  | {
      failureCode:
        | 'already_running'
        | 'generation_failed'
        | 'invalid_generation_output'
        | 'no_sources'
        | 'not_found'
        | 'not_retryable'
        | 'save_failed'
        | 'source_access_changed'
      roadmapId: string
      status: 'failed'
    }

type WorkerDependencies = {
  admin?: ReturnType<typeof createAdminClient>
  provider?: RoadmapGenerationProvider
}

export function isRoadmapWorkerConfigured() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  return Boolean(key && !key.includes('REPLACE_ME'))
}

async function markFailed(
  admin: ReturnType<typeof createAdminClient>,
  roadmapId: string,
  ownerId: string,
  failureCode: string,
) {
  await admin.rpc('mark_roadmap_generation_failed', {
    p_failure_code: failureCode,
    p_owner_id: ownerId,
    p_roadmap_id: roadmapId,
  })
}

export async function generateRoadmapForOwner(
  roadmapId: string,
  ownerId: string,
  dependencies: WorkerDependencies = {},
): Promise<RoadmapWorkerResult> {
  const provider = dependencies.provider || deterministicRoadmapProvider
  const admin = dependencies.admin || createAdminClient()
  const { data, error } = await admin.rpc('claim_roadmap_generation', {
    p_generator_key: provider.id,
    p_owner_id: ownerId,
    p_roadmap_id: roadmapId,
  })

  if (error) {
    console.error('roadmap generation claim failed', roadmapId, error)
    return { failureCode: 'generation_failed', roadmapId, status: 'failed' }
  }

  const parsedClaim = claimSchema.safeParse(data?.[0])
  if (!parsedClaim.success) {
    console.error('roadmap generation claim was invalid', roadmapId)
    return { failureCode: 'generation_failed', roadmapId, status: 'failed' }
  }

  const claim = parsedClaim.data
  if (claim.claim_status !== 'claimed') {
    return {
      failureCode: claim.claim_status,
      roadmapId,
      status: 'failed',
    }
  }

  if (!claim.topic || !claim.study_mode) {
    await markFailed(admin, roadmapId, ownerId, 'generation_failed')
    return { failureCode: 'generation_failed', roadmapId, status: 'failed' }
  }

  try {
    const providerOutput = await provider.generate({
      sources: claim.sources,
      studyMode: claim.study_mode,
      topic: claim.topic,
    })
    const output = validateRoadmapGenerationOutput(
      providerOutput,
      claim.sources,
    )
    const { data: saved, error: saveError } = await admin.rpc(
      'save_roadmap_snapshot',
      {
        p_roadmap_id: roadmapId,
        p_sections: output.sections as Json,
        p_title: output.title,
      },
    )

    if (saveError || !saved) {
      await markFailed(admin, roadmapId, ownerId, 'save_failed')
      return { failureCode: 'save_failed', roadmapId, status: 'failed' }
    }

    return { roadmapId, status: 'ready' }
  } catch (error) {
    const failureCode =
      error instanceof z.ZodError ||
      (error instanceof Error &&
        (error.message.includes('generated roadmap') ||
          error.message.includes('unauthorized source') ||
          error.message.includes('selected source')))
        ? 'invalid_generation_output'
        : 'generation_failed'

    console.error('roadmap generation failed', roadmapId, error)
    await markFailed(admin, roadmapId, ownerId, failureCode)
    return { failureCode, roadmapId, status: 'failed' }
  }
}
