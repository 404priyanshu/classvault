import type { ReactNode } from 'react'

import styles from './Landing.module.css'
import { VaultMark } from './VaultMark'

type ProductMockupProps = {
  className?: string
}

type IconProps = {
  className?: string
}

type MockupFrameProps = ProductMockupProps & {
  children: ReactNode
  surface: string
  variant: string
}

type AccessState = 'allowed' | 'conditional' | 'denied' | 'private'

type AccessCellValue = {
  label: string
  state: AccessState
}

const NOTES = [
  {
    title: 'Database indexing — Unit 3',
    meta: 'DBMS · PDF · updated notes',
    scope: 'University',
    scopeKind: 'campus',
  },
  {
    title: 'OS scheduling & deadlocks',
    meta: 'Operating Systems · PDF · exam revision',
    scope: 'Public',
    scopeKind: 'public',
  },
  {
    title: 'Thermodynamics formula revision',
    meta: 'Thermodynamics · PDF · formula sheet',
    scope: 'University',
    scopeKind: 'campus',
  },
] as const

const ROADMAP_PHASES = [
  { label: 'Foundations', detail: 'Ready', state: 'complete' },
  { label: 'Core concepts', detail: 'Current', state: 'active' },
  { label: 'Practice', detail: 'Queued', state: 'pending' },
  { label: 'Revision', detail: 'Queued', state: 'pending' },
] as const

const ACCESS_ROWS: Array<{
  surface: string
  signedOut: AccessCellValue
  student: AccessCellValue
  sameCampus: AccessCellValue
  owner: AccessCellValue
}> = [
  {
    surface: 'Public note library',
    signedOut: { label: 'Sign in', state: 'denied' },
    student: { label: 'Read', state: 'allowed' },
    sameCampus: { label: 'Read', state: 'allowed' },
    owner: { label: 'Manage own', state: 'private' },
  },
  {
    surface: 'University note library',
    signedOut: { label: 'No access', state: 'denied' },
    student: { label: 'No access', state: 'denied' },
    sameCampus: { label: 'Read', state: 'allowed' },
    owner: { label: 'If eligible', state: 'conditional' },
  },
  {
    surface: 'Saved roadmap',
    signedOut: { label: 'Private', state: 'denied' },
    student: { label: 'Private', state: 'denied' },
    sameCampus: { label: 'Private', state: 'denied' },
    owner: { label: 'Private', state: 'private' },
  },
  {
    surface: 'Shared public-source section',
    signedOut: { label: 'Visible', state: 'allowed' },
    student: { label: 'Visible', state: 'allowed' },
    sameCampus: { label: 'Visible', state: 'allowed' },
    owner: { label: 'Visible', state: 'allowed' },
  },
  {
    surface: 'Shared campus-source section',
    signedOut: { label: 'Withheld', state: 'denied' },
    student: { label: 'Withheld', state: 'denied' },
    sameCampus: { label: 'If eligible', state: 'conditional' },
    owner: { label: 'If eligible', state: 'conditional' },
  },
  {
    surface: 'Task progress',
    signedOut: { label: 'Hidden', state: 'denied' },
    student: { label: 'Hidden', state: 'denied' },
    sameCampus: { label: 'Hidden', state: 'denied' },
    owner: { label: 'Owner only', state: 'private' },
  },
]

function joinClasses(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(' ')
}

function SearchIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" focusable="false">
      <circle cx="10.75" cy="10.75" r="6.25" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="m15.5 15.5 4 4" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  )
}

function FileIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" focusable="false">
      <path d="M6 3.75h7.2L18 8.6v11.65H6Z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.6" />
      <path d="M13 3.75V9h5M9 13h6M9 16.5h4.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" />
    </svg>
  )
}

function StarIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" focusable="false">
      <path d="m12 3.8 2.35 4.76 5.25.76-3.8 3.7.9 5.23L12 15.78l-4.7 2.47.9-5.23-3.8-3.7 5.25-.76Z" fill="currentColor" />
    </svg>
  )
}

function CheckIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" focusable="false">
      <path d="m5.5 12.5 4.1 4.1 8.9-9.2" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  )
}

function LockIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" focusable="false">
      <rect x="5.25" y="10" width="13.5" height="10" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8.25 10V7.8a3.75 3.75 0 0 1 7.5 0V10" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" />
    </svg>
  )
}

function ClockIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="8.25" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 7.5v5l3.3 2" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" />
    </svg>
  )
}

function ChatIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" focusable="false">
      <path d="M5 5.5h14v10.25H9.2L5 19Z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.6" />
      <path d="M8.5 9h7M8.5 12.25h4.75" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" />
    </svg>
  )
}

function ShieldIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" focusable="false">
      <path d="M12 3.5 19 6v5.25c0 4.2-2.65 7.35-7 9.25-4.35-1.9-7-5.05-7-9.25V6Z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.6" />
      <path d="m8.7 12 2.1 2.1 4.5-4.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" />
    </svg>
  )
}

function MockupFrame({ children, className, surface, variant }: MockupFrameProps) {
  return (
    <article
      className={joinClasses(styles.mockupFrame, styles[variant], className)}
      aria-label={`${surface} product preview`}
    >
      <header className={styles.mockupChrome}>
        <div className={styles.mockupChromeBrand}>
          <VaultMark className={styles.mockupBrandMark} inverted />
          <span className={styles.mockupWordmark}>classvault</span>
        </div>
        <span className={styles.mockupChromeLabel}>{surface}</span>
        <span className={styles.mockupChromeDots} aria-hidden="true">
          <span className={styles.mockupChromeDot} />
          <span className={styles.mockupChromeDot} />
          <span className={styles.mockupChromeDot} />
        </span>
      </header>
      <div className={styles.mockupViewport}>{children}</div>
    </article>
  )
}

function AccessCell({ value }: { value: AccessCellValue }) {
  return (
    <td
      className={joinClasses(
        styles.mockupCell,
        value.state === 'allowed' && styles.mockupCellAllowed,
        value.state === 'conditional' && styles.mockupCellConditional,
        value.state === 'denied' && styles.mockupCellDenied,
        value.state === 'private' && styles.mockupCellPrivate,
      )}
    >
      <span className={styles.mockupCellMark} aria-hidden="true">
        {value.state === 'allowed' ? '✓' : value.state === 'denied' ? '—' : '•'}
      </span>
      {value.label}
    </td>
  )
}

export function NotesMockup({ className }: ProductMockupProps) {
  return (
    <MockupFrame className={className} surface="Notes library" variant="mockupNotes">
      <div className={styles.mockupAppShell}>
        <aside className={styles.mockupSidebar} aria-label="Notes sections">
          <p className={styles.mockupSidebarLabel}>Library</p>
          <nav>
            <ul className={styles.mockupNavList}>
              <li className={joinClasses(styles.mockupNavItem, styles.mockupNavItemActive)}>
                <span className={styles.mockupNavGlyph} aria-hidden="true">◫</span>
                Discover
              </li>
              <li className={styles.mockupNavItem}>
                <span className={styles.mockupNavGlyph} aria-hidden="true">◇</span>
                Top rated
              </li>
              <li className={styles.mockupNavItem}>
                <span className={styles.mockupNavGlyph} aria-hidden="true">⌂</span>
                My university
              </li>
              <li className={styles.mockupNavItem}>
                <span className={styles.mockupNavGlyph} aria-hidden="true">▣</span>
                My vault
              </li>
            </ul>
          </nav>
          <div className={styles.mockupSidebarNote}>
            <ShieldIcon className={styles.mockupIcon} />
            Results follow note access rules.
          </div>
        </aside>

        <section className={styles.mockupMain} aria-label="Searchable notes">
          <div className={styles.mockupToolbar}>
            <div className={styles.mockupTitleBlock}>
              <p className={styles.mockupContextLabel}>Browse notes</p>
              <h3 className={styles.mockupTitle}>Find the useful version first.</h3>
            </div>
            <label className={styles.mockupSearch}>
              <span className={styles.mockupSrOnly}>Search notes</span>
              <SearchIcon className={styles.mockupSearchIcon} />
              <input
                type="search"
                readOnly
                placeholder="Search titles, tags, and file text"
                className={styles.mockupSearchInput}
              />
            </label>
          </div>

          <div className={styles.mockupFilterRow} aria-label="Applied note filters">
            <span className={joinClasses(styles.mockupFilter, styles.mockupFilterActive)}>All subjects</span>
            <span className={styles.mockupFilter}>PDF</span>
            <span className={styles.mockupFilter}>Newest</span>
            <span className={styles.mockupFilter}>Public + university</span>
          </div>

          <div className={styles.mockupTableWrap}>
            <table className={styles.mockupTable}>
              <thead>
                <tr>
                  <th scope="col">Note</th>
                  <th scope="col">Community rating</th>
                  <th scope="col">Access</th>
                </tr>
              </thead>
              <tbody>
                {NOTES.map((note) => (
                  <tr key={note.title}>
                    <td>
                      <div className={styles.mockupNoteIdentity}>
                        <span className={styles.mockupFileIcon} aria-hidden="true">
                          <FileIcon className={styles.mockupIcon} />
                        </span>
                        <span>
                          <strong className={styles.mockupNoteTitle}>{note.title}</strong>
                          <span className={styles.mockupNoteMeta}>{note.meta}</span>
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={styles.mockupRating}>
                        <StarIcon className={styles.mockupRatingIcon} />
                        Rated by students
                      </span>
                    </td>
                    <td>
                      <span
                        className={joinClasses(
                          styles.mockupScope,
                          note.scopeKind === 'campus'
                            ? styles.mockupScopeCampus
                            : styles.mockupScopePublic,
                        )}
                      >
                        {note.scope}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <footer className={styles.mockupFootbar}>
            <span className={styles.mockupStatus}>
              <span className={styles.mockupStatusDot} aria-hidden="true" />
              Search snippets appear only after access is checked
            </span>
            <span>Private files · short-lived downloads</span>
          </footer>
        </section>
      </div>
    </MockupFrame>
  )
}

export function RoadmapMockup({ className }: ProductMockupProps) {
  return (
    <MockupFrame className={className} surface="Study roadmap" variant="mockupRoadmap">
      <div className={styles.mockupRoadmapLayout}>
        <aside className={styles.mockupPhaseRail} aria-label="Roadmap phases">
          <p className={styles.mockupSidebarLabel}>Operating Systems</p>
          <p className={styles.mockupPhaseMode}>Exam revision · saved privately</p>
          <ol className={styles.mockupPhaseList}>
            {ROADMAP_PHASES.map((phase, index) => (
              <li
                key={phase.label}
                className={joinClasses(
                  styles.mockupPhaseItem,
                  phase.state === 'active' && styles.mockupPhaseItemActive,
                  phase.state === 'complete' && styles.mockupPhaseItemComplete,
                )}
              >
                <span className={styles.mockupPhaseIndex}>
                  {phase.state === 'complete' ? <CheckIcon className={styles.mockupIcon} /> : index + 1}
                </span>
                <span className={styles.mockupPhaseCopy}>
                  <strong>{phase.label}</strong>
                  <small>{phase.detail}</small>
                </span>
              </li>
            ))}
          </ol>
          <div className={styles.mockupSidebarNote}>
            <ShieldIcon className={styles.mockupIcon} />
            Sources are selected and authorized on the server.
          </div>
        </aside>

        <section className={styles.mockupRoadmapCanvas} aria-label="Source-cited roadmap section">
          <header className={styles.mockupCanvasHeader}>
            <div className={styles.mockupTitleBlock}>
              <p className={styles.mockupContextLabel}>Current phase</p>
              <h3 className={styles.mockupTitle}>Core concepts</h3>
              <p className={styles.mockupSubtext}>Deterministic plan built from notes this student can access.</p>
            </div>
            <span className={styles.mockupMode}>Source-cited</span>
          </header>

          <ul className={styles.mockupTaskList} aria-label="Roadmap tasks">
            <li className={styles.mockupTask}>
              <span className={styles.mockupTaskCheck}><CheckIcon className={styles.mockupIcon} /></span>
              <span className={styles.mockupTaskCopy}>
                <strong>Review process states and context switching</strong>
                <small>Cited from OS Unit 2 — Processes</small>
              </span>
            </li>
            <li className={styles.mockupTask}>
              <span className={styles.mockupTaskCheck}><CheckIcon className={styles.mockupIcon} /></span>
              <span className={styles.mockupTaskCopy}>
                <strong>Compare FCFS, SJF, priority, and round robin</strong>
                <small>Cited from Scheduling worked examples</small>
              </span>
            </li>
            <li className={styles.mockupTask}>
              <span className={joinClasses(styles.mockupTaskCheck, styles.mockupTaskPending)} />
              <span className={styles.mockupTaskCopy}>
                <strong>Solve the scheduling practice set</strong>
                <small>Keep calculations beside the cited examples</small>
              </span>
            </li>
          </ul>
        </section>

        <aside className={styles.mockupCitationPanel} aria-label="Roadmap source record">
          <h4 className={styles.mockupPanelTitle}>Source record</h4>
          <ul className={styles.mockupCitationList}>
            <li className={styles.mockupCitation}>
              <FileIcon className={styles.mockupCitationIcon} />
              <span className={styles.mockupCitationCopy}>
                <strong>OS Unit 2 — Processes</strong>
                <small>Public note</small>
              </span>
              <span className={styles.mockupCitationScope}>Available</span>
            </li>
            <li className={styles.mockupCitation}>
              <FileIcon className={styles.mockupCitationIcon} />
              <span className={styles.mockupCitationCopy}>
                <strong>Scheduling worked examples</strong>
                <small>University note</small>
              </span>
              <span className={styles.mockupCitationScope}>Authorized</span>
            </li>
          </ul>

          <div className={styles.mockupWithheld}>
            <LockIcon className={styles.mockupWithheldIcon} />
            <div>
              <strong className={styles.mockupWithheldTitle}>Section withheld</strong>
              <p className={styles.mockupWithheldCopy}>
                A source is no longer available to this viewer, so every task derived from it stays hidden.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </MockupFrame>
  )
}

export function RoomMockup({ className }: ProductMockupProps) {
  return (
    <MockupFrame className={className} surface="Study room" variant="mockupRoom">
      <div className={styles.mockupRoomLayout}>
        <section className={styles.mockupRoomMain} aria-label="Synchronized study room">
          <header className={styles.mockupRoomHeader}>
            <div className={styles.mockupTitleBlock}>
              <span className={styles.mockupLiveStatus}>
                <span className={styles.mockupStatusDot} aria-hidden="true" />
                Public room
              </span>
              <h3 className={styles.mockupTitle}>Operating Systems focus</h3>
            </div>
            <span className={styles.mockupMode}>Temporary room</span>
          </header>

          <div className={styles.mockupTimerPanel}>
            <div className={styles.mockupTimerHeader}>
              <span><ClockIcon className={styles.mockupIcon} /> Synced focus timer</span>
              <span className={styles.mockupTimer}>24:18</span>
            </div>
            <p className={styles.mockupTimerMeta}>The same clock and revision are shown to every room member.</p>
            <div className={styles.mockupTimerTrack} aria-label="Focus timer in progress">
              <span className={styles.mockupTimerFill} />
            </div>
            <div className={styles.mockupSessionTags}>
              <span className={joinClasses(styles.mockupSessionTag, styles.mockupSessionTagActive)}>Focus</span>
              <span className={styles.mockupSessionTag}>Break next</span>
              <span className={styles.mockupSessionTag}>Host can transfer</span>
            </div>
          </div>

          <div className={styles.mockupMemberRail}>
            <p className={styles.mockupPanelTitle}>In this room</p>
            <ul className={styles.mockupMemberList}>
              <li className={styles.mockupMember}>
                <span className={styles.mockupAvatar}>YO</span>
                <span className={styles.mockupMemberCopy}><strong>You</strong><small>Studying</small></span>
                <span className={styles.mockupMemberRole}>Host</span>
              </li>
              <li className={styles.mockupMember}>
                <span className={styles.mockupAvatar}>RI</span>
                <span className={styles.mockupMemberCopy}><strong>Riya</strong><small>Studying</small></span>
              </li>
              <li className={styles.mockupMember}>
                <span className={styles.mockupAvatar}>DE</span>
                <span className={styles.mockupMemberCopy}><strong>Dev</strong><small>Studying</small></span>
              </li>
            </ul>
          </div>
        </section>

        <aside className={styles.mockupChatPanel} aria-label="Temporary room chat">
          <header className={styles.mockupChatHeader}>
            <span><ChatIcon className={styles.mockupIcon} /> Room chat</span>
            <span className={styles.mockupTemporary}>Temporary</span>
          </header>
          <div className={styles.mockupChatMessages}>
            <div className={styles.mockupMessage}>
              <p className={styles.mockupMessageMeta}>Riya · now</p>
              <p className={styles.mockupMessageBubble}>Starting the scheduling questions now.</p>
            </div>
            <div className={joinClasses(styles.mockupMessage, styles.mockupMessageOwn)}>
              <p className={styles.mockupMessageMeta}>You · now</p>
              <p className={styles.mockupMessageBubble}>I’ll post the page reference after the break.</p>
            </div>
            <div className={styles.mockupMessage}>
              <p className={styles.mockupMessageMeta}>Dev · now</p>
              <p className={styles.mockupMessageBubble}>Timer matches here.</p>
            </div>
          </div>
          <div className={styles.mockupComposer} aria-label="Chat message field preview">
            <span className={styles.mockupComposerText}>Write a room message…</span>
            <span className={styles.mockupComposerAction} aria-hidden="true">↗</span>
          </div>
          <p className={styles.mockupChatNotice}>
            Chat disappears when the temporary room is purged.
          </p>
        </aside>
      </div>
    </MockupFrame>
  )
}

export function AccessMockup({ className }: ProductMockupProps) {
  return (
    <MockupFrame className={className} surface="Access controls" variant="mockupAccess">
      <section className={styles.mockupAccessBody} aria-label="Viewer and surface access matrix">
        <header className={styles.mockupAccessIntro}>
          <div className={styles.mockupTitleBlock}>
            <p className={styles.mockupContextLabel}>Viewer / surface matrix</p>
            <h3 className={styles.mockupTitle}>Access is checked before content is returned.</h3>
            <p className={styles.mockupSubtext}>
              Note scope, campus membership, roadmap sharing, and owner-only progress remain separate decisions.
            </p>
          </div>
          <span className={styles.mockupMode}><ShieldIcon className={styles.mockupIcon} /> Database enforced</span>
        </header>

        <div className={styles.mockupAccessMatrix}>
          <table className={styles.mockupAccessTable}>
            <thead>
              <tr>
                <th scope="col">Surface</th>
                <th scope="col">Signed out</th>
                <th scope="col">Student</th>
                <th scope="col">Same campus</th>
                <th scope="col">Owner</th>
              </tr>
            </thead>
            <tbody>
              {ACCESS_ROWS.map((row) => (
                <tr key={row.surface}>
                  <th scope="row" className={styles.mockupAccessSurface}>{row.surface}</th>
                  <AccessCell value={row.signedOut} />
                  <AccessCell value={row.student} />
                  <AccessCell value={row.sameCampus} />
                  <AccessCell value={row.owner} />
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <footer className={styles.mockupPolicyStrip}>
          <span className={styles.mockupPolicyItem}>
            <LockIcon className={styles.mockupPolicyIcon} /> Private files stay private
          </span>
          <span className={styles.mockupPolicyItem}>
            <ShieldIcon className={styles.mockupPolicyIcon} /> Source access is rechecked
          </span>
          <span className={styles.mockupPolicyItem}>
            <CheckIcon className={styles.mockupPolicyIcon} /> Owner progress never enters a share
          </span>
        </footer>
      </section>
    </MockupFrame>
  )
}
