/* eslint-disable @next/next/no-img-element */
/* eslint-disable jsx-a11y/alt-text */

import { Box, Typography } from "@mui/material";
import { useState } from "react";

export default function BookThumb(props: any) {
  const [error, setError] = useState(false);

  return !error ?
    <img {...props} onError={() => setError(true)} src={'/api/book/' + props.id + '/thumb'} />
    : <Box sx={{
      background: 'linear-gradient(to top, #935d1d, #D08529)',
      color: '#F3DEC4',
      width: '150px',
      height: '14rem',
      borderRadius: '4px',
      textTransform: 'none',
      padding: '1rem'
    }} {...props}>
      <div style={{
        border: 'solid 2px hsl(33, 67%, 84%, 30%)',
        height: '100%',
        width: '100%',
        padding: '1rem 10px'
      }}>
        <Typography textAlign='center' sx={{
          userSelect: 'none',
          overflowWrap: 'break-word',
          hyphens: 'manual',
          maxHeight: '100%'
        }} overflow='hidden'>
          {props.title}
        </Typography>
      </div>
    </Box>
}