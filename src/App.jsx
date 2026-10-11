import { Suspense, lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import WhatsAppFloat from './components/WhatsAppFloat.jsx'
import Seo from './components/Seo.jsx'
import Home from './pages/Home.jsx'

const AiPlanner = lazy(() => import('./pages/AiPlanner.jsx'))
const FindGuides = lazy(() => import('./pages/FindGuides.jsx'))
const Itineraries = lazy(() => import('./pages/Itineraries.jsx'))
const Contact = lazy(() => import('./pages/Contact.jsx'))
const About = lazy(() => import('./pages/About.jsx'))
const BecomeGuide = lazy(() => import('./pages/BecomeGuide.jsx'))
const Admin = lazy(() => import('./pages/Admin.jsx'))

const Careers = lazy(async () => {
  const [{ default: SimplePage }, { default: careers }] = await Promise.all([
    import('./pages/SimplePage.jsx'),
    import('./content/careers.js'),
  ])
  return {
    default: function CareersPage() {
      return <SimplePage title={careers.title} blocks={careers.blocks} />
    },
  }
})

const BookingTerms = lazy(async () => {
  const [{ default: SimplePage }, { default: bookingTerms }] = await Promise.all([
    import('./pages/SimplePage.jsx'),
    import('./content/bookingTerms.js'),
  ])
  return {
    default: function BookingTermsPage() {
      return (
        <SimplePage
          title={bookingTerms.title}
          updated={bookingTerms.updated}
          blocks={bookingTerms.blocks}
        />
      )
    },
  }
})

const Privacy = lazy(async () => {
  const [{ default: SimplePage }, { default: privacyPolicy }] = await Promise.all([
    import('./pages/SimplePage.jsx'),
    import('./content/privacyPolicy.js'),
  ])
  return {
    default: function PrivacyPage() {
      return (
        <SimplePage
          title={privacyPolicy.title}
          updated={privacyPolicy.updated}
          blocks={privacyPolicy.blocks}
        />
      )
    },
  }
})

const Terms = lazy(async () => {
  const [{ default: SimplePage }, { default: termsOfUse }] = await Promise.all([
    import('./pages/SimplePage.jsx'),
    import('./content/termsOfUse.js'),
  ])
  return {
    default: function TermsPage() {
      return (
        <SimplePage
          title={termsOfUse.title}
          updated={termsOfUse.updated}
          blocks={termsOfUse.blocks}
        />
      )
    },
  }
})

function PageFallback() {
  return (
    <div className="route-fallback" role="status" aria-live="polite">
      Loading…
    </div>
  )
}

export default function App() {
  return (
    <>
      <Seo />
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/" element={<Navigate to="/traveler" replace />} />
          <Route path="/traveler" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="ai-planner" element={<AiPlanner />} />
            <Route path="guides" element={<FindGuides />} />
            <Route path="itineraries" element={<Itineraries />} />
            <Route path="about" element={<About />} />
            <Route path="contact" element={<Contact />} />
            <Route path="careers" element={<Careers />} />
            <Route path="booking-terms" element={<BookingTerms />} />
            <Route path="privacy" element={<Privacy />} />
            <Route path="terms" element={<Terms />} />
          </Route>
          <Route path="/guide" element={<BecomeGuide />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<Navigate to="/traveler" replace />} />
        </Routes>
      </Suspense>
      <WhatsAppFloat />
    </>
  )
}
