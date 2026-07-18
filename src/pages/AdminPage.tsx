// ─── SAION AI — Owner Admin Panel ────────────────────────────────────────────
// RESTRICTED: Only sakethtransformers@gmail.com can access this page.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Users, Ban, CheckCircle, Search, RefreshCw, LogOut, ChevronDown, ChevronUp, AlertTriangle, Clock, Mail } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getAllUsers, banUser, unbanUser, isOwner } from '../services/dbService';
import { User } from '../types';
import SaionLogo from '../components/UI/SaionLogo';

function fmt(d?: Date | null): string {
  if (!d) return '—';
  return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }).format(d);
}

export default function AdminPage() {
  const { currentUser, signOut } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [filtered, setFiltered] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'banned' | 'active'>('all');
  const [banModal, setBanModal] = useState<{ user: User; action: 'ban' | 'unban' } | null>(null);
  const [banReason, setBanReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [expandedUid, setExpandedUid] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (!currentUser) { navigate('/', { replace: true }); return; }
    if (!isOwner(currentUser.email)) { navigate('/', { replace: true }); }
  }, [currentUser, navigate]);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const all = await getAllUsers();
      all.sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
      setUsers(all);
    } catch { showToast('Failed to load users', 'error'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    let list = users;
    if (filter === 'banned') list = list.filter(u => u.isBanned);
    if (filter === 'active') list = list.filter(u => !u.isBanned);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(u => u.email?.toLowerCase().includes(q) || u.displayName?.toLowerCase().includes(q) || u.uid.toLowerCase().includes(q));
    }
    setFiltered(list);
  }, [users, search, filter]);

  const handleBanAction = async () => {
    if (!banModal) return;
    setActionLoading(true);
    try {
      if (banModal.action === 'ban') {
        await banUser(banModal.user.uid, banReason.trim() || 'Suspended by admin.');
        showToast(`${banModal.user.email} has been banned.`);
      } else {
        await unbanUser(banModal.user.uid);
        showToast(`${banModal.user.email} has been unbanned.`);
      }
      setBanModal(null); setBanReason('');
      await load();
    } catch { showToast('Action failed.', 'error'); }
    finally { setActionLoading(false); }
  };

  const totalUsers = users.length;
  const bannedCount = users.filter(u => u.isBanned).length;
  const todayCount = users.filter(u => u.createdAt && new Date(u.createdAt).toDateString() === new Date().toDateString()).length;

  if (!currentUser || !isOwner(currentUser.email)) return null;

  return (
    <div className="min-h-screen bg-black text-white">
      {toast && (
        <div className={`fixed top-4 right-4 z-[999] flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium shadow-xl ${toast.type === 'success' ? 'bg-emerald-900/90 border border-emerald-700/50 text-emerald-200' : 'bg-red-900/90 border border-red-700/50 text-red-200'}`}>
          {toast.type === 'success' ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
          {toast.msg}
        </div>
      )}

      <header className="sticky top-0 z-40 bg-black/90 backdrop-blur-md border-b border-[#1a1a1a] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <SaionLogo size={32} />
          <div>
            <h1 className="font-bold text-white text-base leading-none">Admin Panel</h1>
            <p className="text-gray-600 text-xs mt-0.5">SAION AI — Owner Dashboard</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:flex items-center gap-2 bg-[#0e0e0e] border border-[#1e1e1e] rounded-lg px-3 py-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-gray-400">{currentUser.email}</span>
          </span>
          <button onClick={load} disabled={loading} className="p-2 rounded-lg border border-[#1e1e1e] text-gray-400 hover:text-white transition-colors">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={async () => { await signOut(); navigate('/'); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#1e1e1e] text-gray-400 hover:text-red-400 hover:border-red-900/50 transition-colors text-xs">
            <LogOut size={13} /> Sign Out
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Users', value: totalUsers, icon: <Users size={16} />, color: 'text-violet-400', bg: 'bg-violet-900/20 border-violet-700/30' },
            { label: 'Active', value: totalUsers - bannedCount, icon: <CheckCircle size={16} />, color: 'text-emerald-400', bg: 'bg-emerald-900/20 border-emerald-700/30' },
            { label: 'Banned', value: bannedCount, icon: <Ban size={16} />, color: 'text-red-400', bg: 'bg-red-900/20 border-red-700/30' },
            { label: 'Joined Today', value: todayCount, icon: <Clock size={16} />, color: 'text-blue-400', bg: 'bg-blue-900/20 border-blue-700/30' },
          ].map((s, i) => (
            <div key={i} className={`${s.bg} border rounded-xl p-4`}>
              <div className={`flex items-center gap-2 ${s.color} mb-2`}>{s.icon}<span className="text-xs text-gray-500">{s.label}</span></div>
              <p className="text-2xl font-bold text-white">{loading ? '…' : s.value}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by email, name, or UID…"
              className="w-full bg-[#0a0a0a] border border-[#1e1e1e] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-700 focus:outline-none focus:border-violet-700/50" />
          </div>
          <div className="flex gap-2">
            {(['all', 'active', 'banned'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl text-xs font-medium transition-colors border ${filter === f ? 'bg-violet-700/30 border-violet-600/50 text-violet-300' : 'bg-[#0a0a0a] border-[#1e1e1e] text-gray-500 hover:text-gray-300'}`}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-[#080808] border border-[#141414] rounded-2xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20"><RefreshCw size={20} className="animate-spin text-violet-500" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-gray-600">No users found.</div>
          ) : (
            <div className="divide-y divide-[#111]">
              {filtered.map(user => (
                <div key={user.uid} className="hover:bg-[#0c0c0c] transition-colors">
                  <div className="flex items-center gap-4 px-5 py-4">
                    <div className="relative flex-shrink-0">
                      {user.photoURL
                        ? <img src={user.photoURL} alt="" className="w-9 h-9 rounded-full object-cover" />
                        : <div className="w-9 h-9 rounded-full bg-violet-900/40 border border-violet-700/30 flex items-center justify-center text-sm font-bold text-violet-400">{(user.displayName || user.email || '?')[0].toUpperCase()}</div>
                      }
                      {user.isBanned && <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 rounded-full border border-black flex items-center justify-center"><Ban size={7} className="text-white" /></div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-white truncate">{user.displayName || 'No name'}</span>
                        {user.isBanned && <span className="text-xs bg-red-900/40 border border-red-700/30 text-red-400 px-2 py-0.5 rounded-full">Banned</span>}
                        {user.isPaid && <span className="text-xs bg-amber-900/40 border border-amber-700/30 text-amber-400 px-2 py-0.5 rounded-full">Pro</span>}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Mail size={11} className="text-gray-600" />
                        <span className="text-xs text-gray-500 truncate">{user.email || '—'}</span>
                      </div>
                    </div>
                    <div className="hidden md:block text-right flex-shrink-0">
                      <p className="text-xs text-gray-600">Joined</p>
                      <p className="text-xs text-gray-400">{fmt(user.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={() => setExpandedUid(expandedUid === user.uid ? null : user.uid)} className="p-1.5 rounded-lg text-gray-600 hover:text-gray-300 transition-colors">
                        {expandedUid === user.uid ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                      </button>
                      {user.isBanned
                        ? <button onClick={() => setBanModal({ user, action: 'unban' })} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-900/30 border border-emerald-700/30 text-emerald-400 hover:bg-emerald-900/50 transition-colors text-xs font-medium"><CheckCircle size={12} /> Unban</button>
                        : <button onClick={() => setBanModal({ user, action: 'ban' })} disabled={user.email === 'sakethtransformers@gmail.com'} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-900/30 border border-red-700/30 text-red-400 hover:bg-red-900/50 transition-colors text-xs font-medium disabled:opacity-30 disabled:cursor-not-allowed"><Ban size={12} /> Ban</button>
                      }
                    </div>
                  </div>
                  {expandedUid === user.uid && (
                    <div className="px-5 pb-4 grid grid-cols-2 md:grid-cols-4 gap-3 bg-[#060606]">
                      {[
                        { label: 'UID', value: user.uid.slice(0, 16) + '…' },
                        { label: 'Provider', value: user.provider || '—' },
                        { label: 'Messages Today', value: user.dailyMessageCount ?? 0 },
                        { label: 'Sign Ins', value: (user as any).signInCount ?? 1 },
                        { label: 'Last Sign In', value: fmt((user as any).lastSignIn) },
                        { label: 'Files Uploaded', value: user.totalFilesUploaded ?? 0 },
                        ...(user.isBanned ? [
                          { label: 'Ban Reason', value: user.banReason || '—' },
                          { label: 'Banned At', value: fmt((user as any).bannedAt) },
                        ] : []),
                      ].map((item, i) => (
                        <div key={i} className="bg-[#0a0a0a] border border-[#141414] rounded-lg p-3">
                          <p className="text-xs text-gray-600 mb-1">{item.label}</p>
                          <p className="text-xs text-gray-300 font-medium break-all">{String(item.value)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        <p className="text-center text-gray-800 text-xs mt-6">{filtered.length} of {totalUsers} users · SAION AI Owner Dashboard</p>
      </div>

      {banModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm bg-[#0c0c0c] border border-[#1e1e1e] rounded-2xl p-6 shadow-2xl fade-in-up">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 ${banModal.action === 'ban' ? 'bg-red-900/30 border border-red-700/30' : 'bg-emerald-900/30 border border-emerald-700/30'}`}>
              {banModal.action === 'ban' ? <Ban size={20} className="text-red-400" /> : <CheckCircle size={20} className="text-emerald-400" />}
            </div>
            <h3 className="font-bold text-white text-center text-lg mb-1">{banModal.action === 'ban' ? 'Ban User?' : 'Unban User?'}</h3>
            <p className="text-gray-500 text-sm text-center mb-5">{banModal.user.email}</p>
            {banModal.action === 'ban' && (
              <div className="mb-4">
                <label className="text-xs text-gray-500 mb-1.5 block">Ban reason (shown to user)</label>
                <input type="text" value={banReason} onChange={e => setBanReason(e.target.value)} placeholder="e.g. Violation of terms of service" autoFocus
                  className="w-full bg-[#0a0a0a] border border-[#1e1e1e] rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-700 focus:outline-none focus:border-red-700/50" />
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => { setBanModal(null); setBanReason(''); }} disabled={actionLoading}
                className="flex-1 py-2.5 rounded-xl border border-[#1e1e1e] text-gray-400 hover:text-white text-sm transition-colors">Cancel</button>
              <button onClick={handleBanAction} disabled={actionLoading}
                className={`flex-1 py-2.5 rounded-xl text-white text-sm font-semibold transition-colors disabled:opacity-60 ${banModal.action === 'ban' ? 'bg-red-700 hover:bg-red-600' : 'bg-emerald-700 hover:bg-emerald-600'}`}>
                {actionLoading ? 'Please wait…' : banModal.action === 'ban' ? 'Ban User' : 'Unban User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
