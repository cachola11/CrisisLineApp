const admin = require('firebase-admin');
const serviceAccount = require('./crisislineapp-firebase-adminsdk-fbsvc-6e4c2160b2.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function migrateUsers() {
  console.log('Iniciando migração de utilizadores...');
  const listUsersResult = await admin.auth().listUsers(1000);
  for (const userRecord of listUsersResult.users) {
    const { uid, email } = userRecord;
    const idNumber = email.split('@')[0];
    if (!email.endsWith('@crisisline.internal')) {
      const novoEmail = `${idNumber}@crisisline.internal`;
      const tempPassword = 'Alterar123!';
      try {
        // Copiar dados do utilizador do Firestore
        const oldDoc = await db.collection('users').doc(uid).get();
        let userData = oldDoc.exists ? oldDoc.data() : {};
        // Criar novo utilizador no Auth
        const newUser = await admin.auth().createUser({
          email: novoEmail,
          password: tempPassword,
        });
        // Criar novo documento no Firestore
        await db.collection('users').doc(newUser.uid).set({
          ...userData,
          idNumber: idNumber,
          status: 'ativo',
        });
        // Apagar utilizador antigo do Auth e Firestore
        await admin.auth().deleteUser(uid);
        await db.collection('users').doc(uid).delete();
        console.log(`Utilizador ${email} migrado para ${novoEmail} com sucesso. Palavra-passe temporária: ${tempPassword}`);
      } catch (err) {
        console.error(`Erro ao migrar utilizador ${email}:`, err.message);
      }
    } else {
      // Atualizar/Adicionar campo status
      try {
        await db.collection('users').doc(uid).set({ status: 'ativo' }, { merge: true });
        console.log(`Campo 'status' atualizado para 'ativo' para ${email}`);
      } catch (err) {
        console.error(`Erro ao atualizar campo 'status' para ${email}:`, err.message);
      }
    }
  }
  console.log('Migração concluída.');
}

migrateUsers(); 