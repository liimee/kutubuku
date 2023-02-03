import Menu from "@mui/icons-material/Menu";
import Class from "@mui/icons-material/Class";
import Explore from "@mui/icons-material/Explore";
import { AppBar, Box, Button, Divider, Drawer, IconButton, Link, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography, Menu as MenuComp, MenuItem } from "@mui/material";
import NextLink from 'next/link';
import { ReactNode, MouseEvent, useState } from "react";
import { useRouter } from "next/router";
import ArrowBack from "@mui/icons-material/ArrowBack";
import { signOut, useSession } from "next-auth/react";
import Face from "@mui/icons-material/Face";

export default function TopBar() {
  const router = useRouter();
  const session = useSession();

  const menu: {
    [key: string]: [ReactNode, string]
  } = {
    // eslint-disable-next-line react/jsx-key
    '/': [<Explore />, 'Explore'],
    // eslint-disable-next-line react/jsx-key
    '/my': [<Class />, 'My Books']
  }

  const [drawer, setOpen] = useState(false);

  const [userOpen, setUser] = useState<HTMLElement | null>(null);

  return (
    <>
      <AppBar position="fixed">
        <Toolbar>
          {
            (router.pathname != '/' && router.pathname != '/my' && router.pathname != '/signin') &&
            <IconButton color='inherit' aria-label='back' sx={{ mr: 1 }} onClick={router.back}>
              <ArrowBack />
            </IconButton>
          }
          {router.pathname != '/signin' &&
            <IconButton sx={{ display: { md: 'none' }, mr: 2 }} onClick={() => setOpen(true)} color="inherit" aria-label="menu">
              <Menu />
            </IconButton>
          }
          <Link href='/' sx={{ flexGrow: 1 }} component={NextLink} color='inherit' underline='hover'><Typography variant="h6">kutubuku</Typography></Link>
          {router.pathname != '/signin' &&
            <Box ml={2} sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
              {
                Object.keys(menu).map(v =>
                  <Button key={v} variant="text" href={v} startIcon={menu[v][0]} sx={{ color: 'inherit', mx: 1 }} LinkComponent={NextLink}>{menu[v][1]}</Button>
                )
              }
            </Box>
          }
          {session.status === 'authenticated' &&
            <div>
              <IconButton
                size="large"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                color="inherit"
                onClick={(e: MouseEvent<HTMLElement>) => setUser(e.currentTarget)}
              >
                <Face />
              </IconButton>
              <MenuComp
                id="menu-appbar"
                anchorEl={userOpen}
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                sx={{ mt: '30px' }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={userOpen !== null}
                onClose={() => setUser(null)}
              >
                <MenuItem onClick={() => signOut()}>Sign out</MenuItem>
              </MenuComp>
            </div>
          }
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