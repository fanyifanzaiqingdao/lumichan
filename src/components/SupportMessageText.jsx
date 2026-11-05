import { href } from '../i18n/router.jsx'
import { t } from '../i18n/runtime.js'
export default function SupportMessageText({ text }) {
  return text.split('\n').map((line, index) => <span key={index}>
    {index > 0 && '\n'}
    {/^\/traveler(?:[\/#][a-zA-Z0-9_/#-]*)?$/.test(line)
      ? <a href={href(line)} target="_blank" rel="noreferrer">{t('View details')}</a>
      : line}
  </span>)
}
