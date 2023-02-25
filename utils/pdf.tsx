import { useMediaQuery, CircularProgress } from "@mui/material";
import { useRef, useState, useEffect } from "react";
import { PDFPageProxy, pdfjs, Page, Document } from "react-pdf";
import { ReaderProps, TocContent } from "./type";
import 'react-pdf/dist/esm/Page/TextLayer.css'
import 'react-pdf/dist/esm/Page/AnnotationLayer.css'

export default function PdfViewer({ file, progress, setBar, deb, drawer, bar, id, setToc, setTocClick }: ReaderProps) {
  var pdf = useRef<HTMLDivElement>();
  const isSmol = useMediaQuery('(max-width: 500px)');
  const [width, setWidth] = useState<number | undefined>(100);
  const [height, setHeight] = useState<number | undefined>(100);
  const [pageNum, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  var [pdfViewport, setViewport] = useState<PDFPageProxy | undefined>();
  const somethingSelected = useRef(false);

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
      if (!drawer && !somethingSelected.current) {
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

  useEffect(() => {
    function onSelect() {
      const selection = document.getSelection();

      somethingSelected.current = (selection != null
        && (selection.anchorNode!.parentElement!.closest('.react-pdf__Document') != null
          && (selection.toString().length > 0)
        )
      )
    }

    document.addEventListener('selectionchange', onSelect);

    return () => {
      document.removeEventListener('selectionchange', onSelect);
    }
  }, [])


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