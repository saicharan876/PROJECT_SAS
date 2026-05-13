import { useState, useEffect } from 'react';
import { scholarshipAPI } from '../services/api';
import { FiExternalLink, FiRefreshCw } from 'react-icons/fi';

const ScholarshipFinder = () => {
  const [scholarships, setScholarships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scraping, setScraping] = useState(false);
  const [search, setSearch] = useState('');

  const loadScholarships = async () => {
    setLoading(true);
    try {
      const res = await scholarshipAPI.getAll({ search });
      setScholarships(res.data.data || []);
    } catch { setScholarships([]); }
    setLoading(false);
  };

  useEffect(() => { loadScholarships(); }, []);

  const handleScrape = async () => {
    setScraping(true);
    try { await scholarshipAPI.scrape(); await loadScholarships(); } catch {}
    setScraping(false);
  };

  return (
    <div className="fade-in">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'32px'}}>
        <div className="page-header" style={{marginBottom:0}}><h1>Scholarship Finder</h1><p>AI-curated scholarships matched to your profile</p></div>
        <button className="btn-secondary" onClick={handleScrape} disabled={scraping}><FiRefreshCw style={{marginRight:'6px'}} />{scraping ? 'Scraping...' : 'Refresh Data'}</button>
      </div>
      <div style={{marginBottom:'24px'}}><input className="input-field" placeholder="🔍 Search scholarships..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && loadScholarships()} style={{maxWidth:'400px'}} /></div>
      {loading ? <div style={{textAlign:'center',padding:'48px'}}><div className="spinner" style={{margin:'0 auto'}} /></div> : (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))',gap:'20px'}}>
          {scholarships.length === 0 ? <p style={{color:'var(--text-muted)'}}>No scholarships found. Click "Refresh Data" to fetch some.</p> : scholarships.map((s,i) => (
            <div key={i} className="glass-card">
              <h3 style={{fontSize:'1.05rem',fontWeight:600,marginBottom:'4px'}}>{s.name}</h3>
              <p style={{fontSize:'0.8rem',color:'var(--text-muted)',marginBottom:'12px'}}>{s.provider}</p>
              <div style={{display:'flex',gap:'8px',flexWrap:'wrap',marginBottom:'12px'}}>
                <span className="badge badge-cyan">{s.amount}</span>
                <span className="badge badge-purple">{s.degreeLevel}</span>
                <span className="badge badge-warning">{s.country}</span>
              </div>
              <p style={{fontSize:'0.85rem',color:'var(--text-secondary)',marginBottom:'12px',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>{s.description}</p>
              {s.deadline && <p style={{fontSize:'0.8rem',color:'var(--text-muted)',marginBottom:'12px'}}>📅 Deadline: {new Date(s.deadline).toLocaleDateString()}</p>}
              {s.url && <a href={s.url} target="_blank" rel="noreferrer" className="btn-secondary" style={{display:'inline-flex',alignItems:'center',gap:'6px',fontSize:'0.85rem'}}>Apply <FiExternalLink /></a>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ScholarshipFinder;
