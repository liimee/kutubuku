import client from "@/prisma";
import { NextApiRequest, NextApiResponse } from "next";
import { unstable_getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";

export default async function allBooks(req: NextApiRequest, res: NextApiResponse) {
  const session = await unstable_getServerSession(req, res, authOptions)

  if (session) {
    res.json(
      await client.book.findMany(
        {
          select: {
            title: true,
            author: true,
            desc: false,
            id: true,
            path: false
          }
        }
      )
    )
  } else {
    res.status(401).send('Unauthorized :)');
  }
}