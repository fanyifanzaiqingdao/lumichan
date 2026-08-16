import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import WhatsAppFloat from './components/WhatsAppFloat.jsx'
import Home from './pages/Home.jsx'
import AiPlanner from './pages/AiPlanner.jsx'
import FindGuides from './pages/FindGuides.jsx'
import Itineraries from './pages/Itineraries.jsx'
import Contact from './pages/Contact.jsx'
import BecomeGuide from './pages/BecomeGuide.jsx'
import Admin from './pages/Admin.jsx'

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/traveler" replace />} />
        <Route path="/traveler" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="ai-planner" element={<AiPlanner />} />
          <Route path="guides" element={<FindGuides />} />
          <Route path="itineraries" element={<Itineraries />} />
          <Route path="contact" element={<Contact />} />
        </Route>
        <Route path="/guide" element={<BecomeGuide />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<Navigate to="/traveler" replace />} />
      </Routes>
      <WhatsAppFloat />
    </>
  )
}
