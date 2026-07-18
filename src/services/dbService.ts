import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { Conversation, Message, User } from '../types';
import { v4 as uuidv4 } from 'uuid';

// ─── User Management ─────────────────────────────────────────────────────────

export async function getUser(uid: string): Promise<User | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    ...data,
    uid,
    subscriptionExpiry: data.subscriptionExpiry?.toDate(),
    createdAt: data.createdAt?.toDate() || new Date(),
  } as User;
}

export async function createOrUpdateUser(user: Partial<User> & { uid: string }): Promise<void> {
  const ref = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, {
      ...user,
      isPaid: false,
      dailyMessageCount: 0,
      lastMessageDate: new Date().toDateString(),
      totalFilesUploaded: 0,
      totalPhotosUploaded: 0,
      createdAt: serverTimestamp(),
    });
  } else {
    await updateDoc(ref, {
      displayName: user.displayName,
      photoURL: user.photoURL,
      email: user.email,
    });
  }
}

// Get timezone: prefer location saved at login, fallback to browser timezone
function getUserTimezone(): string {
  try {
    const saved = localStorage.getItem('saion_location');
    if (saved) {
      const loc = JSON.parse(saved);
      if (loc.timezone) return loc.timezone;
    }
  } catch { /* ignore */ }
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

// Get user's local date string in their exact timezone
function getUserLocalDateString(): string {
  const userTimezone = getUserTimezone();
  const localDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: userTimezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  return localDate; // e.g. "2026-06-15" in user's local timezone
}

export async function incrementMessageCount(uid: string): Promise<{ count: number; allowed: boolean }> {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return { count: 0, allowed: false };

  const data = snap.data() as User;

  // Use user's LOCAL date — resets at midnight in their timezone
  // India user → resets at 12:00 AM IST
  // USA user   → resets at 12:00 AM EST/PST
  const todayLocal = getUserLocalDateString();
  const isNewDay = data.lastMessageDate !== todayLocal;

  if (data.isPaid) {
    return { count: data.dailyMessageCount, allowed: true };
  }

  const currentCount = isNewDay ? 0 : (data.dailyMessageCount || 0);

  if (currentCount >= 200) {
    return { count: currentCount, allowed: false };
  }

  await updateDoc(ref, {
    dailyMessageCount: currentCount + 1,
    lastMessageDate: todayLocal,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, // save their timezone
  });

  return { count: currentCount + 1, allowed: true };
}

export async function updateSubscription(uid: string, expiry: Date): Promise<void> {
  await updateDoc(doc(db, 'users', uid), {
    isPaid: true,
    subscriptionExpiry: Timestamp.fromDate(expiry),
  });
}

// ─── Conversation Management ──────────────────────────────────────────────────

export async function getConversations(uid: string): Promise<Conversation[]> {
  // No orderBy here — avoids needing a Firestore composite index
  const q = query(
    collection(db, 'conversations'),
    where('userId', '==', uid)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => {
    const data = d.data();
    return {
      ...data,
      id: d.id,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      messages: (data.messages || []).map((m: Message & { timestamp: Timestamp }) => ({
        ...m,
        timestamp: m.timestamp instanceof Timestamp ? m.timestamp.toDate() : new Date(m.timestamp),
      })),
    } as Conversation;
  });
}

export async function createConversation(uid: string, title: string, personality: string): Promise<Conversation> {
  const id = uuidv4();
  const now = new Date();
  const convo: Conversation = {
    id,
    title,
    messages: [],
    personality: personality as Conversation['personality'],
    createdAt: now,
    updatedAt: now,
    userId: uid,
  };
  await setDoc(doc(db, 'conversations', id), {
    ...convo,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return convo;
}

export async function updateConversation(id: string, messages: Message[], title?: string): Promise<void> {
  const serializedMessages = messages.map(m => ({
    ...m,
    timestamp: m.timestamp instanceof Date ? Timestamp.fromDate(m.timestamp) : m.timestamp,
  }));
  
  const updateData: Record<string, unknown> = {
    messages: serializedMessages,
    updatedAt: serverTimestamp(),
  };
  if (title) updateData.title = title;

  await updateDoc(doc(db, 'conversations', id), updateData);
}

export async function deleteConversation(id: string): Promise<void> {
  await deleteDoc(doc(db, 'conversations', id));
}

export async function generateTitle(firstMessage: string): Promise<string> {
  const words = firstMessage.split(' ').slice(0, 6).join(' ');
  return words.length > 40 ? words.substring(0, 40) + '...' : words || 'New Chat';
}

// ── Owner Admin Functions ─────────────────────────────────────────────────────
const OWNER_EMAIL = 'sakethtransformers@gmail.com';
export function isOwner(email: string | null): boolean { return email === OWNER_EMAIL; }

export async function trackSignIn(uid: string): Promise<void> {
  try {
    const ref = doc(db, 'users', uid);
    const snap = await getDoc(ref);
    await updateDoc(ref, { lastSignIn: serverTimestamp(), signInCount: (snap.data()?.signInCount || 0) + 1 });
  } catch { /* non-critical */ }
}

export async function checkIfBanned(uid: string): Promise<{ banned: boolean; reason?: string }> {
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) return { banned: false };
    const data = snap.data();
    if (data.isBanned) return { banned: true, reason: data.banReason || 'Account suspended.' };
    return { banned: false };
  } catch { return { banned: false }; }
}

export async function banUser(uid: string, reason: string): Promise<void> {
  await updateDoc(doc(db, 'users', uid), { isBanned: true, banReason: reason, bannedAt: serverTimestamp() });
}

export async function unbanUser(uid: string): Promise<void> {
  await updateDoc(doc(db, 'users', uid), { isBanned: false, banReason: null, bannedAt: null });
}

export async function getAllUsers(): Promise<User[]> {
  const snap = await getDocs(collection(db, 'users'));
  return snap.docs.map(d => {
    const data = d.data();
    return { ...data, uid: d.id, createdAt: data.createdAt?.toDate() || new Date(), lastSignIn: data.lastSignIn?.toDate(), bannedAt: data.bannedAt?.toDate() } as User;
  });
}
