const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.adminResetUserPassword = functions.https.onRequest(async (req, res) => {
  // Set CORS headers for all responses (allow all origins, methods, and headers)
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', '*');
  res.set('Access-Control-Allow-Headers', '*');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  // 1. Check for Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).send('Unauthorized: No token provided');
    return;
  }
  const idToken = authHeader.split('Bearer ')[1];

  try {
    // 2. Verify token
    const decoded = await admin.auth().verifyIdToken(idToken);

    // 3. Check admin role in Firestore
    const userDoc = await admin.firestore().collection('users').doc(decoded.uid).get();
    if (!userDoc.exists || userDoc.data().role !== 'Administrador') {
      res.status(403).send('Forbidden: Not an admin');
      return;
    }

    // 4. Proceed with password reset
    const { uid, newPassword } = req.body;
    if (!uid || !newPassword) {
      res.status(400).send('Missing parameters');
      return;
    }
    await admin.auth().updateUser(uid, { password: newPassword });
    res.status(200).send('Password reset successful');
  } catch (error) {
    console.error('Error:', error);
    res.status(401).send('Unauthorized or error occurred');
  }
});