import BookThumb from "@/utils/bookthumb";
import PlayArrow from "@mui/icons-material/PlayArrow";
import { Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, IconButton, Snackbar, Stack, Tooltip, Typography } from "@mui/material";
import { Container } from "@mui/system";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router"
import { useEffect, useState } from "react";
import DownloadForOfflineIcon from '@mui/icons-material/DownloadForOffline';
import DownloadDoneIcon from '@mui/icons-material/DownloadDone';
import DownloadingIcon from '@mui/icons-material/Downloading';

export default function Book() {
  const router = useRouter();
  const { id } = router.query;

  const [book, setBook] = useState<any>(0);

  const [isDownloading, downloading] = useState(false);
  const [downloaded, setDown] = useState(false);
  const [dialog, setOpen] = useState(false);
  const [snack, sSnack] = useState(false);
  const [msg, setMsg] = useState('');

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

  function downloadOrDelete() {
    if (downloaded) {
      setOpen(true);
    } else {
      downloading(true);

      window.workbox.messageSW({
        do: 'downloadIfNotExist',
        thing: `/api/book/${id}/file`,
        name: 'books'
      }).then(v => {
        setDown(v.includes(id as string));
        downloading(false);
        setMsg('Book downloaded!');
        sSnack(true);
      })
    }
  }

  function actuallyDelete() {
    window.workbox.messageSW({
      do: 'deleteBook',
      thing: id
    }).then((v: string[]) => {
      setDown(v.includes(id as string));
      handleClose();
      setMsg('Book removed!');
      sSnack(true);
    })
  }

  const handleClose = () => setOpen(false);

  return (
    <>
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
                <Tooltip title={isDownloading ? 'Downloading...' : downloaded ? 'Downloaded' : 'Download'}>
                  <IconButton onClick={downloadOrDelete} color='primary' disabled={isDownloading}>{isDownloading ? <DownloadingIcon /> : downloaded ? <DownloadDoneIcon /> : <DownloadForOfflineIcon />}</IconButton>
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

      <Dialog
        open={dialog}
        onClose={handleClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          Remove downloaded book?
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            {"When you remove this book, you won't be able to read the book while you're offline. Please note that when you read the book (through the Read button), the book will be downloaded automatically."}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} autoFocus>Cancel</Button>
          <Button onClick={actuallyDelete} color='error'>
            Remove
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack} autoHideDuration={5000} onClose={() => sSnack(false)}>
        <Alert severity="success" sx={{ width: '100%' }}>
          {msg}
        </Alert>
      </Snackbar>
    </>
  )
}