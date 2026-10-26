import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react'
import SoftImage from './SoftImage.jsx'

export default function JourneyGallery({ images = [] }) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const [visible, setVisible] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const root = useRef(null)
  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReducedMotion(motion.matches)
    update()
    motion.addEventListener('change', update)
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.2 })
    observer.observe(root.current)
    return () => { motion.removeEventListener('change', update); observer.disconnect() }
  }, [])
  const rotating = !paused && !hovered && !focused && !reducedMotion && visible && images.length > 1
  useEffect(() => {
    if (!rotating) return
    const timer = window.setInterval(() => {
      if (!document.hidden) setIndex((value) => (value + 1) % images.length)
    }, 5000)
    return () => window.clearInterval(timer)
  }, [rotating, images.length])
  const current = index % Math.max(images.length, 1)
  const move = (offset) => { setPaused(true); setIndex((current + offset + images.length) % images.length) }
  return <div ref={root} className="journey-gallery" role="region" aria-roledescription="carousel" aria-label="Journeys with Lumichan"
    onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
    onFocusCapture={() => setFocused(true)} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false) }}>
    <div className="journey-gallery__slides" aria-live={rotating ? 'off' : 'polite'}>
      {images.map((image, position) => <div key={image.src + position} hidden={position !== current} role="group" aria-roledescription="slide" aria-label={`${position + 1} of ${images.length}`}>
        <SoftImage src={image.src} alt={image.alt} width={1536} height={1024} />
        {image.aiGenerated && <span className="ai-image-label">AI-generated illustration</span>}
      </div>)}
    </div>
    {images.length > 1 && <div className="journey-gallery__controls">
      <button type="button" title="Previous image" aria-label="Previous image" onClick={() => move(-1)}><ChevronLeft size={20} /></button>
      <div className="journey-gallery__dots">{images.map((image, position) => <button key={position} type="button" title={image.alt} aria-label={`Show image ${position + 1}`} aria-current={position === current ? 'true' : undefined} onClick={() => { setPaused(true); setIndex(position) }}><span /></button>)}</div>
      {!reducedMotion && <button type="button" title={paused ? 'Play slideshow' : 'Pause slideshow'} aria-label={paused ? 'Play slideshow' : 'Pause slideshow'} onClick={() => setPaused((value) => !value)}>{paused ? <Play size={18} /> : <Pause size={18} />}</button>}
      <button type="button" title="Next image" aria-label="Next image" onClick={() => move(1)}><ChevronRight size={20} /></button>
    </div>}
  </div>
}
