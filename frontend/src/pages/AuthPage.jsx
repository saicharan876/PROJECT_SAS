import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiMail, FiLock, FiUser } from 'react-icons/fi';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await login(form.email, form.password);
      } else {
        await signup(form.name, form.email, form.password);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
      <div style={{ display: 'flex', width: '900px', maxWidth: '95vw', minHeight: '520px', borderRadius: 'var(--radius-xl)', overflow: 'hidden', border: '1px solid var(--border)' }}>
        {/* Left Panel */}
        <div style={{ flex: 1, background: 'var(--gradient)', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '48px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: 'white', marginBottom: '12px' }}>PROJECT SAS</h1>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '1.05rem', lineHeight: 1.7 }}>Automate. Optimize. Succeed.</p>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.9rem', marginTop: '24px', lineHeight: 1.6 }}>AI-powered tools for students & engineers — CV Builder, ATS Checker, Assignment Solver, and more.</p>
        </div>
        {/* Right Panel */}
        <div style={{ flex: 1, background: 'var(--bg-secondary)', padding: '48px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ display: 'flex', gap: '0', marginBottom: '32px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', padding: '4px' }}>
            <button onClick={() => setIsLogin(true)} style={{ flex: 1, padding: '10px', background: isLogin ? 'var(--purple)' : 'transparent', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 600, fontFamily: 'Inter', fontSize: '0.85rem' }}>Sign In</button>
            <button onClick={() => setIsLogin(false)} style={{ flex: 1, padding: '10px', background: !isLogin ? 'var(--purple)' : 'transparent', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 600, fontFamily: 'Inter', fontSize: '0.85rem' }}>Sign Up</button>
          </div>

          {error && <div style={{ padding: '10px 14px', background: 'rgba(255,118,117,0.1)', border: '1px solid rgba(255,118,117,0.3)', borderRadius: 'var(--radius-sm)', color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '16px' }}>{error}</div>}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {!isLogin && (
              <div style={{ position: 'relative' }}>
                <FiUser style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input className="input-field" placeholder="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={{ paddingLeft: '40px' }} required />
              </div>
            )}
            <div style={{ position: 'relative' }}>
              <FiMail style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input className="input-field" type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={{ paddingLeft: '40px' }} required />
            </div>
            <div style={{ position: 'relative' }}>
              <FiLock style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input className="input-field" type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} style={{ paddingLeft: '40px' }} required minLength={6} />
            </div>
            <button type="submit" className="btn-glow" disabled={loading} style={{ width: '100%', marginTop: '8px' }}>
              {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
