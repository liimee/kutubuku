import Menu from "@mui/icons-material/Menu";
import Class from "@mui/icons-material/Class";
import Explore from "@mui/icons-material/Explore";
import { AppBar, Box, Button, Divider, Drawer, IconButton, Link, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography } from "@mui/material";
import NextLink from 'next/link';
import { ReactNode, useState } from "react";

export default function TopBar() {
  const menu: {
    [key: string]: [ReactNode, string]
  } = {
    // eslint-disable-next-line react/jsx-key
    '/': [<Explore />, 'Explore'],
    // eslint-disable-next-line react/jsx-key
    '/my': [<Class />, 'My Books']
  }

  const [drawer, setOpen] = useState(false);

  return (
    <>
      <AppBar position="fixed">
        <Toolbar>
          <IconButton sx={{ display: { md: 'none' }, mr: 2 }} onClick={() => setOpen(true)} color="inherit" aria-label="menu">
            <Menu />
          </IconButton>
          <Link href='/' component={NextLink} color='inherit' underline='hover'><Typography variant="h6">kutubuku</Typography></Link>
          <Box ml={2} sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
            {
              Object.keys(menu).map(v =>
                <Button key={v} variant="text" href={v} startIcon={menu[v][0]} sx={{ color: 'inherit' }} LinkComponent={NextLink}>{menu[v][1]}</Button>
              )
            }
          </Box>
        </Toolbar>
      </AppBar>
      <Drawer
        anchor="left"
        open={drawer}
        onClose={() => setOpen(false)}
      >
        <List sx={{ width: 250 }}>
          <ListItem>
            <Typography variant='h5'>kutubuku</Typography>
          </ListItem>
          <Divider />
          {Object.keys(menu).map(v =>
            <ListItem key={v} disablePadding>
              <ListItemButton href={v} LinkComponent={NextLink}>
                <ListItemIcon>
                  {menu[v][0]}
                </ListItemIcon>
                <ListItemText primary={menu[v][1]} />
              </ListItemButton>
            </ListItem>
          )}
        </List>
      </Drawer>
    </>
  )
}