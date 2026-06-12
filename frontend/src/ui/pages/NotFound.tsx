import { Compass, Home } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import ErrorPage from './ErrorPage.tsx'

/** Shown for any unknown URL (the app only lives at `/`). */
export default function NotFound() {
  const { t } = useTranslation()
  return (
    <ErrorPage
      icon={Compass}
      code="404"
      title={t('errors.notFoundTitle')}
      description={t('errors.notFoundDescription')}
      actionLabel={t('errors.goHome')}
      actionIcon={Home}
      onAction={() => {
        window.location.href = '/'
      }}
    />
  )
}
