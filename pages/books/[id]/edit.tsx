import { Box, Button, Container, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, LinearProgress, Snackbar, TextField, Typography } from "@mui/material";
import type { Book } from "@prisma/client";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function EditBook() {
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [desc, setDesc] = useState('');
  const [published, setPub] = useState('');
  const [snackbar, setSnack] = useState('');
  const router = useRouter();

  const [idForGp, setIdForGp] = useState('');

  const [confirmDel, setDel] = useState(false);
  const [beingDelled, setBeing] = useState(false);

  useEffect(() => {
    if (router.query.id) fetch('/api/book/' + router.query.id).then(v => v.json()).then((v: Book) => {
      setTitle(v.title);
      setAuthor(v.author || '');
      setDesc(v.desc || '');
      setPub(v.published ? new Date(v.published).toISOString().split('T')[0] : '')
      setLoading(false);
    })
  }, [router.query.id])

  return <>
    <Head>
      <title>{`Edit ${title || 'book'}`}</title>
    </Head>

    <Container maxWidth='sm' sx={{
      p: 3,
      display: 'flex',
      flexDirection: 'column',
      gap: 2
    }}>
      {loading && <LinearProgress />}
      <Box component='form' display='flex' flexDirection='column' gap={2} border='solid 1px hsl(0, 0%, 0%, 0.2)' borderRadius='6px' padding={1.5} onSubmit={e => {
        e.preventDefault()
        if (!loading) {
          setLoading(true)

          fetch('/api/book/' + router.query.id, {
            method: 'POST',
            headers: new Headers({
              'Content-Type': 'application/json'
            }),
            body: JSON.stringify({
              title,
              desc,
              author,
              published: published ? new Date(published).toISOString() : null
            })
          }).then(() => {
            window.workbox.messageSW({
              do: 'deleteInfo',
              thing: router.query.id
            })

            router.replace('/books/' + router.query.id)
          }, () => setSnack('Failed to save edits.')).finally(() => setLoading(false))
        }
      }}>
        <Typography fontWeight='bold' component='h1'>Edit metadata</Typography>

        <TextField fullWidth disabled={loading} required value={title} onChange={e => setTitle(e.target.value)} label='Title' variant="outlined" />
        <TextField fullWidth disabled={loading} value={author} onChange={e => setAuthor(e.target.value)} label='Author' variant="outlined" />
        <TextField fullWidth disabled={loading} value={desc} onChange={e => setDesc(e.target.value)} label='Description' multiline minRows={2} maxRows={6} variant="outlined" />
        <TextField type='date' InputLabelProps={{ shrink: true }} fullWidth disabled={loading} value={published} onChange={e => setPub(e.target.value)} label='Publish date' variant='outlined' />

        <Box display='flex'>
          <Box>
            <Button color='error' onClick={() => setDel(true)}>Delete Book</Button>
          </Box>
          <Box flexGrow={1} sx={{ textAlign: 'end' }}>
            <Button variant='text' onClick={router.back} sx={{ mr: 1 }}>Cancel</Button>
            <Button disabled={loading} variant='contained' type='submit'>Save</Button>
          </Box>
        </Box>
      </Box>

      <Box component='form' border='solid 1px hsl(0, 0%, 0%, 0.2)' borderRadius='6px' padding={1.5} display='flex' gap={2} flexDirection='column'
        onSubmit={e => {
          e.preventDefault();

          setLoading(true);
          fetch('/api/playbooks', {
            method: 'POST',
            body: JSON.stringify({
              id: idForGp
            }),
            headers: {
              'Content-Type': 'application/json'
            }
          }).then(v => {
            if (v.ok) {
              return v.json()
            } else {
              throw new Error()
            }
          }).then(v => {
            setTitle(v.title);
            setAuthor(v.author);
            setDesc(v.desc);
            setIdForGp('');
            setPub(v.published);
            setSnack('Metadata successfully fetched.');
          }, () => setSnack('Failed to fetch metadata from Play Books.')).finally(() => setLoading(false))
        }}
      >
        <Box>
          <Typography fontWeight='bold' component='h1'>...or import it from Google Play Books!</Typography>
          <Typography>I know you are too lazy to copy-paste things yourself. Me too, so just paste the <b>ID</b> (or the <b>URL of the book page</b>, <s>with hope that things work and the URL gets transformed to an ID</s>) of the book here.</Typography>
        </Box>

        <TextField fullWidth label="ID or URL..." onChange={e => {
          const value = e.target.value;

          try {
            const url = new URL(value);
            const id = url.searchParams.get('id');
            if ((url.host === 'play.google.com' && /^\/store\/books\/details\/\w+\/?$/.test(url.pathname)) && id) {
              setIdForGp(id);
            } else {
              setIdForGp(value);
            }
          } catch (_) {
            setIdForGp(value);
          }
        }} disabled={loading} InputLabelProps={{ shrink: true }} value={idForGp} required placeholder="https://play.google.com/store/books/details/book?id=THISTHING" />

        <Box textAlign='end'><Button disabled={loading} variant='outlined' type='submit'>Fetch</Button></Box>
      </Box>
    </Container>

    <Dialog
      open={confirmDel}
      onClose={() => {
        if (!beingDelled) setDel(false)
      }}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogTitle id="alert-dialog-title">
        {"Delete this book?"}
      </DialogTitle>
      <DialogContent>
        {beingDelled && <LinearProgress sx={{ mb: 2 }} />}
        <DialogContentText id="alert-dialog-description">
          Only the metadata, progress, and cover image gets deleted. <b>The book file won&apos;t be removed.</b>
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button autoFocus disabled={beingDelled} onClick={() => setDel(false)}>Cancel</Button>
        <Button color='error' disabled={beingDelled} onClick={() => {
          setBeing(true)
          fetch('/api/book/' + router.query.id as string, {
            method: 'DELETE'
          }).then(v => {
            if (v.ok) {
              setSnack('Book deleted.')
              router.replace('/')
            } else {
              setSnack('Failed to delete book.');
              setDel(false)
            }
          }, () => {
            setSnack('Failed to delete book.');
            setDel(false)
          }).finally(() => setBeing(false))
        }}>
          Delete
        </Button>
      </DialogActions>
    </Dialog>

    <Snackbar message={snackbar} open={snackbar != ''} autoHideDuration={6000} onClose={() => setSnack('')} />
  </>
}