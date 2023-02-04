import client from "@/utils/prisma";
import { NextApiRequest, NextApiResponse } from "next";
import { unstable_getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";
import crypto from 'crypto';

export default async function allBooks(req: NextApiRequest, res: NextApiResponse) {
  const session = await unstable_getServerSession(req, res, authOptions)

  if (session) {
    if(req.method === 'POST') {
      client.user.update({
        where: {
          id: session.user.id
        },
        data: {
          password: crypto.createHash('sha256').update(req.body).digest('hex')
        }
      }).then(() => {
        res.send('ok')
      }).catch(() => res.status(500).send('not ok'))
    }
  } else {
    res.status(401).send('Unauthorized :)');
  }
}