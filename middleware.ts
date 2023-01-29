export { default } from "next-auth/middleware"

export const config = {
  matcher: ['/((?!\/?signin|manifest.json|icons|.+\.(?:js|map)).*)']
}