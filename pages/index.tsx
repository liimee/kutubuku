import { AppBar, Typography, Toolbar, Container, Grid, CircularProgress, Box, Button } from "@mui/material";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export default function Index() {
  useSession({
    required: true
  })

  const [list, setList] = useState<any>(null);

  useEffect(() => {
    fetch('/api/books').then(v => v.json()).then(setList);
  }, [])

  return (
    <>
      <AppBar position="fixed">
        <Toolbar>
          <Typography variant="h6">kutubuku</Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm">
        <Toolbar />
        <Box sx={{ p: 3 }} component="main">
          <Grid container spacing={2}>
            {
              list ? list.map((v: { id: string }) =>
                <Button color='secondary' sx={{ p: 0 }} variant="text" key={v.id}>
                  <img style={{ borderRadius: '4px', height: '14rem' }} src={'/api/thumb?id=' + encodeURIComponent(v.id)} alt="" />
                </Button>
              ) : <CircularProgress />
            }
          </Grid>
        </Box>
      </Container>
    </>
  )
}