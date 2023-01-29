import BookGrid from "@/utils/bookgrid";
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
          <BookGrid list={list} />
        </Box>
      </Container>
    </>
  )
}