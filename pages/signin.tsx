import { Typography, Box, Button, Paper, TextField, InputAdornment, Alert } from "@mui/material";
import AccountCircle from '@mui/icons-material/AccountCircle';
import VpnKey from '@mui/icons-material/VpnKey';
import SubdirectoryArrowLeft from '@mui/icons-material/SubdirectoryArrowLeft';
import { useRouter } from "next/router";
import { ChangeEvent, FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import Head from "next/head";
import icon from '@/public/icons/icon.svg';
import Image from 'next/image';

export default function Index() {
  const router = useRouter();

  const [username, setUser] = useState('');
  const [pass, setPass] = useState('');

  return (
    <Box display='flex'
      justifyContent='center'
      alignItems='center'
      minWidth="100%"
      minHeight="100vh">
      <Paper sx={{
        '& form>*': { my: 1 },
        minWidth: '40%', padding: '24px 16px'
      }}>
        <Image src={icon} style={{
          display: 'block',
          margin: 'auto'
        }} width={120} alt='kutubuku icon' />

        <Typography variant="h4" component="h1" my={2}>
          Sign in
        </Typography>

        <form onSubmit={(e: FormEvent) => {
          e.preventDefault();

          signIn('credentials', {
            username,
            password: pass,
            callbackUrl: router.query.callbackUrl?.toString() || '/'
          });
        }}>
          {router.query.error && router.query.error != 'SessionRequired' && <Alert severity="error">
            {router.query.error == 'CredentialsSignin' ?
              "Consider checking your credentials?" : "It looks like the server is having an error. Sorry!"
            }
          </Alert>}
          <TextField label="Username" name="username" value={username} onInput={(e: ChangeEvent<HTMLInputElement>) => setUser(e.target.value)} required variant="outlined" fullWidth InputProps={{
            startAdornment:
              <InputAdornment position="start">
                <AccountCircle />
              </InputAdornment>
          }} />
          <TextField label="Password" name="password" required variant="outlined" fullWidth type='password' value={pass} onInput={(e: ChangeEvent<HTMLInputElement>) => setPass(e.target.value)} InputProps={{
            startAdornment:
              <InputAdornment position="start">
                <VpnKey />
              </InputAdornment>
          }} />

          <Box textAlign='end'><Button type='submit' variant="contained" endIcon={<SubdirectoryArrowLeft />}>Sign in</Button></Box>
        </form>
      </Paper>
      <Head>
        <title>Sign in</title>
      </Head>
    </Box>
  )
}