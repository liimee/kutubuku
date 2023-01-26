import { AppBar, Link, Toolbar, Typography } from "@mui/material";
import NextLink from 'next/link';

export default function TopBar() {
  return (
    <AppBar position="fixed">
      <Toolbar>
        <Link href='/' component={NextLink} color='inherit' underline='hover'><Typography variant="h6">kutubuku</Typography></Link>
      </Toolbar>
    </AppBar>
  )
}