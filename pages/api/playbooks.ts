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

    res.json({
      title: data.title,
      author: data.authors.join(', '),
      desc: convert(data.description, {
        wordwrap: false
      }),
      published: data.publishedDate
    })
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