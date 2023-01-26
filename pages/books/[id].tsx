import PlayArrow from "@mui/icons-material/PlayArrow";
import { Button, CircularProgress, Stack, Typography } from "@mui/material";
import { Container } from "@mui/system";
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
        <Stack direction={{
          xs: 'column',
          sm: 'row'
        }} spacing={2}>
          <div style={{ width: '11rem' }}>
            <img style={{ borderRadius: '4px', width: '11rem' }} src={'/api/thumb?id=' + encodeURIComponent(book.id)} alt="Book cover" />
            <Button variant="text" startIcon={<PlayArrow />} sx={{ width: '100%' }}>Read</Button>
          </div>
          <div>
            <Typography variant='h4' component='h1' lineHeight={1.1}>{book.title}</Typography>
            <Typography fontStyle='italic' color='GrayText'>{book.author}</Typography>
            <Typography textAlign='justify'>{book.desc}</Typography>
          </div>
        </Stack>
      }
    </Container>
  )
}