import { AccessChapter } from './AccessChapter'
import { AccountSteps } from './AccountSteps'
import { CapabilityRail } from './CapabilityRail'
import { HeroSystem } from './HeroSystem'
import { LandingFooter } from './LandingFooter'
import { LandingHeader } from './LandingHeader'
import { ProductChapters } from './ProductChapters'
import { ProductWalkthrough } from './ProductWalkthrough'
import styles from './Clubhouse.module.css'

export function LandingPage() {
  return (
    <div className={styles.page} data-landing-page>
      <a className={styles.skipLink} href="#landing-main">Skip to content</a>
      <LandingHeader />
      <main id="landing-main">
        <HeroSystem />
        <CapabilityRail />
        <ProductChapters />
        <ProductWalkthrough />
        <AccessChapter />
        <AccountSteps />
      </main>
      <LandingFooter />
    </div>
  )
}
