import client from "@/utils/prisma";
import { NextApiRequest, NextApiResponse } from "next";
import { unstable_getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]";

export default async function updateProgress(req: NextApiRequest, res: NextApiResponse) {
  const session = await unstable_getServerSession(req, res, authOptions)

  if (session) {
    if (req.method === 'POST') {
      const exists = await client.progress.findUnique({
        where: {
          userId_bookId: {
            bookId: req.query.id as string,
            userId: session.user.id as string,
          }
        }
      })

      if (exists) {
        if (new Date(exists.lastUpdated) > new Date(req.body.now)) {
          res.send('db is newer :)');
          return;
        }
      }

      await client.progress.upsert({
        create: {
          bookId: req.query.id as string,
          userId: session.user.id as string,
          progress: req.body.progress || 0,
          lastUpdated: req.body.now
        },
        update: {
          progress: req.body.progress || 0,
          lastUpdated: req.body.now
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
      res.json(await client.progress.findFirst({
        where: {
          userId: session.user.id,
          bookId: req.query.id as string
        },
        select: {
          progress: true,
          lastUpdated: true,
        }
      }))
    }
  } else {
    res.status(401).send('Unauthorized :)');
  }
}