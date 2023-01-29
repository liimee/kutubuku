import BookGrid from "@/utils/bookgrid";
import { Container, Stack, Typography } from "@mui/material";
import { Progress } from "@prisma/client";
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

  return <Container maxWidth='sm' sx={{ py: 3 }}>
    <Stack>
      <Typography component='h1' variant='h4' sx={{mb: 2}}>My Books</Typography>
      {/* @ts-ignore */}
      <BookGrid list={books} />
    </Stack>
  </Container>
}