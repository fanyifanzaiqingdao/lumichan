import { Suspense, lazy } from 'react'
import { Outlet, useLocation, useParams } from 'react-router-dom'
import { Navigate, Route, Routes } from './i18n/router.jsx'
import Layout from './components/Layout.jsx'
import SupportChat from './components/SupportChat.jsx'
import Seo from './components/Seo.jsx'
import { LANGUAGE_PREFIXES } from './i18n/locales.js'
import { t } from './i18n/runtime.js'
import { journeyPath } from './lib/journeys.js'
import { useLanguage } from './i18n/LanguageProvider.jsx'
import Home from './pages/Home.jsx'

const AiPlanner = lazy(() => import('./pages/AiPlanner.jsx'))
const FindGuides = lazy(() => import('./pages/FindGuides.jsx'))
const Itineraries = lazy(() => import('./pages/Itineraries.jsx'))
const Contact = lazy(() => import('./pages/Contact.jsx'))
const About = lazy(() => import('./pages/About.jsx'))
const BecomeGuide = lazy(() => import('./pages/BecomeGuide.jsx'))
const Admin = lazy(() => import('./pages/Admin.jsx'))
const SupportCenter = lazy(() => import('./pages/SupportCenter.jsx'))
const Services = lazy(() => import('./pages/Services.jsx'))
const Journeys = lazy(() => import('./pages/Journeys.jsx'))

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
      {t('Loading…')}
    </div>
  )
}

function JourneyRedirect() {
  const { slug } = useParams()
  const location = useLocation()
  return <Navigate to={journeyPath(slug) + location.search + location.hash} replace />
}

function PublicLocaleGuard() {
  const { locale } = useParams()
  return locale && !LANGUAGE_PREFIXES.includes(locale) ? <Navigate to="/" replace /> : <Outlet />
}
function HomeRedirect() {
  const { search, hash } = useLocation()
  return <Navigate to={'/' + search + hash} replace />
}

export default function App() {
  useLanguage() // Re-render display text without remounting routes or losing form drafts.
  return (
    <>
      <Seo />
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/:locale?" element={<PublicLocaleGuard />}>
          <Route element={<Layout />}><Route index element={<Home />} /></Route>
          <Route path="services" element={<Navigate to="/traveler/services" replace />} />
          <Route element={<Layout />}>
            <Route path="journeys" element={<Journeys />} />
            <Route path="journeys/:slug" element={<Journeys />} />
          </Route>
          <Route path="privacy" element={<Navigate to="/traveler/privacy" replace />} />
          <Route path="booking-terms" element={<Navigate to="/traveler/booking-terms" replace />} />
          <Route path="terms" element={<Navigate to="/traveler/terms" replace />} />
          <Route path="traveler" element={<Layout />}>
            <Route index element={<HomeRedirect />} />
            <Route path="ai-planner" element={<AiPlanner />} />
            <Route path="guides" element={<FindGuides />} />
            <Route path="itineraries" element={<Itineraries />} />
            <Route path="services" element={<Services />} />
            <Route path="journeys" element={<JourneyRedirect />} />
            <Route path="journeys/:slug" element={<JourneyRedirect />} />
            <Route path="about" element={<About />} />
            <Route path="contact" element={<Contact />} />
            <Route path="careers" element={<Careers />} />
            <Route path="booking-terms" element={<BookingTerms />} />
            <Route path="privacy" element={<Privacy />} />
            <Route path="terms" element={<Terms />} />
          </Route>
          <Route path="guide" element={<BecomeGuide />} />
          </Route>
          <Route path="/admin" element={<Admin />} />
          <Route path="/support" element={<SupportCenter />} />
          <Route path="*" element={<Navigate to="/traveler" replace />} />
        </Routes>
      </Suspense>
      <SupportChat />
    </>
  )
}
