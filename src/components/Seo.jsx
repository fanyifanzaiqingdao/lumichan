import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { SITE } from '../config/site.js'

const DEFAULT = {
  title: 'Lumichan — Private Journeys in China & Western Sichuan',
  description:
    'Lumichan designs private, tailor-made journeys in China. Rooted in Chengdu and Western Sichuan — travel through what you do, not what you see.',
}

const ROUTES = {
  '/traveler': DEFAULT,
  '/traveler/': DEFAULT,
  '/traveler/about': {
    title: 'About Lumichan — Go Deeper. Travel Personally.',
    description:
      'Learn about Lumichan’s vision and team. Private journeys connecting travelers with a deeper, more human side of China.',
  },
  '/traveler/itineraries': {
    title: 'Itineraries — Private Journeys by Lumichan',
    description:
      'Browse Lumichan’s private itineraries across Western Sichuan and beyond. Travel through what you do, not what you see.',
  },
  '/traveler/contact': {
    title: 'Book a Consultation — Lumichan',
    description:
      'Contact Lumichan to plan a private, tailor-made journey in China. Email jin.lu@lumichan.com.cn.',
  },
  '/traveler/careers': {
    title: 'Careers — Join Lumichan',
    description:
      'Join Lumichan in creating meaningful travel experiences in China. Send your CV to jasonlee@lumichan.com.cn.',
  },
  '/traveler/booking-terms': {
    title: 'Booking Terms and Conditions — Lumichan',
    description: 'Booking terms and conditions for Lumichan private journeys.',
  },
  '/traveler/privacy': {
    title: 'Privacy Policy — Lumichan',
    description: 'How Lumichan collects, uses and protects your personal information.',
  },
  '/traveler/terms': {
    title: 'Terms of Use — Lumichan',
    description: 'Terms of use for the Lumichan website.',
  },
  '/guide': {
    title: 'Become a Guide — Lumichan',
    description: 'Apply to become a Lumichan local guide and share China’s living cultures with travelers.',
  },
}

function setMeta(name, content, attr = 'name') {
  if (!content) return
  let el = document.head.querySelector(`meta[${attr}="${name}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, name)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function setCanonical(url) {
  let el = document.head.querySelector('link[rel="canonical"]')
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', 'canonical')
    document.head.appendChild(el)
  }
  el.setAttribute('href', url)
}

export default function Seo() {
  const { pathname } = useLocation()

  useEffect(() => {
    const page = ROUTES[pathname] || DEFAULT
    const url = `${SITE.siteUrl}${pathname === '/' ? '/traveler' : pathname}`

    document.title = page.title
    setMeta('description', page.description)
    setMeta('og:title', page.title, 'property')
    setMeta('og:description', page.description, 'property')
    setMeta('og:url', url, 'property')
    setCanonical(url)
  }, [pathname])

  return null
}
