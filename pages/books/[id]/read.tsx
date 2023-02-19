import { AppBar, CircularProgress, Container, Dialog, Drawer, IconButton, Link, List, ListItem, ListItemButton, ListItemText, Slide, Toolbar, useMediaQuery } from '@mui/material';
import { useRouter } from 'next/router';
import { Document, Page, pdfjs, PDFPageProxy } from 'react-pdf';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import { Dispatch, forwardRef, SetStateAction, useCallback, useEffect, useRef, useState } from 'react';
import debounce from 'lodash.debounce';
import ArrowBack from '@mui/icons-material/ArrowBack';
import ListIcon from '@mui/icons-material/List';
import Head from 'next/head';
import Epub, { Book, Location, Rendition } from 'epubjs';
import ErrorPage from '@/utils/error';
import NextLink from 'next/link';
import type { TransitionProps } from '@mui/material/transitions';

type TocContent = {
  index: number | string,
  title: string
};

type ReaderProps = {
  file: ArrayBuffer,
  progress: number,
  setBar: Dispatch<SetStateAction<boolean>>,
  deb: (id: string, progress: number) => void,
  drawer: boolean,
  bar: boolean,
  id: string,
  setToc: Dispatch<SetStateAction<TocContent[]>>,
  setTocClick: (v: any) => void
}

export default function Read() {
  const router = useRouter()
  const { id } = router.query;

  const [progress, setProgress] = useState(0);
  const [title, setTitle] = useState('');

  const [bar, setBar] = useState(false);
  const [toc, setToc] = useState<TocContent[]>([]);
  const [drawer, setDrawer] = useState(false);
  const onTocClick = useRef<((v: TocContent) => void) | null>(null);

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

  const viewerProps = {
    drawer,
    setBar,
    file: file as ArrayBuffer,
    deb,
    progress,
    bar,
    id: id as string,
    setToc,
    setTocClick: (v: any) => { onTocClick.current = v }
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
        : <CircularProgress sx={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
    }

    <Slide appear={true} direction='up' in={bar}>
      <AppBar position='fixed' sx={{ bottom: 0, top: 'auto' }}>
        <Toolbar>
          <IconButton color='inherit' onClick={router.back}>
            <ArrowBack />
          </IconButton>
          <div style={{ flexGrow: 1 }} />
          <IconButton color='inherit' disabled={toc.length < 1} onClick={() => setDrawer(true)}>
            <ListIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
    </Slide>
    <Drawer anchor='right' open={drawer} onClose={() => setDrawer(false)}>
      <List sx={{ width: 250 }}>
        {toc.map((v, i) => <ListItem key={i}>
          <ListItemButton onClick={() => {
            if (onTocClick.current) onTocClick.current(v);

            setDrawer(false);
          }}>
            <ListItemText primary={v.title} secondary={typeof v.index === 'number' ? v.index + 1 : ''} />
          </ListItemButton>
        </ListItem>)}
      </List>
    </Drawer>
  </>
}

function PdfViewer({ file, progress, setBar, deb, drawer, bar, id, setToc, setTocClick }: ReaderProps) {
  var pdf = useRef<HTMLDivElement>();
  const isSmol = useMediaQuery('(max-width: 500px)');
  const [width, setWidth] = useState<number | undefined>(100);
  const [height, setHeight] = useState<number | undefined>(100);
  const [pageNum, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  var [pdfViewport, setViewport] = useState<PDFPageProxy | undefined>();

  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

  useEffect(() => {
    setTocClick((v: TocContent) => {
      setPage(v.index as number);
      deb(id, (v.index as number / pages));
    })
  })

  useEffect(() => {
    function actuallyClick(e: MouseEvent) {
      const add = isSmol ? 1 : 2;

      setPage(p => {
        let g = p;

        if (e.clientX >= window.innerWidth / 2) g = p + add
        else if (p > 0) g = p - add;

        deb(id, (g / pages));

        return g;
      });
    }

    function click(e: MouseEvent) {
      if (!drawer) {
        if (e.clientY > window.innerHeight * 0.64) {
          setBar(b => !b);
        } else {
          setBar(b => {
            if (b) {
              return false
            } else {
              actuallyClick(e);
            }

            return b
          });
        }
      }
    }

    function keyboard(e: KeyboardEvent) {
      if (e.key === 'ArrowRight') {
        actuallyClick(new MouseEvent('mousedown', {
          clientX: window.innerWidth
        }));
      } else if (e.key === 'ArrowLeft') {
        actuallyClick(new MouseEvent('mousedown', {
          clientX: 0
        }));
      } else if (e.key === 'Escape' && bar) {
        setBar(false);
      } else if (e.key === ' ') {
        setBar(b => !b);
      }
    }

    window.addEventListener('keydown', keyboard);
    window.addEventListener('click', click);

    return (() => {
      window.removeEventListener('click', click);
      window.removeEventListener('keydown', keyboard);
    })
  }, [bar, deb, id, isSmol, pages, drawer, setBar])


  useEffect(() => {
    if (progress) setPage(Math.floor(progress * pages))
  }, [pages, progress])

  useEffect(() => {
    function resize() {
      if (pdf.current && pdfViewport) {
        const rect = pdf.current.getBoundingClientRect();
        const CSS_UNITS = 96 / 72;

        setHeight(rect.height);
        setWidth(undefined)

        if (rect.height >= rect.width) {
          if ((pdfViewport.view[2] * CSS_UNITS) * 2 <= rect.width) return
        } else {
          if (pdfViewport.view[3] * CSS_UNITS > rect.height) return
        }

        setWidth(isSmol ? rect.width : (rect.width / 2))
        setHeight(undefined)
      }
    }

    resize();

    window.addEventListener('resize', resize);

    return () => {
      window.removeEventListener('resize', resize);
    };
  }, [isSmol, pdf, pdfViewport])


  {/* @ts-ignore */ }
  return <Document inputRef={pdf} onLoadSuccess={(v) => {
    /* @ts-ignore */
    v.getPage(1).then(v => setViewport(v))
    setPages(v.numPages);
    v.getOutline().then(outlines => {
      const res: { index: number; title: string; }[] = [];

      outlines?.forEach(outline => {
        v.getPageIndex(outline.dest![0]).then(index => res.push({
          index,
          title: outline.title
        }))
      })

      setToc(res);
    });
  }} loading={<CircularProgress />} file={file}>
    <Page pageIndex={pageNum} noData='' width={width} height={height} />
    {!isSmol && <Page pageIndex={pageNum + 1} noData='' width={width} height={height} />}
  </Document>
}

function EpubViewer({ file, setBar, drawer, deb, id, progress, bar, setToc, setTocClick }: ReaderProps) {
  const div = useRef<HTMLDivElement | null>(null);
  const book = useRef<Book | null>(null);
  const [rendition, setRend] = useState<Rendition | null>(null);
  const [ready, setReady] = useState(false);
  const [iReady, setiRed] = useState(false);

  useEffect(() => {
    let c: Rendition | null;

    if (div.current) {
      book.current = Epub(file);
      c = book.current?.renderTo(div.current, {
        manager: 'default'
      })

      setRend(c);
      c?.display().then(() => {
        book.current?.locations.generate(1024).finally(() => setiRed(true))
      });
    }

    return () => {
      try {
        c?.destroy();
        book.current?.destroy();
      } catch (e) { console.log(e) }
    }
  }, [file])

  useEffect(() => {
    setTocClick((v: TocContent) => rendition?.display(v.index as string))
  }, [setTocClick, rendition])

  useEffect(() => {
    if (book.current && iReady)
      setToc(book.current.navigation?.toc.map(v => {
        return {
          title: v.label,
          index: v.href
        }
      }));
  }, [setToc, iReady])

  useEffect(() => {
    if (iReady) {
      setReady(false);

      rendition?.display(book.current?.locations.cfiFromPercentage(progress)).then(() => setReady(true))
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rendition, iReady])

  const actuallyClick = useCallback((e: MouseEvent) => {
    // @ts-ignore
    if (e.clientX - rendition?.manager.container.scrollLeft > window.top!.innerWidth / 2) {
      rendition?.next()
    } else {
      rendition?.prev()
    }
  }, [rendition])

  const click = useCallback((e: MouseEvent) => {
    if (!drawer) {
      if (!(e.target as Element).closest('a'))
        if (e.clientY > window.top!.innerHeight * 0.64) {
          setBar(b => !b);
        } else {
          setBar(b => {
            if (b) {
              return false
            } else {
              actuallyClick(e);
            }

            return b
          });
        }
    }
  }, [actuallyClick, drawer, setBar])

  useEffect(() => {
    rendition?.on('click', click);

    return () => {
      rendition?.off('click', click);
    }
  }, [click, rendition])

  useEffect(() => {
    function keyboard(e: KeyboardEvent) {
      if (e.key === 'ArrowRight') {
        actuallyClick(new MouseEvent('mousedown', {
          clientX: window.top!.innerWidth * 100000
        }));
      } else if (e.key === 'ArrowLeft') {
        actuallyClick(new MouseEvent('mousedown', {
          clientX: 0
        }));
      } else if (e.key === 'Escape' && bar) {
        setBar(false);
      } else if (e.key === ' ') {
        setBar(b => !b);
      }
    }

    window.addEventListener('keydown', keyboard);
    rendition?.on('keydown', keyboard);

    return () => {
      window.removeEventListener('keydown', keyboard);
      rendition?.off('keydown', keyboard);
    }
  }, [actuallyClick, bar, rendition, setBar])

  useEffect(() => {
    function onRelocated(loc: Location) {
      deb(id, loc.start.percentage)
    }

    if (rendition?.book)
      rendition?.on('relocated', onRelocated);

    return () => {
      rendition?.off('relocated', onRelocated);
    }
  }, [rendition, id, deb])

  return <>
    <div style={{
      display: !ready ? 'none' : 'block'
    }} ref={div}>
    </div>
    {!ready && <CircularProgress sx={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />}
  </>
}