'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { ArrowRight, BookOpen, CheckCircle2, Clock3, Users } from 'lucide-react'
import { draftKey } from '@/components/onboarding/draft'
import { JourneyShell } from './JourneyShell'
import styles from './Journey.module.css'

export type WelcomeProps = {
  userId: string
  displayName: string
  university: string
  goal: string
  verified: boolean
  notes: { id: string; title: string; subject: string }[]
  notesUnavailable: boolean
}
const goalMessages: Record<string, string> = {
  ace_exams:
    'Here’s to feeling ready when exam day comes. Start with a set of notes and take it one topic at a time.',
  stay_consistent:
    'Here’s to making steady progress. One set of notes, one focus session, one small win at a time.',
  master_subjects:
    'Here’s to the moment a tricky concept clicks. Find a subject, open some notes, and follow your curiosity.',
  placement_prep:
    'Here’s to your next opportunity. Build your foundations and make a little room for interview preparation.',
}

export function WelcomeExperience({
  userId,
  displayName,
  university,
  goal,
  verified,
  notes,
  notesUnavailable,
}: WelcomeProps) {
  useEffect(() => {
    try {
      sessionStorage.removeItem(draftKey(userId))
    } catch {
      /* Storage can be unavailable. */
    }
  }, [userId])
  return (
    <JourneyShell
      mood="celebrate"
      title={
        <>
          Your next chapter
          <br />
          starts here.
        </>
      }
      message="A little more ready. A lot more you."
    >
      <div className={styles.progress}>
        <div
          className={styles.segments}
          role="progressbar"
          aria-label="Student setup complete"
          aria-valuemin={0}
          aria-valuemax={5}
          aria-valuenow={5}
        >
          {Array.from({ length: 5 }, (_, i) => (
            <span className={styles.segment} data-complete key={i} />
          ))}
        </div>
        <p>All set · Your profile is saved</p>
      </div>
      <h1 className={styles.heading}>You’re in, {displayName}.</h1>
      <p className={styles.description}>
        {goalMessages[goal] ||
          'Make yourself at home. Your next study session starts with a little curiosity.'}
      </p>
      <div className={styles.university}>
        {verified ? <CheckCircle2 aria-hidden="true" /> : <Clock3 aria-hidden="true" />}
        <div>
          <strong>{university}</strong>
          <p>
            {verified
              ? 'University membership verified'
              : 'University verification pending'}
          </p>
        </div>
      </div>
      {!verified ? (
        <p className={styles.hint}>
          Public notes and rooms are ready to explore. University-only access
          needs a confirmed academic email matching your campus.
        </p>
      ) : null}
      <div className={styles.welcomeActions}>
        <Link href="/dashboard/notes" className={styles.primary}>
          Explore notes
          <ArrowRight aria-hidden="true" />
        </Link>
        <Link href="/dashboard/study-rooms" className={styles.secondary}>
          <Users aria-hidden="true" />
          Join a study room
        </Link>
      </div>
      <h2 className="text-sm font-bold">
        A starting point in the public library
      </h2>
      {notes.length ? (
        notes.map((note) => (
          <Link
            key={note.id}
            className={styles.recommendation}
            href={`/dashboard/notes/${note.id}`}
          >
            <BookOpen aria-hidden="true" />
            <span>
              <strong>{note.title}</strong>
              <small>{note.subject}</small>
            </span>
            <ArrowRight aria-hidden="true" />
          </Link>
        ))
      ) : (
        <p className={styles.summary}>
          {notesUnavailable
            ? 'We couldn’t load notes just now. Your profile is saved; open the library to try again.'
            : 'The public library is still growing. No notes are available yet—explore the library or bring the first set to your study crew.'}
        </p>
      )}
      <Link href="/dashboard/settings" className={styles.hint}>
        You can change your study preferences in settings.
      </Link>
    </JourneyShell>
  )
}
