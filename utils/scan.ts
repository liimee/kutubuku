import { existsSync, lstatSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import glob from 'glob';
import { GoogleBooksAPI } from "google-books-js";
import path from "path";
import client from './prisma';

// @types/pdfinfo does not exist?
// @ts-ignore
import pdfinfo from 'pdfinfo';

export default function scan() {
  const books = readFileSync(path.join('./', 'books.txt'), 'utf8').split('\n');

  const gBookApi = new GoogleBooksAPI();

  const thumbnailPath = path.join('./', 'public', 'thumbnails')

  if (!existsSync(thumbnailPath)) {
    mkdirSync(thumbnailPath);
  } else {
    if (!lstatSync(thumbnailPath).isDirectory()) {
      throw new Error(`Make sure ${path.resolve(thumbnailPath)} is a directory`)
    }
  }

  books.filter(v => v.trim().length > 0 && existsSync(v)).filter(v => lstatSync(v).isDirectory()).forEach(v => {
    glob(path.join(v, '*.pdf'), {}, (_, files) => {
      console.log(files)
      files.forEach(v => {
        client.book.findUnique({
          where: {
            path: v
          }
        }).then(uniq => {
          if (!uniq) {
            pdfinfo(v).info((err: any, meta: any) => {
              if (!err) {
                gBookApi.search({
                  filters: {
                    title: meta.title || path.parse(v).name,
                    author: meta.author
                  }
                }).then(res => {
                  if (res.kind == 'books#volumes' && res.totalItems > 0) {
                    const item = res.items[0].volumeInfo;

                    client.book.create({
                      data: {
                        path: v,
                        title: item.title,
                        desc: item.description,
                        author: item.authors.join(', '),
                        id: res.items[0].id
                      }
                    }).then((dbres) => {
                      console.log(dbres);

                      fetch(item.imageLinks.thumbnail).then(v => v.arrayBuffer()).then(v => writeFileSync(path.join(thumbnailPath, res.items[0].id + '.jpg'), Buffer.from(v)))
                    })
                  }
                })
              }
            })
          }
        })
      })
    })
  })
}