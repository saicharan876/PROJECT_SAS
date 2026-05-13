import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { taskAPI, contestAPI } from '../services/api';
import { FiCalendar, FiCheckCircle, FiTrendingUp, FiAward } from 'react-icons/fi';

const Dashboard = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [contests, setContests] = useState([]);
  const [stats, setStats] = useState({ pending: 0, completed: 0, contests: 0 });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [taskRes, contestRes] = await Promise.all([
          taskAPI.getAll(),
          contestAPI.getAll(),
        ]);
        setTasks(taskRes.data.data || []);
        setContests((contestRes.data.data || []).slice(0, 5));
        const all = taskRes.data.data || [];
        setStats({
          pending: all.filter((t) => !t.completed).length,
          completed: all.filter((t) => t.completed).length,
          contests: contestRes.data.count || 0,
        });
      } catch { /* silent on first load if no data */ }
    };
    loadData();
  }, []);

  const statCards = [
    { label: 'Pending Tasks', value: stats.pending, icon: <FiTrendingUp />, color: 'var(--warning)' },
    { label: 'Completed', value: stats.completed, icon: <FiCheckCircle />, color: 'var(--success)' },
    { label: 'Upcoming Contests', value: stats.contests, icon: <FiCalendar />, color: 'var(--cyan)' },
    { label: 'Scholarships', value: '—', icon: <FiAward />, color: 'var(--purple)' },
  ];

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>Welcome back, {user?.name?.split(' ')[0] || 'User'}</h1>
        <p>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        {statCards.map((s, i) => (
          <div key={i} className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '46px', height: '46px', borderRadius: 'var(--radius-md)', background: `${s.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, fontSize: '1.2rem' }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: '1.6rem', fontWeight: 700 }}>{s.value}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Two Columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Upcoming Contests */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px' }}>Upcoming Contests</h3>
          {contests.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No contests loaded. Refresh from the Contests page.</p>
          ) : (
            contests.map((c, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < contests.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{c.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.platform}</div>
                </div>
                <span className="badge badge-cyan">{new Date(c.startTime).toLocaleDateString()}</span>
              </div>
            ))
          )}
        </div>

        {/* Recent Tasks */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px' }}>Recent Tasks</h3>
          {tasks.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No tasks yet. Create one from the To-Do page.</p>
          ) : (
            tasks.slice(0, 5).map((t, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < 4 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: t.completed ? 'var(--success)' : t.priority === 3 ? 'var(--danger)' : t.priority === 2 ? 'var(--warning)' : 'var(--success)' }} />
                  <span style={{ fontSize: '0.9rem', textDecoration: t.completed ? 'line-through' : 'none', color: t.completed ? 'var(--text-muted)' : 'var(--text-primary)' }}>{t.title}</span>
                </div>
                <span className={`badge ${t.completed ? 'badge-success' : 'badge-warning'}`}>{t.completed ? 'Done' : 'Pending'}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
