import { CircularProgress, useMediaQuery } from '@mui/material';
import { useRouter } from 'next/router';
import { Document, Page, pdfjs, PDFPageProxy } from 'react-pdf';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import { useEffect, useRef, useState } from 'react';
import debounce from 'lodash.debounce';

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

  var pdf = useRef<HTMLDivElement>();

  useEffect(() => {
    if (id) fetch(`/api/book/${id}/progress`).then(v => v.json()).then(v => setProgress(v.progress));
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

  useEffect(() => {
    function click(e: MouseEvent) {
      const add = isSmol ? 1 : 2;

      if (e.clientX >= window.innerWidth / 2) setPage(pageNum + add);
      else if (pageNum > 0) setPage(pageNum - add);
    }

    window.addEventListener('click', click);

    return (() => {
      window.removeEventListener('click', click);
    })
  }, [id, pageNum, pages, progress, isSmol])

  const throttled = useRef(debounce((page: number, id: string, pages: number) => {
    fetch('/api/book/' + id + '/progress', {
      body: (page / pages).toString(),
      method: 'POST'
    })
  }, 2000))

  useEffect(() => throttled.current(pageNum, id as string, pages), [pageNum, pages, id])

  useEffect(() => {
    if (progress) setPage(Math.floor(progress * pages))
  }, [pages, progress])

  useEffect(() => {
    if (id) window.navigator.serviceWorker.controller?.postMessage({
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
  </>
}