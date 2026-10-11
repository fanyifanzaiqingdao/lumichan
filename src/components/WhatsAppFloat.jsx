import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { whatsappUrl } from '../config/site.js'
import './WhatsAppFloat.css'

export default function WhatsAppFloat() {
  const { pathname } = useLocation()
  const href = whatsappUrl()
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    if (pathname !== '/traveler') {
      setHidden(false)
      return
    }
    const visible = new Set()
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) visible.add(entry.target.id)
        else visible.delete(entry.target.id)
      })
      setHidden(visible.size > 0)
    })
    ;['faq', 'inquiry'].forEach((id) => {
      const target = document.getElementById(id)
      if (target) observer.observe(target)
    })
    return () => observer.disconnect()
  }, [pathname])

  if (!href || pathname.startsWith('/admin') || hidden) return null

  return (
    <a
      className="wa-float"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      title="WhatsApp"
    >
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <path
          fill="currentColor"
          d="M16.1 3C9.4 3 4 8.3 4 14.9c0 2.1.6 4.1 1.6 5.9L4 29l8.4-1.6c1.7.9 3.6 1.4 5.6 1.4 6.7 0 12.1-5.3 12.1-11.9S22.8 3 16.1 3zm0 21.7c-1.8 0-3.5-.5-5-1.3l-.4-.2-5 1 1-4.8-.2-.4c-1-1.6-1.5-3.4-1.5-5.2 0-5.5 4.6-10 10.2-10s10.2 4.5 10.2 10-4.6 10-10.3 10zm5.6-7.5c-.3-.2-1.8-.9-2.1-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-.9 1.1-.2.2-.3.2-.6 0-.3-.2-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5 0-.2-.7-1.7-1-2.3-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.4s1 2.8 1.2 3c.1.2 2 3.1 4.9 4.3 1.7.7 2.4.8 3.3.7.5-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4 0-.1-.2-.2-.5-.4z"
        />
      </svg>
    </a>
  )
}
