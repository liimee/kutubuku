import { Container, Typography } from "@mui/material";

export default function Offline() {
  return <Container maxWidth='sm'>
    <Typography textAlign='center'>It looks like you&apos;re offline. Which means you cannot open this page.</Typography>
  </Container>
}