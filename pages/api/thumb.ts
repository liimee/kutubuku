import { readFileSync } from "fs";
import { NextApiRequest, NextApiResponse } from "next";
import { unstable_getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";
import path from "path";

export default async function allBooks(req: NextApiRequest, res: NextApiResponse) {
  const session = await unstable_getServerSession(req, res, authOptions)
  const { id } = req.query;

  if (session && id) {
    res.send(readFileSync(path.join(process.cwd(), 'thumbnails', id.toString() + '.jpg')))
  } else {
    res.status(401).send('Unauthorized :)');
  }
}