import React, { useState, useEffect, useRef } from 'react';
import api from '../api';
import ExpenseForm, { CATEGORIES } from '../components/ExpenseForm';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, Tooltip,
  ResponsiveContainer, XAxis, YAxis, CartesianGrid, LineChart, Line,
} from 'recharts';
import {
  Plus, Trash2, Edit2, TrendingUp, IndianRupee, Calendar, Tag,
  LayoutDashboard, BarChart2, Activity, Wallet, ArrowUpRight,
  ArrowDownRight, Zap, Target, Clock, Sun, CalendarDays, CalendarRange,
  CalendarCheck, Filter, X, ChevronDown, Search, SlidersHorizontal,
} from 'lucide-react';

// ─── HELPERS ───────────────────────────────────────────────────────────────
const fmt    = v => new Intl.NumberFormat('en-IN', { style:'currency', currency:'INR', maximumFractionDigits:0 }).format(v);
const fmtFull= v => new Intl.NumberFormat('en-IN', { style:'currency', currency:'INR', minimumFractionDigits:2 }).format(v);
const getCat = val => CATEGORIES.find(c => c.value === val) || { emoji:'📦', color:'#6b7280', value: val };
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MONTHS_FULL  = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS_SHORT   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const isSameDay = (a,b) => a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate();
const getWeekStart = d => { const x=new Date(d); x.setDate(x.getDate()-x.getDay()); x.setHours(0,0,0,0); return x; };

const filterByPeriod = (expenses, period) => {
  const now = new Date();
  return expenses.filter(e => {
    const d = new Date(e.date);
    if (period==='daily')   return isSameDay(d,now);
    if (period==='weekly')  return d >= getWeekStart(now);
    if (period==='monthly') return d.getMonth()===now.getMonth() && d.getFullYear()===now.getFullYear();
    if (period==='yearly')  return d.getFullYear()===now.getFullYear();
    return true;
  });
};

const getPrevPeriod = (expenses, period) => {
  const now = new Date();
  return expenses.filter(e => {
    const d = new Date(e.date);
    if (period==='daily')   { const y=new Date(now); y.setDate(y.getDate()-1); return isSameDay(d,y); }
    if (period==='weekly')  { const pw=getWeekStart(new Date(now-7*864e5)), tw=getWeekStart(now); return d>=pw&&d<tw; }
    if (period==='monthly') { const pm=now.getMonth()===0?11:now.getMonth()-1, py=now.getMonth()===0?now.getFullYear()-1:now.getFullYear(); return d.getMonth()===pm&&d.getFullYear()===py; }
    if (period==='yearly')  return d.getFullYear()===now.getFullYear()-1;
    return false;
  });
};

const buildChartData = (expenses, period) => {
  const now = new Date();
  if (period==='daily')  return Array.from({length:24},(_,h)=>({ label:`${h}:00`, amount:expenses.filter(e=>{ const d=new Date(e.date); return isSameDay(d,now)&&d.getHours()===h; }).reduce((a,e)=>a+e.amount,0) })).filter((_,h)=>h<=now.getHours()+1);
  if (period==='weekly') { const ws=getWeekStart(now); return Array.from({length:7},(_,i)=>{ const day=new Date(ws); day.setDate(ws.getDate()+i); return { label:DAYS_SHORT[i], amount:expenses.filter(e=>isSameDay(new Date(e.date),day)).reduce((a,e)=>a+e.amount,0), isToday:isSameDay(day,now) }; }); }
  if (period==='monthly'){ const dim=new Date(now.getFullYear(),now.getMonth()+1,0).getDate(); return Array.from({length:dim},(_,i)=>{ const day=new Date(now.getFullYear(),now.getMonth(),i+1); return {label:`${i+1}`,amount:expenses.filter(e=>isSameDay(new Date(e.date),day)).reduce((a,e)=>a+e.amount,0)}; }); }
  if (period==='yearly') return Array.from({length:12},(_,m)=>({ label:MONTHS_SHORT[m], amount:expenses.filter(e=>{ const d=new Date(e.date); return d.getMonth()===m&&d.getFullYear()===now.getFullYear(); }).reduce((a,e)=>a+e.amount,0) }));
  return [];
};

// ─── QUICK PRESETS ─────────────────────────────────────────────────────────
const PRESETS = [
  { label:'Today',      getDates:()=>{ const d=new Date(); return { from:d.toISOString().split('T')[0], to:d.toISOString().split('T')[0] }; }},
  { label:'Yesterday',  getDates:()=>{ const d=new Date(); d.setDate(d.getDate()-1); const s=d.toISOString().split('T')[0]; return { from:s, to:s }; }},
  { label:'Last 7 Days',getDates:()=>{ const to=new Date(),from=new Date(); from.setDate(from.getDate()-6); return { from:from.toISOString().split('T')[0], to:to.toISOString().split('T')[0] }; }},
  { label:'Last 30 Days',getDates:()=>{ const to=new Date(),from=new Date(); from.setDate(from.getDate()-29); return { from:from.toISOString().split('T')[0], to:to.toISOString().split('T')[0] }; }},
  { label:'Last 3 Months',getDates:()=>{ const to=new Date(),from=new Date(); from.setMonth(from.getMonth()-3); return { from:from.toISOString().split('T')[0], to:to.toISOString().split('T')[0] }; }},
  { label:'Last 6 Months',getDates:()=>{ const to=new Date(),from=new Date(); from.setMonth(from.getMonth()-6); return { from:from.toISOString().split('T')[0], to:to.toISOString().split('T')[0] }; }},
  { label:'This Month', getDates:()=>{ const now=new Date(); return { from:new Date(now.getFullYear(),now.getMonth(),1).toISOString().split('T')[0], to:new Date(now.getFullYear(),now.getMonth()+1,0).toISOString().split('T')[0] }; }},
  { label:'Last Month', getDates:()=>{ const now=new Date(); return { from:new Date(now.getFullYear(),now.getMonth()-1,1).toISOString().split('T')[0], to:new Date(now.getFullYear(),now.getMonth(),0).toISOString().split('T')[0] }; }},
  { label:'This Year',  getDates:()=>{ const y=new Date().getFullYear(); return { from:`${y}-01-01`, to:`${y}-12-31` }; }},
  { label:'All Time',   getDates:()=>({ from:'', to:'' }) },
];

// ─── ANIMATED COUNTER ─────────────────────────────────────────────────────
const AnimatedCounter = ({ value }) => {
  const [disp,setDisp] = useState(0);
  const sr=useRef(0), raf=useRef(null);
  useEffect(()=>{ const from=sr.current,to=value,t0=performance.now(); const step=now=>{ const t=Math.min((now-t0)/900,1),ease=t<.5?2*t*t:-1+(4-2*t)*t; setDisp(Math.round(from+(to-from)*ease)); if(t<1)raf.current=requestAnimationFrame(step); else sr.current=to; }; raf.current=requestAnimationFrame(step); return()=>cancelAnimationFrame(raf.current); },[value]);
  return <span className="tabular-nums">₹{new Intl.NumberFormat('en-IN').format(disp)}</span>;
};

const CustomTooltip = ({active,payload,label}) => !active||!payload?.length ? null : (
  <div className="bg-[#0d1022] border border-white/10 rounded-xl px-4 py-3 shadow-2xl text-sm">
    {label && <p className="text-slate-400 text-xs mb-1">{label}</p>}
    {payload.map((p,i)=><p key={i} className="font-bold" style={{color:p.color||'#60a5fa'}}>{fmtFull(p.value)}</p>)}
  </div>
);
const PieTooltip = ({active,payload}) => !active||!payload?.length ? null : (
  <div className="bg-[#0d1022] border border-white/10 rounded-xl px-4 py-2.5 shadow-2xl text-sm">
    <p className="font-semibold text-white">{payload[0].name}</p>
    <p style={{color:payload[0].payload.color}}>{fmtFull(payload[0].value)}</p>
  </div>
);
const SectionHeader = ({icon:Icon,title,subtitle,color='#2563eb'}) => (
  <div className="flex items-center gap-3 mb-4">
    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{background:color+'20'}}><Icon size={17} style={{color}} /></div>
    <div><h3 className="font-display font-bold text-white text-base leading-none">{title}</h3>{subtitle&&<p className="text-slate-500 text-xs mt-0.5">{subtitle}</p>}</div>
  </div>
);

const PERIODS = [
  {id:'daily',  label:'Today',      short:'D', icon:Sun,          color:'#f59e0b', gradient:'from-amber-500 to-orange-500'},
  {id:'weekly', label:'This Week',  short:'W', icon:CalendarDays, color:'#06b6d4', gradient:'from-cyan-500 to-blue-500'},
  {id:'monthly',label:'This Month', short:'M', icon:CalendarRange,color:'#7c3aed', gradient:'from-violet-500 to-purple-600'},
  {id:'yearly', label:'This Year',  short:'Y', icon:CalendarCheck,color:'#10b981', gradient:'from-emerald-500 to-teal-500'},
];

// ─── FILTER PANEL ─────────────────────────────────────────────────────────
const FilterPanel = ({ filters, setFilters, totalCount, onClose }) => {
  const now = new Date();
  const years = Array.from({length:5}, (_,i) => now.getFullYear() - i);
  const [activePreset, setActivePreset] = useState('');

  const applyPreset = (preset) => {
    const dates = preset.getDates();
    setFilters(f => ({...f, dateFrom: dates.from, dateTo: dates.to}));
    setActivePreset(preset.label);
  };

  const applyMonthYear = (month, year) => {
    if (month === '' || year === '') { setFilters(f=>({...f, dateFrom:'', dateTo:''})); return; }
    const from = new Date(year, month, 1);
    const to   = new Date(year, parseInt(month)+1, 0);
    setFilters(f=>({...f, dateFrom: from.toISOString().split('T')[0], dateTo: to.toISOString().split('T')[0]}));
    setActivePreset('');
  };

  return (
    <div className="glass-card p-5 border border-white/8 animate-slide-up">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={16} className="text-blue-400" />
          <span className="font-display font-bold text-white">Advanced Filters</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-medium">{totalCount} results</span>
        </div>
        <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/10 transition-all"><X size={15}/></button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Quick Presets */}
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Quick Presets</p>
          <div className="grid grid-cols-2 gap-1.5">
            {PRESETS.map(p => (
              <button key={p.label} onClick={() => applyPreset(p)}
                className={`text-xs px-2.5 py-2 rounded-lg font-medium transition-all text-left ${activePreset===p.label ? 'bg-blue-500/25 border border-blue-500/50 text-blue-300' : 'bg-white/4 border border-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/8'}`}>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Date Range */}
        <div className="space-y-3">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Date Range</p>
            <div className="space-y-2">
              <div>
                <label className="text-xs text-slate-600 mb-1 block">From</label>
                <input type="date" value={filters.dateFrom}
                  onChange={e=>{ setFilters(f=>({...f,dateFrom:e.target.value})); setActivePreset(''); }}
                  className="input-dark pl-3 text-xs py-2 w-full" style={{colorScheme:'dark'}} />
              </div>
              <div>
                <label className="text-xs text-slate-600 mb-1 block">To</label>
                <input type="date" value={filters.dateTo}
                  onChange={e=>{ setFilters(f=>({...f,dateTo:e.target.value})); setActivePreset(''); }}
                  className="input-dark pl-3 text-xs py-2 w-full" style={{colorScheme:'dark'}} />
              </div>
            </div>
          </div>

          {/* Month + Year Picker */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Month & Year</p>
            <div className="flex gap-2">
              <select defaultValue="" onChange={e => applyMonthYear(e.target.value, document.getElementById('yr-sel').value)}
                className="select-dark text-xs py-2 flex-1">
                <option value="">Month</option>
                {MONTHS_FULL.map((m,i)=><option key={i} value={i}>{m}</option>)}
              </select>
              <select id="yr-sel" defaultValue="" onChange={e => { const mEl=document.querySelector('select[data-role="month"]'); applyMonthYear(mEl?.value ?? '', e.target.value); }}
                className="select-dark text-xs py-2 flex-1">
                <option value="">Year</option>
                {years.map(y=><option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Category & Amount & Sort */}
        <div className="space-y-3">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Category</p>
            <select value={filters.category} onChange={e=>setFilters(f=>({...f,category:e.target.value}))} className="select-dark text-xs py-2 w-full">
              <option value="">All Categories</option>
              {CATEGORIES.map(c=><option key={c.value} value={c.value}>{c.emoji} {c.value}</option>)}
            </select>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Amount Range (₹)</p>
            <div className="flex gap-2">
              <input type="number" placeholder="Min" value={filters.amtMin}
                onChange={e=>setFilters(f=>({...f,amtMin:e.target.value}))}
                className="input-dark pl-3 text-xs py-2 flex-1" />
              <input type="number" placeholder="Max" value={filters.amtMax}
                onChange={e=>setFilters(f=>({...f,amtMax:e.target.value}))}
                className="input-dark pl-3 text-xs py-2 flex-1" />
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Sort By</p>
            <select value={filters.sortBy} onChange={e=>setFilters(f=>({...f,sortBy:e.target.value}))} className="select-dark text-xs py-2 w-full">
              <option value="date_desc">Date: Newest First</option>
              <option value="date_asc">Date: Oldest First</option>
              <option value="amount_desc">Amount: High → Low</option>
              <option value="amount_asc">Amount: Low → High</option>
              <option value="title_asc">Title: A → Z</option>
              <option value="category">Category</option>
            </select>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Search</p>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
              <input type="text" placeholder="Search title or note…" value={filters.search}
                onChange={e=>setFilters(f=>({...f,search:e.target.value}))}
                className="input-dark text-xs py-2 pl-8 w-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Reset */}
      <div className="mt-5 pt-4 border-t border-white/5 flex justify-end">
        <button onClick={()=>{ setFilters({dateFrom:'',dateTo:'',category:'',amtMin:'',amtMax:'',sortBy:'date_desc',search:''}); setActivePreset(''); }}
          className="text-xs text-slate-500 hover:text-red-400 transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-red-500/10">
          <X size={12}/> Reset All Filters
        </button>
      </div>
    </div>
  );
};

// ─── ACTIVE FILTER CHIPS ───────────────────────────────────────────────────
const FilterChips = ({ filters, setFilters }) => {
  const chips = [];
  if (filters.dateFrom||filters.dateTo) chips.push({ label:`${filters.dateFrom||'…'} → ${filters.dateTo||'…'}`, key:'date', clear:()=>setFilters(f=>({...f,dateFrom:'',dateTo:''})) });
  if (filters.category) { const m=getCat(filters.category); chips.push({label:`${m.emoji} ${filters.category}`,key:'cat',clear:()=>setFilters(f=>({...f,category:''}))}); }
  if (filters.amtMin)   chips.push({label:`Min ₹${filters.amtMin}`,key:'min',clear:()=>setFilters(f=>({...f,amtMin:''}))});
  if (filters.amtMax)   chips.push({label:`Max ₹${filters.amtMax}`,key:'max',clear:()=>setFilters(f=>({...f,amtMax:''}))});
  if (filters.search)   chips.push({label:`"${filters.search}"`,key:'search',clear:()=>setFilters(f=>({...f,search:''}))});
  if (!chips.length) return null;
  return (
    <div className="flex items-center flex-wrap gap-2">
      <span className="text-xs text-slate-600 font-medium">Active:</span>
      {chips.map(c=>(
        <span key={c.key} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/15 border border-blue-500/30 text-blue-300">
          {c.label}
          <button onClick={c.clear} className="hover:text-white transition-colors"><X size={11}/></button>
        </span>
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
const Dashboard = () => {
  const [expenses, setExpenses]   = useState([]);
  const [modalOpen,setModalOpen]  = useState(false);
  const [editingExp,setEditingExp]= useState(null);
  const [loading,  setLoading]    = useState(true);
  const [activeTab,setActiveTab]  = useState('overview');
  const [period,   setPeriod]     = useState('monthly');
  const [showFilter,setShowFilter]= useState(false);
  const [filters,setFilters]      = useState({ dateFrom:'', dateTo:'', category:'', amtMin:'', amtMax:'', sortBy:'date_desc', search:'' });

  useEffect(()=>{ api.get('/expenses').then(r=>setExpenses(r.data)).catch(console.error).finally(()=>setLoading(false)); },[]);

  const handleSave = async (data) => {
    try {
      if (editingExp) { const r=await api.put(`/expenses/${editingExp._id}`,data); setExpenses(p=>p.map(e=>e._id===editingExp._id?r.data:e)); }
      else { const r=await api.post('/expenses',data); setExpenses(p=>[r.data,...p]); }
      setModalOpen(false); setEditingExp(null);
    } catch(e) { console.error(e); }
  };
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this expense?')) return;
    try { await api.delete(`/expenses/${id}`); setExpenses(p=>p.filter(e=>e._id!==id)); } catch(e) { console.error(e); }
  };
  const openEdit = exp => { setEditingExp(exp); setModalOpen(true); };
  const openAdd  = ()  => { setEditingExp(null); setModalOpen(true); };

  // ─── Apply global filters ────────────────────────────────────────────
  const applyFilters = (list) => {
    let result = [...list];
    if (filters.dateFrom) result = result.filter(e => new Date(e.date) >= new Date(filters.dateFrom));
    if (filters.dateTo)   result = result.filter(e => new Date(e.date) <= new Date(filters.dateTo + 'T23:59:59'));
    if (filters.category) result = result.filter(e => e.category === filters.category);
    if (filters.amtMin)   result = result.filter(e => e.amount >= Number(filters.amtMin));
    if (filters.amtMax)   result = result.filter(e => e.amount <= Number(filters.amtMax));
    if (filters.search)   result = result.filter(e => e.title.toLowerCase().includes(filters.search.toLowerCase()) || (e.description||'').toLowerCase().includes(filters.search.toLowerCase()));
    const sortMap = {
      date_desc:   (a,b) => new Date(b.date)-new Date(a.date),
      date_asc:    (a,b) => new Date(a.date)-new Date(b.date),
      amount_desc: (a,b) => b.amount-a.amount,
      amount_asc:  (a,b) => a.amount-b.amount,
      title_asc:   (a,b) => a.title.localeCompare(b.title),
      category:    (a,b) => a.category.localeCompare(b.category),
    };
    return result.sort(sortMap[filters.sortBy]||sortMap.date_desc);
  };

  const hasFilters = !!(filters.dateFrom||filters.dateTo||filters.category||filters.amtMin||filters.amtMax||filters.search);

  // Period data
  const periodExp  = hasFilters ? applyFilters(expenses) : filterByPeriod(expenses, period);
  const prevExp    = getPrevPeriod(expenses, period);
  const periodTotal= periodExp.reduce((a,e)=>a+e.amount,0);
  const prevTotal  = prevExp.reduce((a,e)=>a+e.amount,0);
  const pctChange  = prevTotal>0 ? ((periodTotal-prevTotal)/prevTotal)*100 : null;
  const highest    = periodExp.reduce((mx,e)=>e.amount>mx?e.amount:mx,0);
  const avgPerTx   = periodExp.length ? periodTotal/periodExp.length : 0;

  const catBreakdown = CATEGORIES.map(cat=>({
    ...cat,
    total:periodExp.filter(e=>e.category===cat.value).reduce((a,e)=>a+e.amount,0),
    count:periodExp.filter(e=>e.category===cat.value).length,
  })).filter(c=>c.count>0).sort((a,b)=>b.total-a.total);

  const chartData = buildChartData(hasFilters ? applyFilters(expenses) : expenses, period);
  const pieData   = catBreakdown.slice(0,8).map(c=>({ name:`${c.emoji} ${c.value}`, value:c.total, color:c.color }));
  const periodSummary = PERIODS.map(p=>({ ...p, total:filterByPeriod(expenses,p.id).reduce((a,e)=>a+e.amount,0), count:filterByPeriod(expenses,p.id).length }));
  const periodConfig  = PERIODS.find(p=>p.id===period);
  const txFiltered    = hasFilters ? applyFilters(expenses) : periodExp.sort((a,b)=>new Date(b.date)-new Date(a.date));

  if (loading) return (
    <div className="flex justify-center items-center h-72">
      <div className="relative w-14 h-14 mx-auto"><div className="absolute inset-0 border-2 border-blue-500/20 rounded-full"/><div className="absolute inset-0 border-2 border-t-blue-500 rounded-full animate-spin"/><div className="absolute inset-2 border-2 border-t-violet-500 rounded-full animate-spin" style={{animationDirection:'reverse',animationDuration:'0.7s'}}/></div>
    </div>
  );

  return (
    <div className="space-y-4 animate-fade-in">
      {/* ── TOP BAR ──────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 p-1 rounded-xl bg-white/3 border border-white/5">
          {[{id:'overview',label:'Overview',icon:LayoutDashboard},{id:'analytics',label:'Analytics',icon:BarChart2},{id:'transactions',label:'Transactions',icon:Activity}].map(t=>(
            <button key={t.id} onClick={()=>setActiveTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab===t.id?'bg-blue-600 text-white shadow-lg shadow-blue-500/20':'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}>
              <t.icon size={14}/><span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {/* Period pills */}
          {!hasFilters && (
            <div className="flex gap-1 p-1 rounded-xl bg-white/3 border border-white/5">
              {PERIODS.map(p=>(
                <button key={p.id} onClick={()=>setPeriod(p.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${period===p.id?`bg-gradient-to-r ${p.gradient} text-white shadow-lg`:'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}>
                  <p.icon size={12}/><span className="hidden lg:inline">{p.label}</span><span className="lg:hidden">{p.short}</span>
                </button>
              ))}
            </div>
          )}
          {/* Filter toggle */}
          <button onClick={()=>setShowFilter(f=>!f)}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium border transition-all duration-200 ${showFilter||hasFilters?'bg-blue-500/20 border-blue-500/40 text-blue-300':'bg-white/3 border-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/8'}`}>
            <Filter size={14}/>
            <span className="hidden sm:inline">Filters</span>
            {hasFilters && <span className="w-4 h-4 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-bold">!</span>}
          </button>
          <button onClick={openAdd} className="btn-primary text-sm"><Plus size={15}/><span className="hidden sm:inline">Add Expense</span></button>
        </div>
      </div>

      {/* ── FILTER PANEL ─────────────────────────────────────────────── */}
      {showFilter && <FilterPanel filters={filters} setFilters={setFilters} totalCount={txFiltered.length} onClose={()=>setShowFilter(false)} />}

      {/* ── ACTIVE FILTER CHIPS ──────────────────────────────────────── */}
      {hasFilters && <FilterChips filters={filters} setFilters={setFilters}/>}

      {/* ── PERIOD / FILTER BANNER ───────────────────────────────────── */}
      <div className="glass-card p-4 border-l-4 flex items-center justify-between flex-wrap gap-4"
        style={{borderLeftColor: hasFilters?'#2563eb':periodConfig.color}}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{background:(hasFilters?'#2563eb':periodConfig.color)+'20'}}>
            {hasFilters ? <Filter size={20} className="text-blue-400"/> : <periodConfig.icon size={20} style={{color:periodConfig.color}}/>}
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">
              {hasFilters ? 'Custom Filter Results' : periodConfig.label}
            </p>
            <p className="text-2xl font-display font-bold text-white"><AnimatedCounter value={periodTotal}/></p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-center"><p className="text-xs text-slate-600 mb-0.5">Transactions</p><p className="text-lg font-bold text-white">{periodExp.length}</p></div>
          <div className="text-center"><p className="text-xs text-slate-600 mb-0.5">Avg/Expense</p><p className="text-lg font-bold text-white">{fmt(Math.round(avgPerTx))}</p></div>
          <div className="text-center"><p className="text-xs text-slate-600 mb-0.5">Highest</p><p className="text-lg font-bold text-white">{fmt(highest)}</p></div>
          {!hasFilters && pctChange!==null && (
            <div className="text-center">
              <p className="text-xs text-slate-600 mb-0.5">vs Previous</p>
              <div className={`flex items-center gap-1 text-sm font-bold ${pctChange<=0?'text-emerald-400':'text-red-400'}`}>
                {pctChange<=0?<ArrowDownRight size={14}/>:<ArrowUpRight size={14}/>}{Math.abs(pctChange).toFixed(1)}%
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ═══ OVERVIEW TAB ═══════════════════════════════════════════════ */}
      {activeTab==='overview' && (
        <>
          {/* 4 Period Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {periodSummary.map((ps,i)=>(
              <button key={ps.id} onClick={()=>{ setPeriod(ps.id); setFilters(f=>({...f,dateFrom:'',dateTo:''})); }}
                className={`stat-card stat-card-${['orange','blue','violet','green'][i]} text-left w-full transition-all duration-300 ${period===ps.id&&!hasFilters?'ring-1 ring-white/15 scale-[1.02]':'opacity-85 hover:opacity-100'}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2"><ps.icon size={14} style={{color:ps.color}}/><span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{ps.label}</span></div>
                  {period===ps.id&&!hasFilters&&<span className="text-xs px-1.5 py-0.5 rounded-full font-medium" style={{background:ps.color+'20',color:ps.color}}>Active</span>}
                </div>
                <p className="text-xl font-display font-bold text-white">{fmt(ps.total)}</p>
                <p className="text-slate-600 text-xs mt-1.5">{ps.count} transaction{ps.count!==1?'s':''}</p>
              </button>
            ))}
          </div>

          {/* Chart + Categories */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="glass-card p-5 lg:col-span-2">
              <SectionHeader icon={TrendingUp} title={hasFilters?'Filtered Results':'Spending Trend'} subtitle={hasFilters?`${txFiltered.length} transactions matching filters`:`${periodConfig.label} breakdown`} color={hasFilters?'#2563eb':periodConfig.color}/>
              {chartData.every(d=>d.amount===0) ? (
                <div className="h-52 flex flex-col items-center justify-center text-slate-600 gap-2"><BarChart2 size={28} className="opacity-20"/><span className="text-sm">No data for this period</span></div>
              ) : (
                <ResponsiveContainer width="100%" height={210}>
                  {period==='daily'||period==='weekly' ? (
                    <BarChart data={chartData} barSize={period==='weekly'?28:12} margin={{top:5,right:5,left:-10,bottom:0}}>
                      <defs><linearGradient id="bg1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={periodConfig.color} stopOpacity={0.95}/><stop offset="100%" stopColor={periodConfig.color} stopOpacity={0.35}/></linearGradient></defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
                      <XAxis dataKey="label" tick={{fill:'#4b5563',fontSize:10}} axisLine={false} tickLine={false}/>
                      <YAxis tick={{fill:'#4b5563',fontSize:10}} axisLine={false} tickLine={false} tickFormatter={v=>v>=1000?`₹${(v/1000).toFixed(0)}k`:v>0?`₹${v}`:''}/>
                      <Tooltip content={<CustomTooltip/>}/>
                      <Bar dataKey="amount" fill="url(#bg1)" radius={[6,6,0,0]}>
                        {chartData.map((e,i)=><Cell key={i} fill={e.isToday?periodConfig.color:'url(#bg1)'} opacity={e.isToday?1:0.65}/>)}
                      </Bar>
                    </BarChart>
                  ) : (
                    <AreaChart data={chartData} margin={{top:5,right:5,left:-10,bottom:0}}>
                      <defs><linearGradient id="ag1" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={periodConfig.color} stopOpacity={0.35}/><stop offset="95%" stopColor={periodConfig.color} stopOpacity={0}/></linearGradient></defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
                      <XAxis dataKey="label" tick={{fill:'#4b5563',fontSize:10}} axisLine={false} tickLine={false} interval={period==='monthly'?4:0}/>
                      <YAxis tick={{fill:'#4b5563',fontSize:10}} axisLine={false} tickLine={false} tickFormatter={v=>v>=1000?`₹${(v/1000).toFixed(0)}k`:v>0?`₹${v}`:''}/>
                      <Tooltip content={<CustomTooltip/>}/>
                      <Area type="monotone" dataKey="amount" stroke={periodConfig.color} strokeWidth={2.5} fill="url(#ag1)" dot={{fill:periodConfig.color,r:3,strokeWidth:0}} activeDot={{r:6,fill:periodConfig.color,strokeWidth:2,stroke:'#0d1022'}}/>
                    </AreaChart>
                  )}
                </ResponsiveContainer>
              )}
            </div>
            <div className="glass-card p-5">
              <SectionHeader icon={Tag} title="Top Categories" subtitle={hasFilters?'Filtered':'For selected period'} color="#7c3aed"/>
              {catBreakdown.length===0 ? (
                <div className="h-40 flex flex-col items-center justify-center text-slate-600 gap-2"><Tag size={24} className="opacity-20"/><p className="text-sm">No data</p></div>
              ) : catBreakdown.slice(0,6).map((cat,i)=>{
                const pct=periodTotal>0?(cat.total/periodTotal)*100:0;
                return (
                  <div key={cat.value} className="mb-3" style={{animationDelay:`${i*60}ms`}}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2"><span>{cat.emoji}</span><span className="text-xs font-medium text-slate-300 truncate max-w-[75px]">{cat.value}</span></div>
                      <div><span className="text-xs font-bold text-white">{fmt(cat.total)}</span><span className="text-slate-600 text-xs ml-1">({pct.toFixed(0)}%)</span></div>
                    </div>
                    <div className="progress-bar"><div className="progress-fill" style={{width:`${pct}%`,background:`linear-gradient(90deg,${cat.color},${cat.color}88)`}}/></div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent list */}
          <div className="glass-card overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
              <SectionHeader icon={Clock} title="Recent Transactions" subtitle={`${periodExp.slice(0,6).length} of ${periodExp.length}`} color="#06b6d4"/>
              <button onClick={()=>setActiveTab('transactions')} className="text-xs text-blue-400 hover:text-blue-300 transition-colors font-medium">View All →</button>
            </div>
            {periodExp.length===0 ? (
              <div className="py-10 text-center text-slate-600"><Wallet size={28} className="mx-auto mb-2 opacity-20"/><p className="text-sm">No expenses for this period.</p></div>
            ) : periodExp.slice(0,6).map(exp=>{
              const meta=getCat(exp.category);
              return (
                <div key={exp._id} className="flex items-center gap-4 px-6 py-3.5 table-row-hover group">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0" style={{background:meta.color+'18',border:`1px solid ${meta.color}25`}}>{meta.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-200 truncate">{exp.title}</p>
                    <p className="text-xs text-slate-600">{new Date(exp.date).toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short'})}{exp.description&&` · ${exp.description}`}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-white">{fmtFull(exp.amount)}</p>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={()=>openEdit(exp)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-blue-500/15 text-blue-400 hover:bg-blue-500/30 transition-colors"><Edit2 size={12}/></button>
                      <button onClick={()=>handleDelete(exp._id)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500/30 transition-colors"><Trash2 size={12}/></button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ═══ ANALYTICS TAB ══════════════════════════════════════════════ */}
      {activeTab==='analytics' && (
        <>
          <div className="glass-card p-5">
            <SectionHeader icon={BarChart2} title="Period Comparison" subtitle="All time periods at a glance" color="#f59e0b"/>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {periodSummary.map((ps,i)=>(
                <div key={ps.id} className="text-center p-4 rounded-xl border border-white/5 bg-white/2">
                  <div className="flex items-center justify-center gap-2 mb-2"><ps.icon size={15} style={{color:ps.color}}/><span className="text-xs font-semibold text-slate-400">{ps.label}</span></div>
                  <p className="text-2xl font-display font-bold text-white">{fmt(ps.total)}</p>
                  <p className="text-xs text-slate-600 mt-1">{ps.count} expenses</p>
                  <div className="mt-3 h-1.5 bg-white/5 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{width:`${ps.total>0?Math.min((ps.total/Math.max(...periodSummary.map(x=>x.total)))*100,100):0}%`,background:`linear-gradient(90deg,${ps.color},${ps.color}88)`}}/></div>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="glass-card p-5">
              <SectionHeader icon={Tag} title="Category Distribution" subtitle={hasFilters?'Filtered results':periodConfig.label} color="#7c3aed"/>
              {pieData.length===0 ? <div className="h-52 flex items-center justify-center text-slate-600 text-sm">No data</div> : (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3} dataKey="value" stroke="none" animationBegin={0} animationDuration={700}>{pieData.map((e,i)=><Cell key={i} fill={e.color}/>)}</Pie><Tooltip content={<PieTooltip/>}/></PieChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-2 gap-1.5 mt-2">{pieData.map(d=><div key={d.name} className="flex items-center gap-1.5 text-xs text-slate-400"><div className="w-2 h-2 rounded-full flex-shrink-0" style={{background:d.color}}/><span className="truncate">{d.name}</span></div>)}</div>
                </>
              )}
            </div>
            <div className="glass-card p-5">
              <SectionHeader icon={TrendingUp} title="Spending Chart" subtitle={`${periodConfig.label}`} color={periodConfig.color}/>
              {chartData.every(d=>d.amount===0) ? <div className="h-52 flex items-center justify-center text-slate-600 text-sm">No data</div> : (
                <ResponsiveContainer width="100%" height={215}>
                  <AreaChart data={chartData} margin={{top:5,right:5,left:-10,bottom:0}}>
                    <defs><linearGradient id="ag2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={periodConfig.color} stopOpacity={0.4}/><stop offset="95%" stopColor={periodConfig.color} stopOpacity={0}/></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
                    <XAxis dataKey="label" tick={{fill:'#4b5563',fontSize:9}} axisLine={false} tickLine={false} interval={period==='monthly'?4:period==='daily'?3:0}/>
                    <YAxis tick={{fill:'#4b5563',fontSize:10}} axisLine={false} tickLine={false} tickFormatter={v=>v>=1000?`₹${(v/1000).toFixed(0)}k`:v>0?`₹${v}`:''}/>
                    <Tooltip content={<CustomTooltip/>}/>
                    <Area type="monotone" dataKey="amount" stroke={periodConfig.color} strokeWidth={2.5} fill="url(#ag2)" dot={{fill:periodConfig.color,r:3,strokeWidth:0}} activeDot={{r:5,fill:periodConfig.color,strokeWidth:2,stroke:'#0d1022'}}/>
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
          {catBreakdown.length>0 && (
            <div className="glass-card p-5">
              <SectionHeader icon={Activity} title="Detailed Breakdown" subtitle="By amount and percentage" color="#06b6d4"/>
              <div className="space-y-3">{catBreakdown.map((cat,i)=>{
                const pct=periodTotal>0?(cat.total/periodTotal)*100:0;
                return (
                  <div key={cat.value} className="flex items-center gap-4" style={{animation:`slideUp 0.3s ease-out ${i*45}ms both`}}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-base flex-shrink-0" style={{background:cat.color+'18'}}>{cat.emoji}</div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center gap-2"><span className="text-sm font-medium text-slate-300">{cat.value}</span><span className="text-xs text-slate-600">({cat.count} exp)</span></div>
                        <div className="flex items-center gap-2"><span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{color:cat.color,background:cat.color+'20'}}>{pct.toFixed(1)}%</span><span className="text-sm font-bold text-white">{fmt(cat.total)}</span></div>
                      </div>
                      <div className="progress-bar"><div className="progress-fill" style={{width:`${pct}%`,background:`linear-gradient(90deg,${cat.color},${cat.color}66)`}}/></div>
                    </div>
                  </div>
                );
              })}</div>
            </div>
          )}
        </>
      )}

      {/* ═══ TRANSACTIONS TAB ═══════════════════════════════════════════ */}
      {activeTab==='transactions' && (
        <div className="glass-card overflow-hidden">
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
            <div>
              <h2 className="font-display font-bold text-white text-lg">{hasFilters?'Filtered':'All'} Transactions</h2>
              <p className="text-slate-500 text-xs mt-0.5">{txFiltered.length} records · {fmtFull(txFiltered.reduce((a,e)=>a+e.amount,0))}</p>
            </div>
            <button onClick={openAdd} className="btn-primary text-sm py-2.5 px-4"><Plus size={14}/> Add</button>
          </div>
          {txFiltered.length===0 ? (
            <div className="py-16 text-center text-slate-600"><Wallet size={36} className="mx-auto mb-3 opacity-20"/><p className="font-semibold text-slate-400 text-lg mb-1">No results</p><p className="text-sm mb-5">{hasFilters?'Try adjusting your filters.':'Add your first expense!'}</p><button onClick={openAdd} className="btn-primary text-sm py-2 px-6 mx-auto"><Plus size={14}/> Add Expense</button></div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr className="border-b border-white/5">{['Date','Title','Category','Amount','Actions'].map((h,i)=><th key={h} className={`px-6 py-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider ${i>=2?'hidden md:table-cell':''} ${i>=3?'text-right':''}`}>{h}</th>)}</tr></thead>
                  <tbody>
                    {txFiltered.map((exp,i)=>{
                      const meta=getCat(exp.category);
                      return (
                        <tr key={exp._id} className="table-row-hover group" style={{animation:`slideUp 0.25s ease-out ${i*20}ms both`}}>
                          <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">{new Date(exp.date).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'2-digit'})}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg hidden sm:flex items-center justify-center text-sm" style={{background:meta.color+'18'}}>{meta.emoji}</div>
                              <div><p className="text-sm font-semibold text-slate-200">{exp.title}</p>{exp.description&&<p className="text-xs text-slate-600 line-clamp-1">{exp.description}</p>}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 hidden md:table-cell"><span className="category-badge text-xs" style={{color:meta.color,background:meta.color+'15',borderColor:meta.color+'30'}}>{meta.emoji} {exp.category}</span></td>
                          <td className="px-6 py-4 text-right"><span className="font-bold text-white text-sm">{fmtFull(exp.amount)}</span></td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200">
                              <button onClick={()=>openEdit(exp)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-blue-500/15 text-blue-400 hover:bg-blue-500/30 transition-colors"><Edit2 size={12}/></button>
                              <button onClick={()=>handleDelete(exp._id)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500/30 transition-colors"><Trash2 size={12}/></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between px-6 py-4 border-t border-white/5 bg-white/[0.01]">
                <span className="text-xs text-slate-600">{txFiltered.length} record{txFiltered.length!==1?'s':''}</span>
                <span className="text-sm font-bold gradient-text">{fmtFull(txFiltered.reduce((a,e)=>a+e.amount,0))}</span>
              </div>
            </>
          )}
        </div>
      )}

      <ExpenseForm isOpen={modalOpen} onClose={()=>{ setModalOpen(false); setEditingExp(null); }} onSubmit={handleSave} initialData={editingExp}/>
    </div>
  );
};

export default Dashboard;
