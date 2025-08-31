// src/services/userService.js

// Correct Firebase import: ensure you import 'db'
import { db } from '../services/firebase/config';
import {
    collection,
    query,
    where,
    getDocs,
    doc,
    getDoc,
    updateDoc,
    deleteDoc,
    setDoc,
    serverTimestamp
} from 'firebase/firestore';

// Correct collection reference to use 'db'
const usersCollection = collection(db, 'users');

/**
 * Fetches all user documents from the 'users' collection.
 * @returns {Array} An array of user objects, each with an 'id' and document data.
 */
export const getAllUsers = async () => {
    try {
        const querySnapshot = await getDocs(usersCollection);
        const users = querySnapshot.docs.map(doc => ({
            id: doc.id,
            uid: doc.id, // Add uid field for consistency
            ...doc.data()
        }));
        console.log("👥 All users fetched:", users);
        return users;
    } catch (error) {
        console.error("Error fetching all users:", error);
        throw new Error(`Failed to fetch users: ${error.message}`);
    }
};

/**
 * Fetches a single user document by their Firebase UID.
 * @param {string} uid The Firebase User ID (UID) of the user.
 * @returns {Object|null} The user object if found, otherwise null.
 */
export const getUser = async (uid) => {
    try {
        const userDocRef = doc(usersCollection, uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
            return { id: userDoc.id, uid: userDoc.id, ...userDoc.data() };
        }
        console.log("No user found with UID:", uid);
        return null;
    } catch (error) {
        console.error("Error getting user by UID:", uid, error);
        throw new Error(`Failed to get user: ${error.message}`);
    }
};

/**
 * Creates a new user document in the 'users' collection.
 * Note: This typically happens after a user signs up via Firebase Auth.
 * @param {string} uid The Firebase User ID (UID) for the new user.
 * @param {Object} userData The data for the new user (e.g., name, email, role, idNumber).
 * @returns {string} The ID of the newly created document.
 */
export const createUser = async (uid, userData) => {
    try {
        // Validate required fields
        const requiredFields = ['name', 'email', 'role'];
        const missingFields = requiredFields.filter(field => !userData[field]);
        
        if (missingFields.length > 0) {
            throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
        }

        const userDocRef = doc(usersCollection, uid);
        await setDoc(userDocRef, {
            ...userData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        }, { merge: true });

        console.log("User document created/updated for UID:", uid);
        return uid;
    } catch (error) {
        console.error("Error creating user document:", uid, error);
        throw new Error(`Failed to create user: ${error.message}`);
    }
};

/**
 * Updates an existing user document.
 * @param {string} uid The Firebase User ID (UID) of the user to update.
 * @param {Object} newData The new data to update in the user document.
 */
export const updateUser = async (uid, newData) => {
    try {
        // Validate user exists
        const userDocRef = doc(usersCollection, uid);
        const userDoc = await getDoc(userDocRef);
        
        if (!userDoc.exists()) {
            throw new Error(`User with UID ${uid} not found`);
        }

        await updateDoc(userDocRef, {
            ...newData,
            updatedAt: serverTimestamp()
        });

        console.log("User document updated for UID:", uid);
        return uid;
    } catch (error) {
        console.error("Error updating user document:", uid, error);
        throw new Error(`Failed to update user: ${error.message}`);
    }
};

/**
 * Deletes a user document.
 * @param {string} uid The Firebase User ID (UID) of the user to delete.
 */
export const deleteUser = async (uid) => {
    try {
        // Validate user exists
        const userDocRef = doc(usersCollection, uid);
        const userDoc = await getDoc(userDocRef);
        
        if (!userDoc.exists()) {
            throw new Error(`User with UID ${uid} not found`);
        }

        await deleteDoc(userDocRef);
        console.log("User document deleted for UID:", uid);
        return uid;
    } catch (error) {
        console.error("Error deleting user document:", uid, error);
        throw new Error(`Failed to delete user: ${error.message}`);
    }
};

/**
 * Fetches a user by their unique 'idNumber'.
 * This is useful for lookup, e.g., for force sign-up.
 * @param {string} roleIdNumber The ID number assigned to the user within the application (e.g., employee ID).
 * @returns {Object|null} The user object if found, otherwise null.
 */
export const getUserByRoleIdNumber = async (roleIdNumber) => {
    try {
        if (!roleIdNumber) {
            throw new Error('roleIdNumber is required');
        }

        const q = query(usersCollection, where('idNumber', '==', roleIdNumber));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0];
            return { id: doc.id, uid: doc.id, ...doc.data() };
        }
        
        console.log("No user found with role ID number:", roleIdNumber);
        return null;
    } catch (error) {
        console.error("Error getting user by role ID number:", error);
        throw new Error(`Failed to get user by role ID: ${error.message}`);
    }
};

/**
 * Assigns a role to a user.
 * @param {string} uid The Firebase UID of the user.
 * @param {string} role The role to assign (e.g., 'Utilizador', 'Coordenador', 'Administrador').
 */
export const assignUserRole = async (uid, role) => {
    try {
        // Validate user exists
        const userDocRef = doc(usersCollection, uid);
        const userDoc = await getDoc(userDocRef);
        
        if (!userDoc.exists()) {
            throw new Error(`User with UID ${uid} not found`);
        }

        // Validate role
        const validRoles = ['Utilizador', 'Coordenador', 'Administrador'];
        if (!validRoles.includes(role)) {
            throw new Error(`Invalid role: ${role}. Must be one of: ${validRoles.join(', ')}`);
        }

        await updateDoc(userDocRef, {
            role,
            updatedAt: serverTimestamp()
        });

        console.log(`Role '${role}' assigned to user UID: ${uid}`);
        return uid;
    } catch (error) {
        console.error(`Error assigning role to user UID ${uid}:`, error);
        throw new Error(`Failed to assign role: ${error.message}`);
    }
};

/**
 * Admin resets a user's password.
 * NOTE: This requires a backend (Cloud Function) to actually change the password.
 * Here, we just show the intended API.
 * @param {string} uid The Firebase UID of the user.
 * @param {string} newPassword The new password to set.
 */
export const adminResetUserPassword = async (uid, newPassword) => {
    try {
        const response = await fetch('https://us-central1-crisislineapp.cloudfunctions.net/adminResetUserPassword', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uid, newPassword }),
        });
        if (!response.ok) {
            throw new Error('Failed to reset password');
        }
    } catch (error) {
        console.error(`Error resetting password for user UID ${uid}:`, error);
        throw error;
    }
};

/**
 * Fetches a user document by their Firebase UID.
 * @param {string} uid The Firebase User ID (UID) of the user.
 * @returns {Object|null} The user object if found, otherwise null.
 */
export const getUserByUid = async (uid) => {
    try {
        const userDocRef = doc(usersCollection, uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
            return { uid: userDoc.id, ...userDoc.data() }; // <-- Add uid field!
        }
        console.log("No user found with UID:", uid);
        return null;
    } catch (error) {
        console.error("Error getting user by UID:", uid, error);
        throw error;
    }
};

