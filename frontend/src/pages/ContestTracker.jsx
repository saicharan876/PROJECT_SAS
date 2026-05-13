import { useState, useEffect } from 'react';
import { contestAPI } from '../services/api';
import { FiExternalLink, FiRefreshCw, FiClock } from 'react-icons/fi';

const platforms = ['all', 'Codeforces', 'LeetCode', 'CodeChef', 'AtCoder', 'HackerRank'];

const ContestTracker = () => {
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [platform, setPlatform] = useState('all');

  const load = async () => {
    setLoading(true);
    try { const res = await contestAPI.getAll({ platform }); setContests(res.data.data || []); } catch { setContests([]); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [platform]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try { await contestAPI.refresh(); await load(); } catch {}
    setRefreshing(false);
  };

  const timeUntil = (date) => {
    const ms = new Date(date) - Date.now();
    if (ms < 0) return 'Started';
    const h = Math.floor(ms / 3600000); const d = Math.floor(h / 24);
    return d > 0 ? `${d}d ${h%24}h` : `${h}h ${Math.floor((ms%3600000)/60000)}m`;
  };

  const platformColor = { Codeforces: '#1890ff', LeetCode: '#FFA116', CodeChef: '#5B4638', AtCoder: '#222', HackerRank: '#00EA64' };

  return (
    <div className="fade-in">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'24px'}}>
        <div className="page-header" style={{marginBottom:0}}><h1>Contest Tracker</h1><p>Never miss a competitive programming contest</p></div>
        <button className="btn-secondary" onClick={handleRefresh} disabled={refreshing}><FiRefreshCw style={{marginRight:'6px'}}/>{refreshing ? 'Refreshing...' : 'Refresh from Clist'}</button>
      </div>
      <div style={{display:'flex',gap:'8px',marginBottom:'24px',flexWrap:'wrap'}}>
        {platforms.map(p => (
          <button key={p} onClick={() => setPlatform(p)} style={{padding:'8px 16px',borderRadius:'20px',border:'1px solid',borderColor: platform===p ? 'var(--purple)' : 'var(--border)',background: platform===p ? 'rgba(108,92,231,0.15)' : 'transparent',color: platform===p ? 'var(--purple-light)' : 'var(--text-secondary)',cursor:'pointer',fontSize:'0.85rem',fontWeight:500,fontFamily:'Inter'}}>{p === 'all' ? 'All' : p}</button>
        ))}
      </div>
      {loading ? <div style={{textAlign:'center',padding:'48px'}}><div className="spinner" style={{margin:'0 auto'}}/></div> : contests.length === 0 ? <div className="glass-card" style={{textAlign:'center'}}><p style={{color:'var(--text-muted)'}}>No upcoming contests. Click "Refresh from Clist" to fetch data.</p></div> : (
        <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
          {contests.map((c,i) => (
            <div key={i} className="glass-card" style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'16px 24px'}}>
              <div style={{display:'flex',alignItems:'center',gap:'16px',flex:1}}>
                <span className="badge" style={{background:`${platformColor[c.platform]||'var(--purple)'}20`,color:platformColor[c.platform]||'var(--purple-light)',minWidth:'90px',textAlign:'center'}}>{c.platform}</span>
                <div><div style={{fontWeight:600,fontSize:'0.95rem'}}>{c.name}</div><div style={{fontSize:'0.8rem',color:'var(--text-muted)'}}>{new Date(c.startTime).toLocaleString()}</div></div>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:'16px'}}>
                <span style={{display:'flex',alignItems:'center',gap:'4px',color:'var(--cyan)',fontWeight:600,fontSize:'0.9rem'}}><FiClock/>{timeUntil(c.startTime)}</span>
                {c.url && <a href={c.url} target="_blank" rel="noreferrer" className="btn-secondary" style={{padding:'6px 14px',fontSize:'0.8rem'}}>Register <FiExternalLink style={{marginLeft:'4px'}}/></a>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ContestTracker;
