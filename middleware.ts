import { NextRequest } from 'next/server'
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'

// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
  const { isAuthenticated } = getKindeServerSession()
  
  // If the user is not authenticated and trying to access protected routes
  if (!(await isAuthenticated())) {
    return Response.redirect(new URL('/', request.url))
  }
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    '/chat/:path*',
    '/admin/:path*',
    '/api/dreamy/:path*',
    '/api/dalle/:path*',
    '/api/process-query/:path*'
  ],
}