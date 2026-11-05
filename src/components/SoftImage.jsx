import { t } from '../i18n/runtime.js'
/** Prefer WebP when available; lazy-load by default. */
export default function SoftImage({
  src,
  alt = '',
  className,
  loading = 'lazy',
  decoding = 'async',
  width,
  height,
  fetchPriority,
  style,
}) {
  const webpSrc = typeof src === 'string' && !src.startsWith('/uploads/') && /\.(jpe?g|png)$/i.test(src)
    ? src.replace(/\.(jpe?g|png)$/i, '.webp')
    : null

  const img = (
    <img
      src={src}
      alt={t(alt)}
      className={className}
      loading={loading}
      decoding={decoding}
      width={width}
      height={height}
      fetchpriority={fetchPriority}
      style={style}
    />
  )

  if (!webpSrc) return img

  return (
    <picture className={className ? `${className}-picture` : undefined} style={style}>
      <source srcSet={webpSrc} type="image/webp" />
      {t(img)}
    </picture>
  )
}
