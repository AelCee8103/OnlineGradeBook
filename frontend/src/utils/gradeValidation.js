export const validateGradeInput = (value) => {
  // Check if value is empty or just whitespace
  if (!value || value.toString().trim() === '') {
    return { isValid: false, error: 'Grade cannot be empty' };
  }

  // Convert to number and check if it's a valid number
  const numValue = Number(value);
  if (isNaN(numValue)) {
    return { isValid: false, error: 'Grade must be a number' };
  }

  // Check if it's a valid grade (between 0 and 100)
  if (numValue < 0 || numValue > 100) {
    return { isValid: false, error: 'Grade must be between 0 and 100' };
  }

  return { isValid: true, error: null };
};