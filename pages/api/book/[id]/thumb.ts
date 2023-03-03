import { NextApiRequest, NextApiResponse } from "next";
import path from "path";
import fs from 'fs';

export default async function Thumbnail(req: NextApiRequest, res: NextApiResponse) {
  const file = path.resolve(process.cwd(), 'thumbnails', req.query.id as string + '.jpg');
  try {
    const imageBuffer = fs.readFileSync(file);

    res.setHeader('Content-Type', 'image/jpg');
    res.send(imageBuffer);
  } catch (e) {
    res.status(404).send('shrug')
  }
}