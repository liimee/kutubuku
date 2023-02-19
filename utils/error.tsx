import { Container, Typography } from "@mui/material";
import Head from "next/head";
import { ReactElement, useEffect, useState } from "react";

export default function ErrorPage({ res, desc }: { res: Response, desc: ReactElement }) {
  const [title, setTitle] = useState('');

  useEffect(() => {
    res.clone().text().then(setTitle)
  }, [res])

  return <Container maxWidth='sm' sx={{ textAlign: 'center' }}>
    <Head>
      <title>{title}</title>
    </Head>

    <Typography variant="h1" color='gray'>{res.status}</Typography>
    <Typography variant="h4">{title}</Typography>
    <Typography>{desc}</Typography>
  </Container>
}