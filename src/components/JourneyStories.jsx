import JourneyGallery from './JourneyGallery.jsx'

export default function JourneyStories({ stories = [], copy = {} }) {
  return <div className="home-stories">
    <p className="eyebrow">{copy.eyebrow || 'Journey Stories'}</p>
    <h3 className="font-serif">{copy.title || 'Three moments from the road'}</h3>
    <div className="home-story-grid">{stories.filter((story) => story.enabled !== false).map((story) => <article className="home-story-card" key={story.id}>
      <div className="home-story-media"><JourneyGallery images={story.frames} intervalMs={story.intervalMs} label={story.title} /><span className="home-story-label">AI IMAGE SEQUENCE</span></div>
      <div className="home-story-body"><h4>{story.title}</h4><p>{story.description}</p></div>
    </article>)}</div>
  </div>
}
