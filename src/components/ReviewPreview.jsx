const examples = [
  { image: '/images/home-v22/story-vlog-01-01.webp', quote: 'We wanted time to stop when the mountains surprised us. The sample itinerary gives that freedom a shape.', context: 'Illustrative road trip scenario · No customer attribution' },
  { image: '/images/home-v22/story-vlog-02-01.webp', quote: 'A slower day with local context made the place feel easier to understand.', context: 'Illustrative culture journey scenario · No customer attribution' },
  { image: '/images/home-v22/why-pandas.webp', quote: 'The planning notes helped us know what to expect before we arrived.', context: 'Illustrative family journey scenario · No customer attribution' },
]
export default function ReviewPreview() {
  return <div className="review-grid">{examples.map((item,index) => <article className="review-preview" key={index}>
    <div className="review-preview__image"><img src={item.image} alt="AI illustrative travel scene, not a customer photograph" width="1600" height="1000" loading="lazy" /><span>AI ILLUSTRATION</span></div>
    <div className="review-card__body"><strong className="home-sample-label">SAMPLE / FICTIONAL COPY · NOT A CUSTOMER REVIEW</strong><p>“{item.quote}”</p><small>{item.context}</small></div>
  </article>)}</div>
}
