import React, { useState, useEffect, useCallback } from 'react';
import { Brain, X, Trash2, Edit2, Plus, Check, RefreshCw } from 'lucide-react';
import { Memory, MemoryCategory, getMemories, deleteMemory, updateMemory, saveMemories } from '../../modules/memory/memoryService';
import { useAuth } from '../../contexts/AuthContext';

interface MemoryPanelProps { onClose: () => void; }

const CAT: Record<MemoryCategory, { label: string; color: string; bg: string }> = {
  preference: { label: 'Preference', color: 'text-violet-400', bg: 'bg-violet-900/20 border-violet-700/30' },
  goal:       { label: 'Goal',       color: 'text-amber-400',  bg: 'bg-amber-900/20 border-amber-700/30'  },
  fact:       { label: 'Fact',       color: 'text-blue-400',   bg: 'bg-blue-900/20 border-blue-700/30'    },
  context:    { label: 'Context',    color: 'text-emerald-400',bg: 'bg-emerald-900/20 border-emerald-700/30'},
  skill:      { label: 'Skill',      color: 'text-pink-400',   bg: 'bg-pink-900/20 border-pink-700/30'    },
};

export default function MemoryPanel({ onClose }: MemoryPanelProps) {
  const { currentUser } = useAuth();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [adding, setAdding] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<MemoryCategory>('fact');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!currentUser?.uid) return;
    setLoading(true);
    setMemories(await getMemories(currentUser.uid));
    setLoading(false);
  }, [currentUser?.uid]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string) => {
    if (!currentUser?.uid) return;
    await deleteMemory(currentUser.uid, id);
    setMemories(m => m.filter(x => x.id !== id));
  };

  const handleEdit = async (id: string) => {
    if (!currentUser?.uid || !editContent.trim()) return;
    setSaving(true);
    await updateMemory(currentUser.uid, id, editContent.trim());
    setMemories(m => m.map(x => x.id === id ? { ...x, content: editContent.trim() } : x));
    setEditingId(null);
    setSaving(false);
  };

  const handleAdd = async () => {
    if (!currentUser?.uid || !newContent.trim()) return;
    setSaving(true);
    await saveMemories(currentUser.uid, [newContent.trim()], newCategory, 'manual');
    await load();
    setNewContent('');
    setAdding(false);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm px-0 sm:px-4">
      <div className="w-full sm:max-w-lg bg-[#0a0a0a] border border-[#1e1e1e] rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#141414]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-900/30 border border-violet-700/30 flex items-center justify-center">
              <Brain size={17} className="text-violet-400" />
            </div>
            <div>
              <h2 className="font-bold text-white text-base">My Memory</h2>
              <p className="text-gray-600 text-xs">What SAION AI remembers about you</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={load} className="p-1.5 text-gray-600 hover:text-gray-300"><RefreshCw size={14} className={loading ? 'animate-spin' : ''} /></button>
            <button onClick={onClose} className="p-1.5 text-gray-600 hover:text-white"><X size={16} /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-12"><RefreshCw size={18} className="animate-spin text-violet-500" /></div>
          ) : memories.length === 0 ? (
            <div className="text-center py-12">
              <Brain size={32} className="text-gray-800 mx-auto mb-3" />
              <p className="text-gray-600 text-sm">No memories yet.</p>
              <p className="text-gray-700 text-xs mt-1">Chat with SAION AI and it will remember things about you.</p>
            </div>
          ) : memories.map(mem => {
            const cat = CAT[mem.category];
            return (
              <div key={mem.id} className="group bg-[#0d0d0d] border border-[#181818] rounded-xl p-3 hover:border-[#242424] transition-colors">
                <div className="flex items-start gap-3">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium shrink-0 mt-0.5 ${cat.bg} ${cat.color}`}>{cat.label}</span>
                  <div className="flex-1 min-w-0">
                    {editingId === mem.id ? (
                      <div className="flex gap-2">
                        <input autoFocus value={editContent} onChange={e => setEditContent(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleEdit(mem.id)}
                          className="flex-1 bg-[#111] border border-violet-700/40 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none" />
                        <button onClick={() => handleEdit(mem.id)} disabled={saving} className="p-1.5 text-emerald-400"><Check size={14} /></button>
                        <button onClick={() => setEditingId(null)} className="p-1.5 text-gray-600"><X size={14} /></button>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-300">{mem.content}</p>
                    )}
                    <p className="text-[10px] text-gray-700 mt-1">{mem.source === 'auto' ? '🤖 AI detected' : '✏️ You added'}</p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button onClick={() => { setEditingId(mem.id); setEditContent(mem.content); }} className="p-1.5 text-gray-600 hover:text-violet-400"><Edit2 size={12} /></button>
                    <button onClick={() => handleDelete(mem.id)} className="p-1.5 text-gray-600 hover:text-red-400"><Trash2 size={12} /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="px-5 py-4 border-t border-[#141414]">
          {adding ? (
            <div className="space-y-2">
              <input autoFocus value={newContent} onChange={e => setNewContent(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAdd()}
                placeholder="e.g. I prefer dark mode, I'm a Python developer…"
                className="w-full bg-[#111] border border-[#222] rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-700 focus:outline-none focus:border-violet-600/50" />
              <div className="flex gap-2">
                <select value={newCategory} onChange={e => setNewCategory(e.target.value as MemoryCategory)}
                  className="flex-1 bg-[#111] border border-[#222] rounded-xl px-3 py-2 text-xs text-gray-400 focus:outline-none">
                  {(Object.keys(CAT) as MemoryCategory[]).map(c => <option key={c} value={c}>{CAT[c].label}</option>)}
                </select>
                <button onClick={handleAdd} disabled={saving || !newContent.trim()}
                  className="px-4 py-2 bg-violet-700 hover:bg-violet-600 disabled:opacity-50 text-white text-xs font-semibold rounded-xl">
                  {saving ? '…' : 'Save'}
                </button>
                <button onClick={() => setAdding(false)} className="px-3 py-2 border border-[#222] text-gray-600 text-xs rounded-xl">Cancel</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setAdding(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-[#222] rounded-xl text-gray-600 hover:text-gray-300 hover:border-[#333] text-xs transition-colors">
              <Plus size={13} /> Add memory manually
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
