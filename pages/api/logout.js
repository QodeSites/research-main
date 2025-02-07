// pages/api/logout.js
import { serialize } from 'cookie';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  // Clear the cookie by setting it to empty and expiring it immediately
  res.setHeader(
    'Set-Cookie',
    serialize('auth', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      expires: new Date(0),
      path: '/',
    })
  );

  res.status(200).json({ message: 'Logout successful' });
}
