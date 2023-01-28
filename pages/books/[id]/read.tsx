import { CircularProgress } from '@mui/material';
import { useRouter } from 'next/router';
import { Document, Page, pdfjs, PDFPageProxy } from 'react-pdf';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import { useEffect, useRef, useState } from 'react';
import { unstable_getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import client from '@/utils/prisma';
import debounce from 'lodash.debounce';
import { GetServerSidePropsContext } from 'next';

export default function Read({ progress }: { progress: number | null }) {
  const router = useRouter()
  const { id } = router.query;

  const [width, setWidth] = useState<number | undefined>(100);
  const [height, setHeight] = useState<number | undefined>(100);

  var [pdfViewport, setViewport] = useState<PDFPageProxy | undefined>();

  const [pageNum, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  var pdf = useRef<HTMLDivElement>();

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

  useEffect(() => {
    function click(e: MouseEvent) {
      if (e.clientX >= window.innerWidth / 2) setPage(pageNum + 2);
      else if (pageNum > 0) setPage(pageNum - 2);
    }

    window.addEventListener('click', click);

    return (() => {
      window.removeEventListener('click', click);
    })
  }, [id, pageNum, pages, progress])

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
    {/* @ts-ignore */}
    <Document inputRef={pdf} onLoadSuccess={(v) => {
      {/* @ts-ignore */ }
      v.getPage(1).then(v => setViewport(v))
      setPages(v.numPages);
    }} loading={<CircularProgress />} file={`/api/book/${id}/file`}>
      <Page pageIndex={pageNum} width={width} height={height} />
      <Page pageIndex={pageNum + 1} width={width} height={height} />
    </Document>
  </>
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const user = await unstable_getServerSession(context.req, context.res, authOptions);

  if (user) {
    const progress = await client.progress.findFirst({
      where: {
        userId: user.user.id,
        bookId: context.query.id as string
      },
      select: {
        progress: true
      }
    })

    if (progress) {
      return {
        props: {
          progress: progress.progress
        }
      }
    }
  }

  return {
    props: {
      progress: null
    }
  }
}