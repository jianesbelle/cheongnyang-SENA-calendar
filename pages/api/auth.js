import { serialize } from 'cookie';

const PASSWORD = process.env.SITE_PASSWORD || 'cheongnyang2026';

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { password } = req.body;

  if (password === PASSWORD) {
    const cookie = serialize('auth_token', PASSWORD, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 30, // 30일
      path: '/',
    });
    res.setHeader('Set-Cookie', cookie);
    res.json({ ok: true });
  } else {
    res.status(401).json({ ok: false });
  }
}
