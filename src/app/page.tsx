import Navbar from '../sections/Navbar'
import Hero from '../sections/Hero'
import UniversityTicker from '../sections/UniversityTicker'
import HowItWorks from '../sections/HowItWorks'
import Features from '../sections/Features'
import RoadmapDemo from '../sections/RoadmapDemo'
import StudyRoom from '../sections/StudyRoom'
import MarginNotes from '../sections/MarginNotes'
import Pricing from '../sections/Pricing'
import FAQ from '../sections/FAQ'
import Footer from '../sections/Footer'
import InteractiveFX from '../sections/InteractiveFX'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#f6f1e5] text-[#171512] antialiased">
      <InteractiveFX />
      <Navbar />
      <main>
        <Hero />
        <UniversityTicker />
        <HowItWorks />
        <Features />
        <RoadmapDemo />
        <StudyRoom />
        <MarginNotes />
        <Pricing />
        <FAQ />
      </main>
      <Footer />
    </div>
  )
}
