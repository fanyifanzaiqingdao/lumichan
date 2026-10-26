import { useEffect, useState } from 'react'
import defaultHomepage from '../data/homepage.js'
import { normalizeHomepage } from '../lib/homepageContent.js'
import BookingPolicy from './BookingPolicy.jsx'

export default function ServicePolicies() {
  const [homepage, setHomepage] = useState(defaultHomepage)
  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/homepage.php', { signal: controller.signal })
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((data) => { if (data.homepage) setHomepage(normalizeHomepage(data.homepage)) })
      .catch(() => {})
    return () => controller.abort()
  }, [])
  return <div id="service-policies">
    {homepage.services.map((service) => <section key={service.id} id={service.id + '-policy'}>
      <h3>{service.title}</h3><BookingPolicy service={service} version={homepage.bookingPolicyVersion} plain />
    </section>)}
  </div>
}
