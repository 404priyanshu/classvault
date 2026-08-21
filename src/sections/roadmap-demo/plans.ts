import { BrainCircuit, Zap } from 'lucide-react'
import type { Phase, StudyMode } from './types'

export const TOPICS: Record<string, Phase[]> = {
  default: [
    { title: 'Foundations', weeks: 'Week 1', tasks: ['Skim overview notes & tag weak spots', 'Read 2 top-rated summaries', 'Self-quiz: 20 flash questions'], source: 'Top-rated public notes' },
    { title: 'Core concepts', weeks: 'Week 2–3', tasks: ['Work through unit-wise notes', 'Solve 30 practice problems', 'Join a study room twice this week'], source: 'University community notes' },
    { title: 'Practice & past papers', weeks: 'Week 4', tasks: ['Attempt 3 previous-year papers', 'Review mistakes against source notes', 'Re-rate notes you used'], source: 'PYQ collections' },
    { title: 'Revision sprint', weeks: 'Final days', tasks: ['One-page summaries per unit', 'Timed mock under exam conditions', 'Sleep. Seriously.'], source: 'Your saved roadmap' },
  ],
  exam: [
    { title: 'Triage', weeks: 'Day 1', tasks: ['List chapters by marks weightage', 'Collect highest-rated quick summaries', 'Cut anything below threshold'], source: 'Rated summaries' },
    { title: 'Rapid coverage', weeks: 'Day 2–4', tasks: ['2 units per day, notes + examples', 'Evening study-room accountability', 'Mark doubtful topics'], source: 'University notes' },
    { title: 'Past papers', weeks: 'Day 5–6', tasks: ['2 PYQs daily, timed', 'Pattern-spot repeated questions', 'Fix weak answers from source notes'], source: 'PYQ + answer keys' },
    { title: 'Final polish', weeks: 'Exam eve', tasks: ['Formula & diagram sheets only', 'One light mock', 'Early night — no all-nighter'], source: 'Your checklist' },
  ],
}

export const SUGGESTIONS = ['Operating Systems', 'Thermodynamics', 'Data Structures', 'Microeconomics']
export const STUDY_MODES: { id: StudyMode; label: string; icon: typeof BrainCircuit }[] = [
  { id: 'indepth', label: 'In-depth study', icon: BrainCircuit },
  { id: 'exam', label: 'Exam revision', icon: Zap },
]

export const EASE_OUT = [0.22, 1, 0.36, 1] as const
