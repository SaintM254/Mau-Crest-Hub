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
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-paper border border-sand rounded-panel p-6 md:p-8">
        <div className="flex justify-center mb-6"><LogoWithText /></div>
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
              <button className="mt-4 text-forest font-semibold min-h-[44px] underline underline-offset-2" onClick={() => setForgot(false)}>Back to sign in</button>
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
              <div className="mt-6 rounded-panel bg-cream border border-sand p-4">
                <div className="text-[13px] font-semibold text-ink mb-2">Demo logins</div>
                <div className="space-y-1.5 text-[13px]">
                  {[
                    { role: 'Owner', email: 'owner@maucrest.co.ke', pass: 'owner123' },
                    { role: 'Manager', email: 'samuel@maucrest.co.ke', pass: 'manager123' },
                    { role: 'Data entry', email: 'daniel@maucrest.co.ke', pass: 'entry123' }
                  ].map(d => (
                    <button
                      key={d.role}
                      type="button"
                      onClick={() => { setId(d.email); setPassword(d.pass); setError(''); }}
                      className="w-full text-left flex items-center justify-between gap-2 rounded-input px-2 py-1.5 hover:bg-cream-deep transition-colors duration-150"
                    >
                      <span className="text-ink-muted">{d.role}</span>
                      <span className="num text-ink">{d.pass}</span>
                    </button>
                  ))}
                </div>
                <p className="text-[13px] text-ink-muted mt-2">Tap a role to fill the form.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
