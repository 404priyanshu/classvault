import styles from './Clubhouse.module.css'

export function AccessChapter() {
  return (
    <section id="access" className={styles.accessSection} aria-labelledby="access-title">
      <div className={styles.accessHeader}>
        <span className={styles.eyebrow}>Good vibes. Thoughtful boundaries.</span>
        <h2 id="access-title">Make yourself<br />at home.</h2>
        <p>Share what helps. Keep private things private. A few things to know before you settle in.</p>
      </div>
      <div className={styles.faqList}>
        <details open>
          <summary>Is my university on ClassVault?</summary>
          <p>We’re starting with Bennett University and growing one campus at a time. A confirmed academic email can verify your university membership and unlock campus-only notes and rooms.</p>
        </details>
        <details>
          <summary>Who can see the notes I share?</summary>
          <p>You choose public or university access. Public notes are available to eligible signed-in students; university notes stay with verified members of that campus. Files are delivered through private, short-lived links.</p>
        </details>
        <details id="vault">
          <summary>Can I take my notes back?</summary>
          <p>Yes. Manage your uploads in <a href="/dashboard/vault">My Vault</a>. Deleted notes move to Trash, where you have 30 days to restore them. Your files have a way back.</p>
        </details>
        <details>
          <summary>What happens when I share a roadmap?</summary>
          <p>Your task progress stays private. Shared plans only show sections whose source notes the viewer can access, and you can revoke a sharing link.</p>
        </details>
        <details>
          <summary>What if something doesn’t belong here?</summary>
          <p>You can report a note privately from its detail page. Campus and platform moderators review reports within their roles. For copyright concerns, use our <a href="/legal/takedown">content report page</a>.</p>
        </details>
      </div>
    </section>
  )
}
