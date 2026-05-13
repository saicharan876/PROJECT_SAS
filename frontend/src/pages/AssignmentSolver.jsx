import { useState } from 'react';
import { assignmentAPI } from '../services/api';

const AssignmentSolver = () => {
  const [form, setForm] = useState({ subject: '', title: '', questions: '', outputFormat: 'Detailed', studentName: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const handleSolve = async (e) => {
    e.preventDefault(); setError(''); setResult(null); setLoading(true);
    try {
      const res = await assignmentAPI.solve(form);
      if (res.headers['content-type']?.includes('application/pdf')) {
        const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
        setResult({ type: 'pdf', url });
      } else {
        const text = await res.data.text();
        setResult({ type: 'json', data: JSON.parse(text) });
      }
    } catch (err) { setError(err.response?.data?.message || 'Solving failed'); }
    setLoading(false);
  };

  return (
    <div className="fade-in">
      <div className="page-header"><h1>AI Assignment Solver</h1><p>Get cleanly formatted PDF answers powered by AI</p></div>
      <div className="glass-card" style={{maxWidth:'800px'}}>
        <form onSubmit={handleSolve} style={{display:'flex',flexDirection:'column',gap:'16px'}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px'}}>
            <div><label style={{fontSize:'0.85rem',fontWeight:500,display:'block',marginBottom:'6px',color:'var(--text-secondary)'}}>Subject</label><input className="input-field" placeholder="e.g. Data Structures" value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} /></div>
            <div><label style={{fontSize:'0.85rem',fontWeight:500,display:'block',marginBottom:'6px',color:'var(--text-secondary)'}}>Assignment Title</label><input className="input-field" placeholder="e.g. Assignment 5" value={form.title} onChange={e => setForm({...form, title: e.target.value})} /></div>
          </div>
          <div><label style={{fontSize:'0.85rem',fontWeight:500,display:'block',marginBottom:'6px',color:'var(--text-secondary)'}}>Assignment Questions *</label>
            <textarea className="input-field" placeholder="Paste your assignment questions here..." value={form.questions} onChange={e => setForm({...form, questions: e.target.value})} rows={8} required />
          </div>
          <div style={{display:'flex',gap:'16px',alignItems:'center'}}>
            <select className="input-field" style={{width:'auto'}} value={form.outputFormat} onChange={e => setForm({...form, outputFormat: e.target.value})}>
              <option value="Detailed">Detailed</option><option value="Concise">Concise</option><option value="Step-by-step">Step-by-step</option>
            </select>
            <input className="input-field" placeholder="Student Name (optional)" value={form.studentName} onChange={e => setForm({...form, studentName: e.target.value})} style={{flex:1}} />
          </div>
          <button type="submit" className="btn-glow" disabled={loading} style={{width:'100%'}}>{loading ? '⏳ Solving...' : '📝 Solve & Generate PDF'}</button>
        </form>
      </div>
      {error && <p className="mt-2" style={{color:'var(--danger)'}}>{error}</p>}
      {result?.type === 'pdf' && <div className="glass-card mt-3" style={{textAlign:'center',maxWidth:'800px'}}><iframe src={result.url} style={{width:'100%',height:'600px',border:'1px solid var(--border)',borderRadius:'var(--radius-md)'}} title="Assignment" /><a href={result.url} download="assignment.pdf" className="btn-glow" style={{display:'inline-block',marginTop:'16px',textDecoration:'none'}}>📥 Download PDF</a></div>}
      {result?.type === 'json' && <div className="glass-card mt-3" style={{maxWidth:'800px'}}><pre style={{fontSize:'0.8rem',overflow:'auto',maxHeight:'400px'}}>{JSON.stringify(result.data,null,2)}</pre></div>}
    </div>
  );
};

export default AssignmentSolver;
