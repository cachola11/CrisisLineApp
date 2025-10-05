import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy,
  where 
} from 'firebase/firestore';
import { db } from './firebase/config';

const linhaticosCollection = collection(db, 'linhaticos');

// Get all linhaticos
export const getAllLinhaticos = async () => {
  try {
    const q = query(linhaticosCollection, orderBy('name', 'asc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    }));
  } catch (error) {
    console.error('Error getting linhaticos:', error);
    throw new Error(`Failed to get linhaticos: ${error.message}`);
  }
};

// Add new linhatico
export const addLinhatico = async (linhaticoData) => {
  try {
    const now = new Date();
    const newLinhatico = {
      name: linhaticoData.name.trim(),
      hasPaidAnnualFee: false,
      createdAt: now,
      updatedAt: now,
    };
    
    const docRef = await addDoc(linhaticosCollection, newLinhatico);
    return {
      id: docRef.id,
      ...newLinhatico
    };
  } catch (error) {
    console.error('Error adding linhatico:', error);
    throw new Error(`Failed to add linhatico: ${error.message}`);
  }
};

// Update linhatico payment status
export const updateLinhaticoPaymentStatus = async (linhaticoId, hasPaid) => {
  try {
    const linhaticoRef = doc(linhaticosCollection, linhaticoId);
    await updateDoc(linhaticoRef, {
      hasPaidAnnualFee: hasPaid,
      updatedAt: new Date(),
    });
    
    return linhaticoId;
  } catch (error) {
    console.error('Error updating linhatico payment status:', error);
    throw new Error(`Failed to update linhatico: ${error.message}`);
  }
};

// Bulk update payment status for multiple linhaticos
export const bulkUpdatePaymentStatus = async (linhaticoIds, hasPaid) => {
  try {
    const updatePromises = linhaticoIds.map(id => 
      updateDoc(doc(linhaticosCollection, id), {
        hasPaidAnnualFee: hasPaid,
        updatedAt: new Date(),
      })
    );
    
    await Promise.all(updatePromises);
    return linhaticoIds;
  } catch (error) {
    console.error('Error bulk updating linhaticos:', error);
    throw new Error(`Failed to bulk update linhaticos: ${error.message}`);
  }
};

// Delete linhatico
export const deleteLinhatico = async (linhaticoId) => {
  try {
    const linhaticoRef = doc(linhaticosCollection, linhaticoId);
    await deleteDoc(linhaticoRef);
    return linhaticoId;
  } catch (error) {
    console.error('Error deleting linhatico:', error);
    throw new Error(`Failed to delete linhatico: ${error.message}`);
  }
};

// Get linhaticos by payment status
export const getLinhaticosByPaymentStatus = async (hasPaid) => {
  try {
    const q = query(
      linhaticosCollection, 
      where('hasPaidAnnualFee', '==', hasPaid),
      orderBy('name', 'asc')
    );
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    }));
  } catch (error) {
    console.error('Error getting linhaticos by payment status:', error);
    throw new Error(`Failed to get linhaticos: ${error.message}`);
  }
};
