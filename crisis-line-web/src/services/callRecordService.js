import { db } from './firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Saves a new call record to the 'callRecords' collection in Firestore.
 * @param {object} recordData - The data for the call record.
 * @returns {Promise<string>} The ID of the newly created document.
 */
export const saveCallRecord = async (recordData) => {
  try {
    const docRef = await addDoc(collection(db, 'callRecords'), {
      ...recordData,
      createdAt: serverTimestamp(),
    });
    console.log('Call record saved with ID: ', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error saving call record: ', error);
    throw new Error('Failed to save call record.');
  }
}; 