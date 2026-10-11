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
  const webpSrc = /\.(jpe?g|png)$/i.test(src) ? src.replace(/\.(jpe?g|png)$/i, '.webp') : null

  const img = (
    <img
      src={src}
      alt={alt}
      className={className}
      loading={loading}
      decoding={decoding}
      width={width}
      height={height}
      fetchPriority={fetchPriority}
      style={style}
    />
  )

  if (!webpSrc) return img

  return (
    <picture className={className ? `${className}-picture` : undefined} style={style}>
      <source srcSet={webpSrc} type="image/webp" />
      {img}
    </picture>
  )
}
