import { useState, useEffect } from 'react';
import { scholarshipAPI } from '../services/api';
import { FiExternalLink, FiRefreshCw, FiSearch, FiCalendar, FiDollarSign, FiGlobe, FiBookOpen, FiAward } from 'react-icons/fi';
import { motion } from 'framer-motion';

const DEGREE_OPTIONS = ['All', 'Bachelors', 'Masters', 'PhD'];
const COUNTRY_OPTIONS = ['All', 'International', 'USA', 'India', 'UK'];

const ScholarshipFinder = () => {
  const [scholarships, setScholarships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scraping, setScraping] = useState(false);
  const [search, setSearch] = useState('');
  const [degree, setDegree] = useState('All');
  const [country, setCountry] = useState('All');
  const [error, setError] = useState('');

  const loadScholarships = async () => {
    setLoading(true); setError('');
    try {
      const params = {};
      if (search) params.search = search;
      if (degree !== 'All') params.degree = degree;
      if (country !== 'All') params.country = country;
      const res = await scholarshipAPI.getAll(params);
      setScholarships(res.data.data || []);
      if (res.data.seeded) setError('');
    } catch (err) {
      setError('Failed to load scholarships. Check your connection.');
      setScholarships([]);
    }
    setLoading(false);
  };

  useEffect(() => { loadScholarships(); }, [degree, country]);

  const handleScrape = async () => {
    setScraping(true); setError('');
    try {
      const res = await scholarshipAPI.scrape();
      if (res.data.message) setError('');
      await loadScholarships();
    } catch (err) {
      setError(err.response?.data?.message || 'Scraping failed.');
    }
    setScraping(false);
  };

  const getDaysLeft = (deadline) => {
    if (!deadline) return null;
    const days = Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24));
    return days;
  };

  return (
    <div className="fade-in" style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '50px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FiAward size={28} style={{ color: 'var(--accent)' }} /> Scholarship Finder
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>AI-curated scholarships from top organizations worldwide</p>
        </div>
        <button
          className="btn-glow"
          onClick={handleScrape}
          disabled={scraping}
          style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}
        >
          <FiRefreshCw size={14} style={{ animation: scraping ? 'spin 1s linear infinite' : 'none' }} />
          {scraping ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>

      {/* Filters Bar */}
      <div className="glass-card" style={{ padding: '16px 20px', marginBottom: '24px', display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 250px' }}>
          <FiSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="input-field"
            placeholder="Search scholarships..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && loadScholarships()}
            style={{ paddingLeft: '38px', margin: 0 }}
          />
        </div>
        <select
          className="input-field"
          value={degree}
          onChange={e => setDegree(e.target.value)}
          style={{ flex: '0 0 150px', margin: 0, cursor: 'pointer' }}
        >
          {DEGREE_OPTIONS.map(d => <option key={d} value={d}>{d === 'All' ? '🎓 All Degrees' : d}</option>)}
        </select>
        <select
          className="input-field"
          value={country}
          onChange={e => setCountry(e.target.value)}
          style={{ flex: '0 0 160px', margin: 0, cursor: 'pointer' }}
        >
          {COUNTRY_OPTIONS.map(c => <option key={c} value={c}>{c === 'All' ? '🌍 All Countries' : c}</option>)}
        </select>
      </div>

      {error && (
        <div style={{ background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.3)', color: '#ff6b6b', padding: '12px 16px', borderRadius: '10px', marginBottom: '20px', fontSize: '0.85rem' }}>
          {error}
        </div>
      )}

      {/* Stats Bar */}
      {!loading && scholarships.length > 0 && (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '16px' }}>
          Showing <strong style={{ color: 'var(--accent)' }}>{scholarships.length}</strong> scholarship{scholarships.length !== 1 ? 's' : ''}
        </p>
      )}

      {/* Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px' }}>
          <div className="spinner" style={{ margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--text-muted)' }}>Loading scholarships...</p>
        </div>
      ) : scholarships.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '60px' }}>
          <FiBookOpen size={40} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
          <h3 style={{ marginBottom: '8px' }}>No scholarships found</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>Try adjusting your filters or click "Refresh Data" to fetch the latest.</p>
          <button className="btn-glow" onClick={handleScrape} disabled={scraping} style={{ padding: '10px 24px' }}>
            {scraping ? 'Loading...' : 'Load Scholarships'}
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
          {scholarships.map((s, i) => {
            const daysLeft = getDaysLeft(s.deadline);
            const isUrgent = daysLeft !== null && daysLeft <= 30 && daysLeft >= 0;
            const isPast = daysLeft !== null && daysLeft < 0;

            return (
              <motion.div
                key={s._id || i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card"
                style={{ display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}
              >
                {/* Urgency indicator */}
                {isUrgent && (
                  <div style={{
                    position: 'absolute', top: '12px', right: '12px',
                    background: 'rgba(255,107,107,0.15)', color: '#ff6b6b',
                    padding: '3px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700
                  }}>
                    ⏰ {daysLeft} days left
                  </div>
                )}

                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '4px', paddingRight: isUrgent ? '100px' : 0 }}>{s.name}</h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--accent)', marginBottom: '12px', fontWeight: 500 }}>{s.provider}</p>

                {/* Badges */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(0,210,190,0.1)', color: '#00d2be', padding: '3px 10px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 600 }}>
                    <FiDollarSign size={11} /> {s.amount}
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(160,120,255,0.1)', color: '#a078ff', padding: '3px 10px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 600 }}>
                    🎓 {s.degreeLevel}
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(255,193,7,0.1)', color: '#ffc107', padding: '3px 10px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 600 }}>
                    <FiGlobe size={11} /> {s.country}
                  </span>
                </div>

                <p style={{
                  fontSize: '0.83rem', color: 'var(--text-secondary)', marginBottom: '12px', flex: 1,
                  display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.5
                }}>
                  {s.description}
                </p>

                {/* AI Tags */}
                {s.aiTags && s.aiTags.length > 0 && (
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '12px' }}>
                    {s.aiTags.slice(0, 4).map((tag, ti) => (
                      <span key={ti} style={{ background: 'var(--bg-tertiary)', color: 'var(--text-muted)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 500 }}>
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Deadline */}
                {s.deadline && (
                  <p style={{ fontSize: '0.78rem', color: isPast ? '#ff6b6b' : 'var(--text-muted)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FiCalendar size={13} />
                    {isPast ? 'Deadline passed: ' : 'Deadline: '}
                    {new Date(s.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                )}

                {/* Apply Button */}
                {s.url && (
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                      padding: '10px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 600,
                      background: 'rgba(var(--accent-rgb), 0.1)', color: 'var(--accent)',
                      border: '1px solid rgba(var(--accent-rgb), 0.2)', textDecoration: 'none',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => { e.target.style.background = 'var(--accent)'; e.target.style.color = '#fff'; }}
                    onMouseLeave={e => { e.target.style.background = 'rgba(var(--accent-rgb), 0.1)'; e.target.style.color = 'var(--accent)'; }}
                  >
                    Apply Now <FiExternalLink size={14} />
                  </a>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default ScholarshipFinder;
