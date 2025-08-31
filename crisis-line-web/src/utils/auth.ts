/**
 * Converts an ID number to an internal email address
 * @param idNumber The user's ID number
 * @returns The internal email address
 */
export const idNumberToEmail = (idNumber: string): string => {
  return `${idNumber}@crisisline.internal`;
};

/**
 * Extracts the ID number from an internal email address
 * @param email The internal email address
 * @returns The ID number
 */
export const emailToIdNumber = (email: string): string => {
  return email.split('@')[0];
};

/**
 * Validates an ID number format
 * @param idNumber The ID number to validate
 * @returns Whether the ID number is valid
 */
export const isValidIdNumber = (idNumber: string): boolean => {
  // Accept numbers from 3 to 10 digits
  return /^\d{3,10}$/.test(idNumber);
}; 