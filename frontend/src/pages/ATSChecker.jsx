import { useState } from 'react';
import { atsAPI } from '../services/api';

const ATSChecker = () => {
  const [file, setFile] = useState(null);
  const [jd, setJd] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleAnalyze = async (e) => {
    e.preventDefault(); setError(''); setResult(null); setLoading(true);
    try {
      const fd = new FormData();
      fd.append('resume', file);
      fd.append('jobDescription', jd);
      const res = await atsAPI.analyze(fd);
      setResult(res.data.data);
    } catch (err) { setError(err.response?.data?.message || 'Analysis failed'); }
    setLoading(false);
  };

  const ScoreGauge = ({ score }) => {
    const color = score >= 80 ? 'var(--success)' : score >= 50 ? 'var(--warning)' : 'var(--danger)';
    return (
      <div style={{width:'140px',height:'140px',borderRadius:'50%',border:`6px solid var(--border)`,borderTopColor:color,borderRightColor: score > 25 ? color : 'var(--border)',borderBottomColor: score > 50 ? color : 'var(--border)',borderLeftColor: score > 75 ? color : 'var(--border)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px'}}>
        <span style={{fontSize:'2rem',fontWeight:700,color}}>{score}</span>
      </div>
    );
  };

  return (
    <div className="fade-in">
      <div className="page-header"><h1>ATS Resume Checker</h1><p>Analyze your resume against any job description</p></div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'24px'}}>
        <div className="glass-card">
          <form onSubmit={handleAnalyze} style={{display:'flex',flexDirection:'column',gap:'16px'}}>
            <div style={{border:'2px dashed var(--border)',borderRadius:'var(--radius-md)',padding:'32px',textAlign:'center',cursor:'pointer'}} onClick={() => document.getElementById('cv-upload').click()}>
              <input id="cv-upload" type="file" accept=".pdf" hidden onChange={e => setFile(e.target.files[0])} />
              <p style={{color:'var(--text-muted)'}}>{file ? `📄 ${file.name}` : '📁 Drop your CV here or click to browse'}</p>
              <p style={{fontSize:'0.75rem',color:'var(--text-muted)',marginTop:'4px'}}>PDF only, max 5MB</p>
            </div>
            <div><label style={{fontSize:'0.85rem',fontWeight:500,display:'block',marginBottom:'6px',color:'var(--text-secondary)'}}>Job Description *</label>
              <textarea className="input-field" placeholder="Paste the job description..." value={jd} onChange={e => setJd(e.target.value)} rows={6} required />
            </div>
            <button type="submit" className="btn-glow" disabled={loading || !file} style={{width:'100%'}}>{loading ? '⏳ Analyzing...' : '🔍 Analyze Resume'}</button>
          </form>
        </div>

        <div className="glass-card">
          <h3 style={{marginBottom:'16px',fontWeight:600}}>Analysis Results</h3>
          {error && <p style={{color:'var(--danger)'}}>{error}</p>}
          {loading && <div style={{textAlign:'center'}}><div className="spinner" style={{margin:'0 auto'}}/></div>}
          {result && (
            <div className="fade-in">
              <ScoreGauge score={result.score} />
              <p style={{textAlign:'center',color:'var(--text-secondary)',marginBottom:'24px'}}>{result.summary}</p>
              <h4 style={{fontSize:'0.9rem',fontWeight:600,marginBottom:'8px'}}>Missing Keywords</h4>
              <div style={{display:'flex',flexWrap:'wrap',gap:'6px',marginBottom:'16px'}}>{(result.missingKeywords||[]).map((k,i) => <span key={i} className="badge badge-danger">{k}</span>)}</div>
              <h4 style={{fontSize:'0.9rem',fontWeight:600,marginBottom:'8px'}}>Found Keywords</h4>
              <div style={{display:'flex',flexWrap:'wrap',gap:'6px',marginBottom:'16px'}}>{(result.presentKeywords||[]).map((k,i) => <span key={i} className="badge badge-success">{k}</span>)}</div>
              <h4 style={{fontSize:'0.9rem',fontWeight:600,marginBottom:'8px'}}>Recommendations</h4>
              <ul style={{color:'var(--text-secondary)',fontSize:'0.85rem',paddingLeft:'20px'}}>{(result.recommendations||[]).map((r,i) => <li key={i} style={{marginBottom:'6px'}}>{r}</li>)}</ul>
            </div>
          )}
          {!loading && !result && !error && <p style={{color:'var(--text-muted)',textAlign:'center'}}>Upload a CV and provide a job description to see results</p>}
        </div>
      </div>
    </div>
  );
};

export default ATSChecker;
