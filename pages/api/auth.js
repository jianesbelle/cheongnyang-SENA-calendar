const PASSWORD = process.env.SITE_PASSWORD || 'cheongnyang2026';

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { password } = req.body;

  if (password === PASSWORD) {
    const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
    res.setHeader('Set-Cookie',
      `auth_token=${PASSWORD}; HttpOnly; Path=/; Max-Age=${60 * 60 * 24 * 30}; SameSite=Strict${secure}`
    );
    res.json({ ok: true });
  } else {
    res.status(401).json({ ok: false });
  }
}
