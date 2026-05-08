import { getUser } from '@/app/actions/auth'
import { redirect } from 'next/navigation'
import InviteAcceptClient from '@/app/dashboard/workspace/invite/InviteAcceptClient'

export default async function InvitePage({ searchParams }: { searchParams: Promise<{ token: string }> }) {
  const { token } = await searchParams
  const user = await getUser()
  if (!user) {
    redirect(`/auth?returnTo=/dashboard/workspace/invite?token=${token}`)
  }

  return (
    <div className="h-full bg-[#0a0a0a] flex items-center justify-center p-4">
      <InviteAcceptClient token={token} userEmail={user.email!} />
    </div>
  )
}
