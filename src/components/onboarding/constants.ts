import {
  BookOpen,
  Building2,
  CalendarDays,
  CircleUserRound,
  Sparkles,
  Target,
} from 'lucide-react'

export const STEPS = [
  {
    description: 'Your name and academic path',
    icon: CircleUserRound,
    label: 'Your identity',
  },
  {
    description: 'The community you belong to',
    icon: Building2,
    label: 'Your campus',
  },
  {
    description: 'How ClassVault should help',
    icon: CalendarDays,
    label: 'Study rhythm',
  },
]

export const GOALS = [
  {
    description: 'Turn the syllabus into a clear revision plan.',
    icon: Target,
    label: 'Ace my exams',
    value: 'ace_exams',
  },
  {
    description: 'Build momentum without last-minute panic.',
    icon: CalendarDays,
    label: 'Stay consistent',
    value: 'stay_consistent',
  },
  {
    description: 'Go deeper on difficult concepts and subjects.',
    icon: BookOpen,
    label: 'Master my subjects',
    value: 'master_subjects',
  },
  {
    description: 'Balance coursework with interview preparation.',
    icon: Sparkles,
    label: 'Prepare for placements',
    value: 'placement_prep',
  },
]

export const STUDY_PREFERENCES = [
  {
    description: 'Quiet focus with a plan I can follow.',
    label: 'Mostly solo',
    value: 'solo',
  },
  {
    description: 'A little structure and someone keeping pace.',
    label: 'Accountability',
    value: 'accountability',
  },
  {
    description: 'Live rooms and shared study sessions.',
    label: 'Study groups',
    value: 'study_group',
  },
]

export const COURSE_OPTIONS = ['MCA', 'BCA', 'B.Tech', 'M.Tech'] as const
