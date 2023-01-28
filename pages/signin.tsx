import { Typography, Box, Button, Paper, TextField, InputAdornment, Alert } from "@mui/material";
import AccountCircle from '@mui/icons-material/AccountCircle';
import VpnKey from '@mui/icons-material/VpnKey';
import SubdirectoryArrowLeft from '@mui/icons-material/SubdirectoryArrowLeft';

import { getCsrfToken } from "next-auth/react"
import { useRouter } from "next/router";
import { GetServerSidePropsContext } from "next";

export default function Index({ csrfToken }: { csrfToken: string }) {
  const router = useRouter();

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
        <Typography variant="h4" component="h1" my={2}>
          Sign in
        </Typography>

        <form method="post" action="/api/auth/callback/credentials">
          {router.query.error && router.query.error != 'SessionRequired' && <Alert severity="error">
            {router.query.error == 'CredentialsSignin' ?
              "Consider checking your credentials?" : "It looks like the server is having an error. Sorry!"
            }
          </Alert>}

          <input name="csrfToken" type="hidden" defaultValue={csrfToken} />
          <TextField label="Username" name="username" required variant="outlined" fullWidth InputProps={{
            startAdornment:
              <InputAdornment position="start">
                <AccountCircle />
              </InputAdornment>
          }} />
          <TextField label="Password" name="password" required variant="outlined" fullWidth type='password' InputProps={{
            startAdornment:
              <InputAdornment position="start">
                <VpnKey />
              </InputAdornment>
          }} />

          <Box textAlign='end'><Button type='submit' variant="contained" endIcon={<SubdirectoryArrowLeft />}>Sign in</Button></Box>
        </form>
      </Paper>
    </Box>
  )
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  return {
    props: {
      csrfToken: await getCsrfToken(context),
    },
  }
}