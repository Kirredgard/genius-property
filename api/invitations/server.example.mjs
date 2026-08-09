import express from 'express';
import { requireFirebaseUser, db, sendApiError } from '../shared/firebase-auth.mjs';

const app = express();
app.use(express.json({ limit: '8kb' }));

app.post('/api/invitations/accept', async (req, res) => {
  try {
    const user = await requireFirebaseUser(req);
    const token = String(req.body?.token || '').trim();

    if (!token) {
      return res.status(400).json({ error: 'Token d’invitation requis' });
    }

    const snap = await db.collectionGroup('invitations')
      .where('token', '==', token)
      .limit(1)
      .get();

    if (snap.empty) {
      return res.status(404).json({ error: 'Invitation introuvable' });
    }

    const invitationDoc = snap.docs[0];
    const invitation = invitationDoc.data() || {};
    const agencyId = invitation.agencyId;

    if (!agencyId || !invitation.email) {
      return res.status(400).json({ error: 'Invitation invalide' });
    }

    if (invitation.status !== 'pending') {
      return res.status(409).json({ error: 'Invitation déjà utilisée' });
    }

    if (!user.email || invitation.email.toLowerCase() !== user.email.toLowerCase()) {
      return res.status(403).json({ error: 'Cette invitation est destinée à une autre adresse email' });
    }

    const memberRef = db.doc(`agencies/${agencyId}/members/${user.uid}`);
    const memberSnap = await memberRef.get();

    if (memberSnap.exists && memberSnap.data()?.status === 'active') {
      await invitationDoc.ref.set({
        status: 'accepted',
        acceptedAt: new Date().toISOString(),
        acceptedBy: user.uid
      }, { merge: true });
      return res.json({ ok: true, agencyId, role: memberSnap.data()?.role || invitation.role || 'viewer' });
    }

    await db.runTransaction(async (transaction) => {
      const latest = await transaction.get(invitationDoc.ref);
      if (!latest.exists || latest.data()?.status !== 'pending') {
        const error = new Error('Invitation déjà utilisée');
        error.statusCode = 409;
        throw error;
      }

      transaction.set(memberRef, {
        userId: user.uid,
        email: user.email,
        role: invitation.role || 'viewer',
        agencyId,
        status: 'active',
        joinedAt: new Date().toISOString(),
        source: 'invitation'
      }, { merge: true });

      transaction.set(invitationDoc.ref, {
        status: 'accepted',
        acceptedAt: new Date().toISOString(),
        acceptedBy: user.uid
      }, { merge: true });
    });

    return res.json({ ok: true, agencyId, role: invitation.role || 'viewer' });
  } catch (error) {
    console.error('[Invitation API] accept failed:', error);
    return sendApiError(res, error, 'invitation_accept_failed');
  }
});

app.listen(process.env.PORT || 8789, () => {
  console.log('Invitation API listening');
});
