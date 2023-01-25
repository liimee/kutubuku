import type { NextApiRequest, NextApiResponse } from 'next';
import scan from '../../scan';

export default function handler(_: NextApiRequest, res: NextApiResponse) {
  scan();

  res.status(200).json({ message: '(hopefully) ok' })
}