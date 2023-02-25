import { Dialog, DialogTitle, IconButton, DialogContent, CircularProgress } from "@mui/material";
import Epub, { Book, Rendition, Contents, Location, NavItem } from "epubjs";
import { useRef, useState, useCallback, useEffect } from "react";
import { ReaderProps, TocContent } from "./type";
import CloseIcon from '@mui/icons-material/Close';

export default function EpubViewer({ file, setBar, drawer, deb, id, progress, bar, setToc, setTocClick }: ReaderProps) {
  const div = useRef<HTMLDivElement | null>(null);
  const book = useRef<Book | null>(null);
  const [rendition, setRend] = useState<Rendition | null>(null);
  const [ready, setReady] = useState(false);
  const [iReady, setiRed] = useState(false);
  const somethingSelected = useRef(false);

  const [dialog, setDialog] = useState<string | null>(null);
  const dialogRef = useCallback((node: HTMLDivElement) => {
    if (node !== null) {
      if (dialog) {
        dialogRend.current = book.current!.renderTo(node, {
          manager: 'default',
          width: '100%'
        });

        const url = new URL(dialog);

        dialogRend.current.hooks.content.register((contents: Contents) => {
          const selected = contents.document.getElementById(url.hash.replace('#', ''));

          if (selected) {
            contents.document.body.innerHTML = selected.outerHTML;
          }

          const links = contents.document.querySelectorAll('a')
          links.forEach(v => {
            if (!isFootnote(v)) {
              v.onclick = e => {
                e.preventDefault();

                closeDialog();

                const url = new URL((e.target as HTMLAnchorElement).href);
                rendition?.display(book.current?.path.relative(url.pathname + url.search + url.hash))
              }
            }
          })
        })

        dialogRend.current.display(book.current?.path.relative(url.pathname + url.search + url.hash));
      }
    }
  }, [dialog, rendition]);

  const dialogRend = useRef<Rendition | null>(null);

  function isFootnote(node: Element) {
    const decs = node.querySelectorAll('*');

    return [...Array.from(decs), node].filter((el: Element) => {
      const style = window.getComputedStyle(el);
      const epType = node.closest('[epub\\:type]')?.getAttribute('epub:type');

      return epType !== 'footnote' && (epType == 'noteref' ||
        (['inline', 'inline-block'].includes(style.display) &&
          ['sub', 'super', 'top', 'bottom'].includes(style.verticalAlign)))
    }).length > 0
  }

  useEffect(() => {
    let c: Rendition | null;

    if (div.current) {
      book.current = Epub(file);
      c = book.current?.renderTo(div.current, {
        manager: 'default'
      })

      c.hooks.content.register((contents: Contents) => {
        const links = contents.document.querySelectorAll('a')
        links.forEach(v => {
          if (isFootnote(v as Element)) {
            v.onclick = e => {
              e.preventDefault();

              if (book.current) setDialog((e.target as Element).tagName.toLowerCase() === 'a' ? (e.target as HTMLAnchorElement).href : (e.target as Element).closest('a')!.href)
            }
          }
        })

        contents.document.addEventListener('selectionchange', () => {
          const selection = contents.document.getSelection();
          somethingSelected.current = (selection != null && selection.toString().length > 0)
        })
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

        book.current = null;
      } catch (e) { console.log(e) }
    }
  }, [file])

  useEffect(() => {
    setTocClick((v: TocContent) => rendition?.display(v.index as string))
  }, [setTocClick, rendition])

  useEffect(() => {
    function mapSub(v: NavItem) {
      const returned: TocContent = {
        title: v.label,
        index: v.href,
        children: v.subitems?.map(mapSub)
      }

      return returned;
    }

    if (book.current && iReady)
      setToc(book.current.navigation?.toc.map(v => {
        return {
          title: v.label,
          index: v.href,
          children: v.subitems?.map(mapSub)
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
    console.log(somethingSelected.current)
    if (!drawer && !somethingSelected.current) {
      const closestA = (e.target as Element).closest('a');

      if (!closestA)
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

  function closeDialog() {
    dialogRend.current?.destroy();
    setDialog(null);
    dialogRend.current = null;
  }

  return <>
    <div style={{
      display: !ready ? 'none' : 'block'
    }} ref={div}>
    </div>
    <Dialog maxWidth='sm' scroll='body' fullWidth PaperProps={{ sx: { minHeight: '200px' } }} open={dialog !== null} onClose={closeDialog}>
      <DialogTitle>
        <div style={{ flex: 1, display: 'flex' }}>
          <div style={{ flexGrow: 1, margin: 'auto' }}>Footnote</div>
          <IconButton onClick={closeDialog}><CloseIcon /></IconButton>
        </div>
      </DialogTitle>
      <DialogContent>
        <div style={{ width: '100%' }} ref={dialogRef}></div>
      </DialogContent>
    </Dialog>
    {!ready && <CircularProgress sx={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />}
  </>
}