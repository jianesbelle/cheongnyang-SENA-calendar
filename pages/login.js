import { useState } from 'react';
import { useRouter } from 'next/router';

export default function LoginPage() {
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!pw.trim()) return;
    setLoading(true);
    setError('');
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pw }),
    });
    const data = await res.json();
    if (data.ok) {
      const from = router.query.from || '/';
      router.push(from);
    } else {
      setError('비밀번호가 틀렸어요 🔒');
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #F5F2EA 0%, #EAE6DE 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Pretendard', 'Apple SD Gothic Neo', sans-serif",
    }}>
      <div style={{
        background: '#FFF',
        borderRadius: 20,
        padding: '48px 40px',
        width: '100%',
        maxWidth: 360,
        boxShadow: '0 8px 40px rgba(61,53,48,0.12)',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🔐</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#3D3530', marginBottom: 6 }}>
          청량중 2026
        </div>
        <div style={{ fontSize: 13, color: '#aaa', marginBottom: 32 }}>
          비밀번호를 입력하세요
        </div>

        <input
          type="password"
          value={pw}
          onChange={e => setPw(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
          placeholder="비밀번호"
          autoFocus
          style={{
            width: '100%', padding: '12px 16px',
            border: `2px solid ${error ? '#FCA5A5' : '#DDD8CE'}`,
            borderRadius: 12, fontSize: 16,
            fontFamily: 'inherit', outline: 'none',
            boxSizing: 'border-box',
            marginBottom: error ? 8 : 20,
            transition: 'border 0.2s',
          }}
        />

        {error && (
          <div style={{ color: '#EF4444', fontSize: 13, marginBottom: 16 }}>{error}</div>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: '100%', padding: '13px',
            background: loading ? '#ccc' : '#3D3530',
            color: '#FFF', border: 'none',
            borderRadius: 12, fontSize: 15,
            fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit', transition: 'background 0.2s',
          }}
        >
          {loading ? '확인 중...' : '입장하기'}
        </button>
      </div>
    </div>
  );
}
