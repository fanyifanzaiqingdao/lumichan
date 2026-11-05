import { t } from '../i18n/runtime.js'
export default function JourneyMedia({ media, hero = false, className = '', caption = true }) {
  if (!media?.src) return null
  return <figure className={'jv-media ' + className} style={{'--jv-focus':media.focalPoint || '50% 50%','--jv-mobile-focus':media.mobileFocalPoint || media.focalPoint || '50% 50%'}}>
    <picture>{media.mobileSrc && <source media="(max-width: 600px)" srcSet={media.mobileSrc}/>}<img src={media.src} alt={t(media.alt || media.caption || '')} width="1600" height="1000" loading={hero ? 'eager' : 'lazy'} fetchpriority={hero ? 'high' : undefined} decoding="async" /></picture>
    {media.illustrative && <span className="jv-image-note">{t('AI illustration')}</span>}
    {caption && media.caption && <figcaption>{t(media.caption)}</figcaption>}
  </figure>
}
