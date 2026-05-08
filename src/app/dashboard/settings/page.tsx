import { getUser, getActiveSessions } from '@/app/actions/auth'
import { redirect } from 'next/navigation'
import SettingsClient from './SettingsClient'

export default async function SettingsPage() {
  const user = await getUser()
  if (!user) redirect('/auth')

  const { data: sessions } = await getActiveSessions()

  return (
    <div className="h-full bg-[#0a0a0a]">
      <SettingsClient 
        user={user}
        initialSessions={sessions || []}
      />
    </div>
  )
}
