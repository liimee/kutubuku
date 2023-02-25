import type { Dispatch, SetStateAction } from "react";

export type TocContent = {
  index: number | string,
  title: string
};

export type ReaderProps = {
  file: ArrayBuffer,
  progress: number,
  setBar: Dispatch<SetStateAction<boolean>>,
  deb: (id: string, progress: number) => void,
  drawer: boolean,
  bar: boolean,
  id: string,
  setToc: Dispatch<SetStateAction<TocContent[]>>,
  setTocClick: (v: any) => void,
  setButtons: (v: any) => void
}