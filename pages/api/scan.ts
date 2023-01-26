import type { NextApiRequest, NextApiResponse } from 'next';
import scan from '@/utils/scan';
import { authOptions } from "./auth/[...nextauth]"
import { unstable_getServerSession } from "next-auth/next"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await unstable_getServerSession(req, res, authOptions)

  if (session) {
    scan();

    res.status(200).json({ message: '(hopefully) ok' });
  } else {
    res.status(401).send('Unauthorized :)');
  }
}