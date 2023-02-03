import BookGrid from "@/utils/bookgrid";
import { Container, Typography, Stack } from "@mui/material";
import Head from "next/head";
import { useEffect, useState } from "react";

export default function Index() {
  const [list, setList] = useState<any>(null);

  useEffect(() => {
    fetch('/api/books').then(v => v.json()).then(setList);
  }, [])

  return (
    <Container maxWidth="sm" sx={{ py: 3 }}>
      <Stack>
        <Typography component='h1' variant='h4' sx={{ mb: 2 }}>Explore</Typography>
        <BookGrid list={list} />
      </Stack>
      <Head>
        <title>kutubuku</title>
      </Head>
    </Container>
  )
}