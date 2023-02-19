import BookThumb from "@/utils/bookthumb";
import PlayArrow from "@mui/icons-material/PlayArrow";
import { Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, IconButton, Snackbar, Stack, Tooltip, Typography } from "@mui/material";
import { Container } from "@mui/system";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router"
import { useCallback, useEffect, useState } from "react";
import DownloadForOfflineIcon from '@mui/icons-material/DownloadForOffline';
import DownloadDoneIcon from '@mui/icons-material/DownloadDone';
import DownloadingIcon from '@mui/icons-material/Downloading';
import Edit from "@mui/icons-material/Edit";
import Add from "@mui/icons-material/Add";
import Remove from "@mui/icons-material/Remove";

export default function Book() {
  const router = useRouter();
  const { id } = router.query;

  const [book, setBook] = useState<any>(0);

  const [isDownloading, downloading] = useState(false);
  const [downloaded, setDown] = useState(false);
  const [dialog, setOpen] = useState(false);
  const [snack, sSnack] = useState(false);
  const [msg, setMsg] = useState('');

  const [progDisabled, setProgDisabled] = useState(false);
  const [progConfirm, setProgConfirm] = useState(false);

  const fetchBook = useCallback(() => fetch('/api/book/' + encodeURIComponent(id as string)).then((res) => res.json()).then(setBook), [id]);

  useEffect(() => {
    if (id) {
      fetchBook()

      window.workbox?.messageSW({
        do: 'getDownloaded'
      }).then((v: string[]) => {
        setDown(v.includes(id as string))
      })
    }
  }, [id, fetchBook]);

  function downloadOrDelete() {
    if (downloaded) {
      setOpen(true);
    } else {
      downloading(true);

      window.workbox?.messageSW({
        do: 'downloadIfNotExist',
        thing: `/api/book/${id}/file`,
        name: 'books'
      }).then(v => {
        downloading(false);
        if (v.error) {
          setMsg('Failed to download. Check your network connection, or there may be not enough space for the book to be stored.');
        } else {
          setMsg('Book downloaded!');
          setDown(v.includes(id as string));
        }
        sSnack(true);
      })
    }
  }

  function actuallyDelete() {
    window.workbox?.messageSW({
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
              {book.BookProgress.length > 0 ? <Button fullWidth variant='text' disabled={progDisabled} color='error' startIcon={<Remove />} onClick={() => {
                setProgDisabled(true);
                setProgConfirm(true);
              }}>Remove from My books</Button> : <Button fullWidth variant='text' disabled={progDisabled} startIcon={<Add />} onClick={() => {
                setProgDisabled(true);

                fetch('/api/book/' + router.query.id + '/progress', {
                  method: 'POST'
                }).then(v => v.ok ? fetchBook() : null).finally(() => setProgDisabled(false))
              }}>Add to My books</Button>}
            </div>
            <div>
              <Head>
                <title>{book.title}</title>
              </Head>
              <Box display='flex'>
                <Typography sx={{ flexGrow: 1 }} variant='h4' component='h1' lineHeight={1.1}>{book.title}</Typography>
                <Box m='auto'><IconButton href={`/books/${id}/edit`} LinkComponent={Link}><Edit /></IconButton></Box>
              </Box>
              <Typography fontStyle='italic' color='GrayText'>{book.author}</Typography>
              <Typography textAlign='justify' whiteSpace='pre-wrap'>{book.desc}</Typography>
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

      <Snackbar open={snack} autoHideDuration={5000} onClose={() => sSnack(false)} message={msg} />

      <ConfirmRemove open={progConfirm} onClose={() => {
        setProgDisabled(false);
        setProgConfirm(false);
      }} actuallyDo={() => {
        setProgConfirm(false)

        fetch('/api/book/' + router.query.id + '/progress', {
          method: 'DELETE'
        }).then(v => v.ok ? fetchBook() : null).finally(() => setProgDisabled(false))
      }} />
    </>
  )
}

function ConfirmRemove({ open, onClose, actuallyDo }: { open: boolean, onClose: (event?: {}, reason?: "backdropClick" | "escapeKeyDown") => void, actuallyDo: () => void }) {
  return <Dialog
    open={open}
    onClose={onClose}
    aria-labelledby="remove-title"
    aria-describedby="remove-description"
  >
    <DialogTitle id="remove-title">
      Remove this book from <i>My Books</i> and delete reading progress?
    </DialogTitle>
    <DialogContent>
      <DialogContentText id="remove-description">
        {"This action will delete your reading progress for this book. Keep in mind that when you read the book (through the 'Read' button), the book will be added to My Books automatically."}
      </DialogContentText>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose} autoFocus>Cancel</Button>
      <Button onClick={actuallyDo} color='error'>
        Remove
      </Button>
    </DialogActions>
  </Dialog>
}