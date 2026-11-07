import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { Alert, Card, Field, GoldButton, PageShell } from '../components/ui';

/* Login ke baad kahan jaana hai (?next=/checkout) – sirf apni site ke andar */
function useNext() {
  const [params] = useSearchParams();
  const next = params.get('next') || '/orders';
  return next.startsWith('/') && !next.startsWith('//') ? next : '/orders';
}

function PasswordInput({ value, onChange, error, label = 'Password', name = 'password', autoComplete }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Field label={label} name={name} type={show ? 'text' : 'password'} value={value} onChange={onChange} error={error} autoComplete={autoComplete} className="[&_input]:pr-20" />
      <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-2 top-[34px] rounded-lg px-3 py-1.5 text-xs font-medium text-gold-light hover:bg-white/5">
        {show ? 'Hide' : 'Show'}
      </button>
    </div>
  );
}

export function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const next = useNext();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={next} replace />;

  const submit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) return setError('Enter your email and password.');
    setBusy(true);
    setError('');
    try {
      await login(email.trim(), password);
      navigate(next, { replace: true });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <PageShell narrow eyebrow="Welcome back" title="Log" accent="in" sub="Track your orders and check out faster.">
      <Card className="page-in p-6 md:p-8">
        <form onSubmit={submit} className="space-y-5" noValidate>
          <Field label="Email" name="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
          <div className="-mt-2 text-right">
            <Link to="/forgot-password" className="text-sm text-gold-light hover:underline">Forgot password?</Link>
          </div>
          {error && <Alert>{error}</Alert>}
          <GoldButton type="submit" loading={busy} className="w-full">{busy ? 'Logging in' : 'Log in'}</GoldButton>
        </form>
      </Card>
      <p className="mt-6 text-center text-sm text-mist">
        New to RUPUR?{' '}
        <Link to={`/signup${location.search}`} className="font-medium text-gold-light hover:underline">Create an account</Link>
      </p>
    </PageShell>
  );
}

export function SignupPage() {
  const { user, signup } = useAuth();
  const navigate = useNavigate();
  const next = useNext();
  const location = useLocation();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={next} replace />;

  const set = (k) => (e) => { setForm((f) => ({ ...f, [k]: e.target.value })); setErrors((er) => ({ ...er, [k]: undefined })); };

  const submit = async (e) => {
    e.preventDefault();
    const er = {};
    if (form.name.trim().length < 2) er.name = 'Enter your full name.';
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) er.email = 'Enter a valid email address.';
    if (!/^[6-9]\d{9}$/.test(form.phone.replace(/\D/g, '').slice(-10))) er.phone = 'Enter a 10 digit mobile number.';
    if (form.password.length < 8) er.password = 'At least 8 characters.';
    setErrors(er);
    if (Object.keys(er).length) return;
    setBusy(true);
    setError('');
    try {
      await signup({ ...form, name: form.name.trim(), email: form.email.trim() });
      navigate(next, { replace: true });
    } catch (err) {
      setErrors(err.fields);
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <PageShell narrow eyebrow="Join RUPUR" title="Create" accent="account" sub="It takes less than a minute.">
      <Card className="page-in p-6 md:p-8">
        <form onSubmit={submit} className="space-y-5" noValidate>
          <Field label="Full name" name="name" autoComplete="name" value={form.name} onChange={set('name')} error={errors.name} />
          <Field label="Email" name="email" type="email" autoComplete="email" value={form.email} onChange={set('email')} error={errors.email} placeholder="you@example.com" />
          <Field label="Mobile number" name="phone" type="tel" inputMode="numeric" autoComplete="tel-national" value={form.phone} onChange={set('phone')} error={errors.phone} placeholder="98765 43210" />
          <PasswordInput value={form.password} onChange={set('password')} error={errors.password} autoComplete="new-password" />
          {error && !Object.keys(errors || {}).length && <Alert>{error}</Alert>}
          <GoldButton type="submit" loading={busy} className="w-full">{busy ? 'Creating account' : 'Create account'}</GoldButton>
        </form>
      </Card>
      <p className="mt-6 text-center text-sm text-mist">
        Already have an account?{' '}
        <Link to={`/login${location.search}`} className="font-medium text-gold-light hover:underline">Log in</Link>
      </p>
    </PageShell>
  );
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError('Enter a valid email address.');
    setBusy(true);
    setError('');
    try {
      await api('/auth/forgot', { method: 'POST', body: { email: email.trim() } });
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageShell narrow eyebrow="Account help" title="Forgot" accent="password?" sub="We will email you a link to set a new one.">
      <Card className="page-in p-6 md:p-8">
        {sent ? (
          <div className="text-center">
            <p className="font-serif text-2xl text-cream">Check your email</p>
            <p className="mt-3 text-[15px] text-mist">If an account exists for <span className="text-cream">{email}</span>, a reset link is on its way. It works for 1 hour.</p>
            <Link to="/login" className="mt-6 inline-block text-sm text-gold-light hover:underline">Back to log in</Link>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-5" noValidate>
            <Field label="Email" name="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            {error && <Alert>{error}</Alert>}
            <GoldButton type="submit" loading={busy} className="w-full">Send reset link</GoldButton>
          </form>
        )}
      </Card>
    </PageShell>
  );
}

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (password.length < 8) return setError('Password must be at least 8 characters.');
    setBusy(true);
    setError('');
    try {
      await resetPassword(token, password);
      navigate('/orders', { replace: true });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <PageShell narrow eyebrow="Account help" title="New" accent="password">
      <Card className="page-in p-6 md:p-8">
        {!token ? (
          <Alert>This reset link is not complete. <Link to="/forgot-password" className="underline">Request a new one</Link>.</Alert>
        ) : (
          <form onSubmit={submit} className="space-y-5" noValidate>
            <PasswordInput label="New password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
            {error && <Alert>{error}</Alert>}
            <GoldButton type="submit" loading={busy} className="w-full">Save password</GoldButton>
          </form>
        )}
      </Card>
    </PageShell>
  );
}
