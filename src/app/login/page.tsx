// src/app/login/page.tsx
'use client';
import { useState, type FormEvent } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Fraunces, Inter, IBM_Plex_Mono } from 'next/font/google';

const fraunces = Fraunces({ subsets: ['latin'], weight: ['500', '600'], style: ['normal', 'italic'], variable: '--font-display' });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-body' });
const plexMono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['500'], variable: '--font-mono' });

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await signIn('credentials', { username, password, redirect: false });
    setLoading(false);
    if (res?.error) {
      setError('Invalid username or password');
      return;
    }
    router.push('/dashboard');
    router.refresh();
  }

  return (
    <div className={`${fraunces.variable} ${inter.variable} ${plexMono.variable} min-h-screen w-full flex bg-[#faf8f3]`} style={{ fontFamily: 'var(--font-body)' }}>
      {/* Left — brand panel */}
      <div className="relative hidden w-[46%] flex-col justify-between overflow-hidden bg-[#122b23] px-14 py-12 text-[#eef3ee] lg:flex">
        {/* logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#eef3ee]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#122b23" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.5 20.5a4.95 4.95 0 0 1-7-7l8-8a4.95 4.95 0 0 1 7 7l-8 8Z" />
              <path d="m9 8 7 7" />
            </svg>
          </div>
          <span className="text-[17px] font-semibold tracking-tight" >
            Formacy
          </span>
        </div>

        {/* headline */}
        <div className="max-w-md">
          <h1 className="text-[42px] leading-[1.12] font-medium tracking-tight">
            Pharmacy billing,{' '}
            <em className="not-italic italic text-[#a9c6b3]">reimagined</em>{' '}
            for speed.
          </h1>
          <p className="mt-5 text-[15px] leading-relaxed text-[#cfdbd2]">
            GST-ready invoicing, one-click print, prescription upload, and secure payments
            — all in a single, snappy console built for busy counters.
          </p>

          <div className="mt-10 flex gap-9">
            {[
              { label: 'Zero-lag POS', icon: <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8Z" /> },
              { label: 'Instant print', icon: <><path d="M6 9V2h12v7" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></> },
              { label: 'GST compliant', icon: <><path d="M12 2 4 5v6c0 5 3.4 8.7 8 11 4.6-2.3 8-6 8-11V5l-8-3Z" /><path d="m9 12 2 2 4-4" /></> },
            ].map((f) => (
              <div key={f.label} className="flex flex-col items-start gap-2">
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#eef3ee" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  {f.icon}
                </svg>
                <span className="font-mono text-[10.5px] font-medium uppercase tracking-[0.09em] text-[#b7c9bd]" >
                  {f.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <span className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-[#7f978a]" >
          v1.0 · made for Indian pharmacies
        </span>

        {/* signature: capsule motif, not the generic stacked-square pattern */}
        <div className="pointer-events-none absolute -bottom-16 -right-20 h-72 w-72">
          <div className="absolute h-20 w-52 rotate-[38deg] rounded-full bg-[#1c3d33] opacity-90" />
          <div className="absolute left-10 top-16 h-20 w-52 rotate-[38deg] rounded-full border border-[#3a5c4e] bg-transparent" />
          <div className="absolute left-24 top-32 h-14 w-36 rotate-[38deg] rounded-full bg-[#254639]" />
        </div>
      </div>

      {/* Right — form */}
      <div className="flex w-full flex-1 items-center justify-center px-6 py-16 lg:w-[54%]">
        <div className="w-full max-w-[380px]">
          {/* mobile-only brand mark */}
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#122b23]">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#eef3ee" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.5 20.5a4.95 4.95 0 0 1-7-7l8-8a4.95 4.95 0 0 1 7 7l-8 8Z" />
                <path d="m9 8 7 7" />
              </svg>
            </div>
            <span className="text-[15px] font-semibold" style={{ fontFamily: 'var(--font-display)' }}>Formacy</span>
          </div>

          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-[#8a9a90]" >
            Sign in to continue
          </p>
          <h2 className="mt-2 text-[32px] font-medium tracking-tight text-[#141a17]" >
            Welcome back.
          </h2>
          <p className="mt-2 text-[14.5px] leading-relaxed text-[#6b756f]">
            Access your pharmacy dashboard, inventory and billing counter.
          </p>

          <form onSubmit={handleSubmit} className="mt-9 space-y-6">
            <div>
              <label htmlFor="username" className="font-mono text-[10.5px] font-medium uppercase tracking-[0.09em] text-[#8a9a90]" style={{ fontFamily: 'var(--font-mono)' }}>
                Username
              </label>
              <input
                id="username"
                className="mt-2 w-full border-0 border-b-[1.5px] border-[#d8ddd8] bg-transparent px-0 py-2 text-[15px] text-[#141a17] outline-none transition-colors placeholder:text-[#a9b3ac] focus:border-[#122b23]"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                placeholder="admin"
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="font-mono text-[10.5px] font-medium uppercase tracking-[0.09em] text-[#8a9a90]" style={{ fontFamily: 'var(--font-mono)' }}>
                Password
              </label>
              <input
                id="password"
                type="password"
                className="mt-2 w-full border-0 border-b-[1.5px] border-[#d8ddd8] bg-transparent px-0 py-2 text-[15px] text-[#141a17] outline-none transition-colors placeholder:text-[#a9b3ac] focus:border-[#122b23]"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="••••••••"
                required
              />
            </div>

            {error && <p className="text-[13.5px] text-[#b3413a]">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center rounded-md bg-[#122b23] py-3 text-[14.5px] font-medium text-[#eef3ee] transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="mt-8 text-center text-[12px] leading-relaxed text-[#a1aaa4]">
            Demo: admin / Admin@123 · pharmacist / Pharma@123
          </p>
        </div>
      </div>
    </div>
  );
}