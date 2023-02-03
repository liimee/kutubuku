import BookThumb from "@/utils/bookthumb";
import PlayArrow from "@mui/icons-material/PlayArrow";
import { Box, Button, CircularProgress, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import { Container } from "@mui/system";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router"
import { useEffect, useState } from "react";
import DownloadForOfflineIcon from '@mui/icons-material/DownloadForOffline';
import DownloadDoneIcon from '@mui/icons-material/DownloadDone';

export default function Book() {
  const router = useRouter();
  const { id } = router.query;

  const [book, setBook] = useState<any>(0);
  const [downloaded, setDown] = useState(false);

  useEffect(() => {
    if (id) {
      fetch('/api/book/' + encodeURIComponent(id as string)).then((res) => res.json()).then(setBook);

      window.workbox.messageSW({
        do: 'getDownloaded'
      }).then((v: string[]) => {
        setDown(v.includes(id as string))
      })
    }
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
            <Box sx={{ width: '100%', display: 'flex' }}>
              <Button variant="text" sx={{ flexGrow: 1 }} href={`/books/${book.id}/read`} LinkComponent={Link} startIcon={<PlayArrow />}>Read</Button>
              <Tooltip title={downloaded ? 'Downloaded' : 'Download'}>
                <IconButton color='primary'>{downloaded ? <DownloadDoneIcon /> : <DownloadForOfflineIcon />}</IconButton>
              </Tooltip>
            </Box>
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