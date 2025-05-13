/**
 * User utility functions for the OnlineGradeBook application
 */

/**
 * Determine the current user type based on localStorage values
 * @returns {string|null} 'admin', 'faculty', or null if not logged in
 */
export const getCurrentUserType = () => {
  const facultyID = localStorage.getItem('facultyID');
  const adminID = localStorage.getItem('adminID');
  
  if (adminID) return 'admin';
  if (facultyID) return 'faculty';
  return null;
};

/**
 * Get the current user's ID based on their role
 * @returns {string|null} User ID or null if not logged in
 */
export const getCurrentUserId = () => {
  const facultyID = localStorage.getItem('facultyID');
  const adminID = localStorage.getItem('adminID');
  
  return adminID || facultyID || null;
};

/**
 * Get the current user's name based on their role
 * @returns {string} User name or "Unknown User" if not found
 */
export const getCurrentUserName = () => {
  const facultyName = localStorage.getItem('facultyName');
  const adminName = localStorage.getItem('adminName');
  
  return adminName || facultyName || "Unknown User";
};
