import { useTranslation } from 'react-i18next'
import { Check, X } from 'lucide-react'
import { useFriends } from '@/store/friends'
import RequestRow from './RequestRow'
import { RequestAction, Section } from './RequestSection'

export default function FriendRequests() {
  const { t } = useTranslation()
  const { incoming, outgoing, accept, decline } = useFriends()

  if (incoming.length === 0 && outgoing.length === 0) {
    return (
      <p className="px-4 py-8 text-center text-sm text-muted-foreground">
        {t('friends.requests.empty')}
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-2 p-2">
      {incoming.length > 0 && (
        <Section title={t('friends.requests.incoming')}>
          {incoming.map((f) => (
            <RequestRow
              key={f.id}
              name={f.requester.username}
              avatar={f.requester.avatar}
              actions={
                <>
                  <RequestAction
                    tone="primary"
                    title={t('friends.requests.accept')}
                    onClick={() => void accept(f.id)}
                  >
                    <Check className="size-4" />
                  </RequestAction>
                  <RequestAction
                    tone="destructive"
                    title={t('friends.requests.decline')}
                    onClick={() => void decline(f.id)}
                  >
                    <X className="size-4" />
                  </RequestAction>
                </>
              }
            />
          ))}
        </Section>
      )}

      {outgoing.length > 0 && (
        <Section title={t('friends.requests.outgoing')}>
          {outgoing.map((f) => (
            <RequestRow
              key={f.id}
              name={f.addressee.username}
              avatar={f.addressee.avatar}
              actions={
                <RequestAction
                  tone="destructive"
                  title={t('friends.requests.cancel')}
                  onClick={() => void decline(f.id)}
                >
                  <X className="size-4" />
                </RequestAction>
              }
            />
          ))}
        </Section>
      )}
    </div>
  )
}
