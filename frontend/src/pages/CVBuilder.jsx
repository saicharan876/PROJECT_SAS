import { useState } from 'react';
import { cvAPI } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { FiGithub, FiUser, FiMail, FiPhone, FiLinkedin, FiBook, FiBriefcase, FiCpu, FiEdit3, FiCheck, FiLoader, FiCode, FiEye } from 'react-icons/fi';

/* ── Reusable Modal ── */
const Modal = ({ isOpen, onClose, title, children }) => (
  <AnimatePresence>
    {isOpen && (
      <>
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
            zIndex: 1000,
          }}
        />
        <motion.div 
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          style={{
            position: 'fixed', zIndex: 1001,
            top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            width: '90%', maxWidth: '500px',
            background: 'var(--bg-primary)', padding: '24px',
            borderRadius: '16px', border: '1px solid var(--border)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0 }}>{title}</h3>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.4rem', lineHeight: 1 }}>×</button>
          </div>
          {children}
          <button onClick={onClose} className="btn-glow" style={{ width: '100%', marginTop: '20px' }}>Save & Close</button>
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

/* ── Attribute Card ── */
const AttributeCard = ({ icon: Icon, label, value, onClick, isComplete }) => (
  <motion.div 
    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
    onClick={onClick}
    style={{
      padding: '14px 16px', borderRadius: '12px', background: 'var(--bg-secondary)',
      border: isComplete ? '1px solid var(--accent)' : '1px solid var(--border)',
      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px',
    }}
  >
    <div style={{ 
      width: '38px', height: '38px', borderRadius: '8px', flexShrink: 0,
      background: isComplete ? 'rgba(var(--accent-rgb), 0.1)' : 'var(--bg-tertiary)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: isComplete ? 'var(--accent)' : 'var(--text-muted)'
    }}>
      <Icon size={18} />
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
      <div style={{ fontSize: '0.88rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {value || <span style={{ fontStyle: 'italic', opacity: 0.4 }}>Click to fill...</span>}
      </div>
    </div>
    {isComplete && <FiCheck style={{ color: 'var(--accent)', flexShrink: 0 }} />}
  </motion.div>
);

/* ── Project Card with bullet points ── */
const ProjectCard = ({ repo, isSelected, onToggle, bullets, isLoadingBullets }) => (
  <motion.div
    whileHover={{ scale: 1.01 }}
    onClick={onToggle}
    style={{
      padding: '14px', borderRadius: '12px', cursor: 'pointer',
      background: isSelected ? 'rgba(var(--accent-rgb), 0.08)' : 'var(--bg-secondary)',
      border: isSelected ? '2px solid var(--accent)' : '1px solid var(--border)',
    }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
      <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{repo.name}</span>
      <span style={{ fontSize: '0.65rem', background: 'var(--bg-tertiary)', padding: '2px 8px', borderRadius: '6px', color: 'var(--text-muted)' }}>{repo.language}</span>
    </div>
    {repo.description && (
      <p style={{ fontSize: '0.73rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>{repo.description}</p>
    )}
    {isSelected && (
      <div style={{ marginTop: '10px', borderTop: '1px solid var(--border)', paddingTop: '8px' }}>
        {isLoadingBullets ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent)', fontSize: '0.78rem' }}>
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
              <FiLoader size={14} />
            </motion.div>
            Reading README & generating points...
          </div>
        ) : bullets && bullets.length > 0 ? (
          <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            {bullets.slice(0, 3).map((b, i) => <li key={i} style={{ marginBottom: '3px' }}>{b}</li>)}
          </ul>
        ) : (
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>No bullets available</p>
        )}
      </div>
    )}
  </motion.div>
);

/* ══════════════════════ Main Component ══════════════════════ */
const CVBuilder = () => {
  const [step, setStep] = useState(1);
  const [activeModal, setActiveModal] = useState(null);
  const [form, setForm] = useState({ githubUrl: '', jobTitle: '', jobDescription: '' });
  const [fetchedData, setFetchedData] = useState(null);
  const [selectedRepos, setSelectedRepos] = useState([]);
  const [repoBullets, setRepoBullets] = useState({});
  const [loadingBullets, setLoadingBullets] = useState({});
  const [manualData, setManualData] = useState({
    fullName: '', email: '', phone: '', linkedin: '',
    education: '', experience: '', skills_languages: ''
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);     // { pdfBase64, latexSource }
  const [latexCode, setLatexCode] = useState('');  // editable LaTeX
  const [previewTab, setPreviewTab] = useState('pdf'); // 'pdf' | 'latex'
  const [compiling, setCompiling] = useState(false);
  const [error, setError] = useState('');

  /* ── Step 1: Fetch GitHub repos ── */
  const handleFetchGithub = async (e) => {
    e.preventDefault();
    if (!form.githubUrl) return setError('Please enter a GitHub URL');
    setError(''); setLoading(true);
    try {
      const res = await cvAPI.fetchGithub({ githubUrl: form.githubUrl });
      setFetchedData(res.data.data);
      if (res.data.data.profile) {
        setManualData(prev => ({ ...prev, fullName: res.data.data.profile.name || '' }));
      }
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch GitHub data');
    }
    setLoading(false);
  };

  /* ── Toggle repo + auto-fetch bullets ── */
  const toggleRepo = async (repoName) => {
    if (selectedRepos.includes(repoName)) {
      setSelectedRepos(prev => prev.filter(r => r !== repoName));
      return;
    }
    if (selectedRepos.length >= 3) return;
    setSelectedRepos(prev => [...prev, repoName]);

    if (repoBullets[repoName]) return;
    const repo = fetchedData.repositories.find(r => r.name === repoName);
    if (!repo) return;

    setLoadingBullets(prev => ({ ...prev, [repoName]: true }));
    try {
      const res = await cvAPI.generateBullets({
        repoName: repo.name, apiUrl: repo.apiUrl,
        description: repo.description, readme: repo.readme || ''
      });
      setRepoBullets(prev => ({ ...prev, [repoName]: res.data.bullets || [] }));
    } catch (err) {
      console.error(`Failed to get bullets for ${repoName}:`, err);
      setRepoBullets(prev => ({ ...prev, [repoName]: [`Developed and maintained ${repoName}`] }));
    }
    setLoadingBullets(prev => ({ ...prev, [repoName]: false }));
  };

  /* ── Generate CV ── */
  const handleGenerate = async () => {
    setError(''); setResult(null); setLoading(true);
    try {
      const enrichedRepos = selectedRepos.map(name => {
        const repo = fetchedData.repositories.find(r => r.name === name);
        return { ...repo, generatedBullets: repoBullets[name] || [] };
      });
      const payload = {
        ...form, selectedRepos: enrichedRepos,
        manualData: { ...manualData, githubUsername: fetchedData?.profile?.login || form.githubUrl.split('/').pop() }
      };
      const res = await cvAPI.generate(payload);
      const data = res.data;

      if (data.pdfBase64) {
        const byteChars = atob(data.pdfBase64);
        const byteArray = new Uint8Array(byteChars.length);
        for (let i = 0; i < byteChars.length; i++) byteArray[i] = byteChars.charCodeAt(i);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        setResult({ type: 'pdf', url, latexSource: data.latexSource || '' });
        setLatexCode(data.latexSource || '');
      } else {
        setResult({ type: 'json', data: data.data, latexSource: data.latexSource || '' });
        setLatexCode(data.latexSource || '');
      }
      setPreviewTab('pdf');
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || 'Generation failed');
    }
    setLoading(false);
  };

  /* ── Recompile edited LaTeX ── */
  const handleRecompile = async () => {
    setCompiling(true); setError('');
    try {
      const res = await cvAPI.compileLaTeX({ latexSource: latexCode });
      if (res.data.pdfBase64) {
        const byteChars = atob(res.data.pdfBase64);
        const byteArray = new Uint8Array(byteChars.length);
        for (let i = 0; i < byteChars.length; i++) byteArray[i] = byteChars.charCodeAt(i);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        setResult(prev => ({ ...prev, type: 'pdf', url }));
        setPreviewTab('pdf');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Compilation failed. Check your LaTeX syntax.');
    }
    setCompiling(false);
  };

  const attributes = [
    { key: 'fullName',         label: 'Full Name',        icon: FiUser },
    { key: 'email',            label: 'Email Address',    icon: FiMail },
    { key: 'phone',            label: 'Phone Number',     icon: FiPhone },
    { key: 'linkedin',         label: 'LinkedIn Profile', icon: FiLinkedin },
    { key: 'education',        label: 'Education',        icon: FiBook,      isLong: true },
    { key: 'experience',       label: 'Work Experience',  icon: FiBriefcase, isLong: true },
    { key: 'skills_languages', label: 'Key Skills',       icon: FiCpu },
  ];

  const filledCount = attributes.filter(a => !!manualData[a.key]).length;

  /* ════════════════════ RENDER ════════════════════ */
  return (
    <div className="fade-in" style={{ maxWidth: '1100px', margin: '0 auto', paddingBottom: '50px' }}>
      <div style={{ textAlign: 'center', marginBottom: '36px' }}>
        <h1 style={{ fontSize: '2.2rem', marginBottom: '8px' }}>AI CV Builder</h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Step {step} of 3 — {step === 1 ? 'Connect GitHub' : step === 2 ? 'Customize Details' : 'Preview & Download'}
        </p>
      </div>

      <div className="glass-card" style={{ padding: '36px', borderRadius: '20px' }}>

        {/* ── STEP 1 ── */}
        {step === 1 && (
          <form onSubmit={handleFetchGithub} style={{ maxWidth: '480px', margin: '0 auto' }}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '0.85rem' }}>GitHub Profile URL *</label>
              <div style={{ position: 'relative' }}>
                <FiGithub style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--accent)' }} />
                <input className="input-field" style={{ paddingLeft: '42px' }} placeholder="https://github.com/username" value={form.githubUrl} onChange={e => setForm({...form, githubUrl: e.target.value})} required />
              </div>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '0.85rem' }}>Target Job Title *</label>
              <input className="input-field" placeholder="e.g. Full Stack Developer" value={form.jobTitle} onChange={e => setForm({...form, jobTitle: e.target.value})} required />
            </div>
            <div style={{ marginBottom: '28px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '0.85rem' }}>Job Description (optional)</label>
              <textarea className="input-field" placeholder="Paste the JD to tailor your resume..." value={form.jobDescription} onChange={e => setForm({...form, jobDescription: e.target.value})} rows={4} />
            </div>
            {error && <div style={{ color: 'var(--danger)', marginBottom: '12px', fontSize: '0.85rem' }}>{error}</div>}
            <button type="submit" className="btn-glow" style={{ width: '100%', padding: '14px' }} disabled={loading}>
              {loading ? '🔍 Fetching Profile...' : 'Continue →'}
            </button>
          </form>
        )}

        {/* ── STEP 2 ── */}
        {step === 2 && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '36px' }}>
              <div>
                <h3 style={{ marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem' }}>
                  <FiGithub size={18} /> Select Projects — <span style={{ color: 'var(--accent)' }}>{selectedRepos.length}/3</span>
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '520px', overflowY: 'auto', paddingRight: '8px' }}>
                  {fetchedData?.repositories?.map(repo => (
                    <ProjectCard key={repo.name} repo={repo} isSelected={selectedRepos.includes(repo.name)} onToggle={() => toggleRepo(repo.name)} bullets={repoBullets[repo.name]} isLoadingBullets={loadingBullets[repo.name]} />
                  ))}
                </div>
              </div>
              <div>
                <h3 style={{ marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem' }}>
                  <FiEdit3 size={18} /> Your Details — <span style={{ color: 'var(--accent)' }}>{filledCount}/{attributes.length}</span>
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {attributes.map(attr => (
                    <AttributeCard key={attr.key} icon={attr.icon} label={attr.label} value={manualData[attr.key]} isComplete={!!manualData[attr.key]} onClick={() => setActiveModal(attr.key)} />
                  ))}
                </div>
              </div>
            </div>
            {error && <div style={{ color: 'var(--danger)', marginTop: '16px', fontSize: '0.85rem' }}>{error}</div>}
            <div style={{ marginTop: '32px', display: 'flex', gap: '16px' }}>
              <button onClick={() => setStep(1)} className="btn-secondary" style={{ flex: 1 }}>← Back</button>
              <button onClick={handleGenerate} className="btn-glow" style={{ flex: 2.5, padding: '14px' }} disabled={loading || selectedRepos.length === 0}>
                {loading ? '🪄 Building Your CV...' : '🚀 Generate My CV'}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Preview + LaTeX Editor ── */}
        {step === 3 && (
          <div>
            {/* Tab Switcher */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: 'var(--bg-secondary)', borderRadius: '10px', padding: '4px' }}>
              <button
                onClick={() => setPreviewTab('pdf')}
                style={{
                  flex: 1, padding: '10px', border: 'none', borderRadius: '8px', cursor: 'pointer',
                  background: previewTab === 'pdf' ? 'var(--accent)' : 'transparent',
                  color: previewTab === 'pdf' ? '#fff' : 'var(--text-muted)',
                  fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  transition: 'all 0.2s'
                }}
              >
                <FiEye size={16} /> PDF Preview
              </button>
              <button
                onClick={() => setPreviewTab('latex')}
                style={{
                  flex: 1, padding: '10px', border: 'none', borderRadius: '8px', cursor: 'pointer',
                  background: previewTab === 'latex' ? 'var(--accent)' : 'transparent',
                  color: previewTab === 'latex' ? '#fff' : 'var(--text-muted)',
                  fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  transition: 'all 0.2s'
                }}
              >
                <FiCode size={16} /> LaTeX Source
              </button>
            </div>

            {error && <div style={{ color: 'var(--danger)', marginBottom: '12px', fontSize: '0.85rem' }}>{error}</div>}

            {/* PDF Preview Tab */}
            {previewTab === 'pdf' && result?.type === 'pdf' && (
              <div>
                <iframe src={result.url} style={{ width: '100%', height: '700px', border: 'none', borderRadius: '14px', boxShadow: '0 8px 30px rgba(0,0,0,0.4)' }} title="Resume Preview" />
                <div style={{ marginTop: '24px', display: 'flex', gap: '16px', justifyContent: 'center' }}>
                  <button onClick={() => setStep(2)} className="btn-secondary">← Edit Details</button>
                  <a href={result.url} download={`${manualData.fullName || 'resume'}.pdf`} className="btn-glow" style={{ padding: '12px 28px', textDecoration: 'none' }}>Download PDF</a>
                </div>
              </div>
            )}

            {previewTab === 'pdf' && result?.type !== 'pdf' && (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <p style={{ color: 'var(--text-muted)' }}>PDF preview is not available. Switch to the LaTeX tab to view and edit the source code.</p>
                <button onClick={() => setStep(2)} className="btn-secondary" style={{ marginTop: '16px' }}>← Back</button>
              </div>
            )}

            {/* LaTeX Editor Tab */}
            {previewTab === 'latex' && (
              <div>
                <div style={{ position: 'relative' }}>
                  <textarea
                    value={latexCode}
                    onChange={e => setLatexCode(e.target.value)}
                    spellCheck={false}
                    style={{
                      width: '100%', height: '550px', padding: '20px',
                      background: '#1e1e2e', color: '#cdd6f4', border: '1px solid var(--border)',
                      borderRadius: '12px', fontFamily: '"Fira Code", "Cascadia Code", "Consolas", monospace',
                      fontSize: '0.82rem', lineHeight: 1.6, resize: 'vertical',
                      outline: 'none', tabSize: 2,
                    }}
                  />
                </div>
                <div style={{ marginTop: '16px', display: 'flex', gap: '12px', justifyContent: 'center' }}>
                  <button onClick={() => setStep(2)} className="btn-secondary">← Edit Details</button>
                  <button onClick={handleRecompile} className="btn-glow" style={{ padding: '12px 28px' }} disabled={compiling}>
                    {compiling ? '⏳ Compiling...' : '🔄 Recompile PDF'}
                  </button>
                  <button onClick={() => { navigator.clipboard.writeText(latexCode); }} className="btn-secondary">
                    📋 Copy LaTeX
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Attribute Dialog Modals ── */}
      {attributes.map(attr => (
        <Modal key={attr.key} isOpen={activeModal === attr.key} onClose={() => setActiveModal(null)} title={attr.label}>
          {attr.isLong ? (
            <textarea className="input-field" autoFocus rows={5} placeholder={`Enter your ${attr.label.toLowerCase()}...`} value={manualData[attr.key]} onChange={e => setManualData({...manualData, [attr.key]: e.target.value})} />
          ) : (
            <input className="input-field" autoFocus placeholder={`Enter your ${attr.label.toLowerCase()}...`} value={manualData[attr.key]} onChange={e => setManualData({...manualData, [attr.key]: e.target.value})} />
          )}
        </Modal>
      ))}

      <style>{`
        .btn-secondary { background: var(--bg-tertiary); color: var(--text-primary); border: 1px solid var(--border); padding: 12px 20px; border-radius: 10px; cursor: pointer; transition: all 0.2s; font-size: 0.9rem; }
        .btn-secondary:hover { background: var(--bg-primary); border-color: var(--text-muted); }
      `}</style>
    </div>
  );
};

export default CVBuilder;
