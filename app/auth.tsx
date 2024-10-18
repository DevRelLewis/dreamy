import { getServerSession } from "next-auth/next"

export async function Auth() {
  const session = await getServerSession()

  if (session) {
    return <p>Signed in as {session.user?.email}</p>
  }
  return <p>Not signed in</p>
}