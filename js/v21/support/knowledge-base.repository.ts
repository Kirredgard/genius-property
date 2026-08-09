import { addDoc, collection, getDocs, query, orderBy, type Firestore } from 'firebase/firestore';
import { resolveFirestore } from '../data/firestore.repository.js';
import { HELP_ARTICLES, type HelpArticle } from './help-content.js';

export async function listKnowledgeBaseArticles(options: { db?: Firestore | unknown } = {}): Promise<HelpArticle[]> {
  const db = resolveFirestore({ db: options.db, collectionName: 'knowledgeBase' });
  if (!db) return HELP_ARTICLES;

  const snap = await getDocs(query(collection(db, 'knowledgeBase'), orderBy('category'), orderBy('title')));
  const rows = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as HelpArticle[];

  return rows.length ? rows : HELP_ARTICLES;
}

export async function createKnowledgeBaseArticle(article: Omit<HelpArticle, 'id'>, options: { db?: Firestore | unknown } = {}) {
  const db = resolveFirestore({ db: options.db, collectionName: 'knowledgeBase' });
  const payload = {
    ...article,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  if (!db) {
    return { ok: false, pendingSync: true, article: payload };
  }

  const ref = await addDoc(collection(db, 'knowledgeBase'), payload);
  return { ok: true, id: ref.id, article: payload };
}
