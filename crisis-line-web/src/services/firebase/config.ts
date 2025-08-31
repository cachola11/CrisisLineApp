import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDyNmWMyHbvJTQJRqE21XX2NIgb6gACrnE", // Replace with your actual API key
  authDomain: "crisislineapp.firebaseapp.com",
  projectId: "crisislineapp",
  storageBucket: "crisislineapp.firebasestorage.app",
  messagingSenderId: "1022052681225", // Replace with your actual messaging sender ID
  appId: "1:1022052681225:web:a01a57b945e65832e89ad8" // Replace with your actual app ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth
const auth = getAuth(app);

// Set persistence to LOCAL
setPersistence(auth, browserLocalPersistence)
  .catch((error) => {
    console.error("Erro ao configurar persistência de autenticação:", error);
  });

// Initialize Firestore
const db = getFirestore(app);

export { auth, db };

export default app;