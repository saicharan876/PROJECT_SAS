import { useState } from 'react';
import { cvAPI } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { FiGithub, FiUser, FiMail, FiPhone, FiLinkedin, FiBook, FiBriefcase, FiCpu, FiEdit3, FiCheck } from 'react-icons/fi';

const Modal = ({ isOpen, onClose, title, children }) => (
  <AnimatePresence>
    {isOpen && (
      <>
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
            zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
        />
        <motion.div 
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          style={{
            position: 'fixed', zIndex: 1001,
            width: '90%', maxWidth: '500px',
            background: 'var(--bg-primary)', padding: '24px',
            borderRadius: '16px', border: '1px solid var(--border)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0 }}>{title}</h3>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}>×</button>
          </div>
          {children}
          <button onClick={onClose} className="btn-glow" style={{ width: '100%', marginTop: '20px' }}>Save & Close</button>
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

const AttributeCard = ({ icon: Icon, label, value, onClick, isComplete }) => (
  <motion.div 
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    style={{
      padding: '16px', borderRadius: '12px', background: 'var(--bg-secondary)',
      border: isComplete ? '1px solid var(--accent)' : '1px solid var(--border)',
      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px',
      position: 'relative', overflow: 'hidden'
    }}
  >
    <div style={{ 
      width: '40px', height: '40px', borderRadius: '8px', 
      background: isComplete ? 'rgba(var(--accent-rgb), 0.1)' : 'var(--bg-tertiary)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: isComplete ? 'var(--accent)' : 'var(--text-muted)'
    }}>
      <Icon size={20} />
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: '0.9rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }}>
        {value || <span style={{ fontStyle: 'italic', opacity: 0.5 }}>Click to fill...</span>}
      </div>
    </div>
    {isComplete && <FiCheck style={{ color: 'var(--accent)' }} />}
  </motion.div>
);

const CVBuilder = () => {
  const [step, setStep] = useState(1);
  const [activeModal, setActiveModal] = useState(null); // 'fullName', 'email', etc.
  const [form, setForm] = useState({ 
    githubUrl: '', 
    jobTitle: '', 
    jobDescription: ''
  });
  const [fetchedData, setFetchedData] = useState(null);
  const [selectedRepos, setSelectedRepos] = useState([]);
  const [manualData, setManualData] = useState({
    fullName: '', email: '', phone: '', linkedin: '',
    education: '', experience: '', skills_languages: '',
    skills_tools: '', skills_frameworks: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleFetchGithub = async (e) => {
    e.preventDefault();
    if (!form.githubUrl) return setError('Please enter a GitHub URL');
    setError('');
    setLoading(true);
    try {
      const res = await cvAPI.fetchGithub({ githubUrl: form.githubUrl });
      setFetchedData(res.data.data);
      if (res.data.data.profile) {
        setManualData(prev => ({
          ...prev,
          fullName: res.data.data.profile.name || '',
          linkedin: res.data.data.profile.login || ''
        }));
      }
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch GitHub data');
    }
    setLoading(false);
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);
    setLoading(true);
    try {
      const payload = {
        ...form,
        selectedRepos: selectedRepos.map(name => fetchedData.repositories.find(r => r.name === name)),
        manualData: {
          ...manualData,
          githubUsername: fetchedData?.profile?.login || form.githubUrl.split('/').pop()
        }
      };
      const res = await cvAPI.generate(payload);
      if (res.headers['content-type']?.includes('application/pdf')) {
        const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
        setResult({ type: 'pdf', url });
        setStep(3);
      } else {
        const text = await res.data.text();
        setResult({ type: 'json', data: JSON.parse(text) });
        setStep(3);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Generation failed');
    }
    setLoading(false);
  };

  const toggleRepo = (repoName) => {
    setSelectedRepos(prev => 
      prev.includes(repoName) ? prev.filter(r => r !== repoName) : [...prev, repoName].slice(0, 3)
    );
  };

  const attributes = [
    { key: 'fullName', label: 'Full Name', icon: FiUser },
    { key: 'email', label: 'Email Address', icon: FiMail },
    { key: 'phone', label: 'Phone Number', icon: FiPhone },
    { key: 'linkedin', label: 'LinkedIn Profile', icon: FiLinkedin },
    { key: 'education', label: 'Education Detail', icon: FiBook, isLong: true },
    { key: 'experience', label: 'Work Experience', icon: FiBriefcase, isLong: true },
    { key: 'skills_languages', label: 'Key Skills', icon: FiCpu },
  ];

  return (
    <div className="fade-in" style={{ maxWidth: '1100px', margin: '0 auto', paddingBottom: '50px' }}>
      <div className="page-header" style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '10px' }}>Interactive AI CV Builder</h1>
        <p style={{ color: 'var(--text-muted)' }}>Step {step} of 3: {step === 1 ? 'Connect Data' : step === 2 ? 'Customize Details' : 'Final Preview'}</p>
      </div>

      <div className="glass-card" style={{ padding: '40px', borderRadius: '24px' }}>
        {step === 1 && (
          <form onSubmit={handleFetchGithub} style={{ maxWidth: '500px', margin: '0 auto' }}>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>GitHub Profile URL</label>
              <div style={{ position: 'relative' }}>
                <FiGithub style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--accent)' }} />
                <input 
                  className="input-field" 
                  style={{ paddingLeft: '45px' }}
                  placeholder="https://github.com/username" 
                  value={form.githubUrl} 
                  onChange={e => setForm({...form, githubUrl: e.target.value})} 
                  required 
                />
              </div>
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Target Job Title</label>
              <input 
                className="input-field" 
                placeholder="e.g. Full Stack Developer" 
                value={form.jobTitle} 
                onChange={e => setForm({...form, jobTitle: e.target.value})} 
                required 
              />
            </div>
            <div style={{ marginBottom: '32px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Job Description (Optional)</label>
              <textarea 
                className="input-field" 
                placeholder="Paste the JD here to tailor your resume..." 
                value={form.jobDescription} 
                onChange={e => setForm({...form, jobDescription: e.target.value})} 
                rows={4} 
              />
            </div>
            <button type="submit" className="btn-glow w-full" disabled={loading} style={{ padding: '16px' }}>
              {loading ? '🔍 Fetching GitHub Profile...' : 'Continue to Personalization →'}
            </button>
          </form>
        )}

        {step === 2 && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '40px' }}>
              <div>
                <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FiGithub size={20} /> Select Your Top Projects
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', maxHeight: '500px', overflowY: 'auto', paddingRight: '10px' }}>
                  {fetchedData?.repositories?.map(repo => (
                    <div 
                      key={repo.name}
                      onClick={() => toggleRepo(repo.name)}
                      className={`glass-card repo-item ${selectedRepos.includes(repo.name) ? 'active' : ''}`}
                      style={{ 
                        padding: '16px', cursor: 'pointer', border: '1px solid var(--border)',
                        background: selectedRepos.includes(repo.name) ? 'rgba(var(--accent-rgb), 0.1)' : 'var(--bg-secondary)'
                      }}
                    >
                      <div style={{ fontWeight: 600, marginBottom: '4px' }}>{repo.name}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--accent)' }}>{repo.language}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FiEdit3 size={20} /> Fill Your Attributes
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
                  {attributes.map(attr => (
                    <AttributeCard 
                      key={attr.key}
                      icon={attr.icon}
                      label={attr.label}
                      value={manualData[attr.key]}
                      isComplete={!!manualData[attr.key]}
                      onClick={() => setActiveModal(attr.key)}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div style={{ marginTop: '40px', display: 'flex', gap: '20px' }}>
              <button onClick={() => setStep(1)} className="btn-secondary" style={{ flex: 1 }}>Back</button>
              <button onClick={handleGenerate} className="btn-glow" style={{ flex: 2 }} disabled={loading}>
                {loading ? '🪄 Building Your Premium CV...' : '🚀 Generate My CV'}
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={{ textAlign: 'center' }}>
            {error && <div className="alert alert-danger mb-4">{error}</div>}
            {result?.type === 'pdf' ? (
              <div>
                <iframe src={result.url} style={{ width: '100%', height: '700px', border: 'none', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }} title="Resume Preview" />
                <div style={{ marginTop: '30px', display: 'flex', gap: '20px', justifyContent: 'center' }}>
                  <button onClick={() => setStep(2)} className="btn-secondary">Back to Edit</button>
                  <a href={result.url} download={`${manualData.fullName || 'resume'}.pdf`} className="btn-glow" style={{ padding: '12px 30px' }}>Download Professional PDF</a>
                </div>
              </div>
            ) : (
              <div className="alert alert-warning">
                Generation complete! If the PDF didn't load, please try again or check your LaTeX installation.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Attribute Modals */}
      {attributes.map(attr => (
        <Modal 
          key={attr.key}
          isOpen={activeModal === attr.key}
          onClose={() => setActiveModal(null)}
          title={`Update ${attr.label}`}
        >
          {attr.isLong ? (
            <textarea 
              className="input-field" 
              autoFocus
              rows={6}
              placeholder={`Enter your ${attr.label.toLowerCase()} details...`}
              value={manualData[attr.key]}
              onChange={e => setManualData({...manualData, [attr.key]: e.target.value})}
            />
          ) : (
            <input 
              className="input-field" 
              autoFocus
              placeholder={`Enter your ${attr.label.toLowerCase()}...`}
              value={manualData[attr.key]}
              onChange={e => setManualData({...manualData, [attr.key]: e.target.value})}
            />
          )}
        </Modal>
      ))}

      <style>{`
        .repo-item.active { border-color: var(--accent) !important; box-shadow: 0 0 20px rgba(var(--accent-rgb), 0.2); }
        .repo-item:hover { transform: translateY(-2px); transition: all 0.2s; }
        .btn-secondary { background: var(--bg-tertiary); color: var(--text-primary); border: 1px solid var(--border); padding: 14px; border-radius: 12px; cursor: pointer; transition: all 0.2s; }
        .btn-secondary:hover { background: var(--bg-primary); border-color: var(--text-muted); }
      `}</style>
    </div>
  );
};

export default CVBuilder;
