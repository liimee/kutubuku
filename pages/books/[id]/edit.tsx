import { Box, Button, Container, LinearProgress, Snackbar, TextField } from "@mui/material";
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
  const [snackbar, setSnack] = useState(false);
  const router = useRouter();

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

    <Container maxWidth='sm' sx={{ p: 3 }}>
      {loading && <LinearProgress />}
      <Box component='form' sx={{
        '& .MuiTextField-root': { my: 1 },
      }} onSubmit={e => {
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
            }).finally(() => {
              router.push('/books/' + router.query.id)
            })
          }, () => setSnack(true)).finally(() => setLoading(false))
        }
      }}>
        <TextField fullWidth disabled={loading} required value={title} onChange={e => setTitle(e.target.value)} label='Title' variant="outlined" />
        <TextField fullWidth disabled={loading} value={author} onChange={e => setAuthor(e.target.value)} label='Author' variant="outlined" />
        <TextField fullWidth disabled={loading} value={desc} onChange={e => setDesc(e.target.value)} label='Description' multiline minRows={2} maxRows={6} variant="outlined" />
        <TextField type='date' InputLabelProps={{ shrink: true }} fullWidth disabled={loading} value={published} onChange={e => setPub(e.target.value)} label='Publish date' variant='outlined' />

        <Box sx={{ textAlign: 'end' }}>
          <Button disabled={loading} variant='contained' type='submit'>Save</Button>
        </Box>
      </Box>
    </Container>

    <Snackbar message='Failed to save edits.' open={snackbar} autoHideDuration={6000} onClose={() => setSnack(false)} />
  </>
}