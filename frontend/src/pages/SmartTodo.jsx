import { useState, useEffect } from 'react';
import { taskAPI } from '../services/api';
import { FiPlus, FiTrash2, FiEdit2, FiZap, FiCheck } from 'react-icons/fi';

const priorityLabels = { 1: 'Low', 2: 'Medium', 3: 'Urgent' };
const priorityColors = { 1: 'var(--success)', 2: 'var(--warning)', 3: 'var(--danger)' };
const categoryColors = { assignment: 'badge-purple', contest: 'badge-cyan', personal: 'badge-success', scholarship: 'badge-warning' };

const SmartTodo = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [prioritizing, setPrioritizing] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', dueDate: '', priority: 2, category: 'personal' });

  const load = async () => {
    setLoading(true);
    try { const res = await taskAPI.getAll({ filter }); setTasks(res.data.data || []); } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, [filter]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try { await taskAPI.create(form); setForm({ title: '', description: '', dueDate: '', priority: 2, category: 'personal' }); setShowForm(false); load(); } catch {}
  };

  const handleToggle = async (id, completed) => {
    try { await taskAPI.update(id, { completed: !completed }); load(); } catch {}
  };

  const handleDelete = async (id) => {
    try { await taskAPI.delete(id); load(); } catch {}
  };

  const handlePrioritize = async () => {
    setPrioritizing(true);
    try { await taskAPI.prioritize(); load(); } catch {}
    setPrioritizing(false);
  };

  const filters = ['', 'today', 'week', 'completed', 'overdue'];
  const filterLabels = { '': 'All', today: 'Today', week: 'This Week', completed: 'Completed', overdue: 'Overdue' };

  return (
    <div className="fade-in">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'24px'}}>
        <div className="page-header" style={{marginBottom:0}}><h1>Smart To-Do</h1><p>AI-prioritized task management</p></div>
        <div style={{display:'flex',gap:'8px'}}>
          <button className="btn-secondary" onClick={handlePrioritize} disabled={prioritizing}><FiZap style={{marginRight:'4px'}}/>{prioritizing ? 'Thinking...' : 'AI Prioritize'}</button>
          <button className="btn-glow" onClick={() => setShowForm(!showForm)}><FiPlus style={{marginRight:'4px'}}/>Add Task</button>
        </div>
      </div>

      {/* Filters */}
      <div style={{display:'flex',gap:'8px',marginBottom:'24px'}}>
        {filters.map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{padding:'8px 16px',borderRadius:'20px',border:'1px solid',borderColor:filter===f?'var(--purple)':'var(--border)',background:filter===f?'rgba(108,92,231,0.15)':'transparent',color:filter===f?'var(--purple-light)':'var(--text-secondary)',cursor:'pointer',fontSize:'0.85rem',fontWeight:500,fontFamily:'Inter'}}>{filterLabels[f]}</button>
        ))}
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="glass-card mb-3 fade-in">
          <form onSubmit={handleCreate} style={{display:'flex',flexDirection:'column',gap:'12px'}}>
            <input className="input-field" placeholder="Task title *" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} required />
            <input className="input-field" placeholder="Description" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} />
            <div style={{display:'flex',gap:'12px'}}>
              <input className="input-field" type="date" value={form.dueDate} onChange={e=>setForm({...form,dueDate:e.target.value})} />
              <select className="input-field" value={form.priority} onChange={e=>setForm({...form,priority:Number(e.target.value)})}>
                <option value={1}>Low</option><option value={2}>Medium</option><option value={3}>Urgent</option>
              </select>
              <select className="input-field" value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>
                <option value="personal">Personal</option><option value="assignment">Assignment</option><option value="contest">Contest</option><option value="scholarship">Scholarship</option>
              </select>
            </div>
            <button type="submit" className="btn-glow" style={{alignSelf:'flex-start'}}>Create Task</button>
          </form>
        </div>
      )}

      {/* Task List */}
      {loading ? <div style={{textAlign:'center',padding:'48px'}}><div className="spinner" style={{margin:'0 auto'}}/></div> : tasks.length === 0 ? <div className="glass-card text-center"><p style={{color:'var(--text-muted)'}}>No tasks found. Add one above!</p></div> : (
        <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
          {tasks.map(t => (
            <div key={t._id} className="glass-card" style={{display:'flex',alignItems:'center',gap:'16px',padding:'14px 20px'}}>
              <button onClick={() => handleToggle(t._id, t.completed)} style={{width:'22px',height:'22px',borderRadius:'50%',border:`2px solid ${t.completed ? 'var(--success)' : priorityColors[t.priority]}`,background:t.completed?'var(--success)':'transparent',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,padding:0}}>
                {t.completed && <FiCheck size={12} color="white"/>}
              </button>
              <div style={{flex:1}}>
                <div style={{fontWeight:500,textDecoration:t.completed?'line-through':'none',color:t.completed?'var(--text-muted)':'var(--text-primary)'}}>{t.title}</div>
                <div style={{fontSize:'0.8rem',color:'var(--text-muted)',display:'flex',gap:'8px',marginTop:'2px'}}>
                  {t.dueDate && <span>📅 {new Date(t.dueDate).toLocaleDateString()}</span>}
                  {t.aiReason && <span style={{color:'var(--cyan)'}}>💡 {t.aiReason}</span>}
                </div>
              </div>
              <span className={`badge ${categoryColors[t.category]||'badge-purple'}`}>{t.category}</span>
              {t.aiPriorityScore != null && <span style={{fontSize:'0.8rem',fontWeight:600,color:'var(--cyan)'}}>{t.aiPriorityScore}pts</span>}
              <button onClick={() => handleDelete(t._id)} style={{background:'none',border:'none',color:'var(--text-muted)',cursor:'pointer',padding:'4px'}}><FiTrash2 size={16}/></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SmartTodo;
