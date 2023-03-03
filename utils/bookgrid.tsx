import { Button, Grid, LinearProgress } from "@mui/material";
import { Book } from "@prisma/client";
import Link from "next/link";
import BookThumb from "./bookthumb";

export default function BookGrid({ list }: { list: Book[] | null }) {
  return (
    list ?
      <Grid container spacing={2} justifyContent='space-evenly'>
        {
          // @ts-ignore
          list.sort((a, b) => a.title?.localeCompare(b.title)).map((v: {
            title: string; id: string
          }) =>
            <Grid item key={v.id}>
              <Button color='secondary' sx={{ p: 0 }} LinkComponent={Link} href={"/books/" + v.id} variant="text">
                <BookThumb style={{ borderRadius: '4px', height: '14rem' }} id={v.id} title={v.title} alt={v.title} />
              </Button>
            </Grid>
          )
        }
      </Grid>
      : <LinearProgress />
  )
}