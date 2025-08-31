import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth, db } from '../firebaseconfig';
import { doc, setDoc } from 'firebase/firestore';

// Converte o ID numérico para email falso
const idToFakeEmail = (id) => `${id}@clapp.com`;

export const signupWithIDAndPassword = async (id, password) => {
  try {
    const email = idToFakeEmail(id);
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Grava o role default 'Visitante' no Firestore para este user
    await setDoc(doc(db, 'users', user.uid), {
      role: 'Visitante',
      createdAt: new Date(),
      idUser: id,
    });

    return { success: true, user };
  } catch (error) {
    return { success: false, error };
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Erro ao fazer logout:', error);
  }
};
