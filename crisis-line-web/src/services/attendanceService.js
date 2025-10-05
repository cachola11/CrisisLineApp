// src/services/attendanceService.js
import { db } from '../services/firebase/config';
import {
    collection,
    doc,
    getDocs,
    addDoc,
    updateDoc,
    query,
    where,
    orderBy,
    serverTimestamp,
    Timestamp
} from 'firebase/firestore';

const attendanceCollection = collection(db, 'attendance');

/**
 * Helper function to convert Firestore Timestamps to Date objects.
 */
const convertTimestampsToDates = (docData) => {
    const newData = { ...docData };
    for (const key in newData) {
        if (newData[key] instanceof Timestamp) {
            newData[key] = newData[key].toDate();
        }
    }
    return newData;
};

/**
 * Creates a new attendance record.
 * @param {Object} attendanceData The attendance data.
 * @returns {string} The ID of the newly created document.
 */
export const createAttendanceRecord = async (attendanceData) => {
    try {
        const docRef = await addDoc(attendanceCollection, {
            ...attendanceData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        console.log("Attendance record created with ID:", docRef.id);
        return docRef.id;
    } catch (error) {
        console.error("Error creating attendance record:", error);
        throw new Error(`Failed to create attendance record: ${error.message}`);
    }
};

/**
 * Updates an existing attendance record.
 * @param {string} id The ID of the attendance record to update.
 * @param {Object} newData The new data to update.
 */
export const updateAttendanceRecord = async (id, newData) => {
    try {
        const docRef = doc(attendanceCollection, id);
        await updateDoc(docRef, {
            ...newData,
            updatedAt: serverTimestamp()
        });
        console.log("Attendance record updated with ID:", id);
        return id;
    } catch (error) {
        console.error("Error updating attendance record:", error);
        throw new Error(`Failed to update attendance record: ${error.message}`);
    }
};

/**
 * Gets attendance record by user ID and date.
 * @param {string} userId The user ID.
 * @param {string} date The date in YYYY-MM-DD format.
 * @returns {Object|null} The attendance record if found, otherwise null.
 */
export const getAttendanceRecord = async (userId, date) => {
    try {
        const q = query(
            attendanceCollection,
            where('userId', '==', userId),
            where('date', '==', date)
        );
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0];
            return { id: doc.id, ...convertTimestampsToDates(doc.data()) };
        }
        return null;
    } catch (error) {
        console.error("Error getting attendance record:", error);
        throw error;
    }
};

/**
 * Gets all attendance records for a specific date.
 * @param {string} date The date in YYYY-MM-DD format.
 * @returns {Array} Array of attendance records.
 */
export const getAttendanceForDate = async (date) => {
    try {
        const q = query(
            attendanceCollection,
            where('date', '==', date),
            orderBy('userId', 'desc')
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...convertTimestampsToDates(doc.data())
        }));
    } catch (error) {
        console.error("Error getting attendance for date:", error);
        throw error;
    }
};

/**
 * Gets all attendance records for a specific user.
 * @param {string} userId The user ID.
 * @returns {Array} Array of attendance records.
 */
export const getAttendanceForUser = async (userId) => {
    try {
        const q = query(
            attendanceCollection,
            where('userId', '==', userId),
            orderBy('date', 'asc')
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...convertTimestampsToDates(doc.data())
        }));
    } catch (error) {
        console.error("Error getting attendance for user:", error);
        throw error;
    }
};

/**
 * Gets all attendance records.
 * @returns {Array} Array of all attendance records.
 */
export const getAllAttendanceRecords = async () => {
    try {
        const q = query(attendanceCollection, orderBy('date', 'asc'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...convertTimestampsToDates(doc.data())
        }));
    } catch (error) {
        console.error("Error getting all attendance records:", error);
        throw error;
    }
};

/**
 * Marks attendance for a user on a specific date.
 * @param {string} userId The user ID.
 * @param {string} date The date in YYYY-MM-DD format.
 * @param {string} status 'present' or 'absent'.
 * @param {string} markedBy The ID of the user marking the attendance.
 * @returns {string} The ID of the attendance record.
 */
export const markAttendance = async (userId, date, status, markedBy) => {
    try {
        // Check if attendance record already exists
        const existingRecord = await getAttendanceRecord(userId, date);
        
        if (existingRecord) {
            // Update existing record
            await updateAttendanceRecord(existingRecord.id, {
                status,
                markedBy,
                markedAt: serverTimestamp()
            });
            return existingRecord.id;
        } else {
            // Create new record
            const newRecord = await createAttendanceRecord({
                userId,
                date,
                status,
                markedBy,
                markedAt: serverTimestamp()
            });
            return newRecord;
        }
    } catch (error) {
        console.error("Error marking attendance:", error);
        throw error;
    }
};

/**
 * Gets all unique dates from attendance records.
 * @returns {Array} Array of unique dates sorted from oldest to newest.
 */
export const getAllAttendanceDates = async () => {
    try {
        const allRecords = await getAllAttendanceRecords();
        const uniqueDates = [...new Set(allRecords.map(record => record.date))];
        return uniqueDates.sort(); // Sort from oldest to newest
    } catch (error) {
        console.error("Error getting attendance dates:", error);
        throw error;
    }
};

/**
 * Gets all users who have attendance records.
 * @returns {Array} Array of unique user IDs sorted in descending order.
 */
export const getAllAttendanceUsers = async () => {
    try {
        const allRecords = await getAllAttendanceRecords();
        const uniqueUsers = [...new Set(allRecords.map(record => record.userId))];
        return uniqueUsers.sort((a, b) => b.localeCompare(a)); // Sort in descending order
    } catch (error) {
        console.error("Error getting attendance users:", error);
        throw error;
    }
};

/**
 * Checks for consecutive absences and returns flagged users.
 * @param {string} userId The user ID to check.
 * @param {Array} dates Array of dates to check.
 * @param {Object} attendanceMap Map of attendance records.
 * @returns {Object} Object with consecutive absence information.
 */
export const checkConsecutiveAbsences = (userId, dates, attendanceMap) => {
    let currentStreak = 0;
    let maxStreak = 0;
    let flaggedDates = [];

    for (let i = 0; i < dates.length; i++) {
        const date = dates[i];
        const record = attendanceMap[`${userId}-${date}`];
        const isAbsent = !record || record.status === 'absent';

        if (isAbsent) {
            currentStreak++;
            maxStreak = Math.max(maxStreak, currentStreak);
            if (currentStreak >= 2) {
                flaggedDates.push(date);
            }
        } else {
            currentStreak = 0;
        }
    }

    return {
        hasConsecutiveAbsences: maxStreak >= 2,
        consecutiveCount: maxStreak,
        flaggedDates: flaggedDates,
        isFlagged: maxStreak >= 2
    };
};

/**
 * Updates the flag status for a user's consecutive absences.
 * @param {string} userId The user ID.
 * @param {boolean} isFlagged Whether the user should be flagged.
 * @param {string} flaggedBy The ID of the user setting the flag.
 */
export const updateFlagStatus = async (userId, isFlagged, flaggedBy) => {
    try {
        // This would typically update a user's flag status in the users collection
        // For now, we'll store it in a separate flags collection
        const flagsCollection = collection(db, 'attendanceFlags');
        const q = query(flagsCollection, where('userId', '==', userId));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0];
            await updateDoc(doc.ref, {
                isFlagged,
                flaggedBy,
                flaggedAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
        } else {
            await addDoc(flagsCollection, {
                userId,
                isFlagged,
                flaggedBy,
                flaggedAt: serverTimestamp(),
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
        }
    } catch (error) {
        console.error("Error updating flag status:", error);
        throw error;
    }
};

/**
 * Gets flag status for a user.
 * @param {string} userId The user ID.
 * @returns {Object|null} The flag status if found, otherwise null.
 */
export const getFlagStatus = async (userId) => {
    try {
        const flagsCollection = collection(db, 'attendanceFlags');
        const q = query(flagsCollection, where('userId', '==', userId));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0];
            return { id: doc.id, ...convertTimestampsToDates(doc.data()) };
        }
        return null;
    } catch (error) {
        console.error("Error getting flag status:", error);
        throw error;
    }
};
