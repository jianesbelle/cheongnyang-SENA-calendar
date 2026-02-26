import { serialize } from 'cookie';

export default function handler(req, res) {
  const cookie = serialize('auth_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0, // 즉시 만료
    path: '/',
  });
  res.setHeader('Set-Cookie', cookie);
  res.json({ ok: true });
}
