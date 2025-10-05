// src/services/eventService.js
import { db } from '../services/firebase/config';
import {
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    Timestamp,
    orderBy,
    serverTimestamp,
    writeBatch
} from 'firebase/firestore';

const eventsCollection = collection(db, 'events');
const eventSignUpsCollection = collection(db, 'eventSignUps');

/**
 * Helper function to convert Firestore Timestamps to Date objects.
 * This ensures date-fns receives valid Date objects.
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
 * Creates a new event document in the 'events' collection.
 * @param {Object} eventData The data for the new event.
 * @returns {string} The ID of the newly created document.
 */
export const createEvent = async (eventData) => {
    try {
        // Validate required fields
        const requiredFields = ['title', 'description', 'eventType', 'startTime', 'endTime', 'coordinatorUid'];
        const missingFields = requiredFields.filter(field => !eventData[field]);
        
        // Special validation for maxCapacity (0 is valid for unlimited)
        if (eventData.maxCapacity === undefined || eventData.maxCapacity === null) {
            missingFields.push('maxCapacity');
        }
        
        if (missingFields.length > 0) {
            throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
        }

        // Ensure dates are valid
        if (!(eventData.startTime instanceof Date) || isNaN(eventData.startTime.getTime())) {
            throw new Error('Invalid start time');
        }
        if (!(eventData.endTime instanceof Date) || isNaN(eventData.endTime.getTime())) {
            throw new Error('Invalid end time');
        }

        // Ensure maxCapacity is a non-negative number (0 means unlimited)
        if (typeof eventData.maxCapacity !== 'number' || eventData.maxCapacity < 0) {
            throw new Error('maxCapacity must be a non-negative number (0 = unlimited)');
        }

        const docRef = await addDoc(eventsCollection, {
            ...eventData,
            status: 'draft',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            signedUpUsers: eventData.signedUpUsers || [],
            publishedAt: null,
            participants: eventData.participants || []
        });

        console.log("Event created with ID:", docRef.id);
        return docRef.id;
    } catch (error) {
        console.error("Error creating event:", error);
        throw new Error(`Failed to create event: ${error.message}`);
    }
};

/**
 * Fetches a single event document by its ID.
 * @param {string} id The ID of the event.
 * @returns {Object|null} The event object if found, otherwise null.
 */
export const getEvent = async (id) => {
    try {
        const docRef = doc(eventsCollection, id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...convertTimestampsToDates(docSnap.data()) };
        } else {
            console.log("No such event document!");
            return null;
        }
    } catch (error) {
        console.error("Error getting event: ", error);
        throw error;
    }
};

/**
 * Fetches all event documents from the 'events' collection.
 * @returns {Array} An array of event objects, each with an 'id' and document data.
 */
export const getAllEvents = async () => {
    try {
        const querySnapshot = await getDocs(eventsCollection);
        const events = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...convertTimestampsToDates(doc.data())
        }));
        
        // Sort events by startTime in ascending order (earliest first)
        events.sort((a, b) => {
            const timeA = new Date(a.startTime).getTime();
            const timeB = new Date(b.startTime).getTime();
            return timeA - timeB;
        });
        
        console.log("getAllEvents: Fetched events:", events);
        return events;
    } catch (error) {
        console.error("Error fetching all events:", error);
        throw new Error(`Failed to fetch events: ${error.message}`);
    }
};

/**
 * Updates an existing event document.
 * @param {string} id The ID of the event to update.
 * @param {Object} newData The new data to update in the event document.
 */
export const updateEvent = async (id, newData) => {
    try {
        // Validate event exists
        const eventRef = doc(eventsCollection, id);
        const eventSnap = await getDoc(eventRef);
        
        if (!eventSnap.exists()) {
            throw new Error(`Event with ID ${id} not found`);
        }

        // Validate dates if provided
        if (newData.startTime && (!(newData.startTime instanceof Date) || isNaN(newData.startTime.getTime()))) {
            throw new Error('Invalid start time');
        }
        if (newData.endTime && (!(newData.endTime instanceof Date) || isNaN(newData.endTime.getTime()))) {
            throw new Error('Invalid end time');
        }

        // Validate maxCapacity if provided (0 means unlimited)
        if (newData.maxCapacity !== undefined && (typeof newData.maxCapacity !== 'number' || newData.maxCapacity < 0)) {
            throw new Error('maxCapacity must be a non-negative number (0 = unlimited)');
        }

        await updateDoc(eventRef, {
            ...newData,
            updatedAt: serverTimestamp()
        });

        console.log("Event updated with ID:", id);
        return id;
    } catch (error) {
        console.error("Error updating event:", error);
        throw new Error(`Failed to update event: ${error.message}`);
    }
};

/**
 * Deletes an event document.
 * @param {string} id The ID of the event to delete.
 */
export const deleteEvent = async (id) => {
    try {
        const docRef = doc(eventsCollection, id);
        await deleteDoc(docRef);
        console.log("Event deleted with ID: ", id);
    } catch (error) {
        console.error("Error deleting event: ", error);
        throw error;
    }
};

/**
 * Publishes an event by setting its status to 'published' and recording the publication time.
 * @param {string} id The ID of the event to publish.
 */
export const publishEvent = async (id) => {
    try {
        const docRef = doc(eventsCollection, id);
        await updateDoc(docRef, {
            status: 'published',
            publishedAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        console.log("Event published with ID: ", id);
    } catch (error) {
        console.error("Error publishing event: ", error);
        throw error;
    }
};

/**
 * Unpublishes an event by setting its status back to 'draft'.
 * @param {string} id The ID of the event to unpublish.
 */
export const unpublishEvent = async (eventId) => {
    console.log("unpublishEvent called with eventId:", eventId);
    const eventRef = doc(eventsCollection, eventId);
    try {
        await updateDoc(eventRef, { status: "draft" });
        console.log("Event status set to draft for eventId:", eventId);
    } catch (error) {
        console.error("Error in unpublishEvent:", error);
        throw error;
    }
};

/**
 * Publishes multiple events in a single batch operation.
 * @param {Array<string>} eventIds An array of event IDs to publish.
 */
export const batchPublishEvents = async (eventIds) => {
    console.log('Batch publishing events:', eventIds);
    const promises = eventIds.map(id => updateDoc(doc(db, 'events', id), { status: 'published' }));
    await Promise.all(promises);
};

/**
 * Generates recurring "Turno" events based on a date range.
 * Hardcodes properties like maxCapacity, title, and times.
 * @param {Date} startDate The start date for generating recurring events.
 * @param {Date} endDate The end date for generating recurring events.
 * @param {Array} restrictions An array of dates or periods to exclude from generation.
 * @param {string} coordinatorUid The UID of the coordinator creating these events.
 * @returns {number} The count of generated events.
 */
export const generateRecurringTurnos = async (
    baseEventData,
    startDate,
    endDate,
    restrictions,
    coordinatorUid
) => {
    // Ensure restrictions is always an array
    restrictions = Array.isArray(restrictions) ? restrictions : [];

    const eventsToGenerate = [];
    
    let currentDate = new Date(startDate);
    currentDate.setHours(0, 0, 0, 0); // Normalize to start of the day

    const endDateTime = new Date(endDate);
    endDateTime.setHours(23, 59, 59, 999); // Normalize to end of the day

    // Ensure restrictions dates are Date objects for comparison
    const processedRestrictions = restrictions.map(r => {
        if (r.type === 'day' && r.date instanceof Timestamp) {
            return { ...r, date: r.date.toDate() };
        }
        if (r.type === 'period') {
            if (r.startDate instanceof Timestamp) {
                r.startDate = r.startDate.toDate();
            }
            if (r.endDate instanceof Timestamp) {
                r.endDate = r.endDate.toDate();
            }
        }
        return r;
    });

    while (currentDate <= endDateTime) {
        const dayOfWeek = currentDate.getDay(); // 0 for Sunday, 1 for Monday, ..., 6 for Saturday

        // Check if the current date is in any restriction
        const isRestricted = processedRestrictions.some(restriction => {
            if (restriction.type === 'day') {
                return (
                    currentDate.getFullYear() === restriction.date.getFullYear() &&
                    currentDate.getMonth() === restriction.date.getMonth() &&
                    currentDate.getDate() === restriction.date.getDate()
                );
            } else if (restriction.type === 'period') {
                // Check if currentDate falls within the period
                return (
                    currentDate >= restriction.startDate &&
                    currentDate <= restriction.endDate
                );
            }
            return false;
        });

        if (!isRestricted) {
            // Monday to Friday [cite: 200]
            if (dayOfWeek >= 1 && dayOfWeek <= 5) {
                // Shift 1: 8:00 PM - 10:30 PM [cite: 200]
                const shift1StartTime = new Date(currentDate);
                shift1StartTime.setHours(20, 0, 0, 0); // 8:00 PM
                const shift1EndTime = new Date(currentDate);
                shift1EndTime.setHours(22, 30, 0, 0); // 10:30 PM

                eventsToGenerate.push({
                    title: "Turno", // Fixed title [cite: 197]
                    description: baseEventData.description, // Customizable description
                    type: "Turno",
                    startTime: shift1StartTime,
                    endTime: shift1EndTime,
                    maxCapacity: 1, // Fixed capacity [cite: 198, 257]
                    coordinatorId: coordinatorUid,
                    status: 'draft', // All generated shifts start as draft [cite: 201, 259]
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                    signedUpUsers: [],
                    publishedAt: null,
                    visibilityRoles: ['Voluntário', 'Coordenador', 'Administrador'] // Explicitly set for Turno
                });

                // Shift 2: 10:30 PM - 1:00 AM (next day) [cite: 200]
                const shift2StartTime = new Date(currentDate);
                shift2StartTime.setHours(22, 30, 0, 0); // 10:30 PM
                const shift2EndTime = new Date(currentDate);
                shift2EndTime.setDate(currentDate.getDate() + 1); // Next day
                shift2EndTime.setHours(1, 0, 0, 0); // 1:00 AM

                eventsToGenerate.push({
                    title: "Turno", // Fixed title [cite: 197]
                    description: baseEventData.description, // Customizable description
                    type: "Turno",
                    startTime: shift2StartTime,
                    endTime: shift2EndTime,
                    maxCapacity: 1, // Fixed capacity [cite: 198, 257]
                    coordinatorId: coordinatorUid,
                    status: 'draft', // All generated shifts start as draft [cite: 201, 259]
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                    signedUpUsers: [],
                    publishedAt: null,
                    visibilityRoles: ['Voluntário', 'Coordenador', 'Administrador'] // Explicitly set for Turno
                });
            }
        }

        // Move to the next day
        currentDate.setDate(currentDate.getDate() + 1);
    }

    // Perform batch write
    let docsWritten = 0;
    const batchSize = 400; // A bit less than 500 to be safe
    for (let i = 0; i < eventsToGenerate.length; i += batchSize) {
        const currentBatch = eventsToGenerate.slice(i, i + batchSize);
        const firestoreBatch = writeBatch(db); // Use writeBatch from firebase/firestore

        currentBatch.forEach(eventData => {
            const docRef = doc(eventsCollection); // Create a new doc reference with an auto-generated ID
            firestoreBatch.set(docRef, eventData);
        });
        await firestoreBatch.commit();
        docsWritten += currentBatch.length;
    }

    console.log(`Generated ${docsWritten} recurring turnos.`);
    return docsWritten;
};

/**
 * Fetches events based on the user's role and event status/type.
 * @param {string} userRole The role of the current user.
 * @returns {Array} An array of event objects visible to the user.
 */
export const getEventsForUser = async (userRole) => {
    let q;
    let conditions = [];

    switch (userRole) {
        case 'Visitante':
            // Visitante: allow read: if resource.data.eventType in ['Evento Aberto', 'Reunião Geral'] && resource.data.status == 'published'; [cite: 264]
            conditions.push(where('eventType', 'in', ['Evento Aberto', 'Reunião Geral']));
            conditions.push(where('status', '==', 'published'));
            break;
        case 'Voluntário':
            // Voluntário: allow read: if resource.data.status == 'published' && resource.data.eventType in ['Turno', 'Teambuilding', 'Evento Aberto', 'Reunião Geral']; [cite: 265]
            conditions.push(where('status', '==', 'published'));
            conditions.push(where('eventType', 'in', ['Turno', 'Teambuilding', 'Evento Aberto', 'Reunião Geral']));
            break;
        case 'Coordenador':
        case 'Administrador':
            // Coordenador/Administrador: allow read: true; (They need to see drafts too) [cite: 266]
            // No specific conditions for status or type, they see all
            break;
        default:
            // Default to no events for unknown roles or for safety
            return [];
    }

    // Add an orderBy to ensure consistent results, e.g., by startTime
    conditions.push(orderBy('startTime', 'asc'));

    q = query(eventsCollection, ...conditions);

    try {
        const querySnapshot = await getDocs(q);
        const events = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...convertTimestampsToDates(doc.data())
        }));
        
        // Normalize event type from `eventType` to `type` for backwards compatibility
        const normalizedEvents = events.map(ev => ({ ...ev, type: ev.eventType || ev.type }));
        
        console.log(`Fetched ${normalizedEvents.length} events for role: ${userRole}`);
        return normalizedEvents;
    } catch (error) {
        console.error(`Error fetching events for user role '${userRole}':`, error);
        throw error;
    }
};

/**
 * Signs up a user for an event (using eventSignUps collection).
 * @param {string} eventId The ID of the event.
 * @param {string} userId The UID of the user.
 * @param {boolean} forced If true, override capacity.
 * @returns {boolean} True if signup was successful, false otherwise.
 */
export const signUpUserToEvent = async (eventId, userId, forced = false) => {
    const eventRef = doc(db, 'events', eventId);
    const eventSnap = await getDoc(eventRef);

    if (!eventSnap.exists()) {
        throw new Error("Evento não encontrado.");
    }

    const eventData = eventSnap.data();
    const signUpsQuery = query(eventSignUpsCollection, where('eventId', '==', eventId));
    const signUpsSnap = await getDocs(signUpsQuery);
    const signUps = signUpsSnap.docs.map(doc => doc.data());

    if (!forced && eventData.maxCapacity > 0 && signUps.length >= eventData.maxCapacity) {
        throw new Error("Este evento já atingiu a capacidade máxima.");
    }

    const userSignUpQuery = query(eventSignUpsCollection, where('eventId', '==', eventId), where('userId', '==', userId));
    const userSignUpSnap = await getDocs(userSignUpQuery);

    if (!userSignUpSnap.empty) {
        throw new Error("Já está inscrito neste evento.");
    }

    await addDoc(eventSignUpsCollection, {
        eventId,
        userId,
        signedUpAt: serverTimestamp(),
    });
};

/**
 * Cancels a user's sign-up for an event (using eventSignUps collection).
 * @param {string} eventId The ID of the event.
 * @param {string} userId The UID of the user.
 */
export const cancelSignUpForEvent = async (eventId, userId) => {
    const q = query(collection(db, 'eventSignUps'), where('eventId', '==', eventId), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        throw new Error("Inscrição não encontrada para cancelar.");
    }

    const batch = writeBatch(db);
    querySnapshot.forEach(doc => {
        batch.delete(doc.ref);
    });

    await batch.commit();
};

/**
 * Gets all sign-ups for a given event.
 * @param {string} eventId The ID of the event.
 * @returns {Array} Array of sign-up objects.
 */
export const getSignUpsForEvent = async (eventId) => {
    const q = query(collection(db, 'eventSignUps'), where('eventId', '==', eventId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

/**
 * Gets all sign-ups for a given user.
 * @param {string} userId The UID of the user.
 * @returns {Array} Array of sign-up objects.
 */
export const getSignUpsForUser = async (userId) => {
    const q = query(collection(db, 'eventSignUps'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

/**
 * Fetches all sign-ups for all events (for performance).
 * @returns {Array} Array of all sign-up objects.
 */
export const getAllEventSignUps = async () => {
    const signUpsCollection = collection(db, 'eventSignUps');
    const snapshot = await getDocs(signUpsCollection);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// --- Batch Actions ---

export const batchUnpublishEvents = async (eventIds) => {
    console.log('Batch unpublishing events:', eventIds);
    const promises = eventIds.map(id => updateDoc(doc(db, 'events', id), { status: 'draft' }));
    await Promise.all(promises);
};

export const batchDeleteEvents = async (eventIds) => {
    console.log('Batch deleting events:', eventIds);
    const promises = eventIds.map(id => deleteDoc(doc(db, 'events', id)));
    await Promise.all(promises);
};

export const batchResetSignUps = async (eventIds) => {
    // This requires a backend function (e.g., Cloud Function) for atomicity and efficiency.
    console.log('Batch resetting sign-ups for events:', eventIds);
};

/**
 * Batch assigns a supervisor to multiple events.
 * @param {string[]} eventIds Array of event IDs to assign supervisor to
 * @param {string|null} supervisorId The supervisor's user ID (optional if using manual name)
 * @param {string|null} supervisorName The supervisor's name
 * @param {string|null} supervisorEmoji The supervisor's emoji (optional)
 */
export const batchAssignSupervisor = async (eventIds, supervisorId, supervisorName, supervisorEmoji = null) => {
    console.log(`Batch assigning supervisor (${supervisorId || supervisorName}) to events:`, eventIds);
    const promises = eventIds.map(id => updateDoc(doc(db, 'events', id), {
        supervisor: {
            id: supervisorId || null,
            name: supervisorName || null,
            emoji: supervisorEmoji || null,
        }
    }));
    await Promise.all(promises);
};

