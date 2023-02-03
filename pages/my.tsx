import BookGrid from "@/utils/bookgrid";
import { Container, Stack, Typography } from "@mui/material";
import { Progress } from "@prisma/client";
import Head from "next/head";
import { useEffect, useState } from "react";

export default function MyBooks() {
  const [books, setBooks] = useState<Progress[] | null>(null);

  useEffect(() => {
    fetch('/api/my').then(v => v.json()).then((v: Progress[]) => setBooks(v.map(v => {
      // @ts-ignore
      v.id = v.bookId;

      return v;
    })));
  }, [])

  useEffect(() => {
    window.navigator.serviceWorker.controller?.postMessage({
      do: 'download',
      things: books?.map(v => '/api/book/' + v.bookId),
      name: 'bookInfo'
    })

    window.navigator.serviceWorker.controller?.postMessage({
      do: 'download',
      things: books?.map(v => '/books/' + v.bookId),
      name: 'bookPages'
    })

    window.navigator.serviceWorker.controller?.postMessage({
      do: 'download',
      things: books?.map(v => '/books/' + v.bookId + '/read/'),
      name: 'bookPages'
    })

    window.navigator.serviceWorker.controller?.postMessage({
      do: 'download',
      things: ['/api/my'],
      name: 'apis'
    })
  }, [books])

  return <Container maxWidth='sm' sx={{ py: 3 }}>
    <Stack>
      <Typography component='h1' variant='h4' sx={{ mb: 2 }}>My Books</Typography>
      {/* @ts-ignore */}
      <BookGrid list={books} />
    </Stack>
    <Head>
      <title>My Books</title>
    </Head>
  </Container>
}