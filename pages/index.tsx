import BookThumb from "@/utils/bookthumb";
import { Container, Grid, CircularProgress, Box, Button } from "@mui/material";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Index() {
  const [list, setList] = useState<any>(null);

  useEffect(() => {
    fetch('/api/books').then(v => v.json()).then(setList);
  }, [])

  return (
    <>
      <Container maxWidth="sm">
        <Box sx={{ p: 3 }} component="main">
          <Grid container spacing={2}>
            {
              list ? list.map((v: { id: string }) =>
                <Button color='secondary' sx={{ p: 0 }} LinkComponent={Link} href={"/books/"+v.id} variant="text" key={v.id}>
                  <BookThumb style={{ borderRadius: '4px', height: '14rem' }} id={v.id} alt="" />
                </Button>
              ) : <CircularProgress />
            }
          </Grid>
        </Box>
      </Container>
    </>
  )
}