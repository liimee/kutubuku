import { AppBar, Collapse, Container, Dialog, Drawer, IconButton, LinearProgress, Link, List, ListItem, ListItemButton, ListItemText, Slide, Toolbar } from '@mui/material';
import { useRouter } from 'next/router';
import { forwardRef, MutableRefObject, useCallback, useEffect, useRef, useState } from 'react';
import debounce from 'lodash.debounce';
import ArrowBack from '@mui/icons-material/ArrowBack';
import ListIcon from '@mui/icons-material/List';
import Head from 'next/head';
import ErrorPage from '@/utils/error';
import NextLink from 'next/link';
import type { TransitionProps } from '@mui/material/transitions';
import EpubViewer from '@/utils/epub';
import type { ReaderProps, TocContent } from '@/utils/type';
import PdfViewer from '@/utils/pdf';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';

export default function Read() {
  const router = useRouter()
  const { id } = router.query;

  const [progress, setProgress] = useState(0);
  const [title, setTitle] = useState('');

  const [bar, setBar] = useState(false);
  const [toc, setToc] = useState<TocContent[]>([]);
  const [drawer, setDrawer] = useState(false);
  const onTocClick = useRef<((v: TocContent) => void) | null>(null);
  const [tocSelected, setTocSelect] = useState(0);

  const [barButtons, setButtons] = useState([]);

  const [file, setFile] = useState<ArrayBuffer | null>(null);
  const [filetype, setFtype] = useState('application/pdf');

  const [resp, setRes] = useState<Response | null>(null);

  useEffect(() => {
    if (id) {
      fetch(`/api/book/${id}/file`).then(res => {
        if (res.ok) {
          setFtype(res.headers.get('Content-Type') || 'application/pdf');
          res.arrayBuffer().then(setFile)
        } else {
          setRes(res);
        }
      })
    }
  }, [id])

  useEffect(() => {
    if (id) fetch(`/api/book/${id}/progress`).then(v => v.json(), () => new Promise((_, reject) => reject())).then(v => {
      console.log(v)
      setTitle(v.book?.title || 'Book');
      setProgress(v.progress)
      window.workbox.messageSW({
        do: 'download',
        things: [`/api/book/${id}/progress`],
        name: 'apis'
      })
    }, () => { });
  }, [id])

  const debs = useRef(debounce((id, progress) => {
    fetch('/api/book/' + id + '/progress', {
      body: JSON.stringify({
        progress,
        now: new Date().toISOString()
      }),
      headers: new Headers({
        'Content-Type': 'application/json'
      }),
      method: 'POST'
    }).then(() => window.workbox.messageSW({
      do: 'download',
      things: [`/api/book/${id}/progress`],
      name: 'apis'
    })).catch(() => { })
  }, 2000, {
    trailing: true,
    leading: true
  })).current;

  const deb = useCallback((id: string, progress: number) => {
    setProgress(progress);
    debs(id, progress);
  }, [debs])

  useEffect(() => {
    if (id) window.workbox.messageSW({
      do: 'downloadIfNotExist',
      thing: '/api/book/' + id + '/file',
      name: 'books'
    })
  }, [id])

  useEffect(() => {
    return () => debs.cancel()
  }, [debs])

  const viewerProps: ReaderProps = {
    drawer,
    setBar,
    file: file as ArrayBuffer,
    deb,
    progress,
    bar,
    id: id as string,
    setToc,
    setTocClick: (v: any) => { onTocClick.current = v },
    setButtons,
    setTocSelect
  }

  return <>
    <Head>
      <title>{title || 'Loading book...'}</title>
    </Head>

    {resp ? <Dialog PaperProps={{ sx: { bgcolor: '#FFF8E9' } }} open={true} fullScreen TransitionComponent={forwardRef(function Transition(
      props: TransitionProps & {
        children: React.ReactElement;
      },
      ref: React.Ref<unknown>,
    ) {
      return <Slide direction="up" ref={ref} {...props} />;
    })}>
      <Container maxWidth='sm' sx={{ height: '100%', display: 'flex', alignItems: 'center' }}>
        <ErrorPage res={resp} desc={<>
          Basically, that means that the book with the ID &apos;{id}&apos; does not exist, or, for some reason, the file of the book (PDF/ePub) was not found on the server. Let&apos;s find something else to read on the <Link component={NextLink} href='/'>Explore page</Link>.
        </>} />
      </Container>
    </Dialog> :
      file ?
        filetype === 'application/epub+zip' ?
          <EpubViewer {...viewerProps} /> :
          <PdfViewer {...viewerProps} />
        : <LinearProgress />
    }

    <Slide appear={true} direction='up' in={bar}>
      <AppBar position='fixed' sx={{ bottom: 0, top: 'auto' }}>
        <Toolbar>
          <IconButton color='inherit' onClick={router.back}>
            <ArrowBack />
          </IconButton>
          <div style={{ flexGrow: 1 }} />
          {barButtons}
          <IconButton color='inherit' disabled={toc.length < 1} onClick={() => setDrawer(true)}>
            <ListIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
    </Slide>
    <Drawer anchor='right' open={drawer} onClose={() => setDrawer(false)}>
      <List sx={{ width: 250 }}>
        {toc.map((v, i) => <Toc v={v} i={i} onTocClick={onTocClick} setDrawer={setDrawer} tocSelected={tocSelected} key={i} depth={1} />)}
      </List>
    </Drawer>
  </>
}

function Toc({ v, i, onTocClick, setDrawer, tocSelected, depth }: { v: TocContent, i: number, onTocClick: MutableRefObject<((v: TocContent) => void) | null>, setDrawer: (v: any) => void, tocSelected: number, depth: number }) {
  const [open, setOpen] = useState(false);

  const hasChildren = (v.children && v.children.length > 0)

  return <>
    <ListItem>
      <ListItemButton sx={{ pl: depth * 2 }} onClick={() => {
        if (hasChildren) {
          setOpen(!open);
        } else {
          if (onTocClick.current) onTocClick.current(v);

          setDrawer(false);
        }
      }} selected={tocSelected === i && depth === 1}>
        <ListItemText primary={v.title} secondary={typeof v.index === 'number' ? v.index + 1 : ''} />
        {hasChildren && (open ? <ExpandLess /> : <ExpandMore />)}
      </ListItemButton>
    </ListItem>

    {v.children && <Collapse in={open} timeout="auto" unmountOnExit>
      <List disablePadding>
        {
          v.children.map((v, i) => <Toc key={i} v={v} i={i} onTocClick={onTocClick} setDrawer={setDrawer} tocSelected={tocSelected} depth={depth + 1} />)
        }
      </List>
    </Collapse>}
  </>
}