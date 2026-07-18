import {
  collection, doc, getDocs, addDoc, updateDoc,
  deleteDoc, serverTimestamp, query, orderBy, limit, getDoc,
} from 'firebase/firestore';
import { db } from '../../services/firebase';

export interface Memory {
  id: string;
  uid: string;
  content: string;
  category: MemoryCategory;
  source: 'auto' | 'manual';
  createdAt: Date;
  updatedAt: Date;
  useCount: number;
}

export type MemoryCategory = 'preference' | 'goal' | 'fact' | 'context' | 'skill';

const MEMORY_LIMIT = 50;

export async function extractMemoriesFromMessage(
  userMessage: string,
  assistantResponse: string,
  openrouterKey: string
): Promise<string[]> {
  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openrouterKey}`,
      },
      body: JSON.stringify({
        model: 'qwen/qwen-2.5-72b-instruct',
        max_tokens: 200,
        messages: [
          {
            role: 'system',
            content: 'Extract memorable facts about the USER from this conversation. Return ONLY a JSON array of short strings (max 3, each under 15 words). Return [] if nothing worth remembering. Example: ["User is a React developer","User prefers dark mode"]. Return ONLY the JSON array.',
          },
          {
            role: 'user',
            content: `User: "${userMessage.slice(0, 300)}"\nAI: "${assistantResponse.slice(0, 200)}"`,
          },
        ],
      }),
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content?.trim() || '[]';
    const cleaned = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((m: unknown) => typeof m === 'string').slice(0, 3);
  } catch {
    return [];
  }
}

export async function saveMemories(
  uid: string,
  memories: string[],
  category: MemoryCategory = 'fact',
  source: 'auto' | 'manual' = 'auto'
): Promise<void> {
  if (!memories.length || !uid) return;
  const col = collection(db, 'users', uid, 'memories');
  const existing = await getMemories(uid);
  const existingContents = new Set(existing.map(m => m.content.toLowerCase()));
  for (const content of memories) {
    if (existingContents.has(content.toLowerCase())) continue;
    await addDoc(col, { uid, content, category, source, useCount: 0, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  }
}

export async function getMemories(uid: string): Promise<Memory[]> {
  if (!uid) return [];
  try {
    const col = collection(db, 'users', uid, 'memories');
    const q = query(col, orderBy('createdAt', 'desc'), limit(MEMORY_LIMIT));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({
      id: d.id,
      ...(d.data() as Omit<Memory, 'id' | 'createdAt' | 'updatedAt'>),
      createdAt: d.data().createdAt?.toDate?.() || new Date(),
      updatedAt: d.data().updatedAt?.toDate?.() || new Date(),
    }));
  } catch { return []; }
}

export async function deleteMemory(uid: string, memoryId: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid, 'memories', memoryId));
}

export async function updateMemory(uid: string, memoryId: string, content: string): Promise<void> {
  await updateDoc(doc(db, 'users', uid, 'memories', memoryId), { content, updatedAt: serverTimestamp() });
}

export function formatMemoriesForPrompt(memories: Memory[]): string {
  if (!memories.length) return '';
  const lines = ['[USER MEMORY — use this to personalize responses]:'];
  const prefs = memories.filter(m => m.category === 'preference').map(m => m.content);
  const goals = memories.filter(m => m.category === 'goal').map(m => m.content);
  const facts = memories.filter(m => m.category === 'fact').map(m => m.content);
  const skills = memories.filter(m => m.category === 'skill').map(m => m.content);
  if (prefs.length) lines.push(`Preferences: ${prefs.join('; ')}`);
  if (goals.length) lines.push(`Goals: ${goals.join('; ')}`);
  if (skills.length) lines.push(`Skills: ${skills.join('; ')}`);
  if (facts.length) lines.push(`About user: ${facts.join('; ')}`);
  return lines.join('\n');
}
