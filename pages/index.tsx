import { AppBar, Typography, Toolbar } from "@mui/material";
import { useSession } from "next-auth/react";

export default function Index() {
  useSession({
    required: true
  })

  return (
    <>
    <AppBar position="fixed">
      <Toolbar>
        <Typography variant="h6">kutubuku</Typography>
      </Toolbar>
    </AppBar>
    </>
  )
}