export default function ReviewPreview() {
  return <div className="review-grid">{[1, 2, 3].map((number) => <article className="review-preview" key={number}>
    <div className="review-preview__image"><img src="/images/guest-photo-placeholder.svg" alt="Illustrative photo placeholder, not a customer photograph" width="1600" height="1000" loading="lazy" /><span>PHOTO PLACEHOLDER 0{number}</span></div>
    <div className="review-card__body"><h3>Review slot 0{number}</h3><p>Reserved for an authorized traveler story and photograph.</p><small>Design preview only. No testimonial or customer identity is represented. Unpublished slots are hidden in production.</small></div>
  </article>)}</div>
}
