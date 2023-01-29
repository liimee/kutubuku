import { Button, CircularProgress, Grid } from "@mui/material";
import { Book } from "@prisma/client";
import Link from "next/link";
import BookThumb from "./bookthumb";

export default function BookGrid({ list }: { list: Book[] | null }) {
  return (
    <Grid container spacing={2}>
      {
        list ? list.map((v: { id: string }) =>
          <Grid item key={v.id}>
            <Button color='secondary' sx={{ p: 0 }} LinkComponent={Link} href={"/books/" + v.id} variant="text">
              <BookThumb style={{ borderRadius: '4px', height: '14rem' }} id={v.id} alt="" />
            </Button>
          </Grid>
        ) : <Grid item><CircularProgress /></Grid>
      }
    </Grid>
  )
}