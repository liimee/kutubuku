import client from "@/utils/prisma";
import { NextApiRequest, NextApiResponse } from "next";
import { unstable_getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]";

export default async function updateProgress(req: NextApiRequest, res: NextApiResponse) {
  const session = await unstable_getServerSession(req, res, authOptions)

  if (session) {
    await client.progress.upsert({
      create: {
        bookId: req.query.id as string,
        userId: session.user.id as string,
        progress: parseFloat(req.body) || 0
      },
      update: {
        progress: parseFloat(req.body) || 0
      },
      where: {
        userId_bookId: {
          userId: session.user.id as string,
          bookId: req.query.id as string
        }
      }
    })

    res.send('ok?')
  } else {
    res.status(401).send('Unauthorized :)');
  }
}