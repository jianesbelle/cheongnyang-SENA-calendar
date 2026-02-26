export default function handler(req, res) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader('Set-Cookie',
    `auth_token=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict${secure}`
  );
  res.json({ ok: true });
}
