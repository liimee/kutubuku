import BookThumb from "@/utils/bookthumb";
import PlayArrow from "@mui/icons-material/PlayArrow";
import { Link as MuiLink, Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, IconButton, Snackbar, Stack, Tooltip, Typography, LinearProgress, CircularProgress } from "@mui/material";
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
import ErrorPage from "@/utils/error";

export default function Book() {
  const router = useRouter();
  const { id } = router.query;

  const [book, setBook] = useState<any>(0);

  const [isDownloading, downloading] = useState(false);
  const [downloaded, setDown] = useState(false);
  const [dialog, setOpen] = useState(false);
  const [snack, sSnack] = useState(false);
  const [msg, setMsg] = useState('');

  const [meta, setMeta] = useState<{
    size: number,
    type: string
  } | null>(null);

  const [progDisabled, setProgDisabled] = useState(false);
  const [progConfirm, setProgConfirm] = useState(false);

  const [resp, setResp] = useState<Response | null>(null);

  const fetchBook = useCallback(() => fetch('/api/book/' + encodeURIComponent(id as string)).then((res) => {
    if (res.ok) return res.json();
    return new Promise((_, reject) => reject(res));
  }, () => setResp(new Response('Server unreachable?', {
    status: 444
  }))).then(setBook, (res) => setResp(res)), [id]);

  const [downloadProgress, setDownloadProg] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    const channel = new BroadcastChannel('progress_channel');

    channel.onmessage = e => setDownloadProg(e.data);

    return () => channel.close();
  }, []);

  useEffect(() => {
    const self = downloadProgress[`/api/book/${router.query.id}/file`];

    if (self) {
      if (self === 1) {
        setDown(true);
        setMsg('Book downloaded!');
      }
    }
  }, [downloadProgress, router.query.id])

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

  useEffect(() => {
    if (id) fetch('/api/book/' + id + '/file', {
      method: 'HEAD'
    }).then(v => {
      if (v.ok) {
        setMeta({
          size: parseInt(v.headers.get('Content-Length')!),
          type: v.headers.get('Content-Type') === 'application/epub+zip' ? 'ePub' : 'PDF'
        })
      }
    }, () => { })
  }, [id])

  const handleClose = () => setOpen(false);

  return (
    <>
      <Container maxWidth='sm' sx={{ p: 3 }}>
        {(book === 0 && !resp) ? <LinearProgress /> :
          resp && !resp.ok ? <ErrorPage res={resp!} desc={<>Things didn&apos;t work out? Let&apos;s find some more interesting reads on the <MuiLink href='/' component={Link}>Explore page</MuiLink> instead.</>} /> :
            <Stack direction='row' spacing={2}>
              <Box sx={{
                width: {
                  xs: '10vw',
                  sm: '11rem'
                },
                minWidth: '150px',
                flex: 1
              }}>
                <Box sx={{
                  mb: 1
                }}>
                  <BookThumb style={{ borderRadius: '4px', width: '100%' }} id={book.id} title={book.title} alt="Book cover" />
                </Box>
                <Box sx={{ width: '100%', display: 'flex' }}>
                  <Button variant="text" disabled={isDownloading || downloadProgress[`/api/book/${router.query.id}/file`] != null} sx={{ flexGrow: 1 }} href={`/books/${book.id}/read`} LinkComponent={Link} startIcon={<PlayArrow />}>Read</Button>
                  <Box position='relative'>
                    <Tooltip title={isDownloading || downloadProgress[`/api/book/${router.query.id}/file`] ? 'Downloading...' : downloaded ? 'Downloaded' : 'Download for offline read'}>
                      <IconButton onClick={downloadOrDelete} color='primary' disabled={isDownloading || downloadProgress[`/api/book/${router.query.id}/file`] != null}>{isDownloading || downloadProgress[`/api/book/${router.query.id}/file`] ? <DownloadingIcon /> : downloaded ? <DownloadDoneIcon /> : <DownloadForOfflineIcon />}</IconButton>
                    </Tooltip>

                    {downloadProgress[`/api/book/${router.query.id}/file`] &&
                      <CircularProgress variant={downloadProgress[`/api/book/${router.query.id}/file`] * 100 < 10 ? 'indeterminate' : "determinate"} value={downloadProgress[`/api/book/${router.query.id}/file`] * 100} size='2em' sx={{
                        position: 'absolute',
                        top: 4,
                        left: 4,
                        zIndex: 1,
                      }} />
                    }
                  </Box>
                </Box>
                {book.BookProgress.length > 0 ? <Button fullWidth variant='text' disabled={progDisabled} color='error' startIcon={<Remove />} onClick={() => {
                  setProgDisabled(true);
                  setProgConfirm(true);
                }}>Remove from My books</Button> : <Button fullWidth variant='text' disabled={progDisabled} startIcon={<Add />} onClick={() => {
                  setProgDisabled(true);

                  fetch('/api/book/' + router.query.id + '/progress', {
                    method: 'POST'
                  }).then(v => {
                    if (v.ok) {
                      fetchBook();

                      window.workbox.messageSW({
                        do: 'download',
                        things: ['/api/my'],
                        name: 'apis'
                      })
                    }
                  }).finally(() => setProgDisabled(false))
                }}>Add to My books</Button>}
                {meta &&
                  <Typography color='gray' textAlign='center' mt={1}>
                    {meta.type} &middot; {(meta.size * 0.000001).toFixed(2)} MB
                  </Typography>}
              </Box>
              <div style={{ flex: 2 }}>
                <Head>
                  <title>{book.title}</title>
                </Head>
                <Box display='flex'>
                  <Typography sx={{ flexGrow: 1 }} variant='h4' component='h1' lineHeight={1.1}>{book.title}</Typography>
                  <Box m='auto'><IconButton href={`/books/${id}/edit`} LinkComponent={Link}><Edit /></IconButton></Box>
                </Box>
                <Typography fontStyle='italic' color='GrayText'>{book.author}</Typography>
                <Typography textAlign='justify' whiteSpace='pre-wrap'>{book.desc}</Typography>
                <Box my={2}>
                  {book.published && <Typography fontStyle='italic' color='GrayText'>Published on {new Intl.DateTimeFormat().format(new Date(book.published))}</Typography>}
                </Box>
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
        }).then(v => {
          if (v.ok) {
            fetchBook();
            window.workbox.messageSW({
              do: 'download',
              things: ['/api/my'],
              name: 'apis'
            })
          }
        }).finally(() => setProgDisabled(false))
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