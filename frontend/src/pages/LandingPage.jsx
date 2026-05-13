import { useNavigate } from 'react-router-dom';
import { FiFileText, FiCheckSquare, FiSearch, FiAward, FiCode, FiList, FiArrowRight } from 'react-icons/fi';

const features = [
  { icon: <FiFileText />, title: 'AI CV Builder', desc: 'Generate professional LaTeX CVs from your GitHub and job target.', color: '#6C5CE7' },
  { icon: <FiCheckSquare />, title: 'ATS Checker', desc: 'Analyze your resume against job descriptions for ATS compatibility.', color: '#00CEC9' },
  { icon: <FiSearch />, title: 'Assignment Solver', desc: 'Get AI-generated answers compiled into clean PDF documents.', color: '#A29BFE' },
  { icon: <FiAward />, title: 'Scholarship Finder', desc: 'AI-curated scholarships matched to your profile and eligibility.', color: '#FDCB6E' },
  { icon: <FiCode />, title: 'Contest Tracker', desc: 'Never miss a competitive programming contest across platforms.', color: '#FF7675' },
  { icon: <FiList />, title: 'Smart To-Do', desc: 'AI-prioritized task management based on deadlines and contests.', color: '#00B894' },
];

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Navbar */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 48px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.4rem' }}>⚡</span>
          <span style={{ fontWeight: 800, fontSize: '1.2rem', background: 'var(--gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>PROJECT SAS</span>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn-secondary" onClick={() => navigate('/login')}>Sign In</button>
          <button className="btn-glow" onClick={() => navigate('/login')}>Get Started</button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ textAlign: 'center', padding: '100px 24px 80px', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(108,92,231,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <span className="badge badge-purple" style={{ marginBottom: '20px' }}>🚀 Built for Students & Engineers</span>
        <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 800, lineHeight: 1.1, marginTop: '16px', marginBottom: '20px' }}>
          <span style={{ background: 'var(--gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>PROJECT SAS</span>
        </h1>
        <p style={{ fontSize: '1.3rem', color: 'var(--text-secondary)', marginBottom: '40px', maxWidth: '600px', marginLeft: 'auto', marginRight: 'auto' }}>
          Automate. Optimize. <span style={{ color: 'var(--cyan)' }}>Succeed.</span>
        </p>
        <button className="btn-glow" onClick={() => navigate('/login')} style={{ fontSize: '1.1rem', padding: '16px 40px' }}>
          Get Started <FiArrowRight style={{ marginLeft: '8px', verticalAlign: 'middle' }} />
        </button>
      </section>

      {/* Features */}
      <section style={{ padding: '40px 48px 100px', maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', fontSize: '2rem', fontWeight: 700, marginBottom: '48px' }}>Everything You Need</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          {features.map((f, i) => (
            <div key={i} className="glass-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/login')}>
              <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', background: `${f.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: f.color, fontSize: '1.3rem', marginBottom: '16px' }}>
                {f.icon}
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '8px' }}>{f.title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ textAlign: 'center', padding: '32px', borderTop: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
        © 2026 PROJECT SAS. Built with ⚡ by students, for students.
      </footer>
    </div>
  );
};

export default LandingPage;
