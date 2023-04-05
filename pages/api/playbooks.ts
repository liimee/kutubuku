import { NextApiRequest, NextApiResponse } from "next";
import Cors from 'cors';
import { GoogleBooksAPI } from "google-books-js";
import { convert } from "html-to-text";

export default async function PlayBooks(req: NextApiRequest, res: NextApiResponse) {
  await runMiddleware(req, res, cors);

  const books = new GoogleBooksAPI();

  try {
    const volume = await books.getVolume(req.body.id);
    const data = volume.volumeInfo;

    const response: any = {
      title: data.title,
      author: data.authors.join(', '),
      desc: convert(data.description, {
        wordwrap: false
      }),
      published: data.publishedDate,
      cover: null
    };

    if (req.body.withCover) {
      const cover = await fetch(data.imageLinks.thumbnail);
      const buff = await cover.arrayBuffer();
      const actualBuffer = Buffer.from(buff);

      response.cover = `data:image/jpeg;base64,${actualBuffer.toString('base64')}`;
    }

    res.json(response)
  } catch (e) {
    console.log(e);

    res.status(400).json({
      error: true
    })
  }
}

const cors = Cors({
  methods: ['POST'],
})

function runMiddleware(
  req: NextApiRequest,
  res: NextApiResponse,
  fn: Function
) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result)
      }

      return resolve(result)
    })
  })
}

export const config = {
  api: {
    responseLimit: '10mb',
  },
}