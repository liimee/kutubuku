import client from "@/utils/prisma";
import { NextApiRequest, NextApiResponse } from "next";
import { unstable_getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]";

export default async function bookInfo(req: NextApiRequest, res: NextApiResponse) {
  const session = await unstable_getServerSession(req, res, authOptions)

  if (session) {
    if (req.method === 'POST') {
      try {
        await client.book.update({
          where: {
            id: req.query.id as string
          },
          data: {
            title: req.body.title,
            desc: req.body.desc
          }
        })

        res.send('ok')
      } catch(_) {
        res.status(500).send('no :(')
      }
    } else {
      res.json(await client.book.findUnique({
        where: {
          id: req.query.id as string
        }
      }))
    }
  } else {
    res.status(401).send('Unauthorized :)');
  }
}