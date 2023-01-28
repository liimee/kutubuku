import NextAuth, { Session } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials";
import crypto from 'crypto';
import client from '../../../utils/prisma';
import { JWT } from "next-auth/jwt";

function hash(str: string) {
  return crypto.createHash('sha256').update(str).digest('hex');
}

export const authOptions = {
  // Configure one or more authentication providers
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, _) {
        if (credentials) {
          return await client.user.findFirst({
            where: {
              username: credentials.username,
              password: hash(credentials.password)
            },
            select: {
              username: true,
              id: true
            }
          })
        } else return null
      }
    })
  ],
  pages: {
    signIn: '/signin'
  },
  callbacks: {
    async session({ session, token }: {
      session: Session
      token: JWT
    }) {
      session.user.id = (await client.user.findFirst({ where: { id: token.id as string } }))?.id
      return session
    }
  }
}

export default NextAuth(authOptions)