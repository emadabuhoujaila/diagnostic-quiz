import { Link } from 'react-router-dom'
import { PLATFORM_NAME } from '../lib/constants'

export function ConfigBanner({ configured }) {
  if (configured) return null
  return (
    <div className="config-banner" role="status">
      Firebase غير مربوط بعد — انسخ <code>.env.example</code> إلى{' '}
      <code>.env.local</code> وأضف مفاتيح المشروع.
    </div>
  )
}

export function BrandMark({ size = 'md' }) {
  return (
    <Link to="/" className={`brand brand-${size}`}>
      <span className="brand-mark" aria-hidden="true" />
      <span className="brand-text">{PLATFORM_NAME}</span>
    </Link>
  )
}
