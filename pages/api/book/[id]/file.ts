import client from "@/utils/prisma";
import { createReadStream, existsSync, statSync } from "fs";
import { NextApiRequest, NextApiResponse } from "next";
import { unstable_getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]";
import { extname } from 'path';

export default async function bookInfo(req: NextApiRequest, res: NextApiResponse) {
  const session = await unstable_getServerSession(req, res, authOptions)

  if (session) {
    const path = (await client.book.findUnique({
      where: {
        id: req.query.id as string
      }
    }))?.path

    if (path && existsSync(path)) {
      const stat = statSync(path);

      res.writeHead(200, {
        'Content-Type': extname(path) === '.epub' ? 'application/epub+zip' : 'application/pdf',
        'Content-Length': stat.size
      })

      createReadStream(path).pipe(res);
    } else {
      res.status(404).send('File/book does not exist')
    }
  } else {
    res.status(401).send('Unauthorized :)');
  }
}

export const config = {
  api: {
    responseLimit: false,
  },
}