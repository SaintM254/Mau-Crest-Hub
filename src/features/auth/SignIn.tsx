import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogoWithText } from '../../assets/brand/Logo';
import { Button, Input, Alert } from '../../components/ui';
import { api } from '../../api';
import { useSession } from '../../lib/store';
import { en } from '../../i18n/en';

export function SignIn() {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [forgot, setForgot] = useState(false);
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();
  const { setUser } = useSession();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const users = await api.listUsers();
    const u = users.find(x => (x.email === id || x.phone === id) && x.password === password && x.active);
    if (!u) { setError('Email or phone and password do not match. Check them and try again.'); return; }
    setUser(u);
    navigate('/');
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <div className="bg-forest text-cream p-8 md:p-12 flex flex-col justify-between">
        <LogoWithText dark />
        <div>
          <h1 className="text-[32px] font-bold leading-tight mb-2">{en.appName}</h1>
          <p className="text-[17px] text-cream/85">{en.slogan}</p>
          <p className="mt-6 text-[15px] text-cream/70 max-w-md">Farm management and milk sales for Mau Crest Dairies. Livestock, milk, sales, health and labour in one place.</p>
        </div>
        <p className="text-[13px] text-cream/60">Demo version. Data is stored on this device only.</p>
      </div>
      <div className="bg-cream p-8 md:p-12 flex items-center justify-center">
        <div className="w-full max-w-sm">
          {forgot ? (
            <div>
              <h2 className="text-[24px] font-bold mb-4">Reset password</h2>
              {sent ? (
                <Alert tone="success">A reset link has been sent (mock). Check your email or SMS.</Alert>
              ) : (
                <form onSubmit={(e) => { e.preventDefault(); setSent(true); }} className="space-y-4">
                  <Input label="Email or phone" value={id} onChange={(e) => setId(e.target.value)} required />
                  <Button type="submit" className="w-full">Send reset link</Button>
                </form>
              )}
              <button className="mt-4 text-forest font-semibold min-h-[44px]" onClick={() => setForgot(false)}>Back to sign in</button>
            </div>
          ) : (
            <div>
              <h2 className="text-[24px] font-bold mb-1">{en.auth.signIn}</h2>
              <p className="text-[15px] text-ink-muted mb-6">Use your farm email or phone number.</p>
              {error && <div className="mb-4"><Alert tone="danger">{error}</Alert></div>}
              <form onSubmit={submit} className="space-y-4">
                <Input label={en.auth.emailOrPhone} value={id} onChange={(e) => setId(e.target.value)} required autoComplete="username" />
                <div>
                  <Input label={en.auth.password} type={show ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
                  <label className="flex items-center gap-2 mt-2 min-h-[44px] cursor-pointer">
                    <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} className="w-5 h-5 accent-[#1F4D2E]" />
                    <span className="text-[15px]">{en.auth.showPassword}</span>
                  </label>
                </div>
                <Button type="submit" className="w-full">{en.auth.signIn}</Button>
              </form>
              <button className="mt-4 text-forest font-semibold min-h-[44px]" onClick={() => setForgot(true)}>{en.auth.forgot}</button>
              <div className="mt-6 border border-sand rounded-panel bg-paper p-4 text-[13px] text-ink-muted">
                <div className="font-semibold text-ink mb-1">Demo logins</div>
                <div>Owner: owner@maucrest.co.ke / owner123</div>
                <div>Manager: samuel@maucrest.co.ke / manager123</div>
                <div>Data entry: daniel@maucrest.co.ke / entry123</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
