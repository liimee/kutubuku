import client from "@/utils/prisma";
import { existsSync, unlinkSync } from "fs";
import { NextApiRequest, NextApiResponse } from "next";
import { unstable_getServerSession } from "next-auth/next";
import path from "path";
import { authOptions } from "../../auth/[...nextauth]";

// @ts-ignore
import img from 'image-data-uri';

export default async function bookInfo(req: NextApiRequest, res: NextApiResponse) {
  const session = await unstable_getServerSession(req, res, authOptions)

  if (session) {
    if (req.method === 'POST') {
      try {
        if (req.body.img) {
          img.outputFile(req.body.img, path.join('./', 'thumbnails', req.query.id + '.jpg'));
        }

        if (req.body.img !== undefined) delete req.body.img;

        await client.book.update({
          where: {
            id: req.query.id as string
          },
          data: req.body
        })

        res.send('ok')
      } catch (_) {
        res.status(500).send('no :(')
      }
    } else if (req.method === 'DELETE') {
      try {
        await client.progress.deleteMany({
          where: {
            bookId: req.query.id as string
          }
        })

        await client.book.delete({
          where: {
            id: req.query.id as string
          }
        })

        try {
          const p = path.join('./', 'thumbnails', req.query.id as string + '.jpg');
          if (existsSync(p)) {
            unlinkSync(p);
          }
        } catch (_) { }

        res.send('ok')
      } catch (e) {
        console.log(e)
        res.status(500).send('no :(')
      }
    } else {
      const dbRes = await client.book.findUnique({
        where: {
          id: req.query.id as string
        },
        include: {
          BookProgress: {
            where: {
              userId: session.user.id
            },
            take: 1
          }
        }
      })

      if (!dbRes) {
        res.status(404).send('Book does not exist');
      } else {
        res.json(dbRes)
      }
    }
  } else {
    res.status(401).send('Unauthorized :)');
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb'
    }
  },
}