import { CircularProgress } from '@mui/material';
import { useRouter } from 'next/router';
import { Document, Page, pdfjs, PDFPageProxy } from 'react-pdf';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import { useEffect, useRef, useState } from 'react';

export default function Read() {
  const router = useRouter()
  const { id } = router.query;

  const [width, setWidth] = useState<number | undefined>(100);
  const [height, setHeight] = useState<number | undefined>(100);

  var [pdfViewport, setViewport] = useState<PDFPageProxy>();

  var pdf = useRef<HTMLDivElement>();

  useEffect(() => {
    function resize() {
      if (pdf.current && pdfViewport) {
        const rect = pdf.current.getBoundingClientRect();
        const view = pdfViewport.getViewport({ scale: 1 });
        const CSS_UNITS = 96 / 72;

        setHeight(rect.height);
        setWidth(undefined)

        if (rect.height >= rect.width) {
          if ((pdfViewport.view[2] * CSS_UNITS) * 2 <= rect.width) return
        } else {
          if (pdfViewport.view[3] * CSS_UNITS > rect.height) return
        }

        setWidth(rect.width / 2)
        setHeight(undefined)
      }
    }

    resize();

    window.addEventListener('resize', resize);

    return () => {
      window.removeEventListener('resize', resize);
    };
  }, [pdfViewport])

  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

  return <>
    <style jsx global>{`

    body {
      background-color: #fff !important;
    }

    .react-pdf__Document {
      width: 100vw;
      height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    
    `}</style>
    <Document inputRef={pdf} onLoadSuccess={(v) => {
      v.getPage(1).then(v => setViewport(v))
    }} loading={<CircularProgress />} file={`/api/book/${id}/file`}>
      <Page pageNumber={1} width={width} height={height} />
      <Page pageNumber={2} width={width} height={height} />
    </Document>
  </>
}