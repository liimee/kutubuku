import { AppBar, CircularProgress, IconButton, Slide, Toolbar, useMediaQuery } from '@mui/material';
import { useRouter } from 'next/router';
import { Document, Page, pdfjs, PDFPageProxy } from 'react-pdf';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import { useEffect, useRef, useState } from 'react';
import debounce from 'lodash.debounce';
import ArrowBack from '@mui/icons-material/ArrowBack';

export default function Read() {
  const router = useRouter()
  const { id } = router.query;

  const isSmol = useMediaQuery('(max-width: 500px)');

  const [progress, setProgress] = useState(0);
  const [width, setWidth] = useState<number | undefined>(100);
  const [height, setHeight] = useState<number | undefined>(100);

  var [pdfViewport, setViewport] = useState<PDFPageProxy | undefined>();

  const [pageNum, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const [bar, setBar] = useState(false);

  var pdf = useRef<HTMLDivElement>();

  useEffect(() => {
    if (id) fetch(`/api/book/${id}/progress`).then(v => v.json()).then(v => {
      console.log(v)
      setProgress(v.progress)
      window.workbox.messageSW({
        do: 'download',
        things: [`/api/book/${id}/progress`],
        name: 'apis'
      })
    });
  }, [id])

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
  }, [isSmol, pdfViewport])

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
    function click(e: MouseEvent) {
      if (e.clientY > window.innerHeight * 0.64) {
        setBar(b => !b);
      } else {
        setBar(b => {
          if (b) {
            return false
          } else {
            const add = isSmol ? 1 : 2;

            setPage(p => {
              let g = p;

              if (e.clientX >= window.innerWidth / 2) g = p + add
              else if (p > 0) g = p - add;

              deb(id, g, pages);

              return g;
            });
          }

          return b
        });
      }
    }

    window.addEventListener('click', click);

    return (() => {
      window.removeEventListener('click', click);
      deb.cancel();
    })
  }, [bar, deb, id, isSmol, pages])

  useEffect(() => {
    if (progress) setPage(Math.floor(progress * pages))
  }, [pages, progress])

  useEffect(() => {
    if (id) window.workbox.messageSW({
      do: 'downloadIfNotExist',
      thing: '/api/book/' + id + '/file',
      name: 'books'
    })
  }, [id])

  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

  return <>
    {/* @ts-ignore */}
    <Document inputRef={pdf} onLoadSuccess={(v) => {
      /* @ts-ignore */
      v.getPage(1).then(v => setViewport(v))
      setPages(v.numPages);
    }} loading={<CircularProgress />} file={`/api/book/${id}/file`}>
      <Page pageIndex={pageNum} noData='' width={width} height={height} />
      {!isSmol && <Page pageIndex={pageNum + 1} noData='' width={width} height={height} />}
    </Document>
    <Slide appear={true} direction='up' in={bar}>
      <AppBar position='fixed' sx={{ bottom: 0, top: 'auto' }}>
        <Toolbar>
          <IconButton color='inherit' onClick={router.back}>
            <ArrowBack />
          </IconButton>
        </Toolbar>
      </AppBar>
    </Slide>
  </>
}