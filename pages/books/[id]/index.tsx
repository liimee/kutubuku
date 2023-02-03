import BookThumb from "@/utils/bookthumb";
import PlayArrow from "@mui/icons-material/PlayArrow";
import { Box, Button, CircularProgress, Stack, Typography } from "@mui/material";
import { Container } from "@mui/system";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router"
import { useEffect, useState } from "react";

export default function Book() {
  const router = useRouter();
  const { id } = router.query;

  const [book, setBook] = useState<any>(0);

  useEffect(() => {
    if (id) fetch('/api/book/' + encodeURIComponent(id as string)).then((res) => res.json()).then(setBook);
  }, [id]);

  return (
    <Container maxWidth='sm' sx={{ p: 3 }}>
      {book === 0 ? <CircularProgress /> :
        <Stack direction='row' spacing={2}>
          <div>
            <Box sx={{
              width: {
                xs: '30vw',
                sm: '11rem'
              },
              minWidth: '100px'
            }}>
              <BookThumb style={{ borderRadius: '4px', width: '100%' }} id={book.id} alt="Book cover" />
            </Box>
            <Button variant="text" href={`/books/${book.id}/read`} LinkComponent={Link} startIcon={<PlayArrow />} sx={{ width: '100%' }}>Read</Button>
          </div>
          <div>
            <Head>
              <title>{book.title}</title>
            </Head>
            <Typography variant='h4' component='h1' lineHeight={1.1}>{book.title}</Typography>
            <Typography fontStyle='italic' color='GrayText'>{book.author}</Typography>
            <Typography textAlign='justify'>{book.desc}</Typography>
          </div>
        </Stack>
      }
    </Container>
  )
}