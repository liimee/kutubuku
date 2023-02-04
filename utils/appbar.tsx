import Menu from "@mui/icons-material/Menu";
import Class from "@mui/icons-material/Class";
import Explore from "@mui/icons-material/Explore";
import { AppBar, Box, Button, Divider, Drawer, IconButton, Link, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography, Menu as MenuComp, MenuItem, Snackbar, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, TextField } from "@mui/material";
import NextLink from 'next/link';
import { ReactNode, MouseEvent, useState, useEffect } from "react";
import { useRouter } from "next/router";
import ArrowBack from "@mui/icons-material/ArrowBack";
import { signOut, useSession } from "next-auth/react";
import Face from "@mui/icons-material/Face";
import Logout from "@mui/icons-material/Logout";
import SyncIcon from '@mui/icons-material/Sync';
import LockIcon from '@mui/icons-material/Lock';

export default function TopBar() {
  const router = useRouter();
  const session = useSession();

  const [online, setOn] = useState(true);
  const [dialog, setDialog] = useState(false);

  const menu: {
    [key: string]: [ReactNode, string]
  } = {
    // eslint-disable-next-line react/jsx-key
    '/': [<Explore />, 'Explore'],
    // eslint-disable-next-line react/jsx-key
    '/my': [<Class />, 'My Books']
  }

  useEffect(() => {
    setOn(window.navigator.onLine)
    window.addEventListener('online', () => setOn(true));
    window.addEventListener('offline', () => setOn(false));

    return () => {
      window.removeEventListener('online', () => setOn(true));
      window.removeEventListener('offline', () => setOn(false));
    }
  }, [])

  const [drawer, setOpen] = useState(false);
  const [snack, setSnack] = useState(false);
  const [passChange, setPass] = useState<string | null>(null);

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
                <MenuItem onClick={() => setDialog(true)}>
                  <ListItemIcon><LockIcon /></ListItemIcon>
                  Change password
                </MenuItem>
                <MenuItem onClick={() => {
                  fetch('/api/scan').catch(() => { });
                  setSnack(true);
                  setUser(null)
                }}>
                  <ListItemIcon><SyncIcon /></ListItemIcon>
                  Scan library
                </MenuItem>
                <MenuItem onClick={() => signOut()}>
                  <ListItemIcon><Logout /></ListItemIcon>
                  Sign out
                </MenuItem>
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
      <Snackbar message='Scan requested.' open={snack} autoHideDuration={5000} onClose={() => setSnack(false)} />
      <Dialog open={dialog} onClose={() => setDialog(false)}>
        {
          !online ? <>
            <DialogTitle>{"You're offline"}</DialogTitle>
            <DialogContent>
              <DialogContentText>{"And you know that you can't do this while you are."}</DialogContentText>
            </DialogContent>
          </> : <>
            <DialogTitle>{"Change your password"}</DialogTitle>
            <DialogContent>
              <DialogContentText>
                {"Please don't enter gibberish because I'm too lazy to add a forgot password button."}
              </DialogContentText>
              <form id="password" onSubmit={e => {
                e.preventDefault();
                setDialog(false);

                fetch('/api/pass', {
                  method: 'POST',
                  body: (document.querySelector('#name') as HTMLInputElement).value
                }).then((v) => v.ok ? setPass('Password changed.') : setPass('Failed to change password.')).catch(() => setPass('Failed to change password.'));
              }}>
                <TextField
                  autoFocus
                  margin="dense"
                  id="name"
                  label="New password"
                  type="password"
                  fullWidth
                  variant="standard"
                  required
                />
              </form>
            </DialogContent>
          </>
        }
        <DialogActions>
          <Button onClick={() => setDialog(false)}>{online ? 'Cancel' : 'Close'}</Button>
          {online && <Button type='submit' form='password' color='success'>Change</Button>}
        </DialogActions>
      </Dialog>
      <Snackbar
        open={passChange !== null}
        autoHideDuration={6000}
        onClose={() => setPass(null)}
        message={passChange}
      />
    </>
  )
}