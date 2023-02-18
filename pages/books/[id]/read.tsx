import { AppBar, CircularProgress, Drawer, IconButton, List, ListItem, ListItemButton, ListItemText, Slide, Toolbar, useMediaQuery } from '@mui/material';
import { useRouter } from 'next/router';
import { Document, Page, pdfjs, PDFPageProxy } from 'react-pdf';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import { Dispatch, SetStateAction, useCallback, useEffect, useRef, useState } from 'react';
import debounce from 'lodash.debounce';
import ArrowBack from '@mui/icons-material/ArrowBack';
import ListIcon from '@mui/icons-material/List';
import Head from 'next/head';
import Epub, { Book, Rendition } from 'epubjs';

type TocContent = {
  index: number,
  title: string
};

type ReaderProps = {
  file: ArrayBuffer,
  progress: number,
  setBar: Dispatch<SetStateAction<boolean>>,
  deb: (id: any, pageNum: any, pages: any) => void,
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

  useEffect(() => {
    if (id) {
      fetch(`/api/book/${id}/file`).then(res => {
        setFtype(res.headers.get('Content-Type') || 'application/pdf');
        return res.arrayBuffer()
      }).then(setFile);
    }
  }, [id])

  useEffect(() => {
    if (id) fetch(`/api/book/${id}/progress`).then(v => v.json()).then(v => {
      console.log(v)
      setTitle(v.book?.title || 'Book');
      setProgress(v.progress)
      window.workbox.messageSW({
        do: 'download',
        things: [`/api/book/${id}/progress`],
        name: 'apis'
      })
    });
  }, [id])

  const deb = useRef(debounce((id, pageNum, pages) => {
    fetch('/api/book/' + id + '/progress', {
      body: JSON.stringify({
        progress: (pageNum / pages),
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

  useEffect(() => {
    if (id) window.workbox.messageSW({
      do: 'downloadIfNotExist',
      thing: '/api/book/' + id + '/file',
      name: 'books'
    })
  }, [id])

  return <>
    <Head>
      <title>{title || 'Loading book...'}</title>
    </Head>

    {file ?
      filetype === 'application/epub+zip' ? <EpubViewer drawer={drawer} setBar={setBar} file={file} /> :
        <PdfViewer file={file} progress={progress} setBar={setBar} deb={deb} drawer={drawer} bar={bar} id={id as string} setToc={setToc} setTocClick={(v: any) => { onTocClick.current = v }} />
      : <CircularProgress sx={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />}

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
            <ListItemText primary={v.title} secondary={v.index + 1} />
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
      setPage(v.index);
      deb(id, v.index, pages);
    })
  })

  useEffect(() => {
    function actuallyClick(e: MouseEvent) {
      const add = isSmol ? 1 : 2;

      setPage(p => {
        let g = p;

        if (e.clientX >= window.innerWidth / 2) g = p + add
        else if (p > 0) g = p - add;

        deb(id, g, pages);

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

      // @ts-ignore
      deb.cancel();
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

function EpubViewer({ file, setBar, drawer }: ReaderProps) {
  const div = useRef<HTMLDivElement | null>(null);
  const book = useRef<Book | null>(null);
  const [rendition, setRend] = useState<Rendition | null>(null);

  useEffect(() => {
    let c: Rendition | null;

    if (div.current) {
      book.current = Epub(file);
      c = book.current?.renderTo(div.current, {
        manager: 'default'
      })

      setRend(c);
      c.display();
    }

    return () => {
      try {
        c?.destroy();
        book.current?.destroy();
      } catch (e) { console.log(e) }
    }
  }, [file])

  const actuallyClick = useCallback((e: MouseEvent) => {
    if (e.clientX > window.innerWidth / 2) {
      rendition?.next()
    } else {
      rendition?.prev()
    }
  }, [rendition])

  const click = useCallback((e: MouseEvent) => {
    if (!drawer) {
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

  return <div ref={div}></div>
}